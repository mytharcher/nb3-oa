import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { addDays, type TrialFacts } from './bootstrap.js';
import { trialPrefix } from './accounts.js';
import { scenarios, type TrialScenario } from './scenarios.js';
import {
  populateScenario,
  performOffered,
  type ScenarioResult,
  type TrialSessions,
} from './engine.js';
import { passwordFor, type TrialPasswords } from './passwords.js';
import { recordOf, dataOf } from './http.js';

export function cloneScenario(
  s: TrialScenario,
  key: string,
  patch: Partial<TrialScenario> = {},
): TrialScenario {
  const copy = structuredClone(s);
  copy.key = key;
  copy.stopAt = undefined;
  copy.complete = false;
  copy.draft = false;
  const marker = `${trialPrefix}·${key}`;
  const input = copy.body.input as Record<string, unknown> | undefined;
  const proposal = (copy.body.proposal ?? input?.proposal) as
    Record<string, unknown> | undefined;
  if (proposal) proposal[copy.markerField] = marker;
  else if (input) input[copy.markerField] = marker;
  else copy.body[copy.markerField] = marker;
  if ('requestId' in copy.body) copy.body.requestId = `${trialPrefix}-${key}`;
  if ('requestKey' in copy.body) copy.body.requestKey = `${trialPrefix}-${key}`;
  return { ...copy, ...patch };
}

