// @vitest-environment node
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import {
  createEmployeesAppTest,
  createEmployee,
} from '../employees/helpers.js';
const test = createEmployeesAppTest();
test('effective assignment is source fixed, expects actual facts and rolls back with audit', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    employee = c.resolve(employeeServiceToken),
    org = c.resolve(organizationServiceToken),
    audit = c.resolve(auditServiceToken);
  if (!(await db.connection().collections.get('employeeAssignmentOrigins')))
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
  const person = await createEmployee(testApp, 'Transfer person'),
    manager = await createEmployee(testApp, 'Transfer manager');
  const position = await org.createPosition(
    { code: randomUUID(), title: 'Transfer target' },
    { actorId: manager.userId },
  );
  const grade = await org.createGrade(
    { code: randomUUID(), title: 'Transfer grade', rank: 1 },
    { actorId: manager.userId },
  );
  const before = (await employee.getById(person.employeeId))!;
  await db.transaction(async (tx) => {
    await employee.appendCompensation(
      {
        employeeId: before.id,
        baseSalary: '1000.00',
        effectiveFrom: '2026-01-01',
      },
      { actorId: manager.userId },
      tx,
    );
    await employee.appendCompensation(
      {
        employeeId: before.id,
        baseSalary: '1500.00',
        effectiveFrom: '2027-01-01',
      },
      { actorId: manager.userId },
      tx,
    );
  });
  expect(
    await employee.currentCompensationOf(
      before.id,
      '2026-10-11',
      db.connection(),
    ),
  ).toMatchObject({ baseSalary: '1000.00' });
  expect(
    await employee.currentCompensationOf(
      before.id,
      '2025-12-31',
      db.connection(),
    ),
  ).toBeUndefined();
  const input = {
    employeeId: before.id,
    expected: {
      positionId: before.positionId,
      gradeId: before.gradeId,
      managerId: before.managerId,
      status: before.status,
    },
    positionId: position.id,
    gradeId: grade.id,
    managerId: manager.employeeId,
    effectiveAt: '2026-10-11',
  };
  const origin = {
    actorId: manager.userId,
    sourceApplication: `oa.transfer:${randomUUID()}`,
  };
  const original = audit.record.bind(audit);
  audit.record = async (entry, tx) => {
    if (entry.action === 'employee.assignment')
      throw new Error('audit rejected');
    return original(entry, tx);
  };
  try {
    await expect(
      db.transaction((tx) => employee.applyAssignmentChange(input, origin, tx)),
    ).rejects.toThrow('audit rejected');
  } finally {
    audit.record = original;
  }
  expect(await employee.getById(before.id)).toMatchObject(input.expected);
  expect(
    await db.connection().repository('employeeAssignmentOrigins').count(),
  ).toBe(0);
  await expect(
    db.transaction((tx) =>
      employee.applyAssignmentChange(
        { ...input, managerId: before.id },
        origin,
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'EMPLOYEE_MANAGER_CYCLE' });
  const after = await db.transaction((tx) =>
    employee.applyAssignmentChange(input, origin, tx),
  );
  expect(after).toMatchObject({
    positionId: position.id,
    gradeId: grade.id,
    managerId: manager.employeeId,
    status: before.status,
  });
  await expect(
    db.transaction((tx) => employee.applyAssignmentChange(input, origin, tx)),
  ).resolves.toMatchObject({ id: before.id });
  await expect(
    db.transaction((tx) =>
      employee.applyAssignmentChange({ ...input, note: 'changed' }, origin, tx),
    ),
  ).rejects.toMatchObject({ code: 'EMPLOYEE_ASSIGNMENT_SOURCE_CONFLICT' });
  await expect(
    db.transaction((tx) =>
      employee.applyAssignmentChange(
        input,
        { ...origin, sourceApplication: `oa.transfer:${randomUUID()}` },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'EMPLOYEE_ASSIGNMENT_STALE' });
  await db.transaction((tx) =>
    employee.applyStatusChange(
      {
        employeeId: before.id,
        status: 'left',
        active: false,
        kind: 'departure',
        effectiveAt: '2026-10-11',
      },
      { actorId: manager.userId },
      tx,
    ),
  );
  await expect(
    db.transaction((tx) =>
      employee.applyAssignmentChange(
        {
          ...input,
          expected: {
            positionId: after.positionId,
            gradeId: after.gradeId,
            managerId: after.managerId,
            status: 'left',
          },
        },
        { ...origin, sourceApplication: `oa.transfer:${randomUUID()}` },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'EMPLOYEE_ASSIGNMENT_INVALID' });
});
