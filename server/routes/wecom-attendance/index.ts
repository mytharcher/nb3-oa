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
import { databaseManagerToken } from '@nocobase/db';
import {
  defineApiRoutes,
  apiErrorHandler,
  ApiError,
  apiValidator,
  describeRoute,
  dataResponse,
  apiErrorResponses,
} from '@nocobase/app-server/router';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import {
  wecomAttendanceServiceToken,
  type WecomAttendanceRun,
} from '../../providers/wecom-attendance/contract.js';
import { WecomAttendanceError } from '../../providers/wecom-attendance/client.js';
const Input = z.strictObject({
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  reason: z.string().trim().min(1).max(2000),
  requestKey: z.string().min(1).max(128),
});
const Run = z.object({
  id: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  state: z.enum(['running', 'completed', 'failed']),
  errorCode: z.string().nullable(),
  committedRecords: z.number(),
  completedBatches: z.number(),
  attempts: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
const publicRun = (r: WecomAttendanceRun) => ({
  id: r.id,
  startDate: r.startDate,
  endDate: r.endDate,
  state: r.state,
  errorCode: r.errorCode,
  committedRecords: r.committedRecords,
  completedBatches: r.completedBatches,
  attempts: r.attempts,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      service = c.resolve(wecomAttendanceServiceToken),
      db = c.resolve(databaseManagerToken);
    const r = new Hono<AuthEnv & AuthorizationEnv>();
    r.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    r.use('*', async (ctx, next) => {
      await ctx.get('authz').require({
        resource: { type: 'settings', id: 'oa.wecomAttendance' },
        action: ctx.req.method === 'POST' ? 'sync' : 'view',
      });
      await next();
    });
    r.onError(async (error, ctx) => {
      if (!(error instanceof WecomAttendanceError))
        return apiErrorHandler(error, ctx);
      const i18n = c.resolve(i18nToken),
        locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      return apiErrorHandler(
        new ApiError({
          domain: 'wecomAttendance',
          reason: error.code,
          status: 'FAILED_PRECONDITION',
          message: i18n.getFixedT('nb3-oa', locale)('wecomAttendance.failed'),
        }),
        ctx,
      );
    });
    const describe = (summary: string, schema: z.ZodType) =>
      describeRoute({
        tags: ['Attendance source'],
        summary,
        responses: { 200: dataResponse(schema), ...apiErrorResponses },
      });
    r.get(
      '/',
      describe(
        'Read source status and recent runs',
        z.object({
          enabled: z.boolean(),
          configured: z.boolean(),
          mappedUsers: z.number(),
          runs: z.array(Run),
        }),
      ),
      async (ctx) => {
        const rows = await db
          .connection()
          .repository<WecomAttendanceRun>('wecomAttendanceRuns')
          .findMany({ sort: (s) => s.field('createdAt').desc(), limit: 30 });
        return ctx.json({
          data: { ...service.status(), runs: rows.map(publicRun) },
        });
      },
    );
    r.post(
      '/sync',
      describe('Synchronize configured attendance users', Run),
      apiValidator('json', Input),
      async (ctx) => {
        const run = await service.sync({
          ...ctx.req.valid('json'),
          actorId: ctx.get('auth')!.user.id,
        });
        return ctx.json({ data: publicRun(run) });
      },
    );
    return new Hono().route('/attendanceManagement/wecomSource', r);
  }),
];
