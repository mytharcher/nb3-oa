import {
  assetServiceToken,
  onboardingAssetServiceToken,
} from '../../../server/providers/assets/contract.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
// @vitest-environment node
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { OA_TEST_ORIGIN } from '../oa-test-origin.ts';
import { test } from './helpers.js';
import {
  createEmployee,
  ALL,
  employees as moduleEmployees,
} from '../employees/helpers.js';
import { notificationServiceToken } from '@nocobase/app-plugin-notification';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { requisitionServiceToken } from '../../../server/providers/recruitment/requisitions.js';
import type { RecruitmentSubmissionSnapshot } from '../../../server/providers/recruitment/submission.js';
import { onboardingServiceToken } from '../../../server/providers/onboarding/contract.js';
test('creates real disabled account, employee and occupancy while consuming exactly one allocated recruitment seat', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    organization = c.resolve(organizationServiceToken),
    headcounts = c.resolve(headcountServiceToken),
    audit = c.resolve(auditServiceToken),
    calendar = c.resolve(calendarServiceToken),
    employees = c.resolve(employeeServiceToken),
    users = c.resolve(userAdministrationServiceToken),
    requisitions = c.resolve(requisitionServiceToken);
  expect(
    await c
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor('oa-onboarding')
      .getJob('overdue-scan'),
  ).toMatchObject({
    jobName: 'overdue-scan',
    options: { every: 600000 },
  });
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
  const actor = await createEmployee(testApp, 'Onboarding HR');
  const context = { actorId: actor.userId };
  await organization.addDutyRoleMember('hr', actor.userId, context);
  const department = await organization.createDepartment(
      { title: randomUUID(), managerId: actor.userId },
      context,
    ),
    position = await organization.createPosition(
      { code: randomUUID(), title: 'Hire role' },
      context,
    ),
    grade = await organization.createGrade(
      { code: randomUUID(), title: 'Hire grade', rank: 1 },
      context,
    );
  const hireDate = calendar.localDate(new Date()),
    year = Number(hireDate.slice(0, 4));
  const command = (requestKey = randomUUID()) => ({
    actorId: actor.userId,
    requestKey,
    reason: 'Real onboarding allocation',
  });
  const account = await db.transaction((tx) =>
    headcounts.create(
      {
        ...command(),
        departmentId: department.id,
        positionId: position.id,
        year,
        limit: 1,
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    headcounts.reconcile(
      {
        ...command(),
        accountId: account.id,
        expectedVersion: account.version,
        employeeIds: [],
      },
      tx,
    ),
  );
  const sourceId = randomUUID();
  await db.transaction((tx) =>
    headcounts.hold(
      {
        ...command(),
        sourceKind: 'oa.recruitment',
        sourceId,
        accountId: account.id,
        quantity: 1,
      },
      tx,
    ),
  );
  const source = await db.transaction((tx) =>
    requisitions.publish(
      {
        id: sourceId,
        lifecycleVersion: 7,
        snapshot: {
          departmentId: department.id,
          positionId: position.id,
          gradeId: grade.id,
          quantity: 1,
          accountId: account.id,
          year,
        } as RecruitmentSubmissionSnapshot,
      },
      command(),
      tx,
    ),
  );
  const service = c.resolve(onboardingServiceToken);
  const input = {
    id: randomUUID(),
    requisitionId: source.id,
    requisitionVersion: source.version,
    account: {
      name: 'Actual new hire',
      email: `${randomUUID()}@example.test`,
      password: 'new-hire-password',
    },
    employee: {
      code: randomUUID(),
      name: 'Actual new hire',
      managerId: actor.employeeId,
      hireDate,
      careerStartDate: null,
      probationEndDate: calendar.addCalendarDays(hireDate, 90),
    },
    mentorEmployeeId: actor.employeeId,
    workstationRequirement: 'A team workstation',
    baseSalary: '12000.00',
  };
  const cmd = command();
  await expect(
    db.transaction((tx) => service.create(input, cmd, tx, ALL, ALL)),
  ).rejects.toMatchObject({ code: 'ONBOARDING_FORBIDDEN' });
  await expect(
    db.transaction((tx) =>
      service.create(input, cmd, tx, ALL, ALL, {
        ...ALL,
        read: { scope: { id: 'unreadable-mentor' }, fields: ['id', 'name'] },
      }),
    ),
  ).rejects.toMatchObject({ code: 'ONBOARDING_FORBIDDEN' });
  await expect(
    db.transaction((tx) =>
      service.create(input, cmd, tx, ALL, ALL, {
        ...ALL,
        read: { scope: true, fields: ['id'] },
      }),
    ),
  ).rejects.toMatchObject({ code: 'ONBOARDING_FORBIDDEN' });
  await expect(
    db.transaction((tx) =>
      service.create(input, cmd, tx, ALL, ALL, {
        ...ALL,
        read: { scope: { id: 'unreadable-mentor' } },
      }),
    ),
  ).rejects.toMatchObject({ code: 'ONBOARDING_FORBIDDEN' });
  expect(await db.repository('onboardings').count()).toBe(0);
  const spy = vi.spyOn(audit, 'record').mockImplementation(async (entry) => {
    if (entry.action === 'onboarding.create') throw new Error('Audit rollback');
  });
  await expect(
    db.transaction((tx) => service.create(input, cmd, tx, ALL, ALL, ALL)),
  ).rejects.toThrow('Audit rollback');
  spy.mockRestore();
  expect(
    await db
      .repository('employees')
      .count({ filter: { code: input.employee.code } }),
  ).toBe(0);
  expect(await db.repository('onboardings').count()).toBe(0);
  expect(
    await db
      .repository('user')
      .count({ filter: { email: input.account.email } }),
  ).toBe(0);
  await expect(
    signIn(testApp, {
      email: input.account.email,
      password: input.account.password,
    }),
  ).rejects.toThrow('failed');
  expect(await headcounts.balance(account.id, db.connection())).toMatchObject({
    used: 0,
    allocated: 1,
  });
  const record = await db.transaction((tx) =>
    service.create(input, cmd, tx, ALL, ALL, ALL),
  );
  expect(await employees.getById(record.employeeId)).toMatchObject({
    status: 'probation',
    active: true,
    positionId: position.id,
  });
  expect((await users.get(record.userId))?.disabledAt).toBeTruthy();
  await expect(
    signIn(testApp, {
      email: input.account.email,
      password: input.account.password,
    }),
  ).rejects.toThrow('403');
  expect(await headcounts.balance(account.id, db.connection())).toMatchObject({
    used: 1,
    allocated: 0,
  });
  expect(await requisitions.get(source.id, db.connection(), ALL)).toMatchObject(
    { remaining: 0, consumed: 1, status: 'full' },
  );
  expect(
    await db
      .repository('onboardingTasks')
      .count({ filter: { onboardingId: record.id } }),
  ).toBe(4);
  expect(
    (
      await db.transaction((tx) =>
        service.create(input, cmd, tx, ALL, ALL, ALL),
      )
    ).id,
  ).toBe(record.id);
  expect(record).toMatchObject({
    mentorEmployeeId: actor.employeeId,
    workstationRequirement: 'A team workstation',
  });
  expect(JSON.stringify(record)).not.toMatch(/12000|password|baseSalary/);
  expect(
    await db.repository('session').count({ filter: { userId: record.userId } }),
  ).toBe(0);
  const durable = await db.repository('onboardingCommands').findMany();
  expect(JSON.stringify(durable)).not.toMatch(
    /new-hire-password|12000|password|baseSalary/,
  );
  const auditRows = await db
    .repository('auditLogs')
    .findMany({ filter: { targetId: record.id } });
  expect(JSON.stringify(auditRows)).not.toMatch(
    /new-hire-password|12000|password|baseSalary/,
  );

  await db
    .query()
    .deleteFrom('authorizationPermissionSetAssignments')
    .where('permissionSetKey', 'in', [
      'oa-onboarding-employee',
      'oa-onboarding-hr',
      'oa-onboarding-finance',
    ])
    .execute();
  const authz = c.resolve(authorizationToken),
    session = await actor.session();
  expect(
    (await testApp.request(`/onboardings/${record.id}/salary`)).status,
  ).toBe(401);
  const payKey = `onboarding-pay-${randomUUID()}`;
  await authz.permissionSets.create(
    definePermissionSet(payKey)
      .grant({
        resource: { type: 'composite', id: 'oa.onboarding' },
        actions: ['viewSalary', 'viewBank'].map((action) => ({
          action,
          policy: {
            type: 'composite' as const,
            scopes: { onboardings: 'allRecords' },
          },
        })),
      })
      .build(),
  );
  await authz.permissionSets.assign({
    permissionSet: payKey,
    subject: { type: 'user', id: actor.userId },
  });
  expect((await session.fetch(`/onboardings/${record.id}/salary`)).status).toBe(
    403,
  );
  const viewKey = `onboarding-view-${randomUUID()}`;
  await authz.permissionSets.create(
    definePermissionSet(viewKey)
      .grant({
        resource: { type: 'composite', id: 'oa.onboarding' },
        actions: [
          {
            action: 'view',
            policy: {
              type: 'composite',
              scopes: {
                onboardings: 'allRecords',
                onboardingTasks: 'allRecords',
              },
            },
          },
          {
            action: 'create',
            policy: {
              type: 'composite',
              scopes: { onboardings: 'allRecords' },
            },
          },
        ],
      })
      .grant({
        resource: { type: 'composite', id: 'oa.requisitions' },
        actions: [
          {
            action: 'view',
            policy: {
              type: 'composite',
              scopes: { requisitions: 'allRecords' },
            },
          },
        ],
      })
      .build(),
  );
  await authz.permissionSets.assign({
    permissionSet: viewKey,
    subject: { type: 'user', id: actor.userId },
  });
  const publicResponse = await session.fetch(`/onboardings/${record.id}`);
  expect(publicResponse.status).toBe(200);
  const publicDetail = (await publicResponse.json()).data;
  expect(JSON.stringify(publicDetail)).not.toMatch(
    /12000|baseSalary|password|bankAccount/,
  );
  // Read-only grants never expose mutation offers even to an actual HR candidate.
  expect(publicDetail.canCancel).toBe(false);
  expect(
    publicDetail.tasks.every(
      (task: { actions: string[] }) => task.actions.length === 0,
    ),
  ).toBe(true);
  expect(
    (await (await session.fetch('/onboardings/options')).json()).data.canCreate,
  ).toBe(true);
  const privateResponse = await session.fetch(
    `/onboardings/${record.id}/salary`,
  );
  expect(privateResponse.status).toBe(200);
  expect((await privateResponse.json()).data).toMatchObject({
    baseSalary: '12000.00',
    gradeId: grade.id,
  });
  const replayBody = {
    ...input,
    requestId: cmd.requestKey,
    reason: cmd.reason,
  };
  expect(
    (
      await session.fetch('/onboardings', {
        method: 'POST',
        headers: { origin: OA_TEST_ORIGIN, 'content-type': 'application/json' },
        body: JSON.stringify(replayBody),
      })
    ).status,
  ).toBe(200);
  await authz.permissionSets.delete(viewKey);
  expect((await session.fetch(`/onboardings/${record.id}/salary`)).status).toBe(
    403,
  );
  expect(
    (
      await session.fetch('/onboardings', {
        method: 'POST',
        headers: { origin: OA_TEST_ORIGIN, 'content-type': 'application/json' },
        body: JSON.stringify(replayBody),
      })
    ).status,
  ).toBe(403);
  const itId = `${record.id}:it`;
  const failed = vi.spyOn(audit, 'record').mockImplementation(async (entry) => {
    if (entry.action === 'onboarding.task.forceComplete')
      throw new Error('Enable audit rollback');
  });
  const force = {
    id: record.id,
    taskId: itId,
    expectedVersion: 1,
    action: 'forceComplete' as const,
  };
  const forceCommand = command();
  await expect(
    db.transaction((tx) => service.act(force, forceCommand, tx, ALL, ALL)),
  ).rejects.toThrow('Enable audit rollback');
  failed.mockRestore();
  expect((await users.get(record.userId))?.disabledAt).toBeTruthy();
  expect(
    await db.repository('onboardingTasks').findOne({ filter: { id: itId } }),
  ).toMatchObject({ status: 'open', version: 1 });
  const forced = await db.transaction((tx) =>
    service.act(force, forceCommand, tx, ALL, ALL),
  );
  expect(forced).toMatchObject({ forced: true, status: 'completed' });
  expect((await users.get(record.userId))?.disabledAt).toBeFalsy();
  for (const role of ['admin', 'finance'])
    await organization.addDutyRoleMember(role, actor.userId, context);
  const completedFacts: Record<string, Record<string, string>> = {
    administration: {
      workstation: 'D12',
      badgeReference: 'Actual badge receipt',
    },
    finance: {
      bankName: 'Private bank',
      bankAccount: '9876543210',
      bankAccountName: 'Actual new hire',
      socialInsuranceReference: 'Enrollment evidence',
    },
    mentor: {
      mentorEmployeeId: actor.employeeId,
      plan: 'Actual thirty day plan',
    },
  };
  for (const [kind, facts] of Object.entries(completedFacts)) {
    const taskId = `${record.id}:${kind}`;
    await db.transaction((tx) =>
      service.act(
        { id: record.id, taskId, expectedVersion: 1, action: 'claim' },
        command(),
        tx,
        ALL,
        ALL,
      ),
    );
    const completed = await db.transaction((tx) =>
      service.act(
        {
          id: record.id,
          taskId,
          expectedVersion: 2,
          action: 'complete',
          facts,
        },
        command(),
        tx,
        ALL,
        ALL,
      ),
    );
    expect(completed.status).toBe('completed');
    if (kind === 'finance')
      expect(JSON.stringify(completed)).not.toMatch(/9876543210|Private bank/);
  }
  expect(
    await db.repository('onboardings').findOne({ filter: { id: record.id } }),
  ).toMatchObject({ status: 'completed' });
  expect(
    (
      await signIn(testApp, {
        email: input.account.email,
        password: input.account.password,
      })
    ).user.id,
  ).toBe(record.userId);
  const currentCapacity = (await headcounts.balance(
    account.id,
    db.connection(),
  ))!;
  await db.transaction((tx) =>
    headcounts.adjustLimit(
      {
        ...command(),
        accountId: account.id,
        expectedVersion: currentCapacity.version,
        limit: 2,
      },
      tx,
    ),
  );
  const secondSourceId = randomUUID();
  await db.transaction((tx) =>
    headcounts.hold(
      {
        ...command(),
        sourceKind: 'oa.recruitment',
        sourceId: secondSourceId,
        accountId: account.id,
        quantity: 1,
      },
      tx,
    ),
  );
  const secondSource = await db.transaction((tx) =>
    requisitions.publish(
      {
        id: secondSourceId,
        lifecycleVersion: 8,
        snapshot: {
          departmentId: department.id,
          positionId: position.id,
          gradeId: grade.id,
          quantity: 1,
          accountId: account.id,
          year,
        } as RecruitmentSubmissionSnapshot,
      },
      command(),
      tx,
    ),
  );
  const secondInput = {
    ...input,
    id: randomUUID(),
    requisitionId: secondSource.id,
    requisitionVersion: secondSource.version,
    account: { ...input.account, email: `${randomUUID()}@example.test` },
    employee: { ...input.employee, code: randomUUID() },
  };
  const second = await db.transaction((tx) =>
    service.create(secondInput, command(), tx, ALL, ALL, ALL),
  );
  await db.transaction((tx) =>
    service.act(
      {
        id: second.id,
        taskId: `${second.id}:it`,
        expectedVersion: 1,
        action: 'forceComplete',
      },
      command(),
      tx,
      ALL,
      ALL,
    ),
  );
  const assets = c.resolve(assetServiceToken);
  const category = (
    await c.resolve(dictionaryServiceToken).list('assetCategory')
  )[0]!.code;
  const physical = await db.transaction((tx) =>
    assets.create(
      {
        code: randomUUID(),
        name: 'Actual onboarding laptop',
        category,
        serialNumber: 'ONB-SERIAL',
        originalValueCents: 123456,
        actorId: actor.userId,
        reason: 'Real receipt',
      },
      tx,
    ),
  );
  const adminTaskId = `${second.id}:administration`;
  await db.transaction((tx) =>
    service.act(
      {
        id: second.id,
        taskId: adminTaskId,
        expectedVersion: 1,
        action: 'claim',
      },
      command(),
      tx,
      ALL,
      ALL,
    ),
  );
  const assetInput = {
    id: second.id,
    taskId: adminTaskId,
    expectedVersion: 2,
    action: 'complete' as const,
    facts: { workstation: 'W2', badgeReference: 'B2' },
    assetUnits: [{ code: physical.code, serialNumber: 'ONB-SERIAL' }],
  };
  await expect(
    db.transaction((tx) => service.act(assetInput, command(), tx, ALL, ALL)),
  ).rejects.toMatchObject({ code: 'ONBOARDING_FORBIDDEN' });
  await expect(
    db.transaction((tx) =>
      service.act(
        {
          ...assetInput,
          assetUnits: [{ code: physical.code, serialNumber: 'WRONG' }],
        },
        command(),
        tx,
        ALL,
        ALL,
        ALL,
      ),
    ),
  ).rejects.toMatchObject({ code: 'ONBOARDING_FORBIDDEN' });
  const issueAudit = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry) => {
      if (entry.action === 'onboarding.task.complete')
        throw new Error('Issue rollback');
    });
  await expect(
    db.transaction((tx) =>
      service.act(assetInput, command(), tx, ALL, ALL, ALL),
    ),
  ).rejects.toThrow('Issue rollback');
  issueAudit.mockRestore();
  expect(await assets.get(physical.id, db.connection())).toMatchObject({
    status: 'available',
    holderEmployeeId: null,
  });
  expect(
    await db
      .repository('assetIssueFacts')
      .count({ filter: { assetId: physical.id } }),
  ).toBe(0);
  const assetCmd = command();
  const assetTask = await db.transaction((tx) =>
    service.act(assetInput, assetCmd, tx, ALL, ALL, ALL),
  );
  expect(assetTask.facts).toMatchObject({
    assetReceiptId: expect.stringMatching(/^[a-f0-9]{64}$/),
  });
  expect(JSON.stringify(assetTask)).not.toContain('123456');
  expect(
    await db.transaction((tx) =>
      service.act(assetInput, assetCmd, tx, ALL, ALL, ALL),
    ),
  ).toEqual(assetTask);
  expect(await assets.get(physical.id, db.connection())).toMatchObject({
    status: 'assigned',
    holderEmployeeId: second.employeeId,
  });
  await expect(
    assets.assertAllReturned(second.employeeId, db.connection()),
  ).rejects.toThrow();
  const beforeCancel = (await db
    .repository('onboardings')
    .findOne({ filter: { id: second.id } }))!;
  const cancellation = command();
  const cancelAudit = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry) => {
      if (entry.action === 'onboarding.cancel')
        throw new Error('Cancel audit rollback');
    });
  await expect(
    db.transaction((tx) =>
      service.cancel(
        second.id,
        Number(beforeCancel.version),
        cancellation,
        tx,
        ALL,
        ALL,
      ),
    ),
  ).rejects.toThrow('Cancel audit rollback');
  cancelAudit.mockRestore();
  expect(await employees.getById(second.employeeId)).toMatchObject({
    status: 'probation',
    active: true,
  });
  expect(await headcounts.balance(account.id, db.connection())).toMatchObject({
    used: 2,
  });
  const cancelled = await db.transaction((tx) =>
    service.cancel(
      second.id,
      Number(beforeCancel.version),
      cancellation,
      tx,
      ALL,
      ALL,
    ),
  );
  expect(cancelled.status).toBe('cancelled');
  expect(await employees.getById(second.employeeId)).toMatchObject({
    status: 'left',
    active: false,
  });
  expect((await users.get(second.userId))?.disabledAt).toBeTruthy();
  expect(await headcounts.balance(account.id, db.connection())).toMatchObject({
    used: 1,
    allocated: 0,
  });
  expect(
    await requisitions.get(secondSource.id, db.connection(), ALL),
  ).toMatchObject({ remaining: 0, consumed: 1, status: 'full' });
  expect(await assets.get(physical.id, db.connection())).toMatchObject({
    status: 'assigned',
    holderEmployeeId: second.employeeId,
  });
  const adminRecovery = `${adminTaskId}:recovery`;
  const assetOfferGrant = `onboarding-asset-offer-${randomUUID()}`;
  await authz.permissionSets.create(
    definePermissionSet(assetOfferGrant)
      .grant({
        resource: { type: 'composite', id: 'oa.onboarding' },
        actions: ['view', 'forceComplete'].map((action) => ({
          action,
          policy: {
            type: 'composite' as const,
            scopes:
              action === 'view'
                ? { onboardings: 'allRecords', onboardingTasks: 'allRecords' }
                : { onboardingTasks: 'allRecords' },
          },
        })),
      })
      .build(),
  );
  await authz.permissionSets.assign({
    permissionSet: assetOfferGrant,
    subject: { type: 'user', id: actor.userId },
  });
  const offersBeforeResponse = await session.fetch(`/onboardings/${second.id}`);
  expect(offersBeforeResponse.status).toBe(200);
  const offersBefore = (await offersBeforeResponse.json()).data.tasks as {
    id: string;
    actions: string[];
  }[];
  expect(
    offersBefore.find((task) => task.id === adminRecovery)?.actions,
  ).not.toContain('forceComplete');
  expect(
    offersBefore.find((task) => task.id === `${second.id}:it:recovery`)
      ?.actions,
  ).toContain('forceComplete');

  await db.transaction((tx) =>
    service.act(
      {
        id: second.id,
        taskId: adminRecovery,
        expectedVersion: 1,
        action: 'claim',
      },
      command(),
      tx,
      ALL,
      ALL,
    ),
  );
  await expect(
    db.transaction((tx) =>
      service.act(
        {
          id: second.id,
          taskId: adminRecovery,
          expectedVersion: 2,
          action: 'forceComplete',
        },
        command(),
        tx,
        ALL,
        ALL,
      ),
    ),
  ).rejects.toMatchObject({ code: 'ONBOARDING_SOURCE_INVALID' });
  await expect(
    db.transaction((tx) =>
      service.act(
        {
          id: second.id,
          taskId: adminRecovery,
          expectedVersion: 2,
          action: 'complete',
          facts: { returnReceipt: 'Unverified text' },
        },
        command(),
        tx,
        ALL,
        ALL,
      ),
    ),
  ).rejects.toMatchObject({ code: 'ONBOARDING_SOURCE_INVALID' });
  const recoverInput = {
    id: second.id,
    taskId: adminRecovery,
    expectedVersion: 2,
    action: 'complete' as const,
    facts: { returnReceipt: 'Physical receipt' },
    assetUnits: assetInput.assetUnits,
  };
  const recoverAudit = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry) => {
      if (entry.action === 'onboarding.task.complete')
        throw new Error('Return rollback');
    });
  await expect(
    db.transaction((tx) =>
      service.act(recoverInput, command(), tx, ALL, ALL, ALL),
    ),
  ).rejects.toThrow('Return rollback');
  recoverAudit.mockRestore();
  expect(await assets.get(physical.id, db.connection())).toMatchObject({
    status: 'assigned',
    holderEmployeeId: second.employeeId,
  });
  expect(
    await c
      .resolve(onboardingAssetServiceToken)
      .hasOutstanding(adminTaskId, db.connection()),
  ).toBe(true);
  await db.transaction((tx) =>
    service.act(recoverInput, command(), tx, ALL, ALL, ALL),
  );
  expect(await assets.get(physical.id, db.connection())).toMatchObject({
    status: 'available',
    holderEmployeeId: null,
  });
  expect(
    await db
      .repository('assetReturnFacts')
      .count({ filter: { assetId: physical.id } }),
  ).toBe(1);
  await assets.assertAllReturned(second.employeeId, db.connection());
  const offersAfter = (
    await (await session.fetch(`/onboardings/${second.id}`)).json()
  ).data.tasks as { id: string; actions: string[] }[];
  expect(
    offersAfter.find((task) => task.id === `${second.id}:it:recovery`)?.actions,
  ).toContain('forceComplete');
  const recoveryId = `${second.id}:it:recovery`;
  expect(
    await db
      .repository('onboardingTasks')
      .findOne({ filter: { id: recoveryId } }),
  ).toMatchObject({ kind: 'recovery:it', status: 'open' });
  await organization.addDutyRoleMember('it', actor.userId, context);
  await db.transaction((tx) =>
    service.act(
      {
        id: second.id,
        taskId: recoveryId,
        expectedVersion: 1,
        action: 'claim',
      },
      command(),
      tx,
      ALL,
      ALL,
    ),
  );
  await db.transaction((tx) =>
    service.act(
      {
        id: second.id,
        taskId: recoveryId,
        expectedVersion: 2,
        action: 'complete',
        facts: {
          returnReceipt: 'Account cleanup receipt; no physical issue claimed',
        },
      },
      command(),
      tx,
      ALL,
      ALL,
    ),
  );
  expect((await users.get(second.userId))?.disabledAt).toBeTruthy();
  await authz.permissionSets.delete(payKey);
  await db
    .createSeeder({
      sources: [
        {
          packageName: 'onboarding-permissions-candidate',
          directory: path.resolve(
            import.meta.dirname,
            '../../fixtures/onboarding/seeds',
          ),
        },
      ],
      tableName: 'onboardingPermissionSeedProof',
    })
    .run();
  for (const [key, type, id] of [
    ['oa-onboarding-employee', 'authenticated', '*'],
    ['oa-onboarding-hr', 'org.dutyRole', 'hr'],
    ['oa-onboarding-finance', 'org.dutyRole', 'finance'],
  ]) {
    if (
      !(await db
        .query()
        .selectFrom('authorizationPermissionSetAssignments')
        .select('id')
        .where('permissionSetKey', '=', key!)
        .executeTakeFirst())
    )
      await authz.permissionSets.assign({
        permissionSet: key!,
        subject: { type: type!, id: id! },
      });
  }
  const employeeSession = await signIn(testApp, {
    email: input.account.email,
    password: input.account.password,
  });
  expect(
    (await employeeSession.fetch(`/onboardings/${record.id}`)).status,
  ).toBe(200);
  expect(
    (await service.list({ page: 1, pageSize: 20 }, db.connection(), ALL)).items
      .length,
  ).toBeGreaterThan(0);
  const ownList = await employeeSession.fetch(
    '/onboardings?page=1&pageSize=20',
  );
  expect(ownList.status).toBe(200);
  const ownResult = await ownList.json();
  expect(ownResult.meta.total).toBe(1);
  expect(ownResult.data.map((item: { id: string }) => item.id)).toEqual([
    record.id,
  ]);
  expect(
    (await employeeSession.fetch(`/onboardings/${record.id}/salary`)).status,
  ).toBe(403);
  expect(
    (await employeeSession.fetch(`/onboardings/${record.id}/bank`)).status,
  ).toBe(403);
  expect((await session.fetch(`/onboardings/${record.id}/salary`)).status).toBe(
    200,
  );
  const banking = await session.fetch(`/onboardings/${record.id}/bank`);
  expect(banking.status).toBe(200);
  expect((await banking.json()).data).toMatchObject({
    bankAccount: '9876543210',
  });
  const outsider = await createEmployee(testApp, 'Onboarding unrelated user'),
    outsiderSession = await outsider.session();
  expect(
    (await outsiderSession.fetch(`/onboardings/${record.id}`)).status,
  ).toBe(403);
  const safe = await session.fetch(`/onboardings/${record.id}`);
  expect(safe.status).toBe(200);
  expect(JSON.stringify(await safe.json())).not.toMatch(
    /9876543210|12000|baseSalary|password/,
  );
  const manager = await createEmployee(testApp, 'Onboarding supervisor');
  await moduleEmployees(testApp).updateEmployee(
    actor.employeeId,
    { managerId: manager.employeeId },
    ALL,
    actor.userId,
  );
  const thirdSourceId = randomUUID();
  await db.transaction((tx) =>
    headcounts.hold(
      {
        ...command(),
        sourceKind: 'oa.recruitment',
        sourceId: thirdSourceId,
        accountId: account.id,
        quantity: 1,
      },
      tx,
    ),
  );
  const thirdSource = await db.transaction((tx) =>
    requisitions.publish(
      {
        id: thirdSourceId,
        lifecycleVersion: 9,
        snapshot: {
          departmentId: department.id,
          positionId: position.id,
          gradeId: grade.id,
          quantity: 1,
          accountId: account.id,
          year,
        } as RecruitmentSubmissionSnapshot,
      },
      command(),
      tx,
    ),
  );
  const thirdInput = {
    ...input,
    id: randomUUID(),
    requisitionId: thirdSource.id,
    requisitionVersion: thirdSource.version,
    account: { ...input.account, email: `${randomUUID()}@example.test` },
    employee: { ...input.employee, code: randomUUID() },
  };
  const third = await db.transaction((tx) =>
    service.create(thirdInput, command(), tx, ALL, ALL, ALL),
  );
  // Public HTTP must resolve authorization before the SQLite caller transaction: resolving global stores inside it deadlocks its single connection.
  for (const [action, version] of [
    ['claim', 1],
    ['release', 2],
  ] as const) {
    const response = await session.fetch(
      `/onboardings/${third.id}/tasks/${encodeURIComponent(third.id + ':it')}/actions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: OA_TEST_ORIGIN },
        body: JSON.stringify({
          requestId: randomUUID(),
          reason: 'Public HTTP transaction regression',
          expectedVersion: version,
          action,
        }),
      },
    );
    expect(response.status).toBe(200);
  }
  const notifications = c.resolve(notificationServiceToken),
    send = vi.spyOn(notifications, 'send');
  expect(await service.maintenance()).toMatchObject({ sent: 2 });
  const entries = await db
    .repository('onboardingReminders')
    .findMany({ filter: { onboardingId: third.id } });
  expect(entries).toHaveLength(2);
  for (const entry of entries)
    expect(entry.recipientIds).toEqual(
      expect.arrayContaining([actor.userId, manager.userId]),
    );
  expect(send).toHaveBeenCalledTimes(2);
  expect(JSON.stringify(send.mock.calls)).not.toMatch(
    /12000|baseSalary|password|bankAccount/,
  );
  expect(await service.maintenance()).toMatchObject({ sent: 0 });
  expect(send).toHaveBeenCalledTimes(2);
  send.mockRestore();
  const rival = await createEmployee(testApp, 'Onboarding competing IT');
  await organization.addDutyRoleMember('it', rival.userId, context);
  const claimantIds = [actor.userId, rival.userId];
  const claimCommands = claimantIds.map((actorId) => ({
    actorId,
    requestKey: randomUUID(),
    reason: 'Concurrent actual IT claim',
  }));
  const claims = await Promise.allSettled(
    claimCommands.map((claimCommand) =>
      db.transaction((tx) =>
        service.act(
          {
            id: third.id,
            taskId: `${third.id}:it`,
            expectedVersion: 3,
            action: 'claim',
          },
          claimCommand,
          tx,
          ALL,
          ALL,
        ),
      ),
    ),
  );
  expect(claims.filter((result) => result.status === 'fulfilled')).toHaveLength(
    1,
  );
  expect(claims.filter((result) => result.status === 'rejected')).toHaveLength(
    1,
  );
  const claimed = (await db
    .repository('onboardingTasks')
    .findOne({ filter: { id: `${third.id}:it` } }))!;
  expect(claimed).toMatchObject({ status: 'claimed', version: 4 });
  const winner =
    claimCommands[claims.findIndex((result) => result.status === 'fulfilled')]!;
  await organization.removeDutyRoleMember('it', winner.actorId, context);
  await expect(
    db.transaction((tx) =>
      service.act(
        {
          id: third.id,
          taskId: `${third.id}:it`,
          expectedVersion: 3,
          action: 'claim',
        },
        winner,
        tx,
        ALL,
        ALL,
      ),
    ),
  ).rejects.toMatchObject({ code: 'ONBOARDING_FORBIDDEN' });
});

test('explicit cross-year onboarding rebind synchronizes allocation and rolls back all facts on audit failure', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    organization = c.resolve(organizationServiceToken),
    headcounts = c.resolve(headcountServiceToken),
    audit = c.resolve(auditServiceToken),
    calendar = c.resolve(calendarServiceToken),
    requisitions = c.resolve(requisitionServiceToken);
  expect(
    await c
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor('oa-onboarding')
      .getJob('overdue-scan'),
  ).toMatchObject({
    jobName: 'overdue-scan',
    options: { every: 600000 },
  });
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
  const actor = await createEmployee(testApp, 'Onboarding HR');
  const context = { actorId: actor.userId };
  await organization.addDutyRoleMember('hr', actor.userId, context);
  const department = await organization.createDepartment(
      { title: randomUUID(), managerId: actor.userId },
      context,
    ),
    position = await organization.createPosition(
      { code: randomUUID(), title: 'Hire role' },
      context,
    ),
    grade = await organization.createGrade(
      { code: randomUUID(), title: 'Hire grade', rank: 1 },
      context,
    );
  const hireDate = calendar.localDate(new Date()),
    year = Number(hireDate.slice(0, 4));
  const command = (requestKey = randomUUID()) => ({
    actorId: actor.userId,
    requestKey,
    reason: 'Real onboarding allocation',
  });
  const account = await db.transaction((tx) =>
    headcounts.create(
      {
        ...command(),
        departmentId: department.id,
        positionId: position.id,
        year: year - 1,
        limit: 1,
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    headcounts.reconcile(
      {
        ...command(),
        accountId: account.id,
        expectedVersion: account.version,
        employeeIds: [],
      },
      tx,
    ),
  );
  const sourceId = randomUUID();
  await db.transaction((tx) =>
    headcounts.hold(
      {
        ...command(),
        sourceKind: 'oa.recruitment',
        sourceId,
        accountId: account.id,
        quantity: 1,
      },
      tx,
    ),
  );
  const source = await db.transaction((tx) =>
    requisitions.publish(
      {
        id: sourceId,
        lifecycleVersion: 7,
        snapshot: {
          departmentId: department.id,
          positionId: position.id,
          gradeId: grade.id,
          quantity: 1,
          accountId: account.id,
          year: year - 1,
        } as RecruitmentSubmissionSnapshot,
      },
      command(),
      tx,
    ),
  );
  const service = c.resolve(onboardingServiceToken);
  const input = {
    id: randomUUID(),
    requisitionId: source.id,
    requisitionVersion: source.version,
    account: {
      name: 'Actual new hire',
      email: `${randomUUID()}@example.test`,
      password: 'new-hire-password',
    },
    employee: {
      code: randomUUID(),
      name: 'Actual new hire',
      managerId: actor.employeeId,
      hireDate,
      careerStartDate: null,
      probationEndDate: calendar.addCalendarDays(hireDate, 90),
    },
    baseSalary: '12000.00',
  };
  const target = await db.transaction((tx) =>
    headcounts.create(
      {
        ...command(),
        departmentId: department.id,
        positionId: position.id,
        year,
        limit: 0,
      },
      tx,
    ),
  );
  const reboundInput = { ...input, targetAccountId: target.id };
  const cmd = command();
  await expect(
    db.transaction((tx) => service.create(input, cmd, tx, ALL, ALL, ALL)),
  ).rejects.toMatchObject({ code: 'ONBOARDING_SOURCE_INVALID' });
  await expect(
    db.transaction((tx) =>
      service.create(reboundInput, cmd, tx, ALL, ALL, ALL),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_NOT_INITIALIZED' });
  await db.transaction((tx) =>
    headcounts.reconcile(
      {
        ...command(),
        accountId: target.id,
        expectedVersion: target.version,
        employeeIds: [],
      },
      tx,
    ),
  );
  await expect(
    db.transaction((tx) =>
      service.create(reboundInput, cmd, tx, ALL, ALL, ALL),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_INSUFFICIENT' });
  expect(await requisitions.get(source.id, db.connection(), ALL)).toMatchObject(
    { accountId: account.id, sourceYear: year - 1, version: 0 },
  );
  const targetVersion = (await headcounts.balance(target.id, db.connection()))!
    .version;
  await db.transaction((tx) =>
    headcounts.adjustLimit(
      {
        ...command(),
        accountId: target.id,
        expectedVersion: targetVersion,
        limit: 1,
      },
      tx,
    ),
  );
  const auditSpy = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry) => {
      if (entry.action === 'onboarding.create')
        throw new Error('cross-year rollback');
    });
  await expect(
    db.transaction((tx) =>
      service.create(reboundInput, cmd, tx, ALL, ALL, ALL),
    ),
  ).rejects.toThrow('cross-year rollback');
  auditSpy.mockRestore();
  expect(await requisitions.get(source.id, db.connection(), ALL)).toMatchObject(
    { accountId: account.id, sourceYear: year - 1, version: 0, remaining: 1 },
  );
  expect(await headcounts.balance(target.id, db.connection())).toMatchObject({
    used: 0,
    allocated: 0,
    available: 1,
  });
  expect(
    await db
      .repository('user')
      .count({ filter: { email: input.account.email } }),
  ).toBe(0);
  const created = await db.transaction((tx) =>
    service.create(reboundInput, cmd, tx, ALL, ALL, ALL),
  );
  expect(await requisitions.get(source.id, db.connection(), ALL)).toMatchObject(
    {
      accountId: target.id,
      sourceYear: year,
      remaining: 0,
      consumed: 1,
      version: 2,
    },
  );
  expect(await headcounts.balance(target.id, db.connection())).toMatchObject({
    used: 1,
    allocated: 0,
    available: 0,
  });
  expect(await headcounts.balance(account.id, db.connection())).toMatchObject({
    used: 0,
    allocated: 0,
    available: 1,
  });
  expect(
    await db.transaction((tx) =>
      service.create(reboundInput, cmd, tx, ALL, ALL, ALL),
    ),
  ).toEqual(created);
});