export async function followUps(
  app: Application,
  sessions: TrialSessions,
  f: TrialFacts,
  password: string | TrialPasswords,
  saved: Record<string, ScenarioResult>,
  checkpoint: (row: ScenarioResult) => Promise<void>,
  failure: (key: string, error: unknown) => void,
): Promise<void> {
  const db = app.container.resolve(databaseManagerToken);
  const catalog = scenarios(f);
  const seed = (key: string): TrialScenario =>
    catalog.find((s) => s.key === key)!;
  const prepare = async (
    s: TrialScenario,
  ): Promise<ScenarioResult | undefined> => {
    try {
      const row = await populateScenario(app, sessions, f, s, saved[s.key]);
      await checkpoint(row);
      return row;
    } catch (error) {
      failure(s.key, error);
      return undefined;
    }
  };
  await prepare(
    cloneScenario(seed('expense-plan-head'), 'expense-plan-gm', {
      stopAt: 'gm',
      body: {
        ...seed('expense-plan-head').body,
        reason: `${trialPrefix}·expense-plan-gm`,
        amountCents: 30000000,
      },
    }),
  );
  await prepare(
    cloneScenario(seed('budget-head'), 'budget-cfo', { stopAt: 'cfo' }),
  );
  await prepare(
    cloneScenario(seed('vehicle-head'), 'vehicle-dispatch', {
      stopAt: 'admin',
      body: {
        ...seed('vehicle-head').body,
        purpose: `${trialPrefix}·vehicle-dispatch`,
        startAt: f.instant(addDays(f.date, 11), '09:00'),
        endAt: f.instant(addDays(f.date, 11), '17:00'),
      },
    }),
  );
  await prepare(
    cloneScenario(seed('supply-head'), 'supply-issue', { stopAt: 'admin' }),
  );
  await prepare(
    cloneScenario(seed('asset-use'), 'asset-issue', { stopAt: 'admin' }),
  );
  await prepare(
    cloneScenario(seed('seal-head'), 'seal-keeper', { stopAt: 'sealKeeper' }),
  );
  const originalLeave = saved['leave-approved'];
  if (originalLeave)
    await prepare({
      key: 'leave-cancellation',
      title: '销假',
      path: '/leaveCancellations',
      collection: 'leaveCancellations',
      markerField: 'reason',
      actor: 'employee',
      body: {
        originalLeaveId: originalLeave.id,
        cancelAll: true,
        endDate: addDays(f.date, 2),
        endHalf: 'pm',
        reason: `${trialPrefix}·leave-cancellation`,
      },
    });
  const travel = cloneScenario(seed('travel-head'), 'travel-approved', {
    complete: true,
  });
  travel.body = {
    ...travel.body,
    startAt: f.instant(addDays(f.date, 15), '09:00'),
    endAt: f.instant(addDays(f.date, 16), '18:00'),
    needsBooking: false,
  };
  const sourceTrip = await prepare(travel);
  if (sourceTrip)
    await prepare({
      key: 'travel-cancellation',
      title: '出差撤销',
      path: '/travelCancellations',
      collection: 'travelCancellations',
      markerField: 'reason',
      actor: 'employee',
      body: {
        sourceId: sourceTrip.id,
        reason: `${trialPrefix}·travel-cancellation`,
      },
    });
  const contract = await prepare(
    cloneScenario(seed('contract-review'), 'contract-approved', {
      complete: true,
    }),
  );
  if (contract) {
    const parent = await db
      .repository('contractRequests')
      .findOne({ filter: { id: contract.id } });
    const ledger = await db
      .repository('contracts')
      .findOne({ filter: { id: String(parent?.contractId) } });
    if (!ledger)
      failure(
        'contract-followups',
        new Error('The real approved contract ledger is missing.'),
      );
    else
      for (const operation of ['change', 'renew', 'terminate'] as const) {
        const s = cloneScenario(
          seed('contract-review'),
          `contract-${operation}`,
          { draft: true },
        );
        const input = s.body.input as Record<string, unknown>;
        input.operation = operation;
        input.contractId = ledger.id;
        input.baseVersion = ledger.version;
        await prepare(s);
      }
  }
  const recruitment = await prepare(
    cloneScenario(seed('recruitment-review'), 'recruitment-approved', {
      complete: true,
    }),
  );
  if (recruitment) {
    try {
      const requisition = await db
        .repository('requisitions')
        .findOne({ filter: { requestId: recruitment.id } });
      if (!requisition)
        throw new Error(
          'Recruitment approval did not allocate a real requisition.',
        );
      const id = `${trialPrefix}-onboarding`;
      const existing = await db
        .repository('onboardings')
        .findOne({ filter: { id } });
      const row =
        existing ??
        recordOf(
          await sessions.hr.request('/onboardings', {
            id,
            requisitionId: requisition.id,
            requisitionVersion: Number(requisition.version),
            requestId: `${trialPrefix}-onboarding`,
            reason: '虚构入职试用数据',
            account: {
              name: '示例·待入职员工',
              email: 'newhire@oa-trial.example.test',
              username: 'trial.newhire',
              password: passwordFor(password, 'newhire'),
            },
            employee: {
              code: `${trialPrefix}-newhire`,
              name: '示例·待入职员工',
              managerId: f.employees.manager,
              hireDate: addDays(f.date, 14),
              careerStartDate: '2020-01-01',
              probationEndDate: addDays(f.date, 104),
            },
            mentorEmployeeId: f.employees.employee,
            workstationRequirement: '示例工位及电脑',
            baseSalary: '9000.00',
          }),
        );
      await checkpoint({
        key: 'onboarding',
        title: '入职办理',
        path: '/onboardings',
        id: String(row.id),
        status: String(row.status),
        actor: 'hr',
      });
    } catch (error) {
      failure('onboarding', error);
    }
  }
  const issuedLoan = await prepare(
    cloneScenario(seed('loan-head'), 'loan-issued', { stopAt: 'cashier' }),
  );
  if (issuedLoan) {
    try {
      const record = recordOf(
        await sessions.cashier.request(`${issuedLoan.path}/${issuedLoan.id}`),
      );
      if (record.status === 'cashier') {
        const detail = dataOf(
          await sessions.cashier.request(`${issuedLoan.path}/${issuedLoan.id}`),
        );
        const offers = detail.taskActions as { actions: { name: string }[] }[];
        if (offers.some((v) => v.actions.some((a) => a.name === 'claim')))
          await performOffered(
            sessions.cashier,
            issuedLoan.path,
            issuedLoan.id,
            'claim',
          );
        await performOffered(
          sessions.cashier,
          issuedLoan.path,
          issuedLoan.id,
          'complete',
          { paymentVoucher: 'OA-TRIAL-FICTIONAL-PAYMENT' },
        );
      }
      if (!saved['loan-repayment'])
        await sessions.cashier.request(
          `${issuedLoan.path}/${issuedLoan.id}/repayments`,
          {
            operation: 'record',
            receiptId: `${trialPrefix}-repayment-receipt`,
            cents: 50000,
            requestKey: `${trialPrefix}-repayment`,
            reason: '虚构试用现金还款，等待借款人确认',
          },
        );
      const repaymentView = dataOf(
        await sessions.cashier.request(
          `${issuedLoan.path}/${issuedLoan.id}/repayments`,
        ),
      );
      const receipt = (
        repaymentView.reservations as { reference: string; state: string }[]
      ).find(
        (entry) => entry.reference === `cash:${trialPrefix}-repayment-receipt`,
      );
      if (!receipt)
        throw new Error('The real trial repayment receipt is missing.');
      await checkpoint({
        ...issuedLoan,
        key: 'loan-repayment',
        title: '还款待确认',
        status: receipt.state,
      });
    } catch (error) {
      failure('loan-repayment', error);
    }
  }
  // Prove every trial identity can read the actual center. This is an HTTP check, not a UI acceptance claim.
  for (const [role, session] of Object.entries(sessions)) {
    try {
      dataOf(
        await session.request(
          '/approvalCenter?view=pending&kind=oa.workItem&page=1&pageSize=20',
        ),
      );
    } catch (error) {
      failure(`center-${role}`, error);
    }
  }
}
