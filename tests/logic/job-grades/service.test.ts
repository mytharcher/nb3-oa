// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { createPlatformAppTest, createUser } from '../platform/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { salaryGradeServiceToken } from '../../../server/providers/job-grades/contract.js';
const test = createPlatformAppTest();
test('real main immutable salary table: concurrent CAS, old snapshots, audit and caller rollback', async ({
  app,
  testApp,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    audit = c.resolve(auditServiceToken);
  const actorId = (await createUser(testApp, 'Salary publisher')).user.id;
  const grade = await c
    .resolve(organizationServiceToken)
    .createGrade(
      { code: randomUUID(), title: 'Salary proof', rank: 5 },
      { actorId },
    );
  const service = c.resolve(salaryGradeServiceToken);
  expect(await db.transaction((tx) => service.current(tx))).toEqual({
    version: 0,
    revision: null,
  });
  const input = {
    requestKey: 'first-publication',
    expectedVersion: 0,
    actorId,
    reason: 'Publish approved HR bands',
    bands: [{ gradeId: grade.id, minimumCents: 10001, maximumCents: 20002 }],
  };
  const competing = await Promise.allSettled(
    [1, 2].map((index) =>
      db.transaction((tx) =>
        service.publish({ ...input, requestKey: `race-${index}` }, tx),
      ),
    ),
  );
  expect(competing.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(competing.filter((r) => r.status === 'rejected')).toHaveLength(1);
  const first = (await db.transaction((tx) => service.current(tx))).revision!;
  expect(first.version).toBe(1);
  const next = await db.transaction((tx) =>
    service.publish(
      {
        ...input,
        requestKey: 'second-publication',
        expectedVersion: 1,
        bands: [
          { gradeId: grade.id, minimumCents: 30003, maximumCents: 40004 },
        ],
      },
      tx,
    ),
  );
  expect(next.version).toBe(2);
  const replay = await db.transaction((tx) =>
    service.publish(
      {
        ...input,
        requestKey: 'second-publication',
        expectedVersion: 1,
        bands: [
          { gradeId: grade.id, minimumCents: 30003, maximumCents: 40004 },
        ],
      },
      tx,
    ),
  );
  expect(replay.id).toBe(next.id);
  await expect(
    db.transaction((tx) =>
      service.publish(
        { ...input, requestKey: 'second-publication', expectedVersion: 1 },
        tx,
      ),
    ),
  ).rejects.toThrow('IDEMPOTENCY_CONFLICT');
  expect(
    await db.transaction((tx) =>
      service.snapshotForGrade(grade.id, tx, first.id),
    ),
  ).toMatchObject({ minimumCents: 10001, rank: 5, tableVersion: 1 });
  const spy = vi
    .spyOn(audit, 'record')
    .mockRejectedValueOnce(new Error('Audit failed'));
  await expect(
    db.transaction((tx) =>
      service.publish({ ...input, expectedVersion: 2 }, tx),
    ),
  ).rejects.toThrow('Audit failed');
  spy.mockRestore();
  expect((await db.transaction((tx) => service.current(tx))).version).toBe(2);
  expect(await db.repository('salaryGradeRevisions').count()).toBe(2);
  await expect(
    db.transaction(async (tx) => {
      await service.publish({ ...input, expectedVersion: 2 }, tx);
      throw new Error('Caller failed');
    }),
  ).rejects.toThrow('Caller failed');
  expect((await db.transaction((tx) => service.current(tx))).version).toBe(2);
  expect(await db.repository('salaryGradeRevisions').count()).toBe(2);
  const policyInput = {
    ...input,
    expectedVersion: 2,
    requestKey: 'policy-negative',
  };
  await expect(
    db.transaction((tx) =>
      service.publish(policyInput, tx, {
        pointer: { read: true, create: false, update: true, delete: false },
        revision: { read: true, create: false, update: false, delete: false },
      }),
    ),
  ).rejects.toThrow();
  expect((await db.transaction((tx) => service.current(tx))).version).toBe(2);
  expect(await db.repository('salaryGradeRevisions').count()).toBe(2);
  await expect(
    db.transaction((tx) =>
      service.publish(policyInput, tx, {
        pointer: {
          read: true,
          create: false,
          update: { scope: true, fields: ['version'] },
          delete: false,
        },
        revision: { read: true, create: true, update: false, delete: false },
      }),
    ),
  ).rejects.toThrow();
  expect((await db.transaction((tx) => service.current(tx))).version).toBe(2);
  expect(await db.repository('salaryGradeRevisions').count()).toBe(2);
  const log = await db
    .repository('auditLogs')
    .findOne({ filter: { action: 'salaryGrade.publish', targetId: next.id } });
  expect(log?.after).toEqual({ version: 2, gradeCount: 1 });
  expect(log?.reason).toBeNull();
  await c
    .resolve(organizationServiceToken)
    .setGradeActive(grade.id, false, { actorId });
  await expect(
    db.transaction((tx) => service.snapshotForGrade(grade.id, tx)),
  ).rejects.toThrow('GRADE_UNAVAILABLE');
  expect(
    await db.transaction((tx) =>
      service.snapshotForGrade(grade.id, tx, first.id),
    ),
  ).toMatchObject({ rank: 5, minimumCents: 10001, tableVersion: 1 });
  await expect(
    db.transaction((tx) =>
      service.publish({ ...input, expectedVersion: 2 }, tx),
    ),
  ).rejects.toThrow('GRADE_UNAVAILABLE');
  expect((await db.transaction((tx) => service.current(tx))).version).toBe(2);
  expect(
    (
      await db.transaction((tx) =>
        service.publish(
          {
            ...input,
            requestKey: 'second-publication',
            expectedVersion: 1,
            bands: [
              { gradeId: grade.id, minimumCents: 30003, maximumCents: 40004 },
            ],
          },
          tx,
        ),
      )
    ).id,
  ).toBe(next.id);
});
