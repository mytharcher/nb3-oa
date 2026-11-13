import { Hono } from 'hono';
import type { Application } from '@nocobase/app-server/application';
import {
  defineFileRepositoryApiRoutes,
  FILE_COLUMNS,
} from '@nocobase/app-plugin-file/server';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken } from '@nocobase/db';
import {
  ApiError,
  apiErrorHandler,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { repairServiceToken } from '../../providers/it-repairs/index.js';
const principals = new WeakMap<object, { id: string; internal: boolean }>();
const routes = defineFileRepositoryApiRoutes<{ id: string; internal: boolean }>(
  {
    principal: (c) => principals.get(c)!,
    repositories: [
      {
        name: 'itRepairAttachments',
        collection: 'itRepairFiles',
        disk: 'local',
        accessPath: '/uploads/it-repairs',
        accessMode: 'stream',
        policy: ({ id, internal }) => ({
          read: {
            scope: {
              repairId: id,
              ...(!internal ? { visibility: 'public' } : {}),
            },
            fields: FILE_COLUMNS.filter((f) => f !== 'disk' && f !== 'key'),
          },
          create: false,
          update: false,
          delete: false,
        }),
        actions: { findMany: { maxLimit: 100 }, findOne: {} },
      },
    ],
  },
);
export default routes.map((contribution) => ({
  scope: contribution.scope,
  createRouter: async (app: Application) => {
    const r = new Hono<AuthEnv & AuthorizationEnv>(),
      c = app.container,
      db = c.resolve(databaseManagerToken);
    r.onError(apiErrorHandler);
    const path =
      contribution.scope === 'api'
        ? '/itRepairAttachments/*'
        : '/uploads/it-repairs/*';
    r.use(
      path,
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    r.use(path, async (ctx, next) => {
      const denied = () =>
        new ApiError({
          domain: 'itRepairs',
          reason: 'ACCESS_DENIED',
          message: 'Access denied',
          status: 'PERMISSION_DENIED',
        });
      let id = ctx.req.header('x-repair-id');
      let fileVisibility: string | undefined;
      if (contribution.scope === 'root') {
        const fileId = ctx.req.path.split('/').at(-1)?.split('.')[0];
        const f = await db
          .repository<{
            id: string;
            repairId: string;
            purpose: string;
            visibility: string;
          }>('itRepairFiles')
          .findOne({
            filter: {
              id: fileId ?? '',
            },
          });
        id = f ? f.repairId : undefined;
        fileVisibility = f?.visibility;
      }
      if (!id) throw denied();
      const decision = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.itRepairs' },
        action: 'view',
      });
      const policy =
        decision.effect !== 'deny'
          ? decision.conditions?.database?.itRepairs
          : undefined;
      if (!policy) throw denied();
      try {
        const service = c.resolve(repairServiceToken);
        const row = await service.get(id, ctx.get('auth')!.user.id, policy);
        if (
          !(await service.fullAccess(row, ctx.get('auth')!.user.id)) ||
          (fileVisibility === 'internal' &&
            row.requesterId === ctx.get('auth')!.user.id)
        )
          throw denied();
        principals.set(ctx, {
          id,
          internal: row.requesterId !== ctx.get('auth')!.user.id,
        });
      } catch {
        throw denied();
      }

      ctx.header('Cache-Control', 'private, no-store');
      ctx.header('X-Content-Type-Options', 'nosniff');
      ctx.header('Content-Security-Policy', 'sandbox');
      await next();
    });
    r.route('/', await contribution.createRouter(app));
    const mount = new Hono();
    mount.route('/', r);
    return mount;
  },
})) satisfies readonly AppRouteContribution<Application>[];
