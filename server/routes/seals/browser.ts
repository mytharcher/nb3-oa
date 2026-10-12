import type { Application } from '@nocobase/app-server/application';
import { Hono, type Context } from 'hono';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import {
  apiValidator,
  describeRoute,
  dataResponse,
  apiErrorResponses,
} from '@nocobase/app-server/router';
import {
  sealRequestServiceToken,
  SEAL_KIND,
  SEAL_REQUEST_FIELDS,
} from '../../providers/seals/contract.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
} from '../../providers/platform/index.js';
import { approvalDirectoryServiceToken } from '../../providers/approval-directory/contract.js';
import { SealError } from '../../providers/seals/errors.js';
import * as S from './schemas.js';
type Env = AuthEnv & AuthorizationEnv;
export function createSealBrowserRoutes(app: Application) {
  const router = new Hono<Env>();
  router.use(
    '*',
    app.container.resolve(authenticationToken).required(),
    app.container.resolve(authorizationToken).middleware(),
  );
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    service = c.resolve(sealRequestServiceToken);
  async function policy(
    ctx: Context<Env>,
    resource: string,
    action: string,
    collection: string,
  ) {
    const d = await ctx
      .get('authz')
      .authorize({ resource: { type: 'composite', id: resource }, action });
    return d.effect === 'deny'
      ? undefined
      : (
          d.conditions?.database as
            Record<string, RepositoryPolicy | false | undefined> | undefined
        )?.[collection] || undefined;
  }
  async function permits(p: RepositoryPolicy | undefined, id: string) {
    if (!p || p.read === false) return false;
    if (
      p.read !== true &&
      Array.isArray(p.read.fields) &&
      !SEAL_REQUEST_FIELDS.every(
        (f) =>
          p.read !== true &&
          p.read !== false &&
          Array.isArray(p.read.fields) &&
          p.read.fields.includes(f),
      )
    )
      return false;
    const repo = db.repository('sealRequests').withPolicy(p);
    if (!(await repo.findOne({ filter: { id } }))) return false;
    return (
      await repo.validateMutation({
        operation: 'updateOne',
        filter: { id },
        values: { lifecycleVersion: { increment: 0 } },
      })
    ).valid;
  }
  const doc = (
    operationId: string,
    schema: Parameters<typeof dataResponse>[0],
  ) =>
    describeRoute({
      operationId,
      tags: ['Seals'],
      summary: operationId,
      responses: { 200: dataResponse(schema), ...apiErrorResponses },
    });
  router.get(
    '/sealBrowser/options',
    doc('sealBrowserOptions', S.BrowserOptions),
    async (ctx) => {
      const id = ctx.get('auth')!.user.id;
      const view = await policy(ctx, 'oa.sealRequests', 'view', 'sealRequests');
      const create = await policy(
        ctx,
        'oa.sealRequests',
        'create',
        'sealRequests',
      );
      if (!view && !create) throw new SealError('ACCESS_DENIED');
      const contract = await policy(ctx, 'oa.contract', 'ledger', 'contracts');
      // Keep options to publicly readable identity fields; never return funding or contract facts.
      let contracts: { id: string; number: string | null }[] = [];
      if (
        contract &&
        contract.read !== false &&
        (contract.read === true ||
          contract.read.fields === undefined ||
          (Array.isArray(contract.read.fields) &&
            ['id', 'number', 'status'].every(
              (f) =>
                contract.read !== true &&
                contract.read !== false &&
                Array.isArray(contract.read.fields) &&
                contract.read.fields.includes(f),
            )))
      ) {
        const rows = await db
          .repository<{ id: string; number: string | null; status: string }>(
            'contracts',
          )
          .withPolicy(contract)
          .findMany({
            filter: (f) =>
              f.or(
                ['active', 'activePendingSeal'].map((status) =>
                  f.string('status').eq(status),
                ),
              ),
            select: (s) => s.fields('id', 'number', 'status'),
          });
        contracts = rows
          .filter(
            (r): r is { id: string; number: string | null; status: string } =>
              typeof r.id === 'string' &&
              typeof r.status === 'string' &&
              (r.number === null || typeof r.number === 'string'),
          )
          .map((r) => ({ id: r.id, number: r.number }));
      }
      return ctx.json({
        data: {
          timeZone: c.resolve(calendarServiceToken).timeZone(),
          sealTypes: (
            await c.resolve(dictionaryServiceToken).list('sealType')
          ).map((r) => ({ code: r.code, label: r.label })),
          contracts,
          actorId: id,
        },
      });
    },
  );
  router.get(
    '/sealBrowser/requests/:id/capabilities',
    doc('sealBrowserCapabilities', S.BrowserCapabilities),
    apiValidator('param', S.Params),
    async (ctx) => {
      const id = ctx.req.valid('param').id,
        actorId = ctx.get('auth')!.user.id;
      const view = await policy(ctx, 'oa.sealRequests', 'view', 'sealRequests');
      if (!view) throw new SealError('ACCESS_DENIED');
      const detail = await service.detail(id, actorId, view);
      const edit = await policy(ctx, 'oa.sealRequests', 'edit', 'sealRequests');
      const operate = await policy(
        ctx,
        'oa.sealRequests',
        'operate',
        'sealRequests',
      );
      const actual = await policy(
        ctx,
        'oa.sealRequests',
        'actualReturn',
        'sealRequests',
      );
      const contract = await policy(ctx, 'oa.contract', 'ledger', 'contracts');
      const directory = await c
        .resolve(approvalDirectoryServiceToken)
        .snapshot();
      const canEdit = directory.isActive(actorId) && (await permits(edit, id)),
        canOperate =
          directory.isActive(actorId) && (await permits(operate, id));
      const transitions =
        canEdit || canOperate
          ? (
              await service.transitions(id, actorId, {
                requests: view,
                view,
                contract,
              })
            ).filter((n) =>
              ['edit', 'submit', 'withdraw'].includes(n) ? canEdit : canOperate,
            )
          : [];
      const runs = canOperate
        ? await service.approvals.runViewsFor(SEAL_KIND, id)
        : [];
      const offers = canOperate
        ? await service.approvals.actionsFor(SEAL_KIND, id, { id: actorId })
        : [];
      return ctx.json({
        data: {
          timeZone: c.resolve(calendarServiceToken).timeZone(),
          transitions,
          taskActions: offers.map((o) => ({
            taskId: o.task.id,
            runId: o.task.runId,
            contentHash:
              runs.find((r) => r.run.id === o.task.runId)?.run.contentHash ??
              '',
            actions: o.actions
              .filter((a) => {
                if (
                  ['stamping', 'returning', 'returnException'].includes(
                    detail.record.status,
                  ) &&
                  [
                    'claim',
                    'release',
                    'assign',
                    'transfer',
                    'complete',
                    'unable',
                  ].includes(a.name) &&
                  !directory.hasRole(actorId, 'sealKeeper')
                )
                  return false;
                if (
                  ['legal', 'financeManager', 'gm'].includes(
                    detail.record.status,
                  ) &&
                  ['approve', 'reject', 'return', 'answer'].includes(a.name)
                )
                  return (
                    directory.isActive(o.task.assigneeId ?? actorId) &&
                    directory.hasRole(
                      o.task.assigneeId ?? actorId,
                      detail.record.status,
                    )
                  );
                return true;
              })
              .map((a) => ({
                name: a.name,
                options: a.options,
                primary: a.primary,
                tone: a.tone,
              })),
          })),
          canActualReturn:
            detail.record.status === 'administrativelyClosed' &&
            detail.record.external &&
            !!detail.record.ledgerId &&
            !detail.record.returnedAt &&
            directory.isActive(actorId) &&
            directory.hasRole(actorId, 'admin') &&
            directory.hasRole(actorId, 'sealKeeper') &&
            (await permits(actual, id)),
        },
      });
    },
  );
  return router;
}
