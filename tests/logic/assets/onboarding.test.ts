// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  assetServiceToken,
  onboardingAssetServiceToken,
} from '../../../server/providers/assets/contract.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import {
  createEmployeesAppTest,
  createEmployee,
  ALL,
} from '../employees/helpers.js';
const test = createEmployeesAppTest();
test('public owner rejects released tasks, partial batches and asset write scopes before changing custody', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken);
  const actor = await createEmployee(
    testApp,
    'Actual onboarding inventory admin',
  );
  const employee = await createEmployee(testApp, 'Actual inventory hire', {
    status: 'probation',
  });
  const org = c.resolve(organizationServiceToken);
  await org.addDutyRoleMember('admin', actor.userId, { actorId: actor.userId });
  const assets = c.resolve(assetServiceToken),
    owner = c.resolve(onboardingAssetServiceToken);
  const category = (
    await c.resolve(dictionaryServiceToken).list('assetCategory')
  )[0]!.code;
  const batch = [];
  for (const serialNumber of ['ONB-OWNER-1', 'ONB-OWNER-2'])
    batch.push(
      await db.transaction((tx) =>
        assets.create(
          {
            code: randomUUID(),
            name: 'Inventory unit',
            category,
            serialNumber,
            originalValueCents: 500,
            actorId: actor.userId,
            reason: 'Inventory receipt',
          },
          tx,
        ),
      ),
    );
  const id = randomUUID(),
    taskId = `${id}:administration`;
  await db.repository('onboardings').createOne({
    values: {
      id,
      creatorId: actor.userId,
      employeeId: employee.employeeId,
      userId: employee.userId,
      requisitionId: randomUUID(),
      departmentId: randomUUID(),
      positionId: randomUUID(),
      gradeId: randomUUID(),
      hireDate: '2026-10-11',
      status: 'handling',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  const task = {
    id: taskId,
    onboardingId: id,
    kind: 'administration',
    status: 'open',
    assigneeId: null,
    targetUserId: null,
    dutyRoleCode: 'admin',
    dueDate: '2026-10-11',
    facts: null,
    forced: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.repository('onboardingTasks').createOne({ values: task });
  const command = {
    taskId,
    actorId: actor.userId,
    requestKey: 'owner-issue',
    reason: 'Actual whole batch',
    units: [...batch].reverse().map((item) => ({
      code: item.code,
      serialNumber: item.serialNumber!,
    })),
  };
  await expect(
    db.transaction((tx) => owner.issue(command, tx, ALL)),
  ).rejects.toMatchObject({ code: 'ASSET_ACCESS_DENIED' });
  await db.repository('onboardingTasks').updateMany({
    filter: { id: taskId },
    values: { status: 'claimed', assigneeId: actor.userId, version: 2 },
  });
  await expect(
    db.transaction((tx) =>
      owner.issue(command, tx, { read: true, update: { fields: ['version'] } }),
    ),
  ).rejects.toMatchObject({ code: 'ASSET_ACCESS_DENIED' });
  await expect(
    db.transaction((tx) =>
      owner.issue(command, tx, {
        read: true,
        update: {
          fields: [
            'status',
            'holderEmployeeId',
            'borrowDueDate',
            'version',
            'updatedAt',
          ],
          scope: { id: 'outside' },
        },
      }),
    ),
  ).rejects.toThrow();
  const receipt = await db.transaction((tx) => owner.issue(command, tx, ALL));
  expect(receipt.receiptId).toMatch(/^[a-f0-9]{64}$/);
  const stockAudit = await db
    .repository('auditLogs')
    .findMany({ filter: { targetId: id } });
  expect(
    stockAudit.filter((entry) =>
      ['asset.reserve', 'asset.issue'].includes(String(entry.action)),
    ),
  ).toHaveLength(2);
  expect(stockAudit.every((entry) => entry.targetType === 'onboardings')).toBe(
    true,
  );
  expect(JSON.stringify(stockAudit)).toContain(receipt.receiptId);
  await db.repository('onboardingTasks').updateMany({
    filter: { id: taskId },
    values: {
      status: 'completed',
      facts: { assetReceiptId: receipt.receiptId },
      version: 3,
    },
  });
  await db.repository('onboardings').updateMany({
    filter: { id },
    values: { status: 'cancelled', version: 2 },
  });
  const recoveryId = `${taskId}:recovery`;
  await db.repository('onboardingTasks').createOne({
    values: {
      ...task,
      id: recoveryId,
      kind: 'recovery:administration',
      status: 'claimed',
      assigneeId: actor.userId,
      facts: { sourceTaskId: taskId },
    },
  });
  const recover = {
    ...command,
    taskId: recoveryId,
    requestKey: 'owner-return',
  };
  await expect(
    db.transaction((tx) =>
      owner.recover({ ...recover, units: command.units.slice(0, 1) }, tx, ALL),
    ),
  ).rejects.toMatchObject({ code: 'ASSET_UNITS_INCOMPLETE' });
  expect(await owner.hasOutstanding(taskId, db.connection())).toBe(true);
  for (const item of batch)
    expect(await assets.get(item.id, db.connection())).toMatchObject({
      status: 'assigned',
      holderEmployeeId: employee.employeeId,
    });
  await db.transaction((tx) => owner.recover(recover, tx, ALL));
  expect(await owner.hasOutstanding(taskId, db.connection())).toBe(false);
  await assets.assertAllReturned(employee.employeeId, db.connection());
});
