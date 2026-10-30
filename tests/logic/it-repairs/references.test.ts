// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createPlatformAppTest, write } from '../platform/helpers.js';
import { prepareRepairs } from './helpers.js';
import { grantToUser } from '../employees/helpers.js';
import { repairServiceToken } from '../../../server/providers/it-repairs/service.js';
import { purchaseServiceToken } from '../../../server/providers/purchases/service.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
const test = createPlatformAppTest();
test('owner-scoped references, transient history, cursor rollback and read-only receipt following', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    service = c.resolve(repairServiceToken),
    purchase = c.resolve(purchaseServiceToken),
    f = await prepareRepairs(testApp),
    authz = c.resolve(authorizationToken);
  await authz.permissionSets.assign({
    permissionSet: 'oa-it-repairs-handling-leader',
    subject: { type: 'user', id: f.leader.userId },
  });
  await grantToUser(
    testApp,
    'reference-purchase-read',
    [
      {
        resource: { type: 'composite', id: 'oa.purchase' },
        actions: [{ action: 'view' }],
      },
    ],
    f.leader.userId,
  );
  const a = await f.a.session(),
    l = await f.leader.session(),
    s = await f.admin.session();
  expect(
    (
      await s.fetch(
        '/itRepairs/groups/ref',
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: 0,
          title: 'Reference IT',
          leaderIds: [f.leader.userId],
          engineerIds: [],
          categories: ['device'],
          active: true,
        }),
      )
    ).status,
  ).toBe(200);
  const draft = {
    title: 'Reference repair',
    description: 'Synthetic only',
    category: 'device',
    impact: 'partial',
    location: 'Test',
    contact: '',
    occurredAt: null,
    assetId: null,
  };
  const saved = (
    await (
      await a.fetch(
        '/itRepairs/save',
        write('POST', { draft, requestKey: randomUUID() }),
      )
    ).json()
  ).data;
  let row = (
    await (
      await a.fetch(
        `/itRepairs/${saved.id}/submit`,
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: saved.version,
        }),
      )
    ).json()
  ).data;
  const sourceId = randomUUID(),
    foreignId = randomUUID(),
    at = new Date();
  for (const [id, applicantId] of [
    [sourceId, f.leader.userId],
    [foreignId, f.b.userId],
  ])
    await db.repository('purchaseRequests').createOne({
      values: {
        id,
        applicantId,
        createdById: applicantId,
        number: `PUR-${id}`,
        items: [],
        subject: 'office',
        estimatedCents: 100,
        expectedDate: '2026-11-01',
        purpose: 'SOURCE PRIVATE PURPOSE',
        quotes: [],
        status: 'approved',
        lifecycleVersion: 6,
        statusChangedAt: at,
        createdAt: at,
      },
    });
  expect(
    await purchase.referenceSummary(
      f.leader.userId,
      { read: true, create: false, update: false, delete: false },
      foreignId,
      db.connection(),
    ),
  ).toBeNull();
  expect(
    await purchase.referenceSummary(
      f.leader.userId,
      {
        read: { scope: true, fields: ['id', 'number'] },
        create: false,
        update: false,
        delete: false,
      },
      sourceId,
      db.connection(),
    ),
  ).toBeNull();
  expect(
    await purchase.referenceSummary(
      f.leader.userId,
      { read: true, create: false, update: false, delete: false },
      sourceId,
      db.connection(),
    ),
  ).toEqual({
    id: sourceId,
    number: `PUR-${sourceId}`,
    status: 'approved',
    version: 6,
  });
  const call = (source: string, key = randomUUID()) =>
    l.fetch(
      `/itRepairs/${row.id}/actions`,
      write('POST', {
        requestKey: key,
        expectedVersion: row.version,
        action: 'link',
        data: {
          kind: 'purchase',
          sourceId: source,
          reason: 'Approved owner reference',
        },
      }),
    );
  expect((await call(foreignId)).status).toBe(403);
  expect(
    await db
      .repository('itRepairLinks')
      .count({ filter: { repairId: row.id } }),
  ).toBe(0);
  const linked = await call(sourceId);
  expect(linked.status).toBe(200);
  row = (await linked.json()).data;
  for (const [version, status] of [
    [1, 'pending'],
    [2, 'rejected'],
    [3, 'approved'],
    [4, 'withdrawn'],
    [5, 'cancelled'],
    [6, 'approved'],
  ] as const)
    await db.repository('oaLifecycleTransitions').createOne({
      values: {
        lifecycle: 'oa.purchase',
        recordId: sourceId,
        transition: 'synthetic-owner-fixture',
        from: 'pending',
        to: status,
        actorId: f.leader.userId,
        requestKey: randomUUID(),
        input: { private: 'not projected' },
        at,
        version,
      },
    });
  const orderId = randomUUID();
  await db.repository('purchaseOrders').createOne({
    values: {
      id: orderId,
      purchaseId: sourceId,
      applicantId: f.leader.userId,
      departmentId: 'fixture',
      number: `ORDER-${orderId}`,
      items: [],
      actualCents: 100,
      vendor: { private: 'never projected' },
      account: {},
      status: 'received',
      version: 2,
      createdAt: at,
    },
  });
  const before = await db
      .repository('itRepairLinks')
      .findOne({ filter: { repairId: row.id } }),
    sourceBefore = await db
      .repository('purchaseRequests')
      .findOne({ filter: { id: sourceId } }),
    orderBefore = await db
      .repository('purchaseOrders')
      .findOne({ filter: { id: orderId } });
  const audit = c.resolve(auditServiceToken),
    record = audit.record.bind(audit),
    failure = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (input, tx) => {
        if (input.action === 'itRepair.sourceFollowUp')
          throw Error('Injected source follow-up failure');
        return record(input, tx);
      });
  await expect(service.tick()).rejects.toThrow(
    'Injected source follow-up failure',
  );
  failure.mockRestore();
  expect(
    await db
      .repository('itRepairLinks')
      .findOne({ filter: { repairId: row.id } }),
  ).toEqual(before);
  await service.tick();
  await service.tick();
  const events = await db
    .repository('itRepairEvents')
    .findMany({ filter: { repairId: row.id, type: 'sourceChange' } });
  expect(events).toHaveLength(7);
  expect(JSON.stringify(events)).not.toContain('SOURCE PRIVATE PURPOSE');
  expect(JSON.stringify(events)).not.toContain('never projected');
  expect(
    await db
      .repository('purchaseRequests')
      .findOne({ filter: { id: sourceId } }),
  ).toEqual(sourceBefore);
  expect(
    await db.repository('purchaseOrders').findOne({ filter: { id: orderId } }),
  ).toEqual(orderBefore);
  expect(
    (
      await db
        .repository('itRepairLinks')
        .findOne({ filter: { repairId: row.id } })
    )?.cursor,
  ).toBe(6);
}, 60000);
