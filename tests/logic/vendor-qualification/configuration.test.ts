// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { vendorQualificationHttpServiceToken } from '../../../server/providers/vendor-qualification/service.js';
import { createPlatformAppTest, createUser } from '../platform/helpers.js';
import permissionSeed from '../../../database/main/seeds/202610103011_vendor_qualification_permissions.js';
const test = createPlatformAppTest();
test('protected root configuration resolves eligible names and audits fixed-seat compare-and-swap in the caller transaction', async ({
  app,
  testApp,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    authz = c.resolve(authorizationToken),
    org = c.resolve(organizationServiceToken),
    service = c.resolve(vendorQualificationHttpServiceToken),
    manager = await createUser(testApp, 'Protected manager'),
    buyer = await createUser(testApp, 'Fixed purchasing reviewer');
  const existingSets = await authz.permissionSets.list(),
    existingAssignments = await authz.permissionSets.listAssignments();
  await db.transaction(async (tx) => {
    const context = {
      query: tx.query,
      repository: tx.repository.bind(tx),
      connection: tx,
      container: c,
      config: { get: () => undefined },
    };
    await permissionSeed.run(context);
    await permissionSeed.run(context);
  });
  expect(await authz.permissionSets.list()).toEqual(existingSets);
  expect(await authz.permissionSets.listAssignments()).toEqual(
    existingAssignments,
  );
  expect(
    existingAssignments.some(
      (assignment) =>
        assignment.subject.type === 'org.dutyRole' &&
        assignment.subject.id === 'approval.admin',
    ),
  ).toBe(false);
  const root = (await authz.permissionSets.list()).find(
    (set) => authz.permissionSets.protection(set.key)?.unrestricted,
  )!;
  await authz.permissionSets.assign({
    permissionSet: root.key,
    subject: { type: 'user', id: manager.user.id },
  });
  for (const session of [manager, buyer])
    await db.repository('employees').createOne({
      values: {
        id: randomUUID(),
        code: randomUUID(),
        userId: session.user.id,
        name: session.user.name,
        active: true,
        status: 'regular',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  await org.addDutyRoleMember('purchasing', buyer.user.id, {
    actorId: manager.user.id,
  });
  const candidates = await manager.fetch(
    '/vendorQualifications/configuration/candidates?source=purchasing',
  );
  expect(candidates.status).toBe(200);
  expect(await candidates.json()).toMatchObject({
    data: { people: [{ id: buyer.user.id, name: buyer.user.name }] },
  });
  expect(
    (
      await buyer.fetch(
        '/vendorQualifications/configuration/candidates?source=purchasing',
      )
    ).status,
  ).toBe(403);
  const input = {
    committeeVersion: 1,
    seatKey: 'purchasing',
    personId: buyer.user.id,
    expectedVersion: 0,
    actorId: manager.user.id,
    reason: 'Fixed reviewer',
  };
  const audit = c.resolve(auditServiceToken),
    original = audit.record.bind(audit),
    recording = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (entry, tx) => {
        if (entry.action === 'vendorCommittee.assign')
          throw new Error('configuration audit failure');
        return original(entry, tx);
      });
  await expect(
    db.transaction((tx) => service.configuration.assign(input, tx)),
  ).rejects.toThrow('configuration audit failure');
  recording.mockRestore();
  expect(await service.configuration.assignments(1, db.connection())).toEqual(
    [],
  );
  const results = await Promise.allSettled(
    [1, 2].map(() =>
      db.transaction((tx) => service.configuration.assign(input, tx)),
    ),
  );
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  expect(
    await service.configuration.assignments(1, db.connection()),
  ).toMatchObject([{ personId: buyer.user.id, version: 1 }]);
  const configuration = await manager.fetch(
    '/vendorQualifications/configuration',
  );
  expect(configuration.status).toBe(200);
  expect(await configuration.json()).toMatchObject({
    data: { knownUsers: [{ id: buyer.user.id, name: buyer.user.name }] },
  });
});
