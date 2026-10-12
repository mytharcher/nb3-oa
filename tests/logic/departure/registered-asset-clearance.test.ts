// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  createEmployee,
  createEmployeesAppTest,
} from '../employees/helpers.ts';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import {
  departureServiceToken,
  departureAssetClearanceToken,
} from '../../../server/providers/departure/contract.js';
import { assetClearanceServiceToken } from '../../../server/providers/assets/contract.js';
import { write } from '../platform/helpers.ts';
const test = createEmployeesAppTest();
test('registered departure administrative work requires actual return and records no forced exemption', async ({
  testApp,
}) => {
  const c = testApp.application.container;
  const db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  expect(c.resolve(departureAssetClearanceToken)).toBe(
    c.resolve(assetClearanceServiceToken),
  );
  const head = await createEmployee(testApp, 'Asset handover head');
  const hr = await createEmployee(testApp, 'Asset handover HR');
  const admin = await createEmployee(testApp, 'Asset handover administrator');
  const receiver = await createEmployee(testApp, 'Asset handover receiver');
  const grade = await org.createGrade(
    { code: randomUUID(), title: 'Clearance junior', rank: 1 },
    { actorId: hr.userId },
  );
  const owner = await createEmployee(testApp, 'Asset handover owner', {
    managerId: head.employeeId,
    gradeId: grade.id,
  });
  const department = await org.createDepartment(
    { title: 'Asset handover department', managerId: head.userId },
    { actorId: hr.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: hr.userId },
  );
  await org.addDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
  await org.addDutyRoleMember('admin', admin.userId, { actorId: hr.userId });
  const service = c.resolve(departureServiceToken);
  const draft = await service.create(
    {
      departureType: 'resignation',
      reason: 'Actual normal asset clearance',
      expectedLastWorkingDay: '2026-12-03',
      handoverUserId: receiver.userId,
    },
    owner.userId,
  );
  const id = String(draft.record.id);
  await service.transition(
    id,
    'submit',
    owner.userId,
    Number(draft.record.lifecycleVersion),
    randomUUID(),
  );
  async function approve(actorId: string, data?: Record<string, string>) {
    const detail = await service.detail(id, actorId);
    const offer = detail.taskActions.find((t) =>
      t.actions.some((a) => a.name === 'approve'),
    )!;
    const run = detail.runs.find((r) => r.run.id === offer.task.runId)!;
    await service.action(
      id,
      {
        action: 'approve',
        target: { taskId: offer.task.id },
        contentHash: run.run.contentHash,
        requestId: randomUUID(),
        ...(data ? { input: { data } } : {}),
      },
      actorId,
    );
  }
  await approve(head.userId);
  await approve(hr.userId, { lastWorkingDay: '2026-12-03' });
  async function administrativeWork(
    action: string,
    input: Record<string, boolean> = {},
  ) {
    const item = (await service.detail(id, admin.userId)).workItems.find(
      (row) => row.kind === 'admin',
    )!;
    return service.workAction(
      id,
      String(item.id),
      action,
      admin.userId,
      Number(item.lifecycleVersion),
      randomUUID(),
      input,
    );
  }
  const assetId = randomUUID(),
    now = new Date();
  await db
    .repository('assets')
    .createOne({
      values: {
        id: assetId,
        code: assetId,
        category: 'computer',
        name: 'Actual legacy laptop',
        serialNumber: 'CLEARANCE-SERIAL',
        originalValueCents: 12000,
        status: 'assigned',
        holderEmployeeId: owner.employeeId,
        borrowDueDate: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      },
    });
  await administrativeWork('claim');
  await administrativeWork('confirmChecklist', { confirmed: true });
  await expect(administrativeWork('complete')).rejects.toMatchObject({
    code: 'ASSET_DEPARTURE_NOT_CLEARED',
  });
  const blocked = (await service.detail(id, admin.userId)).workItems.find(
    (row) => row.kind === 'admin',
  )!;
  expect(blocked.status).toBe('claimed');
  const returned = await (
    await admin.session()
  ).fetch(
    '/assets/returnHeld',
    write('POST', {
      assetId,
      holderEmployeeId: owner.employeeId,
      serialNumber: 'CLEARANCE-SERIAL',
      version: 1,
      reason: 'Physical handover checked',
      requestKey: randomUUID(),
    }),
  );
  expect(returned.status).toBe(200);
  await administrativeWork('complete');
  const completed = (await service.detail(id, hr.userId)).workItems.find(
    (row) => row.kind === 'admin',
  )!;
  expect(completed).toMatchObject({
    status: 'completed',
    forcedById: null,
    forceReason: null,
  });
  expect(
    (await db.repository('assets').findOne({ filter: { id: assetId } }))!
      .holderEmployeeId,
  ).toBeNull();
});
