import type { Application } from '@nocobase/app-server/application';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import {
  ApiError,
  apiValidator,
  apiErrorResponses,
  describeRoute,
  listResponse,
  dataResponse,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  readWorkbenchTasks,
  workbenchTaskRows,
} from '../../providers/task-center/workbench.js';
import { CenterItem, CenterMeta } from '../approval-center/schemas.js';

export function workbenchTaskRoutes(app: Application) {
  const router = new Hono<AuthEnv & AuthorizationEnv>();
  const c = app.container;
  router.use(
    '/workbench/tasks',
    c.resolve(authenticationToken).required(),
    c.resolve(authorizationToken).middleware(),
  );
  router.use(
    '/workbench/announcementReceipts',
    c.resolve(authenticationToken).required(),
    c.resolve(authorizationToken).middleware(),
  );
  router.get(
    '/workbench/tasks',
    describeRoute({
      tags: ['Workbench'],
      operationId: 'workbenchTasks',
      summary: 'Read personal workbench tasks from Task Center',
      responses: {
        200: listResponse(CenterItem, CenterMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator(
      'query',
      z.strictObject({
        view: z.enum(['pending', 'mine']).default('pending'),
        pageSize: z.coerce.number().int().min(1).max(100).default(100),
        homeSummary: z.enum(['true', 'false']).optional(),
      }),
    ),
    async (ctx) => {
      const grant = await ctx.get('authz').authorize({
        resource: { type: 'page', id: 'oa.approvals' },
        action: 'access',
      });
      if (grant.effect === 'deny')
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'workbench',
          reason: 'ACCESS_DENIED',
          message: 'Forbidden',
        });
      const query = ctx.req.valid('query');
      return ctx.json(
        await readWorkbenchTasks(
          app,
          ctx.get('auth')!.user.id,
          query.view,
          query.pageSize,
        ),
      );
    },
  );
  router.get(
    '/workbench/announcementReceipts',
    describeRoute({
      tags: ['Workbench'],
      operationId: 'workbenchAnnouncementReceipts',
      summary: 'Read own pending announcement receipts from Task Center',
      responses: {
        200: dataResponse(
          z.object({
            count: z.number(),
            items: z.array(
              z.object({
                id: z.string(),
                announcementId: z.string(),
                title: z.string(),
              }),
            ),
          }),
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', z.strictObject({})),
    async (ctx) => {
      const grant = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.announcements' },
        action: 'view',
      });
      if (grant.effect === 'deny')
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'workbench',
          reason: 'ACCESS_DENIED',
          message: 'Forbidden',
        });
      const page = await c
        .resolve(userTaskServiceToken)
        .list(ctx.get('auth')!.user.id, {
          sourceType: 'oa.announcementReceipt',
          status: 'pending',
          pageSize: 5,
          page: 1,
          orderBy: 'createdAt',
          direction: 'desc',
        });
      const rows = await workbenchTaskRows(app, page.data);
      return ctx.json({
        data: {
          count: page.meta.total,
          items: rows.map((row) => ({
            id: row.id,
            announcementId: row.id,
            title: row.title ?? '',
          })),
        },
      });
    },
  );
  return router;
}
