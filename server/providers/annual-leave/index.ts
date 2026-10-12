import type { Application } from '@nocobase/app-server/application';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { databaseManagerToken } from '@nocobase/db';
import { i18nToken } from '@nocobase/app-server/i18n';
import { ServiceProvider } from '@nocobase/service-provider';
import { auditServiceToken } from '../audit/index.js';
import { leaveBalanceServiceToken } from '../leave-balances/contract.js';
import { calendarServiceToken } from '../platform/calendar.js';
import { dictionaryServiceToken } from '../platform/dictionaries.js';
import { ruleServiceToken } from '../platform/rules.js';
import {
  annualLeavePolicyResolverToken,
  annualLeaveServiceToken,
} from './contract.js';
import { createAnnualLeaveService } from './service.js';
export * from './contract.js';
export * from './calculation.js';
export * from './service.js';
export default class AnnualLeaveProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/annual-leave-provider';
  public override register(): void {
    const c = this.app.container;
    c.singleton(annualLeavePolicyResolverToken, () => ({
      async policy(at, tx) {
        const snapshot = await c
          .resolve(ruleServiceToken)
          .snapshot(
            [
              'leave.annualAccrualEnabled',
              'leave.annualCarryExpiryMonth',
              'leave.annualCarryExpiryDay',
            ],
            at,
            tx,
          );
        return {
          enabled: snapshot['leave.annualAccrualEnabled'] === 1,
          seniorityBasis: 'careerStartDate' as const,
          hireMonth: 'includeHireMonth' as const,
          rounding: 'floorHalfDay' as const,
          expiryMonth: Number(snapshot['leave.annualCarryExpiryMonth']),
          expiryDay: Number(snapshot['leave.annualCarryExpiryDay']),
        };
      },
      async seniorityStartDate(employee) {
        // HR's first participation in work is separate from joining this company.
        return employee.careerStartDate;
      },
    }));
    c.singleton(annualLeaveServiceToken, () =>
      createAnnualLeaveService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        balances: c.resolve(leaveBalanceServiceToken),
        calendar: c.resolve(calendarServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
        resolver: c.resolve(annualLeavePolicyResolverToken),
      }),
    );
  }
  public override async boot(): Promise<void> {
    const c = this.app.container;
    const scheduler = c.resolve(schedulerServiceToken);
    const i18n = c.resolve(i18nToken);
    const locale = i18n.getDefaultLocale();
    await i18n.ensureLocaleLoaded(locale);
    const t = i18n.getFixedT('nb3-oa', locale);
    scheduler.registerTarget({
      type: 'app.annual-leave-accrual',
      title: t('annualLeave.scheduleTitle'),
      validate(config) {
        return config !== null &&
          typeof config === 'object' &&
          !Array.isArray(config) &&
          Object.keys(config).length === 0
          ? { valid: true }
          : { valid: false, reason: 'annual-leave-config-must-be-empty' };
      },
      start: async () => {
        // The mid-size OA sweep commits one employee at a time. Complete only after the actual
        // balance and audit work; missing HR data records a failed occurrence, never fake success.
        const result = await c.resolve(annualLeaveServiceToken).reconcile();
        if (result.blocked.length)
          return {
            state: 'failed',
            reason: `annual-leave-blocked:${result.blocked.length}:${[...new Set(result.blocked.map((entry) => entry.code))].join(',')}`,
          };
        return {
          state: 'completed',
          outcome: 'succeeded',
          result: {
            granted: result.granted,
            existing: result.existing,
            skipped: result.skipped,
          },
        };
      },
    });
    await c.resolve(calendarServiceToken).reload();
    scheduler.defineSchedule({
      key: 'oa.annual-leave.daily-reconciliation',
      title: t('annualLeave.scheduleTitle'),
      description: t('annualLeave.scheduleDescription'),
      schedule: {
        cron: '10 0 * * *',
        timezone: c.resolve(calendarServiceToken).timeZone(),
      },
      target: { type: 'app.annual-leave-accrual', config: {} },
    });
  }
}
