import { readSealRelatedNames } from './related-names.js';
import { contractLedgerServiceToken } from '../../providers/contracts/contract.js';
import { LifecycleError } from '@nocobase/lifecycle';
import { ApprovalError } from '@nocobase/app-plugin-approval/server';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import {
  authenticationToken,
  userAdministrationServiceToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import {
  sealRequestServiceToken,
  sealServiceToken,
  type SealRequest,
} from '../../providers/seals/index.js';
import { calendarServiceToken } from '../../providers/platform/index.js';
import { SealError } from '../../providers/seals/errors.js';
import * as S from './schemas.js';
import { createSealBrowserRoutes } from './browser.js';
type Env = AuthEnv & AuthorizationEnv;
export default [
  defineApiRoutes<Application>((app) => {
    const container = app.container,
      db = container.resolve(databaseManagerToken),
      requests = container.resolve(sealRequestServiceToken),
      ledger = container.resolve(sealServiceToken),
      users = container.resolve(userAdministrationServiceToken),
      router = new Hono<Env>();
    router.use(
      '*',
      container.resolve(authenticationToken).required(),
      container.resolve(authorizationToken).middleware(),
    );
    router.onError(async (error, c) => {
      if (
        error instanceof ApprovalError &&
        !['INTERNAL', 'INVALID_EFFECT'].includes(error.code)
      )
        error = new SealError(
          [
            'NOT_ALLOWED',
            'NOT_ASSIGNEE',
            'NOT_QUALIFIED',
            'NOT_IN_POOL',
            'INACTIVE',
            'APPLICANT_NOT_ELIGIBLE',
          ].includes(error.code)
            ? 'ACCESS_DENIED'
            : ['CONFLICT', 'STALE', 'REQUEST_REUSED'].includes(error.code)
              ? 'VERSION_CONFLICT'
              : error.code === 'TASK_NOT_FOUND'
                ? 'REQUEST_NOT_FOUND'
                : 'APPROVAL_REFUSED',
        );
      if (error instanceof LifecycleError)
        error = new SealError(
          ['CONFLICT', 'STALE', 'VERSION_CONFLICT', 'REQUEST_REUSED'].includes(
            error.code,
          )
            ? 'VERSION_CONFLICT'
            : 'APPROVAL_REFUSED',
        );
      if (!(error instanceof SealError)) return apiErrorHandler(error, c);
      const i18n = container.resolve(i18nToken),
        locale = getRequestLocale(c) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      return apiErrorHandler(
        new ApiError({
          domain: 'seals',
          reason: error.code,
          message: i18n.getFixedT(
            'nb3-oa',
            locale,
          )(`seals.errors.${error.code}`),
          status:
            error.code === 'BODY_TOO_LARGE'
              ? 'RESOURCE_EXHAUSTED'
              : error.code.includes('ACCESS_DENIED') ||
                  (error.code.endsWith('REQUIRED') &&
                    [
                      'KEEPER_REQUIRED',
                      'ADMIN_REQUIRED',
                      'ADMIN_KEEPER_REQUIRED',
                      'REVIEWER_REQUIRED',
                    ].includes(error.code))
                ? 'PERMISSION_DENIED'
                : error.code.endsWith('NOT_FOUND')
                  ? 'NOT_FOUND'
                  : error.code.endsWith('CONFLICT')
                    ? 'ABORTED'
                    : 'INVALID_ARGUMENT',
        }),
        c,
      );
    });
    const actor = (c: Context<Env>) => c.get('auth')!.user.id;
    async function policy(
      c: Context<Env>,
      resource: string,
      action: string,
      collection: string,
    ) {
      const decision = await c
        .get('authz')
        .authorize({ resource: { type: 'composite', id: resource }, action });
      const p =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.[collection];
      if (!p) throw new SealError('ACCESS_DENIED');
      return p;
    }
    async function access(c: Context<Env>, action: string) {
      let contract: RepositoryPolicy | undefined;
      try {
        contract = await policy(c, 'oa.contract', 'ledger', 'contracts');
      } catch (error) {
        if (!(error instanceof SealError)) throw error;
      }
      return {
        requests: await policy(c, 'oa.sealRequests', action, 'sealRequests'),
        view: await policy(c, 'oa.sealRequests', 'view', 'sealRequests'),
        contract,
      };
    }
    const person = async (id: string) => ({
      id,
      name: (await users.get(id))?.name ?? id,
    });
    async function dto(row: SealRequest) {
      const {
        approvedFingerprint: _fingerprint,
        approvedAt: _approvedAt,
        ruleSnapshot: _rules,
        ...safe
      } = row;
      return {
        ...safe,
        applicant: await person(row.applicantId),
        createdBy: await person(row.createdById),
      };
    }
    const doc = (
      id: string,
      summary: string,
      schema: Parameters<typeof dataResponse>[0],
    ) =>
      describeRoute({
        tags: ['Seals'],
        operationId: id,
        summary,
        responses: {
          '200': dataResponse(schema),
          ...apiErrorResponses,
          '404': { description: 'Not found' },
          '409': { description: 'Version or command conflict' },
        },
      });
    const listDoc = (
      id: string,
      summary: string,
      schema: Parameters<typeof listResponse>[0],
      meta: Parameters<typeof listResponse>[1] = S.Meta,
    ) =>
      describeRoute({
        tags: ['Seals'],
        operationId: id,
        summary,
        responses: {
          '200': listResponse(schema, meta),
          ...apiErrorResponses,
        },
      });
    router.get(
      '/sealRequests',
      listDoc('listSealRequests', 'List visible seal requests', S.Request),
      apiValidator('query', S.RequestQuery),
      async (c) => {
        const rows = await requests.list(
          actor(c),
          await policy(c, 'oa.sealRequests', 'view', 'sealRequests'),
        );
        const query = c.req.valid('query');
        const text = query.search.toLocaleLowerCase();
        const visible = (await Promise.all(rows.map(dto))).filter(
          (row) =>
            (!query.status || row.status === query.status) &&
            (!text ||
              [row.number, row.purpose, row.applicant.name].some((value) =>
                value?.toLocaleLowerCase().includes(text),
              )),
        );
        visible.sort((a, b) => {
          const value =
            query.sort === 'copies'
              ? a.copies - b.copies
              : Date.parse(a.createdAt) - Date.parse(b.createdAt);
          return (
            (query.direction === 'asc' ? value : -value) ||
            a.id.localeCompare(b.id)
          );
        });
        return c.json({
          data: visible.slice(
            (query.page - 1) * query.pageSize,
            query.page * query.pageSize,
          ),
          meta: {
            total: visible.length,
            page: query.page,
            pageSize: query.pageSize,
          },
        });
      },
    );
    router.post(
      '/sealRequests',
      doc('createSealRequest', 'Create seal request draft', S.Request),
      apiValidator('json', S.Create),
      async (c) => {
        const { requestKey, ...input } = c.req.valid('json');
        return c.json({
          data: await dto(
            await requests.create(
              actor(c),
              input,
              requestKey,
              await access(c, 'create'),
            ),
          ),
        });
      },
    );
    router.get(
      '/sealRequests/:id',
      doc(
        'getSealRequest',
        'Read visible request and safe approval timeline',
        S.Detail,
      ),
      apiValidator('param', S.Params),
      async (c) => {
        const detail = await requests.detail(
          c.req.valid('param').id,
          actor(c),
          await policy(c, 'oa.sealRequests', 'view', 'sealRequests'),
        );
        const optionalPolicy = async (
          resource: string,
          action: string,
          collection: string,
        ) => {
          try {
            return await policy(c, resource, action, collection);
          } catch (error) {
            if (error instanceof SealError && error.code === 'ACCESS_DENIED')
              return undefined;
            throw error;
          }
        };
        const [contract, seal] = await Promise.all([
          detail.record.contractId
            ? optionalPolicy('oa.contract', 'ledger', 'contracts')
            : undefined,
          detail.record.sealId
            ? optionalPolicy('oa.seals', 'view', 'seals')
            : undefined,
        ]);
        let registrationAccess;
        if (detail.record.ledgerId) {
          try {
            registrationAccess = await ledgerAccess(c);
          } catch (error) {
            if (!(error instanceof SealError) || error.code !== 'ACCESS_DENIED')
              throw error;
          }
        }
        const relatedNames = await readSealRelatedNames(
          detail.record,
          actor(c),
          db.connection(),
          {
            contracts: container.resolve(contractLedgerServiceToken),
            seals: ledger,
          },
          { contract, seal, ledger: registrationAccess },
        );
        return c.json({
          data: {
            relatedNames,
            record: await dto(detail.record),
            tasks: await Promise.all(
              detail.tasks
                .filter((t) => t.recordId === detail.record.id)
                .map(async (t) => ({
                  id: t.id,
                  runId: t.runId,
                  status: t.status,
                  assigneeId: t.assigneeId,
                  assignee: t.assigneeId ? await person(t.assigneeId) : null,
                })),
            ),
            runs: detail.runs.map((r) => ({
              id: r.id,

              status: r.status,
              contentHash: r.contentHash,
            })),
            actions: await Promise.all(
              detail.actions.map(async (a) => ({
                id: a.id,
                name: a.name,
                actorId: a.actorId,
                actor: await person(a.actorId),
                createdAt: a.at,
              })),
            ),
          },
        });
      },
    );
    router.put(
      '/sealRequests/:id',
      doc('editSealRequest', 'Edit mutable seal request draft', S.Request),
      apiValidator('param', S.Params),
      apiValidator('json', S.Edit),
      async (c) => {
        const { requestKey, expectedVersion, ...input } = c.req.valid('json');
        return c.json({
          data: await dto(
            await requests.change(
              c.req.valid('param').id,
              actor(c),
              'edit',
              input,
              requestKey,
              expectedVersion,
              await access(c, 'edit'),
            ),
          ),
        });
      },
    );
    for (const transition of [
      'submit',
      'withdraw',
      'terminate',
      'retry',
      'forceComplete',
    ] as const)
      router.post(
        `/sealRequests/:id/${transition}`,
        doc(
          `${transition}SealRequest`,
          `${transition} seal request`,
          S.Request,
        ),
        apiValidator('param', S.Params),
        apiValidator('json', S.Command),
        async (c) => {
          const { requestKey, expectedVersion, ...input } = c.req.valid('json');
          return c.json({
            data: await dto(
              await requests.change(
                c.req.valid('param').id,
                actor(c),
                transition,
                input,
                requestKey,
                expectedVersion,
                await access(
                  c,
                  transition === 'submit' || transition === 'withdraw'
                    ? 'edit'
                    : 'operate',
                ),
              ),
            ),
          });
        },
      );
    router.post(
      '/sealRequests/:id/actions',
      doc(
        'performSealAction',
        'Perform genuine offered approval or handling action',
        S.ActionResult,
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.Action),
      async (c) => {
        const result = await requests.perform(
          c.req.valid('param').id,
          actor(c),
          c.req.valid('json'),
          await access(c, 'operate'),
        );
        return c.json({
          data: {
            actionId: result.actionId,
            name: result.name,
            outcome: result.outcome,
          },
        });
      },
    );
    router.post(
      '/sealRequests/:id/actualReturn',
      doc(
        'confirmExceptionalSealReturn',
        'Record actual physical return after administrative closure',
        S.Receipt,
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.ActualReturn),
      async (c) => {
        const receipt = await requests.actualReturn(
          c.req.valid('param').id,
          actor(c),
          c.req.valid('json'),
          await access(c, 'actualReturn'),
        );
        return c.json({
          data: {
            ...receipt,
            confirmedBy: await person(receipt.confirmedById),
          },
        });
      },
    );
    router.get(
      '/sealRequests/:id/files',
      doc(
        'listSealFiles',
        'Read private current-view attachment metadata',
        S.File.array(),
      ),
      apiValidator('param', S.Params),
      async (c) => {
        c.header('cache-control', 'private, no-store');
        return c.json({
          data: await requests.files(
            actor(c),
            c.req.valid('param').id,
            await policy(c, 'oa.sealRequests', 'view', 'sealRequests'),
          ),
        });
      },
    );
    router.post(
      '/sealRequests/:id/files',
      doc('uploadSealFile', 'Upload a private draft attachment', S.File),
      apiValidator('param', S.Params),
      bodyLimit({
        maxSize: 21 * 1024 * 1024,
        onError: () => {
          throw new SealError('BODY_TOO_LARGE');
        },
      }),
      apiValidator('form', S.Upload),
      async (c) => {
        const { file, requestKey } = c.req.valid('form');
        const a = await access(c, 'edit');
        await requests.detail(c.req.valid('param').id, actor(c), a.view);
        return c.json({
          data: await requests.upload(
            actor(c),
            c.req.valid('param').id,
            file,
            requestKey,
            a.requests,
          ),
        });
      },
    );
    router.get(
      '/sealRequests/:id/files/:fileId/content',
      describeRoute({
        tags: ['Seals'],
        operationId: 'readSealFile',
        summary: 'Read a private current-view attachment',
        responses: {
          '200': { description: 'Guarded attachment bytes' },
          ...apiErrorResponses,
          '404': { description: 'Not found' },
        },
      }),
      apiValidator('param', S.FileParams),
      async (c) => {
        const { id, fileId } = c.req.valid('param'),
          file = await requests.content(
            actor(c),
            id,
            fileId,
            await policy(c, 'oa.sealRequests', 'view', 'sealRequests'),
          );
        return c.body(new Uint8Array(file.bytes), 200, {
          'content-type': file.mimeType,
          'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
          'cache-control': 'private, no-store',
          'x-content-type-options': 'nosniff',
          'content-security-policy': "sandbox; default-src 'none'",
        });
      },
    );
    router.get(
      '/seals',
      listDoc('listSealInstances', 'List visible seal instances', S.Instance),
      async (c) => {
        const p = await policy(c, 'oa.seals', 'view', 'seals'),
          rows = await db.transaction((tx) => ledger.listInstances(tx, p));
        return c.json({ data: rows, meta: { total: rows.length } });
      },
    );
    router.post(
      '/seals',
      doc(
        'saveSealInstance',
        'Manage seal metadata without physical inventory effects',
        S.Instance,
      ),
      apiValidator('json', S.InstanceInput),
      async (c) => {
        const p = await policy(c, 'oa.seals', 'manage', 'seals');
        return c.json({
          data: await db.transaction((tx) =>
            ledger.saveInstance(
              { ...c.req.valid('json'), actorId: actor(c) },
              tx,
              p,
            ),
          ),
        });
      },
    );
    async function ledgerAccess(c: Context<Env>) {
      let seals: RepositoryPolicy | undefined;
      try {
        seals = await policy(c, 'oa.seals', 'view', 'seals');
      } catch (error) {
        if (!(error instanceof SealError)) throw error;
      }
      return {
        seals,
        ledger: await policy(c, 'oa.sealLedger', 'view', 'sealLedger'),
        receipts: await policy(c, 'oa.sealLedger', 'view', 'sealReceipts'),
        requests: await policy(c, 'oa.sealRequests', 'view', 'sealRequests'),
      };
    }
    router.get(
      '/sealLedger',
      listDoc(
        'listSealLedger',
        'Read current visible immutable registrations',
        S.Ledger,
        S.LedgerMeta,
      ),
      apiValidator('query', S.LedgerQuery),
      async (c) => {
        const access = await ledgerAccess(c);
        const result = await db.transaction((tx) =>
          ledger.ledgerPage(actor(c), tx, access, c.req.valid('query')),
        );
        return c.json({
          ...result,
          meta: {
            ...result.meta,
            timeZone: container.resolve(calendarServiceToken).timeZone(),
          },
        });
      },
    );
    router.get(
      '/sealLedger/:id',
      doc(
        'getSealLedger',
        'Read immutable registration and actual receipt',
        S.LedgerDetail,
      ),
      apiValidator('param', S.Params),
      async (c) => {
        const access = await ledgerAccess(c);
        return c.json({
          data: {
            ...(await db.transaction((tx) =>
              ledger.ledgerDetail(
                c.req.valid('param').id,
                actor(c),
                tx,
                access,
              ),
            )),
            timeZone: container.resolve(calendarServiceToken).timeZone(),
          },
        });
      },
    );
    router.route('/', createSealBrowserRoutes(app));
    return new Hono().route('/', router);
  }),
];
