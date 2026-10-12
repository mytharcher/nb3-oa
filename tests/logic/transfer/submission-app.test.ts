// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  createEmployee,
  createEmployeesAppTest,
} from '../employees/helpers.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { salaryGradeServiceToken } from '../../../server/providers/job-grades/contract.js';
import {
  calendarServiceToken,
  ruleServiceToken,
} from '../../../server/providers/platform/index.js';
import { transferPreparation } from '../../../server/providers/transfer/submission.js';
import { transferExecutor } from '../../../server/providers/transfer/execution.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/contract.js';
const test = createEmployeesAppTest();
test('actual personnel preparation keeps salary private and uses frozen historical grade revision', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    employees = c.resolve(employeeServiceToken),
    org = c.resolve(organizationServiceToken),
    grades = c.resolve(salaryGradeServiceToken),
    calendar = c.resolve(calendarServiceToken),
    rules = c.resolve(ruleServiceToken);
  const actor = await createEmployee(testApp, 'Transfer HR'),
    context = { actorId: actor.userId };
  await org.addDutyRoleMember('hr', actor.userId, context);
  const position = await org.createPosition(
    { code: randomUUID(), title: 'Transfer source position' },
    context,
  );
  const grade = await org.createGrade(
    { code: randomUUID(), title: 'Transfer grade', rank: 1 },
    context,
  );
  const department = await org.createDepartment(
    { title: 'Transfer source department', managerId: actor.userId },
    context,
  );
  const person = await createEmployee(testApp, 'Transfer applicant subject', {
    positionId: position.id,
    gradeId: grade.id,
    managerId: actor.employeeId,
  });
  await org.addMember(
    { userId: person.userId, departmentId: department.id, primary: true },
    context,
  );
  await db.transaction((tx) =>
    employees.appendCompensation(
      {
        employeeId: person.employeeId,
        gradeId: grade.id,
        baseSalary: '1000.00',
        effectiveFrom: '2026-01-01',
      },
      context,
      tx,
    ),
  );
  const initial = await grades.current(db.connection());
  const published = await grades.publish(
    {
      expectedVersion: initial.version,
      bands: [{ gradeId: grade.id, minimumCents: 0, maximumCents: 200000 }],
      actorId: actor.userId,
      reason: 'Personnel salary test',
    },
    db.connection(),
  );
  const prepare = transferPreparation({
    employees,
    org,
    grades,
    calendar,
    rules,
  });
  const proposal = {
    employeeId: person.employeeId,
    kinds: ['salaryChange'] as const,
    targetDepartmentId: department.id,
    targetPositionId: position.id,
    targetGradeId: grade.id,
    targetManagerId: actor.employeeId,
    effectiveDate: '2026-10-12',
    targetSalary: '1200.01',
  };
  const first = await db.transaction((tx) =>
    prepare(proposal, actor.userId, new Date('2026-10-11T00:00:00Z'), tx),
  );
  expect(first.snapshot).toMatchObject({
    capacityChanges: false,
    executiveRequired: true,
    gmRequired: false,
    gradeRevisionId: published.id,
  });
  expect(JSON.stringify(first.snapshot)).not.toContain('120001');
  expect(JSON.stringify(first.snapshot)).not.toContain('100000');
  expect(first.salary).toMatchObject({
    currentCents: 100000,
    targetCents: 120001,
  });
  const current = await grades.current(db.connection());
  await grades.publish(
    {
      expectedVersion: current.version,
      bands: [{ gradeId: grade.id, minimumCents: 0, maximumCents: 110000 }],
      actorId: actor.userId,
      reason: 'Future policy',
    },
    db.connection(),
  );
  await expect(
    db.transaction((tx) =>
      prepare(proposal, actor.userId, new Date('2026-10-11T00:00:00Z'), tx),
    ),
  ).rejects.toMatchObject({ reason: 'OUTSIDE_RANGE' });
  await expect(
    db.transaction((tx) =>
      prepare(
        proposal,
        actor.userId,
        new Date('2026-10-11T00:00:00Z'),
        tx,
        first.snapshot,
      ),
    ),
  ).resolves.toMatchObject({ snapshot: { gradeRevisionId: published.id } });
  if (!(await db.connection().collections.get('transferCommands')))
    await db
      .createMigrator({
        sources: [
          {
            packageName: 'transfer-candidate',
            directory: path.resolve(
              import.meta.dirname,
              '../../fixtures/transfer/migrations',
            ),
          },
        ],
        tableName: 'transferCandidateMigrations',
      })
      .latest();
  const targetDepartment = await org.createDepartment(
    { title: 'Transfer target department', managerId: actor.userId },
    context,
  );
  const targetPosition = await org.createPosition(
    { code: randomUUID(), title: 'Transfer target position' },
    context,
  );
  const targetProposal = {
    ...proposal,
    kinds: ['salaryChange', 'transfer'] as const,
    targetDepartmentId: targetDepartment.id,
    targetPositionId: targetPosition.id,
  };
  const prepared = await db.transaction((tx) =>
    prepare(
      targetProposal,
      actor.userId,
      new Date('2026-10-11T00:00:00Z'),
      tx,
      first.snapshot,
    ),
  );
  const headcounts = c.resolve(headcountServiceToken),
    id = randomUUID();
  const command = {
    actorId: actor.userId,
    requestKey: randomUUID(),
    reason: 'Real transfer capacity',
  };
  const sourceAccount = await db.transaction((tx) =>
    headcounts.create(
      {
        ...command,
        departmentId: department.id,
        positionId: position.id,
        year: 2026,
        limit: 2,
      },
      tx,
    ),
  );
  const targetAccount = await db.transaction((tx) =>
    headcounts.create(
      {
        ...command,
        requestKey: randomUUID(),
        departmentId: targetDepartment.id,
        positionId: targetPosition.id,
        year: 2026,
        limit: 2,
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    headcounts.reconcile(
      {
        ...command,
        requestKey: randomUUID(),
        accountId: sourceAccount.id,
        expectedVersion: sourceAccount.version,
        employeeIds: [person.employeeId],
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    headcounts.reconcile(
      {
        ...command,
        requestKey: randomUUID(),
        accountId: targetAccount.id,
        expectedVersion: targetAccount.version,
        employeeIds: [],
      },
      tx,
    ),
  );
  await db.transaction(async (tx) => {
    const oldTarget = await headcounts.create(
      {
        ...command,
        requestKey: randomUUID(),
        departmentId: targetDepartment.id,
        positionId: targetPosition.id,
        year: 2025,
        limit: 2,
      },
      tx,
    );
    await headcounts.reconcile(
      {
        ...command,
        requestKey: randomUUID(),
        accountId: oldTarget.id,
        expectedVersion: oldTarget.version,
        employeeIds: [],
      },
      tx,
    );
    await headcounts.hold(
      {
        ...command,
        requestKey: randomUUID(),
        sourceKind: 'oa.transfer',
        sourceId: id,
        accountId: oldTarget.id,
        quantity: 1,
      },
      tx,
    );
    await headcounts.allocate(
      {
        ...command,
        requestKey: randomUUID(),
        sourceKind: 'oa.transfer',
        sourceId: id,
      },
      tx,
    );
    await headcounts.rebind(
      {
        ...command,
        requestKey: randomUUID(),
        sourceKind: 'oa.transfer',
        sourceId: id,
        targetAccountId: targetAccount.id,
      },
      tx,
    );
    expect(await headcounts.balance(oldTarget.id, tx)).toMatchObject({
      allocated: 0,
      used: 0,
    });
    expect(
      await headcounts.reservation(
        { sourceKind: 'oa.transfer', sourceId: id },
        tx,
      ),
    ).toMatchObject({ accountId: targetAccount.id, remaining: 1 });
  });
  const execute = transferExecutor({
    employees,
    organization: org,
    headcounts,
    grades,
    calendar,
  });
  const execution = {
    id,
    actorId: actor.userId,
    effectiveDate: targetProposal.effectiveDate,
    sourceAccountId: sourceAccount.id,
    ...prepared,
    now: new Date('2026-10-12T00:00:00Z'),
  };
  await expect(
    db.transaction(async (tx) => {
      await execute(execution, tx);
      throw new Error('outer failure');
    }),
  ).rejects.toThrow('outer failure');
  expect(await org.primaryDepartmentOf(person.userId)).toMatchObject({
    id: department.id,
  });
  expect(await employees.getById(person.employeeId)).toMatchObject({
    positionId: position.id,
  });
  expect(
    await headcounts.balance(sourceAccount.id, db.connection()),
  ).toMatchObject({ used: 1 });
  expect(
    await headcounts.balance(targetAccount.id, db.connection()),
  ).toMatchObject({ used: 0, allocated: 1 });
  await db.transaction((tx) => execute(execution, tx));
  expect(await org.primaryDepartmentOf(person.userId)).toMatchObject({
    id: targetDepartment.id,
  });
  expect(await employees.getById(person.employeeId)).toMatchObject({
    positionId: targetPosition.id,
  });
  expect(
    await employees.currentCompensationOf(
      person.employeeId,
      '2026-10-12',
      db.connection(),
    ),
  ).toMatchObject({ baseSalary: '1200.01' });
  expect(
    await headcounts.balance(sourceAccount.id, db.connection()),
  ).toMatchObject({ used: 0 });
  expect(
    await headcounts.balance(targetAccount.id, db.connection()),
  ).toMatchObject({ used: 1, allocated: 0 });
});
