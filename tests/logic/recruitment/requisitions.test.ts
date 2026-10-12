// @vitest-environment node
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { test } from '../headcounts/helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { createRequisitionService } from '../../../server/providers/recruitment/requisitions.js';
import type { RecruitmentSubmissionSnapshot } from '../../../server/providers/recruitment/submission.js';
test('real requisition allocation, caller/audit rollback, scoped close and partial consumption release', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    headcounts = c.resolve(headcountServiceToken),
    audit = c.resolve(auditServiceToken);
  if (!(await db.connection().collections.get('recruitmentCommands')))
    await db
      .createMigrator({
        sources: [
          {
            packageName: 'recruitment-candidate',
            directory: path.resolve(
              import.meta.dirname,
              '../../fixtures/recruitment/migrations',
            ),
          },
        ],
        tableName: 'recruitmentCandidateMigrationHistory',
      })
      .latest();
  const actor = await createEmployee(testApp, 'Recruitment HR'),
    ctx = { actorId: actor.userId };
  const department = await org.createDepartment(
    { title: 'Recruitment capacity ' + randomUUID() },
    ctx,
  );
  const position = await org.createPosition(
    { code: randomUUID(), title: 'Recruitment engineer' },
    ctx,
  );
  const year = Number(
    c.resolve(calendarServiceToken).localDate(new Date()).slice(0, 4),
  );
  const command = (requestKey = randomUUID()) => ({
    ...ctx,
    requestKey,
    reason: 'Approved seats',
  });
  const account = await db.transaction((tx) =>
    headcounts.create(
      {
        ...command(),
        departmentId: department.id,
        positionId: position.id,
        year,
        limit: 2,
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
        quantity: 2,
      },
      tx,
    ),
  );
  const snapshot = {
    departmentId: department.id,
    positionId: position.id,
    gradeId: 'g1',
    quantity: 2,
    accountId: account.id,
    year,
  } as RecruitmentSubmissionSnapshot;
  const service = createRequisitionService({ headcounts, audit }),
    source = { id: sourceId, lifecycleVersion: 7, snapshot };
  const publication = command();
  await expect(
    db.transaction(async (tx) => {
      await service.publish(source, publication, tx);
      throw new Error('Outer rollback');
    }),
  ).rejects.toThrow('Outer rollback');
  expect(await db.repository('requisitions').count()).toBe(0);
  expect(
    await headcounts.reservation(
      { sourceKind: 'oa.recruitment', sourceId },
      db.connection(),
    ),
  ).toMatchObject({ state: 'pending', remaining: 2 });
  const spy = vi.spyOn(audit, 'record').mockImplementation(async (entry) => {
    if (entry.action === 'requisition.publish')
      throw new Error('Audit rejected');
  });
  await expect(
    db.transaction((tx) => service.publish(source, publication, tx)),
  ).rejects.toThrow('Audit rejected');
  spy.mockRestore();
  expect(await db.repository('requisitions').count()).toBe(0);
  const created = await db.transaction((tx) =>
    service.publish(source, publication, tx),
  );
  expect(created).toMatchObject({
    remaining: 2,
    consumed: 0,
    sourceVersion: 7,
    status: 'recruiting',
  });
  expect(
    (await headcounts.balance(account.id, db.connection()))!,
  ).toMatchObject({ allocated: 2, pending: 0 });
  const readOnly = { read: true, create: false, update: false, delete: false };
  await expect(
    db.transaction((tx) => service.close(sourceId, 0, command(), tx, readOnly)),
  ).rejects.toThrow();
  expect(
    (await headcounts.balance(account.id, db.connection()))!.allocated,
  ).toBe(2);
  const employee = await createEmployee(testApp, 'New hire', {
    positionId: position.id,
    status: 'probation',
  });
  await org.addMember(
    { departmentId: department.id, userId: employee.userId, primary: true },
    ctx,
  );
  const consumed = await db.transaction((tx) =>
    service.consume(sourceId, employee.employeeId, 0, command(), tx),
  );
  expect(consumed).toMatchObject({
    remaining: 1,
    consumed: 1,
    status: 'recruiting',
  });
  const closed = await db.transaction((tx) =>
    service.close(sourceId, 1, command(), tx, {
      read: true,
      create: false,
      update: true,
      delete: false,
    }),
  );
  expect(closed).toMatchObject({ remaining: 0, consumed: 1, status: 'closed' });
  expect(
    (await headcounts.balance(account.id, db.connection()))!,
  ).toMatchObject({ used: 1, allocated: 0, available: 1 });
});
