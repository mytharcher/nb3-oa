import { createHash } from 'node:crypto';
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
  ApiError,
  apiErrorHandler,
  apiValidator,
  defineApiRoutes,
  describeRoute,
  dataResponse,
  apiErrorResponses,
} from '@nocobase/app-server/router';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { bodyLimit } from 'hono/body-limit';
import type { InvoiceRecognitionConfig } from '../../config/invoice-recognition.js';
import { auditServiceToken } from '../../providers/audit/index.js';
import { reimbursementInvoiceSourceToken } from '../../providers/reimbursement/invoice-source.js';
import { ReimbursementAttachmentError } from '../../providers/reimbursement/attachments.js';
import { ReimbursementError } from '../../providers/reimbursement/errors.js';
import { INVOICE_RECOGNITION } from '../../providers/invoice-recognition/index.js';
import {
  createInvoiceOperations,
  InvoiceOperationConflict,
} from '../../providers/invoice-recognition/operations.js';
import {
  invoiceEnvelope,
  InvoiceGateway,
} from '../../providers/invoice-recognition/gateway.js';
const id = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const Params = z.object({
  recordId: id,
  lineId: id,
  fileId: id,
  operation: z.enum(['recognize', 'verify']),
});
function fail(
  reason: string,
  status:
    | 'PERMISSION_DENIED'
    | 'FAILED_PRECONDITION'
    | 'ABORTED' = 'PERMISSION_DENIED',
): never {
  throw new ApiError({
    status,
    domain: 'invoiceRecognition',
    reason,
    message:
      'The invoice operation is unavailable with the current record access or configuration.',
  });
}
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      db = c.resolve(databaseManagerToken);
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    router.use(
      '/invoiceRecognition/*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
      bodyLimit({ maxSize: 1024 }),
    );
    router.onError((error, context) => {
      if (
        error instanceof ReimbursementAttachmentError ||
        error instanceof ReimbursementError
      )
        return apiErrorHandler(
          new ApiError({
            status:
              (error instanceof ReimbursementAttachmentError &&
                error.code === 'REIMBURSEMENT_ATTACHMENT_DENIED') ||
              (error instanceof ReimbursementError &&
                error.kind === 'permission')
                ? 'PERMISSION_DENIED'
                : 'FAILED_PRECONDITION',
            domain: 'invoiceRecognition',
            reason: 'SOURCE_UNAVAILABLE',
            message:
              'The invoice attachment or source fields are not accessible.',
          }),
          context,
        );
      if (error instanceof InvoiceOperationConflict)
        return apiErrorHandler(
          new ApiError({
            status: 'ABORTED',
            domain: 'invoiceRecognition',
            reason: 'SOURCE_CHANGED',
            message:
              'The existing invoice operation belongs to another destination.',
          }),
          context,
        );
      return apiErrorHandler(error, context);
    });
    const store = createInvoiceOperations(
      db.connection(),
      c.resolve(auditServiceToken),
    );
    for (const mode of ['read', 'submit', 'lookup'] as const)
      router.on(
        mode === 'read' ? 'GET' : 'POST',
        `/invoiceRecognition/:recordId/:lineId/:fileId/:operation${mode === 'lookup' ? '/refresh' : ''}`,
        describeRoute({
          tags: ['Invoice recognition'],
          operationId: `invoiceRecognition.${mode}`,
          responses: { 200: dataResponse(z.unknown()), ...apiErrorResponses },
        }),
        apiValidator('param', Params),
        async (context) => {
          const params = context.req.valid('param'),
            actorId = context.get('auth')!.user.id,
            authz = context.get('authz');
          await authz.require({
            resource: { type: 'settings', id: INVOICE_RECOGNITION },
            action: mode === 'read' ? 'read' : params.operation,
          });
          const decision = await authz.authorize({
            resource: { type: 'composite', id: 'oa.reimbursement' },
            action: 'view',
          });
          const policy =
            decision.effect !== 'deny'
              ? decision.conditions?.database?.reimbursementRequests
              : undefined;
          if (!policy) fail('ACCESS_DENIED');
          const source = await c.resolve(reimbursementInvoiceSourceToken).read({
            ...params,
            actorId,
            policy,
            mode: mode === 'read' ? 'read' : params.operation,
          });
          if (mode !== 'read' && params.operation === 'recognize') {
            // Match the upload/edit endpoint's explicit submission grant as well as the owner guard.
            const write = await authz.authorize({
              resource: { type: 'composite', id: 'oa.reimbursement' },
              action: source.ownerId === actorId ? 'submit' : 'delegate',
            });
            const writePolicy: RepositoryPolicy | undefined =
                write.effect !== 'deny'
                  ? write.conditions?.database?.reimbursementRequests
                  : undefined,
              update = writePolicy?.update;
            if (
              !writePolicy ||
              !update ||
              (update !== true &&
                !(
                  Array.isArray(update.fields) &&
                  update.fields.includes('lines')
                ))
            )
              fail('ACCESS_DENIED');
            const row = await db
              .repository('reimbursementRequests')
              .withPolicy({
                ...writePolicy,
                read:
                  update === true
                    ? true
                    : { scope: update.scope, fields: ['id'] },
              })
              .findOne({ filter: { id: params.recordId } });
            if (!row) fail('ACCESS_DENIED');
          }
          const config = app.config.get<InvoiceRecognitionConfig>(
            'invoiceRecognition',
          ) ?? { enabled: false, instanceId: '', baseUrl: '', token: '' };
          if (!config.enabled) {
            if (mode !== 'read') fail('NOT_CONFIGURED', 'FAILED_PRECONDITION');
            return context.json({
              data: {
                enabled: false,
                state: 'not_checked',
                result: null,
                busy: false,
                receivedAt: null,
              },
            });
          }
          if (params.operation === 'verify' && !source.facts)
            fail('SOURCE_CHANGED', 'FAILED_PRECONDITION');
          const envelope = invoiceEnvelope(
            {
              instanceId: config.instanceId,
              // Verification belongs to the authorized document; OCR remains private to its editor.
              actorId: params.operation === 'verify' ? source.ownerId : actorId,
              recordId: params.recordId,
              lineId: params.lineId,
              fileId: params.fileId,
              fileHash: source.fileHash,
            },
            params.operation,
            source.facts,
          );
          const gateway = new InvoiceGateway(config),
            base = new URL(config.baseUrl);
          if (!base.pathname.endsWith('/')) base.pathname += '/';
          const destination = createHash('sha256')
            .update(JSON.stringify([config.instanceId, base.href]))
            .digest('hex');
          if (mode !== 'read') {
            const input: unknown = await context.req
              .json()
              .catch(() => undefined);
            if (!z.object({}).strict().safeParse(input).success)
              throw new ApiError({
                status: 'INVALID_ARGUMENT',
                domain: 'invoiceRecognition',
                reason: 'INVALID_INPUT',
                message:
                  'Supply an empty object; invoice facts are owned by the original request.',
              });
            await store.run(
              envelope,
              destination,
              () =>
                mode === 'lookup'
                  ? gateway.lookup(envelope)
                  : gateway.submit(envelope, {
                      mimeType: source.mimeType,
                      bytes: source.bytes,
                    }),
              mode,
              actorId,
            );
          }
          // Recheck access and facts after the network boundary; stale results must never be presented as current.
          const latest =
            mode === 'read'
              ? source
              : await c
                  .resolve(reimbursementInvoiceSourceToken)
                  .read({ ...params, actorId, policy, mode: 'read' });
          const latestEnvelope = invoiceEnvelope(
            { ...envelope.identity, fileHash: latest.fileHash },
            params.operation,
            latest.facts,
          );
          if (latestEnvelope.contentHash !== envelope.contentHash)
            fail('SOURCE_CHANGED', 'ABORTED');
          const row = await store.read(envelope.operationKey);
          return context.json({
            data: {
              enabled: true,
              state: row?.state ?? 'not_checked',
              result: row?.result
                ? {
                    state: row.result.state,
                    ...('facts' in row.result
                      ? { facts: row.result.facts }
                      : {}),
                    ...('reference' in row.result
                      ? {
                          reference: row.result.reference,
                          checkedAt: row.result.checkedAt,
                        }
                      : {}),
                  }
                : null,
              busy:
                !!row?.leaseUntil &&
                new Date(row.leaseUntil).getTime() > Date.now(),
              receivedAt: row?.receivedAt
                ? new Date(row.receivedAt).toISOString()
                : null,
            },
          });
        },
      );
    return new Hono().route('/', router);
  }),
];
