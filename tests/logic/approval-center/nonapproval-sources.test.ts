// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createWorkItemAppTest } from '../work-items/helpers.js';
import {
  createEmployee,
  grantToUser,
  composite,
} from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
const test = createWorkItemAppTest();
import { prepareNonApprovalCenter } from './nonapproval-helpers.js';
test('main center intersects current owner duties, ordinary view and action grants; receipts disappear on completion/revoke', async ({
  testApp,
}) => {
  const f = await prepareNonApprovalCenter(testApp),
    session = await f.reader.session();
  const load = async (kind: string, extra = '') => {
    const response = await session.fetch(
      `/approvalCenter?kind=${kind}${extra}`,
    );
    expect(response.status).toBe(200);
    return response.json();
  };
  const workRows = await load('oa.workItem');
  expect(workRows.meta.total).toBe(1);
  expect(workRows.data[0]).toMatchObject({
    id: f.item.id,
    title: 'Center ordinary duty',
    applicant: { id: f.creator.userId },
    amount: null,
    unit: null,
  });
  expect(workRows.data[0]).not.toHaveProperty('description');
  expect(workRows.data[0]).not.toHaveProperty('result');
  await expect(
    f.work.listForCenter(f.reader.userId, f.db.connection(), {
      view: {
        read: { scope: true, fields: ['id'] },
        create: false,
        update: false,
        delete: false,
      },
      actions: {},
    }),
  ).rejects.toMatchObject({
    code: expect.stringMatching(/ACCESS_DENIED|FIELD_READ_FORBIDDEN/),
  });
  await expect(
    f.announcements.listForCenter(f.reader.userId, f.db.connection(), {
      view: {
        read: { scope: true, fields: ['id'] },
        create: false,
        update: false,
        delete: false,
      },
      confirm: { read: true, create: false, update: false, delete: false },
    }),
  ).rejects.toMatchObject({
    code: expect.stringMatching(/ACCESS_DENIED|FIELD_READ_FORBIDDEN/),
  });

  expect((await load('oa.workItem', '&view=done')).meta.total).toBe(0);
  expect((await load('oa.workItem', '&search=Private')).meta.total).toBe(0);
  const receipts = await load('oa.announcementReceipt');
  expect(receipts.meta.total).toBe(1);
  expect(receipts.data[0]).toMatchObject({
    id: f.published.id,
    title: 'Center personal receipt',
    status: 'pending',
  });
  expect(receipts.data[0]).not.toHaveProperty('body');
  expect(receipts.data[0]).not.toHaveProperty('audience');
  await f.db.transaction((tx) =>
    f.announcements.confirm(
      { actorId: f.reader.userId, requestId: randomUUID(), id: f.published.id },
      tx,
    ),
  );
  expect((await load('oa.announcementReceipt')).meta.total).toBe(0);
  await f.db.transaction((tx) =>
    f.work.act(
      {
        actorId: f.reader.userId,
        requestId: randomUUID(),
        id: f.item.id,
        expectedVersion: f.item.version,
        action: 'complete',
        result: 'Real completion',
      },
      tx,
    ),
  );
  expect((await load('oa.workItem')).meta.total).toBe(0);
  const authz = testApp.application.container.resolve(authorizationToken);
  await authz.permissionSets.update(f.permissionKey, {
    ...(await authz.permissionSets.get(f.permissionKey))!,
    grants: [],
  });
  // Automatic employee grants may retain ordinary view, but no withdrawn completion grants manufacture pending duties.
  expect((await load('oa.workItem')).meta.total).toBe(0);
});

