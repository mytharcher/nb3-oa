import { externalIntegrationsEnabled } from '../../../shared/external-integrations.js';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { i18nToken } from '@nocobase/app-server/i18n';
import { employeeServiceToken } from '../employees/contract.js';
import { auditServiceToken } from '../audit/index.js';
import { calendarServiceToken } from '../platform/index.js';
import { orgServiceToken } from '../org/contract.js';
import { attendanceManagementServiceToken } from '../attendance-management/contract.js';
import { attendanceServiceToken } from '../attendance/contract.js';
import {
  wecomAttendanceServiceToken,
  type WecomAttendanceConfig,
} from './contract.js';
import { createWecomAttendanceService } from './service.js';
export default class WecomAttendanceProvider extends ServiceProvider<Application> {
  readonly name = 'oa/wecom-attendance';
  register() {
    if (!externalIntegrationsEnabled) return;
    const c = this.app.container;
    c.singleton(wecomAttendanceServiceToken, () =>
      createWecomAttendanceService({
        config: this.app.config.get<WecomAttendanceConfig>('wecomAttendance')!,
        db: c.resolve(databaseManagerToken),
        employees: c.resolve(employeeServiceToken),
        calendar: c.resolve(calendarServiceToken),
        org: c.resolve(orgServiceToken),
        management: c.resolve(attendanceManagementServiceToken),
        attendance: c.resolve(attendanceServiceToken),
        audit: c.resolve(auditServiceToken),
      }),
    );
  }
  async boot() {
    const c = this.app.container,
      authz = c.resolve(authorizationToken),
      scheduler = c.resolve(schedulerServiceToken),
      calendar = c.resolve(calendarServiceToken),
      i18n = c.resolve(i18nToken);
    authz.settings.add({
      id: 'oa.wecomAttendance',
      title: { key: 'wecomAttendance.title', ns: 'nb3-oa' },
      actions: ['view', 'sync'].map((name) => ({
        name,
        title: { key: `wecomAttendance.${name}`, ns: 'nb3-oa' },
      })),
    });
    authz.ui.place(
      { type: 'settings', id: 'oa.wecomAttendance' },
      { section: 'oa.org' },
    );
    const locale = i18n.getDefaultLocale();
    await i18n.ensureLocaleLoaded(locale);
    const t = i18n.getFixedT('nb3-oa', locale);
    scheduler.registerTarget({
      type: 'app.wecom-attendance',
      title: t('wecomAttendance.title'),
      validate: (config) =>
        config !== null &&
        typeof config === 'object' &&
        !Array.isArray(config) &&
        Object.keys(config).length === 0
          ? { valid: true }
          : { valid: false, reason: 'empty-config-required' },
      async start(_config, context) {
        // Retained schedules from previous releases must complete without calling WeCom.
        if (!externalIntegrationsEnabled)
          return {
            state: 'completed',
            outcome: 'succeeded',
            result: {
              skipped: true,
              runId: null,
              committedRecords: 0,
              completedBatches: 0,
            },
          };
        const service = c.resolve(wecomAttendanceServiceToken);
        if (!service.status().enabled)
          return {
            state: 'completed',
            outcome: 'succeeded',
            result: {
              skipped: true,
              runId: null,
              committedRecords: 0,
              completedBatches: 0,
            },
          };
        const today = calendar.localDate(new Date());
        const run = await service.sync({
          actorId: 'system:wecom-attendance',
          requestKey: context.occurrenceId,
          startDate: calendar.addCalendarDays(today, -7),
          endDate: calendar.addCalendarDays(today, -1),
          reason: 'Scheduled WeCom attendance synchronization',
        });
        return run.state === 'completed'
          ? {
              state: 'completed',
              outcome: 'succeeded',
              result: {
                skipped: false,
                runId: run.id,
                committedRecords: run.committedRecords,
                completedBatches: run.completedBatches,
              },
            }
          : { state: 'failed', reason: run.errorCode ?? 'wecom-sync-failed' };
      },
    });
    if (!externalIntegrationsEnabled) return;
    await calendar.reload();
    scheduler.defineSchedule({
      key: 'oa.attendance.wecom-source',
      title: t('wecomAttendance.title'),
      description: t('wecomAttendance.scheduleDescription'),
      schedule: { cron: '30 5 * * *', timezone: calendar.timeZone() },
      target: { type: 'app.wecom-attendance', config: {} },
    });
  }
}
