import { calendarServiceToken } from '../../providers/platform/index.js';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Application } from '@nocobase/app-server/application';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import {
  defineApiRoutes,
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { auditServiceToken } from '../../providers/audit/index.js';
import { ELECTRONIC_SIGNATURES } from '../../providers/electronic-signatures/index.js';
import {
  contractSignatureSourceToken,
  sealSignatureSourceToken,
  type SignatureSourceAccess,
} from '../../providers/electronic-signatures/contract.js';
import {
  createSignatureService,
  type SignatureConfig,
  type SignatureRecord,
} from '../../providers/electronic-signatures/service.js';
import {
  SignatureGateway,
  digest,
} from '../../providers/electronic-signatures/gateway.js';
import {
  readSignaturePdf,
  type SignatureStoredFile,
} from '../../providers/electronic-signatures/file.js';
const Params = z.object({
  kind: z.enum(['contract', 'seal']),
  id: z.string().min(1).max(64),
});
const Result = z.object({
  enabled: z.boolean(),
  timeZone: z.string(),
  state: z.string(),
  externalId: z.string().nullable(),
  signedAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  signingUrl: z.string().nullable(),
  resultCode: z.string().nullable(),
  busy: z.boolean(),
  canSend: z.boolean(),
  canDownload: z.boolean(),
});
function denied(): never {
  throw new Error('SIGNATURE_ACCESS_DENIED');
}
function view(
  row: SignatureRecord | undefined,
  config: SignatureConfig,
  send: boolean,
  timeZone: string,
) {
  return {
    enabled: config.enabled,
    timeZone,
    state: row?.state ?? 'not_sent',
    externalId: row?.externalId ?? null,
    signedAt: row?.signedAt ? new Date(row.signedAt).toISOString() : null,
    archivedAt: row?.archivedAt ? new Date(row.archivedAt).toISOString() : null,
    signingUrl:
      row?.signingPath && config.enabled
        ? new SignatureGateway(config).signingUrl(row.signingPath)
        : null,
    resultCode: row?.resultCode ?? null,
    busy: !!row?.leaseUntil && +new Date(row.leaseUntil) > Date.now(),
    canSend: send,
    canDownload: row?.state === 'archived' && !!row.fileId,
  };
}
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      router = new Hono<AuthEnv & AuthorizationEnv>(),
      db = c.resolve(databaseManagerToken).connection(),
      store = createSignatureService(
        db,
        c.resolve(auditServiceToken),
        c.resolve(serverFileRepositoryManagerToken),
      );
    router.use(
      '/electronicSignatures/*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    router.onError(async (error, ctx) => {
      const ownerCode = (error as { code?: string }).code ?? '';
      const code =
        /(?:ACCESS_DENIED|REQUEST_NOT_FOUND|FIELDS_RESTRICTED)$/u.test(
          ownerCode,
        )
          ? 'SIGNATURE_ACCESS_DENIED'
          : error.message;
      if (code.startsWith('SIGNATURE_')) {
        const i18n = c.resolve(i18nToken),
          locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
        await i18n.ensureLocaleLoaded(locale);
        return apiErrorHandler(
          new ApiError({
            status:
              code === 'SIGNATURE_ACCESS_DENIED'
                ? 'PERMISSION_DENIED'
                : code === 'SIGNATURE_SOURCE_CHANGED'
                  ? 'ABORTED'
                  : 'FAILED_PRECONDITION',
            domain: 'electronicSignatures',
            reason: code,
            localizedMessage: {
              locale,
              message: i18n.getFixedT(
                'nb3-oa',
                locale,
              )('electronicSignatures.unavailable'),
            },
            message:
              'Electronic signing is not available for this request. Check permissions, approved documents and current status.',
          }),
          ctx,
        );
      }
      return apiErrorHandler(error, ctx);
    });
    const spec = (operationId: string) =>
      describeRoute({
        tags: ['Electronic signatures'],
        operationId,
        summary: 'Authorized signature status and gateway operation',
        responses: {
          200: operationId.endsWith('download')
            ? {
                description: 'Authorized signed PDF',
                content: {
                  'application/pdf': {
                    schema: { type: 'string', format: 'binary' },
                  },
                },
              }
            : dataResponse(Result),
          ...apiErrorResponses,
        },
      });
    for (const mode of ['read', 'send', 'refresh', 'download'] as const) {
      const path = `/electronicSignatures/:kind/:id${mode === 'read' ? '' : `/${mode}`}`;
      router.on(
        mode === 'send' || mode === 'refresh' ? 'POST' : 'GET',
        path,
        spec(`electronicSignatures${mode}`),
        apiValidator('param', Params),
        async (ctx) => {
          const { kind, id } = ctx.req.valid('param'),
            authz = ctx.get('authz'),
            actor = ctx.get('auth')!.user.id;
          const action =
              mode === 'read' || mode === 'download' ? 'read' : 'send',
            gate = await authz.authorize({
              resource: { type: 'settings', id: ELECTRONIC_SIGNATURES },
              action,
            });
          if (gate.effect === 'deny') denied();
          const resource =
              kind === 'contract' ? 'oa.contract' : 'oa.sealRequests',
            collection =
              kind === 'contract' ? 'contractRequests' : 'sealRequests';
          const decision = await authz.authorize({
              resource: { type: 'composite', id: resource },
              action: 'view',
            }),
            policy =
              decision.effect === 'deny'
                ? undefined
                : decision.conditions?.database?.[collection];
          if (!policy?.read) denied();
          const access: SignatureSourceAccess = { view: policy };
          const sendDecision = await authz.authorize({
            resource: { type: 'settings', id: ELECTRONIC_SIGNATURES },
            action: 'send',
          });
          let canSend = sendDecision.effect !== 'deny';
          if (kind === 'seal') {
            const operate = await authz.authorize({
              resource: { type: 'composite', id: resource },
              action: 'operate',
            });
            access.operate =
              operate.effect === 'deny'
                ? undefined
                : operate.conditions?.database?.sealRequests;
            const contract = await authz.authorize({
              resource: { type: 'composite', id: 'oa.contract' },
              action: 'view',
            });
            access.contractView =
              contract.effect === 'deny'
                ? undefined
                : contract.conditions?.database?.contractRequests;
            const ledger = await authz.authorize({
              resource: { type: 'composite', id: 'oa.contract' },
              action: 'ledger',
            });
            access.ledger =
              ledger.effect === 'deny'
                ? undefined
                : ledger.conditions?.database?.contracts;
            canSend = canSend && !!access.operate?.update;
            if (action === 'send' && !canSend) denied();
          }
          const config = app.config.get(
              'electronicSignatures',
            ) as SignatureConfig,
            owner = c.resolve(
              kind === 'contract'
                ? contractSignatureSourceToken
                : sealSignatureSourceToken,
            );
          const current = await store.source(owner, id, actor, access, false);
          ctx.header('Cache-Control', 'no-store');
          if (mode === 'read') {
            if (canSend) {
              try {
                await store.source(owner, id, actor, access, true);
              } catch {
                canSend = false;
              }
            }
            return ctx.json({
              data: view(
                await store.read(current),
                config,
                canSend,
                c.resolve(calendarServiceToken).timeZone(),
              ),
            });
          }
          if (mode === 'download') {
            const record = await store.read(current);
            if (record?.state !== 'archived' || !record.fileId)
              throw new Error('SIGNATURE_NOT_ARCHIVED');
            const file = await db
              .repository<SignatureStoredFile>('signatureArchiveFiles')
              .findOne({ filter: { id: record.fileId } });
            if (!file) throw new Error('SIGNATURE_NOT_ARCHIVED');
            const bytes = await readSignaturePdf(
              c.resolve(driveManagerToken),
              file,
            );
            if (digest(bytes) !== record.signedHash)
              throw new Error('SIGNATURE_ARCHIVE_CHANGED');
            ctx.header('Content-Type', 'application/pdf');
            ctx.header(
              'Content-Disposition',
              `attachment; filename="signed-${id.replace(/[^A-Za-z0-9_-]/gu, '')}.pdf"`,
            );
            ctx.header('X-Content-Type-Options', 'nosniff');
            return ctx.body(new Uint8Array(bytes));
          }
          if (!config.enabled) throw new Error('SIGNATURE_NOT_CONFIGURED');
          const record = await store.execute(
            owner,
            id,
            actor,
            access,
            config,
            new SignatureGateway(config),
            mode === 'send' ? 'submit' : 'lookup',
          );
          return ctx.json({
            data: view(
              record,
              config,
              canSend,
              c.resolve(calendarServiceToken).timeZone(),
            ),
          });
        },
      );
    }
    return new Hono().route('/', router);
  }),
];
