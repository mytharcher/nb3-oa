import {
  authenticationToken,
  userAdministrationServiceToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken, type DatabaseConnection } from '@nocobase/db';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  budgetServiceToken,
  BUDGET_SETTINGS,
  BudgetError,
  type BudgetBalance,
} from '../../providers/budgets/index.js';
import { parseBudgetAmount } from '../../providers/budgets/money.js';
import { dictionaryServiceToken } from '../../providers/platform/dictionaries.js';
import { orgServiceToken } from '../../providers/org/contract.js';
import {
  AllocationInput,
  AdjustmentInput,
  BudgetSchema,
  LedgerSchema,
  LedgerQuery,
  ListQuery,
  Meta,
  Params,
} from './schemas.js';
export const budgetApiRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const c = app.container,
      s = c.resolve(budgetServiceToken),
      db = c.resolve(databaseManagerToken),
      dictionaries = c.resolve(dictionaryServiceToken),
      org = c.resolve(orgServiceToken);
    // Isolated prefix keeps identity and explicit settings policies from leaking into other contributions.
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    router.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
      async (ctx, next) => {
        await ctx.get('authz').require({
          resource: { type: 'settings', id: BUDGET_SETTINGS },
          action: ctx.req.method === 'GET' ? 'read' : 'update',
        });
        await next();
      },
    );
    router.onError((error, ctx) =>
      apiErrorHandler(
        error instanceof BudgetError
          ? new ApiError({
              status:
                error.code === 'BUDGET_NOT_FOUND'
                  ? 'NOT_FOUND'
                  : error.code === 'BUDGET_ALREADY_EXISTS'
                    ? 'ALREADY_EXISTS'
                    : error.code === 'BUDGET_IDEMPOTENCY_CONFLICT'
                      ? 'ABORTED'
                      : error.code.includes('INVALID')
                        ? 'INVALID_ARGUMENT'
                        : 'FAILED_PRECONDITION',
              reason: error.code,
              domain: 'budgets',
              message: error.message,
              cause: error,
            })
          : error,
        ctx,
      ),
    );
    const doc = (
      operationId: string,
      summary: string,
      schema: z.ZodType,
      list = false,
    ) =>
      describeRoute({
        tags: ['Budgets'],
        operationId,
        summary,
        responses: {
          '200': list ? listResponse(schema, Meta) : dataResponse(schema),
          ...apiErrorResponses,
        },
      });
    async function view(b: BudgetBalance, tx = db.connection()) {
      const department = await tx
        .repository<{ id: string; title: string }>('departments')
        .findOne({ filter: { id: b.departmentId } });
      const subject = await dictionaries.get('budgetSubject', b.subject, tx);
      return {
        ...b,
        department: {
          id: b.departmentId,
          title: department?.title ?? b.departmentId,
        },
        subjectLabel: subject?.label ?? {
          'zh-CN': b.subject,
          'en-US': b.subject,
        },
      };
    }
    async function get(id: string) {
      const b = await s.get(id);
      if (!b)
        throw new BudgetError(
          'BUDGET_NOT_FOUND',
          'The budget account no longer exists.',
        );
      return b;
    }
    async function validate(
      b: Pick<BudgetBalance, 'departmentId' | 'subject'>,
      tx: DatabaseConnection,
    ) {
      if (!(await org.activeChain(b.departmentId, tx)))
        throw new BudgetError(
          'BUDGET_INVALID_DEPARTMENT',
          'Select an active department.',
        );
      if (!(await dictionaries.get('budgetSubject', b.subject, tx))?.active)
        throw new BudgetError(
          'BUDGET_INVALID_SUBJECT',
          'Select an active budget subject.',
        );
    }
    router.get(
      '/',
      doc('listBudgets', 'List budget balances', BudgetSchema, true),
      apiValidator('query', ListQuery),
      async (ctx) => {
        const q = ctx.req.valid('query'),
          r = await s.list({ ...q, sort: q.orderBy });
        return ctx.json({
          data: await Promise.all(r.items.map((b) => view(b))),
          meta: { page: r.page, pageSize: q.pageSize, total: r.total },
        });
      },
    );
    router.get(
      '/options',
      doc(
        'budgetOptions',
        'Budget subject options',
        z.object({
          subjects: z.array(
            z.object({
              code: z.string(),
              label: z.record(z.string(), z.string()),
              active: z.boolean(),
            }),
          ),
        }),
      ),
      async (ctx) =>
        ctx.json({
          data: {
            subjects: (
              await dictionaries.list('budgetSubject', {
                includeInactive: true,
              })
            ).map((v) => ({ code: v.code, label: v.label, active: v.active })),
          },
        }),
    );
    router.post(
      '/allocations',
      describeRoute({
        tags: ['Budgets'],
        operationId: 'allocateAnnualBudget',
        summary: 'Create an annual budget account',
        responses: { '201': dataResponse(BudgetSchema), ...apiErrorResponses },
      }),
      apiValidator('json', AllocationInput),
      async (ctx) => {
        const input = ctx.req.valid('json');
        const result = await db.transaction(async (tx) => {
          await validate(input, tx);
          return view(
            await s.allocate(
              {
                ...input,
                deltaCents: parseBudgetAmount(input.deltaAmount)!,
                requireNew: true,
                actorId: ctx.get('auth')!.user.id,
                reference: `finance:${input.requestKey}`,
              },
              tx,
            ),
            tx,
          );
        });
        return ctx.json({ data: result }, 201);
      },
    );
    router.get(
      '/:budgetId',
      doc('getBudget', 'Read a budget account', BudgetSchema),
      apiValidator('param', Params),
      async (ctx) =>
        ctx.json({
          data: await view(await get(ctx.req.valid('param').budgetId)),
        }),
    );
    router.post(
      '/:budgetId/adjustments',
      doc('adjustBudget', 'Record a manual budget adjustment', BudgetSchema),
      apiValidator('param', Params),
      apiValidator('json', AdjustmentInput),
      async (ctx) => {
        const b = await get(ctx.req.valid('param').budgetId),
          input = ctx.req.valid('json');
        const result = await db.transaction(async (tx) => {
          await validate(b, tx);
          return view(
            await s.allocate(
              {
                ...b,
                ...input,
                deltaCents: parseBudgetAmount(input.deltaAmount)!,
                actorId: ctx.get('auth')!.user.id,
                reference: `finance:${input.requestKey}`,
              },
              tx,
            ),
            tx,
          );
        });
        return ctx.json({ data: result });
      },
    );
    router.get(
      '/:budgetId/ledger',
      doc(
        'listBudgetLedger',
        'List immutable budget changes',
        LedgerSchema,
        true,
      ),
      apiValidator('param', Params),
      apiValidator('query', LedgerQuery),
      async (ctx) => {
        const b = await get(ctx.req.valid('param').budgetId),
          q = ctx.req.valid('query'),
          r = await s.ledger(b, { ...q, sort: q.orderBy });
        const ids = [...new Set(r.items.map((v) => v.actorId))];
        const users = ids.length
          ? (
              await c
                .resolve(userAdministrationServiceToken)
                .list({ userIds: ids, pageSize: 100, kind: 'all' })
            ).items
          : [];
        const names = new Map(users.map((v) => [v.id, v.name]));
        return ctx.json({
          data: r.items.map((v) => ({
            ...v,
            at: v.at.toISOString(),
            actor: { id: v.actorId, name: names.get(v.actorId) ?? v.actorId },
          })),
          meta: { page: r.page, pageSize: q.pageSize, total: r.total },
        });
      },
    );
    const mount = new Hono();
    mount.route('/budgets', router);
    return mount;
  });
export default [
  budgetApiRoutes,
] satisfies readonly AppRouteContribution<Application>[];
