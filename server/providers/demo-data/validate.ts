import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { budgetServiceToken } from '../budgets/contract.js';
import { headcountServiceToken } from '../headcounts/contract.js';
import { employeeServiceToken } from '../employees/contract.js';
import { ownershipForScenario } from './validation-rules.js';
import { ownedRows } from './cleanup.js';
import { rowFilter, hashKey } from './ownership.js';
import type { DemoDataSet } from './contract.js';

export function assertBusinessTimeline(record: Record<string, unknown>): void {
  const date = (key: string) => {
    const value = record[key];
    if (value === null || value === undefined) return undefined;
    const time = new Date(value as string | Date).getTime();
    if (!Number.isFinite(time)) throw new Error('DEMO_INVALID_TIMESTAMP');
    return time;
  };
  const created = date('createdAt'),
    updated = date('updatedAt');
  if (created !== undefined && updated !== undefined && updated < created)
    throw new Error('DEMO_INVALID_TIMELINE');
  for (const key of [
    'submittedAt',
    'completedAt',
    'approvedAt',
    'statusChangedAt',
  ]) {
    const value = date(key);
    if (value !== undefined && created !== undefined && value < created)
      throw new Error('DEMO_INVALID_TIMELINE');
  }
  for (const [key, value] of Object.entries(record))
    if (
      /Cents$/u.test(key) &&
      typeof value === 'number' &&
      !Number.isSafeInteger(value)
    )
      throw new Error('DEMO_INVALID_MONEY');
}
/** Independent read-side verification before a batch may become ready. */
export async function validateDemo(
  app: Application,
  d: DemoDataSet,
): Promise<void> {
  const db = app.container.resolve(databaseManagerToken),
    tx = db.connection();
  const owned = await ownedRows(tx, d.id),
    keys = new Set(owned.map((r) => `${r.collection}:${r.keyHash}`));
  const users = app.container.resolve(userAdministrationServiceToken),
    employees = app.container.resolve(employeeServiceToken);
  for (const account of d.accounts) {
    if (!keys.has(`@user:${hashKey({ id: account.id })}`))
      throw new Error('DEMO_UNOWNED_IDENTITY');
    const user = await users.get(account.id);
    if (!user || user.name !== account.name)
      throw new Error('DEMO_IDENTITY_MISMATCH');
    if (account.role === 'system' || account.role === 'newhire') continue;
    const employee = await employees.getByUserId(account.id, tx);
    if (!employee || employee.name !== account.name)
      throw new Error('DEMO_EMPLOYEE_MISMATCH');
    const memberships = await tx.repository('departmentMembers').findMany({
      filter: { userId: account.id, active: true, primary: true },
    });
    if (memberships.length !== 1)
      throw new Error('DEMO_PRIMARY_DEPARTMENT_MISMATCH');
    if (
      employee.hireDate &&
      employee.careerStartDate &&
      employee.hireDate < employee.careerStartDate
    )
      throw new Error('DEMO_EMPLOYMENT_TIMELINE');
  }
  for (const sample of Object.values(d.scenarios)) {
    const collection = ownershipForScenario(sample.path);
    if (!collection) throw new Error('DEMO_UNKNOWN_SCENARIO');
    if (!keys.has(`${collection}:${hashKey({ id: sample.id })}`))
      throw new Error('DEMO_UNOWNED_SCENARIO');
    const record = await tx
      .repository(collection)
      .findOne({ filter: { id: sample.id } });
    if (!record) throw new Error('DEMO_SCENARIO_MISSING');
    assertBusinessTimeline(record);
    if (
      sample.key !== 'loan-repayment' &&
      typeof record.status === 'string' &&
      sample.status !== String(record.status)
    )
      throw new Error(
        `DEMO_SCENARIO_STATUS_MISMATCH:${sample.key}:${sample.status}:${String(record.status)}`,
      );
  }
  for (const own of owned.filter((r) => r.collection === 'budgets')) {
    const budget = await app.container
      .resolve(budgetServiceToken)
      .get(String(own.key.id), tx);
    if (!budget) throw new Error('DEMO_BUDGET_MISSING');
    const ledger = await app.container
      .resolve(budgetServiceToken)
      .ledger(budget, { page: 1, pageSize: 100 }, tx);
    if (ledger.total > 100) throw new Error('DEMO_VALIDATION_LIMIT');
    const totals = ledger.items.reduce(
      (s, e) => [
        s[0] + e.allocatedDelta,
        s[1] + e.heldDelta,
        s[2] + e.usedDelta,
      ],
      [0, 0, 0],
    );
    if (
      totals[0] !== budget.allocatedCents ||
      totals[1] !== budget.heldCents ||
      totals[2] !== budget.usedCents ||
      budget.availableCents !==
        budget.allocatedCents - budget.heldCents - budget.usedCents ||
      Math.min(budget.availableCents, budget.heldCents, budget.usedCents) < 0
    )
      throw new Error('DEMO_BUDGET_RECONCILIATION');
  }
  for (const own of owned.filter((r) => r.collection === 'headcountAccounts')) {
    const balance = await app.container
      .resolve(headcountServiceToken)
      .balance(String(own.key.id), tx);
    if (!balance) throw new Error('DEMO_HEADCOUNT_MISSING');
    if (
      Math.min(
        balance.used,
        balance.pending,
        balance.allocated,
        balance.available,
      ) < 0 ||
      balance.used + balance.pending + balance.allocated + balance.available !==
        balance.limit
    )
      throw new Error('DEMO_HEADCOUNT_RECONCILIATION');
  }
  // Finished effect attempts are disposable: engine maintenance prunes them after
  // 30 days, outside the import context, so their ownership entries may outlive
  // them. Keep that provenance for cleanup, but do not require the attempts to
  // survive a retry. Business records and permanent transition history must exist.
  // Shared-row preimages are checked separately by the removal preflight.
  for (const own of owned.filter(
    (r) =>
      !r.shared &&
      r.collection !== '@user' &&
      r.collection !== 'oaLifecycleEffectRuns',
  ))
    if (
      !(await tx
        .repository(own.collection)
        .exists({ filter: rowFilter(own.key) }))
    )
      throw new Error(`DEMO_OWNED_ROW_MISSING:${own.collection}`);
}