test('pending source permissions change before completion; announcement revoke and non-recipient filter; pool and confirmation duty remain owner facts', async ({
  testApp,
}) => {
  const f = await prepareNonApprovalCenter(testApp),
    c = testApp.application.container;
  const authz = c.resolve(authorizationToken);
  for (const key of ['oa-work-items-employee', 'oa-announcements-employee']) {
    const original = (await authz.permissionSets.get(key))!;
    await authz.permissionSets.update(key, { ...original, grants: [] });
  }
  const set = (await authz.permissionSets.get(f.permissionKey))!,
    rs = await f.reader.session();
  const get = async (kind: string) => {
    const response = await rs.fetch(`/approvalCenter?kind=${kind}`);
    return { status: response.status, ...(await response.json()) };
  };
  expect((await get('oa.workItem')).meta.total).toBe(1);
  await authz.permissionSets.update(set.key, {
    ...set,
    grants: [
      composite('oa.workItems', { view: { workItems: 'allRecords' } }),
      composite('oa.announcements', {
        view: { announcements: 'oa.announcementsReadable' },
      }),
    ],
  });
  expect((await get('oa.workItem')).meta.total).toBe(0);
  expect((await get('oa.announcementReceipt')).meta.total).toBe(0);
  await authz.permissionSets.update(set.key, set);
  expect((await get('oa.workItem')).meta.total).toBe(1);
  expect((await get('oa.announcementReceipt')).meta.total).toBe(1);
  await authz.permissionSets.update(set.key, {
    ...set,
    grants: [
      composite('oa.workItems', {
        view: { workItems: 'oa.workItemsOwned' },
        complete: { workItems: 'oa.workItemsReadable' },
      }),
    ],
  });
  expect((await get('oa.workItem')).meta.total).toBe(0);
  expect((await get('oa.announcementReceipt')).status).toBe(403);
  await authz.permissionSets.update(set.key, set);
  const late = await createEmployee(
    testApp,
    'Late employee outside frozen notice audience',
  );
  await grantToUser(
    testApp,
    'center-late-reader',
    [
      composite('oa.announcements', {
        view: { announcements: 'oa.announcementsReadable' },
        confirm: { announcements: 'oa.announcementsReadable' },
      }),
    ],
    late.userId,
  );
  expect(
    (
      await (
        await (
          await late.session()
        ).fetch('/approvalCenter?kind=oa.announcementReceipt')
      ).json()
    ).meta.total,
  ).toBe(0);
  await f.db.transaction((tx) =>
    f.announcements.act(
      {
        actorId: f.creator.userId,
        requestId: randomUUID(),
        id: f.published.id,
        expectedVersion: f.published.version,
        action: 'revoke',
      },
      tx,
    ),
  );
  expect((await get('oa.announcementReceipt')).meta.total).toBe(0);
  const completed = await f.db.transaction((tx) =>
    f.work.act(
      {
        actorId: f.reader.userId,
        requestId: randomUUID(),
        id: f.item.id,
        expectedVersion: f.item.version,
        action: 'complete',
        result: 'Completed by real recipient',
      },
      tx,
    ),
  );
  await grantToUser(
    testApp,
    'center-confirmation-owner',
    [
      composite('oa.workItems', {
        view: { workItems: 'allRecords' },
        confirm: { workItems: 'oa.workItemsConfirmationOwned' },
      }),
    ],
    f.creator.userId,
  );
  const cs = await f.creator.session();
  expect(
    (await (await cs.fetch('/approvalCenter?kind=oa.workItem')).json()).data[0]
      .status,
  ).toBe('awaitingConfirmation');
  await f.db.transaction((tx) =>
    f.work.act(
      {
        actorId: f.creator.userId,
        requestId: randomUUID(),
        id: completed.id,
        expectedVersion: completed.version,
        action: 'confirm',
      },
      tx,
    ),
  );
  expect(
    (await (await cs.fetch('/approvalCenter?kind=oa.workItem')).json()).meta
      .total,
  ).toBe(0);
  const org = c.resolve(organizationServiceToken);
  await org.addDutyRoleMember('admin', f.reader.userId, {
    actorId: f.creator.userId,
  });
  const poolDraft = await f.db.transaction((tx) =>
    f.work.save(
      {
        actorId: f.creator.userId,
        requestId: randomUUID(),
        title: 'Pool source',
        description: 'Real owner pool',
        targetUserId: null,
        dutyRoleCode: 'admin',
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        requiresConfirmation: false,
        attachments: [],
      },
      tx,
    ),
  );
  const pool = await f.db.transaction((tx) =>
    f.work.act(
      {
        actorId: f.creator.userId,
        requestId: randomUUID(),
        id: poolDraft.id,
        expectedVersion: poolDraft.version,
        action: 'dispatch',
      },
      tx,
    ),
  );
  await authz.permissionSets.update(set.key, {
    ...set,
    grants: [
      composite('oa.workItems', {
        view: { workItems: 'allRecords' },
        claim: { workItems: 'oa.workItemsReadable' },
        complete: { workItems: 'oa.workItemsReadable' },
      }),
    ],
  });
  expect((await get('oa.workItem')).data[0].id).toBe(pool.id);
  await org.removeDutyRoleMember('admin', f.reader.userId, {
    actorId: f.creator.userId,
  });
  expect((await get('oa.workItem')).meta.total).toBe(0);
});
