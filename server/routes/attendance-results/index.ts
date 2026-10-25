import { Hono, type Context } from 'hono';
import { z } from 'zod';
import {
  authenticationToken,
  userAdministrationServiceToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken } from '@nocobase/db';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import {
  attendanceEvaluationServiceToken,
  AttendanceError,
} from '../../providers/attendance/index.js';
import {
  assertAttendanceDayEnded,
  listAttendanceResults,
} from '../../providers/attendance/results.js';
import { calendarServiceToken } from '../../providers/platform/index.js';
import { orgServiceToken } from '../../providers/org/contract.js';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
const Query = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  userId: z.string().max(64).optional(),
  departmentId: z.string().max(64).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(31),
});
const Calculate = z.strictObject({
  date: z.iso.date(),
  id: z.string().max(64).optional(),
  reason: z.string().trim().min(1).max(2000),
  requestKey: z.string().min(1).max(128),
});
const Row = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  date: z.string(),
  revision: z.number(),
  calculatedAt: z.string(),
  approvedOvertimeMinutes: z.number(),
  missingPunches: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      punchKind: z.string(),
      version: z.number(),
    }),
  ),
  result: z.object({
    status: z.enum(['normal', 'exception', 'blocked', 'rest']),
    reasons: z.array(z.string()),
    lateMinutes: z.number(),
    earlyMinutes: z.number(),
    missingPunches: z.number(),
    absentMinutes: z.number(),
  }),
});
const Summary = z.object({
  normalDays: z.number(),
  exceptionDays: z.number(),
  blockedDays: z.number(),
  restDays: z.number(),
  lateMinutes: z.number(),
  earlyMinutes: z.number(),
  missingPunches: z.number(),
  absentMinutes: z.number(),
  approvedOvertimeMinutes: z.number(),
});
function summarize(rows: Awaited<ReturnType<typeof listAttendanceResults>>) {
  const summary = {
    normalDays: 0,
    exceptionDays: 0,
    blockedDays: 0,
    restDays: 0,
    lateMinutes: 0,
    earlyMinutes: 0,
    missingPunches: 0,
    absentMinutes: 0,
    approvedOvertimeMinutes: 0,
  };
  for (const row of rows) {
    summary[`${row.result.status}Days`]++;
    for (const key of [
      'lateMinutes',
      'earlyMinutes',
      'missingPunches',
      'absentMinutes',
    ] as const)
      summary[key] += row.result[key];
    summary.approvedOvertimeMinutes += row.approvedOvertimeMinutes;
  }
  return summary;
}
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      db = c.resolve(databaseManagerToken),
      calendar = c.resolve(calendarServiceToken),
      evaluator = c.resolve(attendanceEvaluationServiceToken);
    const r = new Hono<AuthEnv & AuthorizationEnv>();
    r.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    r.onError(async (error, ctx) => {
      if (!(error instanceof AttendanceError))
        return apiErrorHandler(error, ctx);
      const i18n = c.resolve(i18nToken),
        locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      return apiErrorHandler(
        new ApiError({
          domain: 'attendanceResults',
          reason: error.code,
          status:
            error.code === 'ATTENDANCE_ACCESS_DENIED'
              ? 'PERMISSION_DENIED'
              : 'FAILED_PRECONDITION',
          message: i18n.getFixedT('nb3-oa', locale)('attendanceResults.failed'),
        }),
        ctx,
      );
    });
    r.use('*', async (ctx, next) => {
      const decision = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.attendanceResults' },
        action:
          ctx.req.method === 'POST'
            ? 'recalculate'
            : ctx.req.path.endsWith('/export')
              ? 'export'
              : 'view',
      });
      if (decision.effect === 'deny')
        throw new AttendanceError(
          'ATTENDANCE_ACCESS_DENIED',
          'Attendance action is unavailable.',
        );
      await next();
    });
    const decorate = async (
      rows: Awaited<ReturnType<typeof listAttendanceResults>>,
    ) => {
      const users = c.resolve(userAdministrationServiceToken);
      const names = new Map(
        await Promise.all(
          [...new Set(rows.map((row) => row.userId))].map(
            async (id) => [id, (await users.get(id))?.name ?? id] as const,
          ),
        ),
      );
      return rows.map((row) => ({ ...row, userName: names.get(row.userId)! }));
    };
    const describe = (summary: string, schema: z.ZodType) =>
      describeRoute({
        tags: ['Attendance results'],
        summary,
        responses: { 200: dataResponse(schema), ...apiErrorResponses },
      });
    const policies = async (
      ctx: Context<AuthEnv & AuthorizationEnv>,
      action: string,
    ) => {
      const decision = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.attendanceResults' },
        action,
      });
      const data = decision.conditions?.database;
      if (
        decision.effect === 'deny' ||
        !data?.attendanceEvaluations ||
        !data.attendanceEvaluationRevisions
      )
        throw new AttendanceError(
          'ATTENDANCE_ACCESS_DENIED',
          'Attendance access is unavailable.',
        );
      return {
        current: data.attendanceEvaluations,
        revision: data.attendanceEvaluationRevisions,
      };
    };
    r.get(
      '/',
      describe(
        'Read authorized monthly attendance results',
        z.object({
          items: z.array(Row),
          summary: Summary,
          total: z.number(),
          page: z.number(),
          pageSize: z.number(),
          timeZone: z.string(),
        }),
      ),
      apiValidator('query', Query),
      async (ctx) => {
        const q = ctx.req.valid('query');
        const rows = await listAttendanceResults(
          db.connection(),
          q,
          await policies(ctx, 'view'),
        );
        return ctx.json({
          data: {
            items: await decorate(
              rows.slice((q.page - 1) * q.pageSize, q.page * q.pageSize),
            ),
            summary: summarize(rows),
            total: rows.length,
            page: q.page,
            pageSize: q.pageSize,
            timeZone: calendar.timeZone(),
          },
        });
      },
    );
    r.get(
      '/export',
      describe(
        'Export authorized monthly attendance results',
        z.object({ items: z.array(Row), summary: Summary }),
      ),
      apiValidator('query', Query),
      async (ctx) => {
        const rows = await listAttendanceResults(
          db.connection(),
          ctx.req.valid('query'),
          await policies(ctx, 'export'),
        );
        return ctx.json({
          data: { items: await decorate(rows), summary: summarize(rows) },
        });
      },
    );
    r.post(
      '/calculate',
      describe(
        'Calculate one ended attendance day',
        z.object({ id: z.string(), status: z.string() }),
      ),
      apiValidator('json', Calculate),
      async (ctx) => {
        const input = ctx.req.valid('json'),
          actorId = ctx.get('auth')!.user.id;
        const policy = await policies(ctx, 'recalculate');
        let userId = actorId;
        if (!input.id) {
          const self = await ctx.get('authz').authorize({
            resource: { type: 'composite', id: 'oa.attendanceResults' },
            action: 'calculateSelf',
          });
          if (self.effect === 'deny')
            throw new AttendanceError(
              'ATTENDANCE_ACCESS_DENIED',
              'Self calculation is unavailable.',
            );
        }
        if (input.id) {
          const current = await db
            .repository('attendanceEvaluations')
            .withPolicy(policy.current)
            .findOne({ filter: { id: input.id } });
          if (
            !current ||
            typeof current.userId !== 'string' ||
            current.date !== input.date
          )
            throw new AttendanceError(
              'ATTENDANCE_ACCESS_DENIED',
              'Attendance result is not readable.',
            );
          userId = current.userId;
          if (
            userId !== actorId &&
            !(await c.resolve(orgServiceToken).hasDutyRole(actorId, 'hr'))
          )
            throw new AttendanceError(
              'ATTENDANCE_ACCESS_DENIED',
              'HR duty is required.',
            );
        }
        const today = calendar.localDate(new Date());
        if (input.date >= today)
          throw new AttendanceError(
            'ATTENDANCE_DAY_NOT_ENDED',
            'Only ended attendance days can be calculated.',
          );
        await assertAttendanceDayEnded(
          db.connection(),
          userId,
          input.date,
          calendar,
          c.resolve(orgServiceToken),
        );
        const result = await db.transaction(async (connection) => {
          const revision = await evaluator.evaluate(
            {
              userId,
              date: input.date,
              actorId,
              requestKey: input.requestKey,
              reason: input.reason,
            },
            connection,
          );
          // Check the newly calculated pointer AND revision under current record/field policy before commit.
          // This also refuses a new self result when a grant only permits someone else's records.
          const visible = await listAttendanceResults(
            connection,
            { month: input.date.slice(0, 7), userId },
            policy,
          );
          const row = visible.find(
            (entry) => entry.id === revision.evaluationId,
          );
          if (!row)
            throw new AttendanceError(
              'ATTENDANCE_ACCESS_DENIED',
              'The calculated result is outside the allowed scope.',
            );
          return { id: row.id, status: row.result.status };
        });
        return ctx.json({ data: result });
      },
    );
    return new Hono().route('/attendanceResults', r);
  }),
];
