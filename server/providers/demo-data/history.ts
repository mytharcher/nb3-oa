import { calendarServiceToken } from '../platform/index.js';
import type { Application } from '@nocobase/app-server/application';
import {
  addDays,
  type TrialFacts,
} from '../../../cli/commands/lib/trial-data/bootstrap.js';
import { scenarios } from '../../../cli/commands/lib/trial-data/scenarios.js';
import { cloneScenario } from '../../../cli/commands/lib/trial-data/follow-ups.js';
import {
  populateScenario,
  transition,
  performOffered,
  type TrialSessions,
  type ScenarioResult,
} from '../../../cli/commands/lib/trial-data/engine.js';
import { recordOf } from '../../../cli/commands/lib/trial-data/http.js';
import { currentDemo } from './context.js';

/** Replay real commands under a server-owned clock; SDK history is produced by
 * those commands. Authentication, credentials and security audits keep wall time. */
export async function historicalScenarios(
  app: Application,
  sessions: TrialSessions,
  facts: TrialFacts,
  saved: Record<string, ScenarioResult>,
  checkpoint: (r: ScenarioResult) => Promise<void>,
) {
  const scope = currentDemo()!;
  const plans = [
    [-730, 'approved'],
    [-365, 'rejected'],
    [-180, 'revision'],
    [-120, 'withdrawn'],
    [-60, 'approved'],
    [-30, 'rejected'],
  ] as const;
  try {
    for (const [offset, target] of plans) {
      const key = `history-general-${-offset}`;
      if (saved[key]) continue;
      const date = addDays(scope.baseDate, offset);
      scope.now = new Date(facts.instant(date, '09:00'));
      const base = scenarios({ ...facts, date }).find(
        (s) => s.key === 'general-approval',
      )!;
      const s = cloneScenario(base, key, { complete: target === 'approved' });
      const en = scope.locale === 'en-US';
      s.body.title = en
        ? `Riverside delivery review · ${date}`
        : `海川客户交付评审 · ${date}`;
      s.body.body = en
        ? 'Review the delivery scope, workshop schedule and coordination responsibilities. Supporting estimates are ready for review.'
        : '评审本期客户交付范围、研讨安排与协作分工，相关估算资料已准备完成。';
      let row = await populateScenario(app, sessions, facts, s);
      if (target === 'rejected' || target === 'revision') {
        await performOffered(
          sessions.manager,
          s.path,
          row.id,
          target === 'rejected' ? 'reject' : 'return',
          target === 'revision' ? { to: 'revision' } : undefined,
          en
            ? target === 'rejected'
              ? 'This scope duplicates the existing delivery contract.'
              : 'Please include the revised staffing estimate before resubmitting.'
            : target === 'rejected'
              ? '交付范围与现有合同重复，本次不予批准。'
              : '请补充修订后的人力估算，再重新提交。',
        );
      } else if (target === 'withdrawn') {
        const record = recordOf(
          await sessions.employee.request(`${s.path}/${row.id}`),
        );
        await transition(sessions.employee, s, row.id, record, 'withdraw');
      }
      const record = recordOf(
        await sessions.employee.request(`${s.path}/${row.id}`),
      );
      row = { ...row, status: String(record.status) };
      if (row.status !== target)
        throw new Error('DEMO_HISTORY_TARGET_MISMATCH');
      await checkpoint(row);
    }
    const leaveKey = 'history-leave-current-month';
    if (!saved[leaveKey]) {
      const calendar = app.container.resolve(calendarServiceToken);
      let date = scope.baseDate.slice(0, 8) + '01';
      for (let day = 0; !calendar.isWorkday(date) && day < 32; day++)
        date = addDays(date, 1);
      if (date.slice(0, 7) !== scope.baseDate.slice(0, 7))
        throw new Error('DEMO_MONTH_HAS_NO_WORKDAYS');
      scope.now = new Date(facts.instant(addDays(date, -3), '09:00'));
      const base = scenarios(facts).find((s) => s.key === 'leave-approved')!;
      const leave = cloneScenario(base, leaveKey, {
        actor: 'probation',
        complete: true,
      });
      Object.assign(leave.body, {
        startDate: date,
        endDate: date,
        reason:
          scope.locale === 'en-US'
            ? 'Family appointment and agreed team handover'
            : '家庭事务安排与团队交接',
      });
      await checkpoint(await populateScenario(app, sessions, facts, leave));
    }
  } finally {
    delete scope.now;
  }
}
