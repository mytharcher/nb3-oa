// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { inAppNotificationStoreToken } from '@nocobase/app-plugin-notification-in-app/server';
import { createAssetRequestsAppTest } from '../asset-requests/helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
import { approvalNotificationServiceToken } from '../../../server/providers/approval-notifications/contract.js';
import { installAssetRequestPageAccess } from '../../../database/main/seeds/202610103413_asset_request_page_access.js';
const test = createAssetRequestsAppTest();

test('real center authorizes asset resource independently from lifecycle kind and projects no valuation', async ({
  testApp,
  request,
}) => {
  const c = testApp.application.container;
  const owner = await createEmployee(testApp, 'Asset center owner');
  const other = await createEmployee(testApp, 'Asset center outsider');
  const session = await owner.session();
  const category = (
    await c.resolve(dictionaryServiceToken).list('assetCategory')
  )[0]!.code;
  const create = await session.fetch(
    '/assetRequests',
    write('POST', {
      operation: 'use',
      category,
      assetIds: [],
      quantity: 1,
      purpose: 'Center private purpose',
      borrowDueDate: null,
      scrapReason: '',
      photos: [],
      requestId: 'center-create',
    }),
  );
  expect(create.status).toBe(201);
  const record = (await create.json()).data;
  const url = '/approvalCenter?kind=oa.assetRequest&view=mine&own=true';
  expect((await request(url)).status).toBe(401);
  const result = await session.fetch(url);
  expect(result.status).toBe(200);
  const center = await result.json();
  expect(center.meta.total).toBe(1);
  expect(center.data).toEqual([
    expect.objectContaining({
      id: record.id,
      kind: 'oa.assetRequest',
      amount: null,
      unit: null,
      applicant: { id: owner.userId, name: 'Asset center owner' },
    }),
  ]);
  expect(center.meta.kinds).toContain('oa.assetRequest');
  expect(center.data[0]).not.toHaveProperty('purpose');
  expect(center.data[0]).not.toHaveProperty('originalValueCents');
  const foreign = await (await other.session()).fetch(url);
  expect(foreign.status).toBe(200);
  expect((await foreign.json()).meta.total).toBe(0);
  const sets = c.resolve(authorizationToken).permissionSets;
  const original = (await sets.get('oa-asset-requests-employee'))!;
  expect(original).toBeTruthy();
  try {
    // Preserve page and write grants: only removing business view must revoke center access.
    await sets.update(original.key, {
      ...original,
      grants: original.grants.map((grant) =>
        grant.resource.type === 'composite' &&
        grant.resource.id === 'oa.assetRequests'
          ? {
              ...grant,
              actions: grant.actions.filter(
                (action) => action.action !== 'view',
              ),
            }
          : grant,
      ),
    });
    expect((await session.fetch(url)).status).toBe(403);
  } finally {
    await sets.update(original.key, original);
  }
  expect((await session.fetch(url)).status).toBe(200);
  const notifications = c.resolve(approvalNotificationServiceToken);
  await notifications.result({
    kind: 'oa.assetRequest',
    recordId: record.id,
    applicantId: owner.userId,
    state: 'approved',
    transitionId: 'asset-center-link-proof',
  });
  const inbox = c.resolve(inAppNotificationStoreToken);
  await expect
    .poll(async () => (await inbox.list({ userId: owner.userId })).length)
    .toBe(1);
  expect((await inbox.list({ userId: owner.userId }))[0]!.target).toEqual({
    type: 'route',
    path: `/approvals/mine/assetRequest/${record.id}`,
  });
});

test('page-only seed repeats without restoring administrator edits or rewriting assignments', async ({
  testApp,
}) => {
  const c = testApp.application.container;
  const db = c.resolve(databaseManagerToken);
  const sets = c.resolve(authorizationToken).permissionSets;
  const key = 'oa-asset-request-page';
  const initial = (await sets.get(key))!;
  expect(initial.grants).toEqual([
    {
      resource: { type: 'page', id: 'oa-asset-requests' },
      actions: [{ action: 'access' }],
    },
  ]);
  const assignments = await sets.listAssignments(key);
  expect(assignments).toHaveLength(1);
  await db.transaction((tx) => installAssetRequestPageAccess(tx.query));
  expect(await sets.get(key)).toEqual(initial);
  try {
    await sets.update(key, { ...initial, grants: [] });
    await db.transaction((tx) => installAssetRequestPageAccess(tx.query));
    await db.transaction((tx) => installAssetRequestPageAccess(tx.query));
    expect((await sets.get(key))!.grants).toEqual([]);
    expect(await sets.listAssignments(key)).toEqual(assignments);
  } finally {
    await sets.update(key, initial);
  }
});
