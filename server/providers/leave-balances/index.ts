import type { Application } from '@nocobase/app-server/application';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ScheduleExecutor } from '@nocobase/jobs';
import { calendarServiceToken } from '../platform/calendar.js';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { auditServiceToken } from '../audit/index.js';
import { leaveBalanceServiceToken } from './contract.js';
import { createLeaveBalanceService } from './service.js';
export * from './contract.js';
export * from './service.js';
export const LEAVE_BALANCE_SETTINGS = 'oa.leaveBalances';
export default class LeaveBalancesProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/leave-balances-provider';
  private expiry?: ScheduleExecutor;
  public override register(): void {
    const c = this.app.container;
    c.singleton(leaveBalanceServiceToken, () =>
      createLeaveBalanceService(
        c.resolve(databaseManagerToken),
        c.resolve(auditServiceToken),
      ),
    );
  }
  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    authz.settings.add({
      id: LEAVE_BALANCE_SETTINGS,
      title: { key: 'leaveBalances.authz.title', ns: 'nb3-oa' },
      actions: ['read', 'update'].map((name) => ({
        name,
        title: { key: `leaveBalances.authz.${name}`, ns: 'nb3-oa' },
      })),
    });
    authz.ui.sections.add({
      name: 'oa.leaveBalances',
      parent: 'administration',
      title: { key: 'leaveBalances.authz.section', ns: 'nb3-oa' },
    });
    authz.ui.place(
      { type: 'settings', id: LEAVE_BALANCE_SETTINGS },
      { section: 'oa.leaveBalances' },
    );
  }
  public override async start(): Promise<void> {
    const c = this.app.container;
    if (
      !(await c
        .resolve(databaseManagerToken)
        .connection()
        .collections.get('leaveLedger'))
    )
      return;
    this.expiry = c
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor('oa-leave-balances');
    // Ledger cleanup is internal maintenance. Balances already omit expired available credits on every read.
    await this.expiry.addJob({
      name: 'expire-leave-entitlements',
      options: {
        cron: '5 0 * * *',
        tz: c.resolve(calendarServiceToken).timeZone(),
      },
      payload: {},
      execute: async () => {
        await c.resolve(leaveBalanceServiceToken).expireDue();
      },
    });
    await this.expiry.setup();
  }
  public override async shutdown(): Promise<void> {
    await this.expiry?.shutdown();
  }
}
