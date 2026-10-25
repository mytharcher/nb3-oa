import { z } from 'zod';
import type { Application } from '@nocobase/app-server/application';
import {
  type AuthEnv,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication';
import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization/server';
import {
  apiValidator,
  describeRoute,
  listResponse,
  apiErrorResponses,
  apiErrorResponse,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import type { Hono } from 'hono';
import { leaveServiceToken } from '../../providers/leave/index.js';
import { outingServiceToken } from '../../providers/outings/index.js';
import { travelServiceToken } from '../../providers/travel/index.js';
import { orgServiceToken } from '../../providers/org/contract.js';
import { employeeServiceToken } from '../../providers/employees/contract.js';
import { calendarServiceToken } from '../../providers/platform/index.js';
import { attendanceServiceToken } from '../../providers/attendance/contract.js';
import { attendanceActivitySourcesToken } from '../../providers/attendance/activity-sources.js';
import { PersonalScheduleError } from '../../providers/personal-schedules/index.js';
const Item = z.object({
  id: z.string(),
  kind: z.enum(['leave', 'travel', 'outing']),
  userId: z.string(),
  name: z.string(),
  departmentId: z.string().nullable(),
  department: z.string(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
});
const Query = z.strictObject({
  date: z.iso.date().optional(),
  departmentId: z.string().max(64).optional(),
  scope: z.enum(['visible', 'managed']).default('visible'),
});
/** All business rows are read through their public owner services and current action policies. */
export function registerTeamCalendar(
  r: Hono<AuthEnv & AuthorizationEnv>,
  app: Application,
) {
  r.get(
    '/team',
    describeRoute({
      tags: ['Personal schedules'],
      operationId: 'teamAbsenceCalendar',
      summary: 'Approved absences visible under current business permissions',
      responses: {
        200: listResponse(
          Item,
          z.object({ date: z.iso.date(), timeZone: z.string() }),
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(400),
      },
    }),
    apiValidator('query', Query),
    async (ctx) => {
      const c = app.container,
        connection = c.resolve(databaseManagerToken).connection(),
        { date: requestedDate, departmentId, scope } = ctx.req.valid('query');
      const calendar = c.resolve(calendarServiceToken),
        date = requestedDate ?? calendar.localDate(new Date()),
        start = calendar.resolveLocalDateTime(date, '00:00');
      let managed: Set<string> | undefined;
      if (scope === 'managed') {
        const actorId = ctx.get('auth')!.user.id;
        const org = c.resolve(orgServiceToken);
        const [departments, reports] = await Promise.all([
          org.departmentsManagedBy(actorId, connection),
          c.resolve(employeeServiceToken).reportsOf(actorId, connection),
        ]);
        managed = new Set([
          ...reports.map((employee) => employee.userId),
          ...(departments.length
            ? await org.primaryMembersOf(departments, connection)
            : []),
        ]);
      }
      const next = new Date(`${date}T12:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      const end = calendar.resolveLocalDateTime(
        next.toISOString().slice(0, 10),
        '00:00',
      );
      const owners = [
        {
          kind: 'leave' as const,
          resource: 'oa.leave',
          collection: 'leaveRequests',
          service: c.resolve(leaveServiceToken),
        },
        {
          kind: 'travel' as const,
          resource: 'oa.travel',
          collection: 'travelRequests',
          service: c.resolve(travelServiceToken),
        },
        {
          kind: 'outing' as const,
          resource: 'oa.outing',
          collection: 'outingRequests',
          service: c.resolve(outingServiceToken),
        },
      ];
      const visible: {
        id: string;
        kind: 'leave' | 'travel' | 'outing';
        userId: string;
      }[] = [];
      let permitted = false;
      for (const owner of owners) {
        const decision = await ctx.get('authz').authorize({
          resource: { type: 'composite', id: owner.resource },
          action: 'view',
        });
        const policy =
          decision.effect !== 'deny'
            ? decision.conditions?.database?.[owner.collection]
            : undefined;
        if (!policy) continue;
        permitted = true;
        const rows = await owner.service.calendarEntries(
          policy,
          connection,
          date,
        );
        for (const row of rows)
          for (const userId of new Set(row.userIds))
            if (!managed || managed.has(userId))
              visible.push({ id: row.id, kind: owner.kind, userId });
      }
      if (!permitted) throw new PersonalScheduleError('ACCESS_DENIED');
      const ids = [...new Set(visible.map((v) => v.userId))];
      const departments = await c
        .resolve(orgServiceToken)
        .primaryDepartmentsOf(ids, connection);
      const data: z.infer<typeof Item>[] = [];
      for (const userId of ids) {
        const department = departments.get(userId);
        if (departmentId && department?.id !== departmentId) continue;
        const evidence = await c
          .resolve(attendanceActivitySourcesToken)
          .read(userId, date, connection);
        const activities = await c
          .resolve(attendanceServiceToken)
          .effectiveActivities(userId, connection);
        const user = await c
          .resolve(userAdministrationServiceToken)
          .get(userId);
        for (const item of visible.filter((v) => v.userId === userId)) {
          for (const fact of evidence.exemptions.filter(
            (v) => v.kind === `oa.${item.kind}` && v.applicationId === item.id,
          )) {
            const interval =
              item.kind === 'leave'
                ? fact
                : activities.find(
                    (v) =>
                      v.kind === fact.kind &&
                      v.applicationId === fact.activityId,
                  );
            if (!interval) continue;
            const from = Math.max(
                +start,
                Date.parse(interval.startAt),
                Date.parse(fact.startAt),
              ),
              to = Math.min(
                +end,
                Date.parse(interval.endAt),
                Date.parse(fact.endAt),
              );
            if (from >= to) continue;
            data.push({
              ...item,
              name: user?.name ?? '',
              departmentId: department?.id ?? null,
              department: department?.title ?? '',
              startAt: new Date(from).toISOString(),
              endAt: new Date(to).toISOString(),
            });
          }
        }
      }
      return ctx.json({
        data: data.sort((a, b) => a.startAt.localeCompare(b.startAt)),
        meta: { date, timeZone: calendar.timeZone() },
      });
    },
  );
}
