import { createHash } from 'node:crypto';
import type { Application } from '@nocobase/app-server/application';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { databaseManagerToken } from '@nocobase/db';
import { i18nToken } from '@nocobase/app-server/i18n';
import { employeeServiceToken } from '../employees/contract.js';
import { calendarServiceToken } from '../platform/index.js';
import { orgServiceToken } from '../org/contract.js';
import { attendanceEvaluationServiceToken } from './evaluation-contract.js';
import { assertAttendanceDayEnded } from './results.js';
import { AttendanceError } from './service.js';
export async function reconcileAttendance(
  app: Application,
  runKey: string,
  now = new Date(),
) {
  const c = app.container,
    users = c.resolve(userAdministrationServiceToken),
    employees = c.resolve(employeeServiceToken),
    calendar = c.resolve(calendarServiceToken),
    db = c.resolve(databaseManagerToken),
    org = c.resolve(orgServiceToken),
    evaluator = c.resolve(attendanceEvaluationServiceToken);
  const today = calendar.localDate(now);
  const result = { evaluated: 0, blocked: 0, skipped: 0 };
  let page = 1;
  while (true) {
    const batch = await users.list({ page, pageSize: 100 });
    if (!batch.items.length) break;
    const archives = await employees.getByUserIds(
      batch.items.map((user) => user.id),
    );
    for (const user of batch.items) {
      const employee = archives.get(user.id);
      if (user.kind !== 'person' || user.disabledAt || !employee?.active)
        continue;
      // Rolling lookback covers the complete correction window, not only yesterday.
      for (let offset = 1; offset <= 7; offset++) {
        const date = calendar.addCalendarDays(today, -offset);
        if (employee.hireDate && date < employee.hireDate) continue;
        try {
          await assertAttendanceDayEnded(
            db.connection(),
            user.id,
            date,
            calendar,
            org,
            now,
          );
          const revision = await evaluator.evaluate({
            userId: user.id,
            date,
            actorId: 'system:attendance',
            reason: 'Scheduled attendance reconciliation',
            requestKey: createHash('sha256')
              .update(JSON.stringify([runKey, user.id, date]))
              .digest('hex'),
          });
          result.evaluated++;
          if (revision.result.status === 'blocked') result.blocked++;
        } catch (error) {
          if (
            error instanceof AttendanceError &&
            error.code === 'ATTENDANCE_DAY_NOT_ENDED'
          )
            result.skipped++;
          else throw error;
        }
      }
    }
    if (batch.items.length < 100) break;
    page++;
  }
  return result;
}
export async function registerAttendanceSchedule(app: Application) {
  const c = app.container,
    scheduler = c.resolve(schedulerServiceToken),
    calendar = c.resolve(calendarServiceToken),
    i18n = c.resolve(i18nToken);
  const locale = i18n.getDefaultLocale();
  await i18n.ensureLocaleLoaded(locale);
  const t = i18n.getFixedT('nb3-oa', locale);
  scheduler.registerTarget({
    type: 'app.attendance-reconciliation',
    title: t('attendanceResults.scheduleTitle'),
    validate: (config) =>
      config !== null &&
      typeof config === 'object' &&
      !Array.isArray(config) &&
      Object.keys(config).length === 0
        ? { valid: true }
        : { valid: false, reason: 'attendance-config-must-be-empty' },
    async start(_config, context) {
      const result = await reconcileAttendance(app, context.occurrenceId);
      if (result.blocked)
        return {
          state: 'failed',
          reason: `attendance-requires-review:${result.blocked}`,
        };
      return { state: 'completed', outcome: 'succeeded', result };
    },
  });
  await calendar.reload();
  scheduler.defineSchedule({
    key: 'oa.attendance.daily-reconciliation',
    title: t('attendanceResults.scheduleTitle'),
    description: t('attendanceResults.scheduleDescription'),
    schedule: { cron: '30 6 * * *', timezone: calendar.timeZone() },
    target: { type: 'app.attendance-reconciliation', config: {} },
  });
}
