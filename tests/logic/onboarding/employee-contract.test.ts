// @vitest-environment node
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { employeeServiceToken } from '../../../server/providers/employees/contract.ts';
import { organizationServiceToken } from '../../../server/providers/org/index.ts';
import { createEmployeesAppTest, createPerson } from '../employees/helpers.ts';
const test = createEmployeesAppTest();
test('public onboarding archive fixes probation, requires disabled account and rolls back with caller', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    employees = c.resolve(employeeServiceToken),
    users = c.resolve(userAdministrationServiceToken),
    org = c.resolve(organizationServiceToken);
  if (!(await db.connection().collections.get('employeeOnboardingOrigins')))
    await db
      .createMigrator({
        sources: [
          {
            packageName: 'onboarding-candidate',
            directory: path.resolve(
              import.meta.dirname,
              '../../fixtures/onboarding/migrations',
            ),
          },
        ],
        tableName: 'onboardingCandidateMigrations',
      })
      .latest();
  const person = await createPerson(testApp, 'Onboarding public archive');
  const context = { actorId: person.userId };
  const position = await org.createPosition(
    { code: randomUUID(), title: 'Onboard position' },
    context,
  );
  const grade = await org.createGrade(
    { code: randomUUID(), title: 'Onboard grade', rank: 1 },
    context,
  );
  const input = {
    userId: person.userId,
    code: randomUUID(),
    name: 'Onboarding hire',
    managerId: null,
    positionId: position.id,
    gradeId: grade.id,
    hireDate: '2026-10-11',
    careerStartDate: null,
    probationEndDate: '2027-01-11',
  };
  const origin = {
    actorId: person.userId,
    sourceApplication: `oa.onboarding:${randomUUID()}`,
  };
  await expect(
    db.transaction((tx) => employees.createForOnboarding(input, origin, tx)),
  ).rejects.toMatchObject({ code: 'EMPLOYEE_ONBOARDING_ACCOUNT_ENABLED' });
  await expect(
    db.transaction(async (tx) => {
      await users.withConnection(tx).disable(person.userId);
      await employees.createForOnboarding(input, origin, tx);
      throw new Error('caller rollback');
    }),
  ).rejects.toThrow('caller rollback');
  expect(await employees.getByUserId(person.userId)).toBeUndefined();
  expect((await users.get(person.userId))?.disabledAt).toBeFalsy();
  const employee = await db.transaction(async (tx) => {
    await users.withConnection(tx).disable(person.userId);
    return employees.createForOnboarding(input, origin, tx);
  });
  expect(employee).toMatchObject({
    status: 'probation',
    active: true,
    userId: person.userId,
  });
  expect((await users.get(person.userId))?.disabledAt).toBeTruthy();
  expect(
    (
      await db.transaction((tx) =>
        employees.createForOnboarding(input, origin, tx),
      )
    ).id,
  ).toBe(employee.id);
  await expect(
    db.transaction((tx) =>
      employees.createForOnboarding({ ...input, name: 'changed' }, origin, tx),
    ),
  ).rejects.toMatchObject({ code: 'EMPLOYEE_ONBOARDING_SOURCE_CONFLICT' });
  const histories = await db
    .repository('employeeHistory')
    .findMany({ filter: { employeeId: employee.id } });
  expect(histories).toHaveLength(1);
  expect(histories[0]).toMatchObject({
    kind: 'hire',
    sourceApplication: origin.sourceApplication,
  });
  expect(JSON.stringify(histories)).not.toMatch(
    /salary|baseSalary|bankAccount/,
  );
});

test('authentication account create and disable participate in caller rollback', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    users = c.resolve(userAdministrationServiceToken);
  let createdId = '';
  await expect(
    db.transaction(async (tx) => {
      const bound = users.withConnection(tx);
      const account = await bound.create({
        name: 'Atomic account',
        email: `${randomUUID()}@example.test`,
        password: 'atomic-account-password',
      });
      createdId = account.id;
      await bound.disable(account.id);
      expect((await bound.get(account.id))?.disabledAt).toBeTruthy();
      throw new Error('account rollback');
    }),
  ).rejects.toThrow('account rollback');
  expect(await users.get(createdId)).toBeUndefined();
});
