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
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  financeAssignmentServiceToken,
  FINANCE_ASSIGNMENTS_SETTINGS,
  FinanceAssignmentError,
  type FinanceAssignment,
} from '../../providers/finance-assignments/index.js';
import {
  Params,
  ListQuery,
  Meta,
  AssignmentSchema,
  NewInput,
  EditInput,
  UserSchema,
} from './schemas.js';
const api: AppApiRouteContribution<Application> = defineApiRoutes((app) => {
  const c = app.container,
    s = c.resolve(financeAssignmentServiceToken),
    db = c.resolve(databaseManagerToken),
    users = c.resolve(userAdministrationServiceToken);
  const router = new Hono<AuthEnv & AuthorizationEnv>();
  router.use(
    '*',
    c.resolve(authenticationToken).required(),
    c.resolve(authorizationToken).middleware(),
    async (ctx, next) => {
      await ctx.get('authz').require({
        resource: { type: 'settings', id: FINANCE_ASSIGNMENTS_SETTINGS },
        action: ctx.req.method === 'GET' ? 'read' : 'update',
      });
      await next();
    },
  );
  router.onError((error, ctx) =>
    apiErrorHandler(
      error instanceof FinanceAssignmentError
        ? new ApiError({
            status: error.code.endsWith('NOT_FOUND')
              ? 'NOT_FOUND'
              : error.code.endsWith('ALREADY_EXISTS')
                ? 'ALREADY_EXISTS'
                : error.code.endsWith('VERSION_CONFLICT')
                  ? 'ABORTED'
                  : 'INVALID_ARGUMENT',
            reason: error.code,
            domain: 'financeAssignments',
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
      tags: ['Finance assignments'],
      operationId,
      summary,
      responses: {
        '200': list ? listResponse(schema, Meta) : dataResponse(schema),
        ...apiErrorResponses,
      },
    });
  async function people(ids: readonly string[]) {
    const known = new Map<string, { id: string; name: string }>();
    const unique = [...new Set(ids)];
    for (let i = 0; i < unique.length; i += 100) {
      const records = await users.list({
        userIds: unique.slice(i, i + 100),
        pageSize: 100,
        kind: 'all',
      });
      for (const u of records.items)
        known.set(u.id, { id: u.id, name: u.name });
    }
    return known;
  }
  async function view(row: FinanceAssignment) {
    const department = await db
        .connection()
        .repository<{ id: string; title: string }>('departments')
        .findOne({ filter: { id: row.departmentId } }),
      known = await people([row.accountantId]);
    return {
      ...row,
      department: {
        id: row.departmentId,
        title: department?.title ?? row.departmentId,
      },
      accountant: known.get(row.accountantId) ?? {
        id: row.accountantId,
        name: row.accountantId,
      },
    };
  }
  async function get(id: string) {
    const row = await s.get(id);
    if (!row)
      throw new FinanceAssignmentError(
        'FINANCE_ASSIGNMENT_NOT_FOUND',
        'This assignment does not exist.',
      );
    return row;
  }
  router.get(
    '/',
    doc(
      'listFinanceAssignments',
      'List department accountant assignments',
      AssignmentSchema,
      true,
    ),
    apiValidator('query', ListQuery),
    async (ctx) => {
      const r = await s.list(ctx.req.valid('query'));
      return ctx.json({ ...r, data: await Promise.all(r.data.map(view)) });
    },
  );
  router.get(
    '/options',
    doc(
      'financeAssignmentOptions',
      'List eligible active finance duty-role members',
      z.object({ accountants: z.array(UserSchema) }),
    ),
    async (ctx) => {
      const ids = await s.candidates(),
        known = await people(ids);
      return ctx.json({
        data: {
          accountants: ids.map((id) => known.get(id) ?? { id, name: id }),
        },
      });
    },
  );
  router.post(
    '/',
    describeRoute({
      tags: ['Finance assignments'],
      operationId: 'createFinanceAssignment',
      summary: 'Assign a department accountant',
      responses: {
        '201': dataResponse(AssignmentSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', NewInput),
    async (ctx) =>
      ctx.json(
        {
          data: await view(
            await db.transaction((tx) =>
              s.create(
                { ...ctx.req.valid('json'), actorId: ctx.get('auth')!.user.id },
                tx,
              ),
            ),
          ),
        },
        201,
      ),
  );
  router.get(
    '/:assignmentId',
    doc(
      'getFinanceAssignment',
      'Read an accountant assignment',
      AssignmentSchema,
    ),
    apiValidator('param', Params),
    async (ctx) =>
      ctx.json({
        data: await view(await get(ctx.req.valid('param').assignmentId)),
      }),
  );
  router.patch(
    '/:assignmentId',
    doc(
      'updateFinanceAssignment',
      'Update or disable a department accountant',
      AssignmentSchema,
    ),
    apiValidator('param', Params),
    apiValidator('json', EditInput),
    async (ctx) =>
      ctx.json({
        data: await view(
          await db.transaction((tx) =>
            s.update(
              ctx.req.valid('param').assignmentId,
              { ...ctx.req.valid('json'), actorId: ctx.get('auth')!.user.id },
              tx,
            ),
          ),
        ),
      }),
  );
  const root = new Hono();
  root.route('/financeAssignments', router);
  return root;
});
const routes: AppRouteContribution<Application>[] = [api];
export default routes;
