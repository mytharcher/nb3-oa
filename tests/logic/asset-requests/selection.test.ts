// @vitest-environment node
import { expect, vi } from 'vitest';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken } from '@nocobase/db';
import { createAssetRequestsAppTest } from './helpers.js';
import { createEmployee, createPerson } from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { assetServiceToken } from '../../../server/providers/assets/contract.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
const test = createAssetRequestsAppTest();
test('selection HTTP restricts physical choices to current offered SDK task and frozen allocation', async ({
  testApp,
  request,
}) => {
  expect(
    (await request('/assetRequests/eligibleAssets?purpose=scrap')).status,
  ).toBe(401);
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  const owner = await createEmployee(testApp, 'HTTP asset owner'),
    head = await createEmployee(testApp, 'HTTP asset head'),
    handler = await createEmployee(testApp, 'HTTP asset handler'),
    outsider = await createEmployee(testApp, 'HTTP asset outsider');
  const department = await org.createDepartment(
    { title: 'HTTP asset team', managerId: head.userId },
    { actorId: head.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: head.userId },
  );
  await org.addDutyRoleMember('admin', handler.userId, {
    actorId: head.userId,
  });
  const assets = c.resolve(assetServiceToken),
    category = (
      await c.resolve(dictionaryServiceToken).list('assetCategory')
    )[0]!.code;
  const asset = await db.transaction((tx) =>
    assets.create(
      {
        code: 'HTTP-UNIT',
        category,
        name: 'HTTP laptop',
        serialNumber: 'HTTP-REAL-SERIAL',
        originalValueCents: 876543,
        actorId: handler.userId,
        reason: 'Received',
      },
      tx,
    ),
  );
  const extra = await db.transaction((tx) =>
    assets.create(
      {
        code: 'EXTRA-UNIT',
        category,
        name: 'Unallocated laptop',
        serialNumber: 'EXTRA-SERIAL',
        originalValueCents: 999999,
        actorId: handler.userId,
        reason: 'Received',
      },
      tx,
    ),
  );
  const ownerSession = await owner.session(),
    headSession = await head.session(),
    handlerSession = await handler.session(),
    outsiderSession = await outsider.session();
  const options = await ownerSession.fetch('/assetRequests/options');
  expect(options.status).toBe(200);
  expect((await options.json()).data).toMatchObject({
    eligible: true,
    eligibleReason: null,
  });
  expect(
    (await ownerSession.fetch('/assetRequests/eligibleAssets?purpose=issue'))
      .status,
  ).toBe(400);
  const scrap = await ownerSession.fetch(
    '/assetRequests/eligibleAssets?purpose=scrap',
  );
  expect(scrap.status).toBe(200);
  expect((await scrap.json()).data).toEqual([]);
  const adminScrap = await handlerSession.fetch(
    '/assetRequests/eligibleAssets?purpose=scrap',
  );
  expect(adminScrap.status).toBe(200);
  expect(
    (await adminScrap.json()).data.map((row: { id: string }) => row.id).sort(),
  ).toEqual([asset.id, extra.id].sort());
  const proposal = {
    operation: 'use',
    category,
    assetIds: [asset.id],
    quantity: 1,
    purpose: 'Actual work',
    borrowDueDate: null,
    scrapReason: '',
    photos: [],
    requestId: 'http-create',
  };
  const bad = await ownerSession.fetch(
    '/assetRequests',
    write('POST', { ...proposal, originalValueCents: 1 }),
  );
  expect(bad.status).toBe(400);
  const response = await ownerSession.fetch(
    '/assetRequests',
    write('POST', proposal),
  );
  expect(response.status).toBe(201);
  const record = (await response.json()).data,
    id = record.id;
  expect(
    (
      await (
        await ownerSession.fetch('/assetRequests', write('POST', proposal))
      ).json()
    ).data.id,
  ).toBe(id);
  expect((await outsiderSession.fetch(`/assetRequests/${id}`)).status).toBe(
    404,
  );
  expect((await ownerSession.fetch(`/assetRequests/${id}/value`)).status).toBe(
    403,
  );
  const { assetRequestServiceToken } =
    await import('../../../server/providers/asset-requests/contract.js');
  expect(
    await c.resolve(assetRequestServiceToken).readableIds(owner.userId),
  ).toContain(id);
  const submitted = await ownerSession.fetch(
    `/assetRequests/${id}/lifecycle`,
    write('POST', {
      action: 'submit',
      lifecycleVersion: record.lifecycleVersion,
      requestId: 'http-submit',
    }),
  );
  expect(submitted.status).toBe(200);
  const detail = (await submitted.json()).data;
  expect(
    await db.transaction((tx) => assets.unreservedIds([asset.id], tx)),
  ).toEqual([]);
  const reservedScrap = await handlerSession.fetch(
    '/assetRequests/eligibleAssets?purpose=scrap',
  );
  expect(reservedScrap.status).toBe(200);
  expect(
    (await reservedScrap.json()).data.map((row: { id: string }) => row.id),
  ).toEqual([extra.id]);
  expect(
    detail.record.allocation.map((unit: { id: string }) => unit.id),
  ).toEqual([asset.id]);
  expect(detail.record).not.toHaveProperty('originalValueCents');
  expect(JSON.stringify(detail)).not.toContain('"originalValueCents":');
  expect(
    (await (await handlerSession.fetch(`/assetRequests/${id}/value`)).json())
      .data.originalValueCents,
  ).toBe(876543);
  async function action(
    session: typeof ownerSession,
    name: string,
    requestId: string,
    input?: unknown,
  ) {
    const current = (await (await session.fetch(`/assetRequests/${id}`)).json())
      .data;
    const group = current.taskActions.find(
      (item: { actions: { name: string }[] }) =>
        item.actions.some((offer) => offer.name === name),
    );
    expect(group).toBeTruthy();
    const result = await session.fetch(
      `/assetRequests/${id}/action`,
      write('POST', {
        target: { taskId: group.task.id },
        action: name,
        contentHash: current.runs.at(-1).run.contentHash,
        requestId,
        ...(input ? { input } : {}),
      }),
    );
    expect(result.status).toBe(200);
    return (await result.json()).data;
  }
  expect(
    (await action(headSession, 'approve', 'http-head')).record.status,
  ).toBe('issuing');
  const before = (
    await (await handlerSession.fetch(`/assetRequests/${id}`)).json()
  ).data;
  const taskId = before.taskActions.find(
    (group: { actions: { name: string }[] }) =>
      group.actions.some((a) => a.name === 'claim'),
  ).task.id;
  const picker = `/assetRequests/eligibleAssets?purpose=issue&requestId=${id}&targetId=${taskId}`;
  expect((await handlerSession.fetch(picker)).status).toBe(403);
  await action(handlerSession, 'claim', 'http-claim');
  expect((await ownerSession.fetch(picker)).status).toBe(403);
  expect((await outsiderSession.fetch(picker)).status).toBe(403);
  expect(
    (
      await handlerSession.fetch(
        `/assetRequests/eligibleAssets?purpose=issue&requestId=${id}&targetId=invalid-target`,
      )
    ).status,
  ).toBe(403);
  const eligible = await handlerSession.fetch(picker);
  expect(eligible.status).toBe(200);
  const selected = await eligible.json();
  expect(selected.meta.total).toBe(1);
  expect(selected.data).toEqual([
    expect.objectContaining({ id: asset.id, serialNumber: 'HTTP-REAL-SERIAL' }),
  ]);
  expect(Object.keys(selected.data[0]).sort()).toEqual([
    'category',
    'code',
    'id',
    'name',
    'serialNumber',
    'status',
    'version',
  ]);
  const units = [{ assetId: asset.id, serialNumber: 'HTTP-REAL-SERIAL' }];
  expect(
    (await action(handlerSession, 'complete', 'http-issue', { units })).record
      .status,
  ).toBe('issued');
  const heldForScrap = await ownerSession.fetch(
    '/assetRequests/eligibleAssets?purpose=scrap',
  );
  expect(heldForScrap.status).toBe(200);
  expect(
    (await heldForScrap.json()).data.map((row: { id: string }) => row.id),
  ).toEqual([asset.id]);
  const foreignHeld = await outsiderSession.fetch(
    '/assetRequests/eligibleAssets?purpose=scrap',
  );
  expect(foreignHeld.status).toBe(200);
  expect((await foreignHeld.json()).data).toEqual([]);
  const receiveUrl = `/assetRequests/eligibleAssets?purpose=receive&mode=returnIssued&requestId=${id}`;
  expect((await ownerSession.fetch(receiveUrl)).status).toBe(403);
  const receive = await handlerSession.fetch(receiveUrl);
  expect(receive.status).toBe(200);
  expect(
    (await receive.json()).data.map((row: { id: string }) => row.id),
  ).toEqual([asset.id]);
  await org.removeDutyRoleMember('admin', handler.userId, {
    actorId: head.userId,
  });
  expect((await handlerSession.fetch(receiveUrl)).status).toBe(403);
  await org.addDutyRoleMember('admin', handler.userId, {
    actorId: head.userId,
  });
  await expect(
    db.transaction((tx) => assets.assertAllReturned(owner.employeeId, tx)),
  ).rejects.toMatchObject({ code: 'ASSET_DEPARTURE_NOT_CLEARED' });
  expect(
    (
      await ownerSession.fetch(
        `/assetRequests/${id}/return`,
        write('POST', {
          units,
          reason: 'Received',
          requestId: 'denied-return',
        }),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await handlerSession.fetch(
        `/assetRequests/${id}/return`,
        write('POST', {
          units,
          reason: 'Physical return checked',
          requestId: 'http-return',
        }),
      )
    ).status,
  ).toBe(200);
  await expect(
    db.transaction((tx) => assets.assertAllReturned(owner.employeeId, tx)),
  ).resolves.toBeUndefined();
});

test('HTTP list searches and sorts the complete owned range before pagination', async ({
  testApp,
}) => {
  const c = testApp.application.container;
  const owner = await createEmployee(testApp, 'Paging owner');
  const outsider = await createEmployee(testApp, 'Paging outsider');
  const session = await owner.session();
  const category = (
    await c.resolve(dictionaryServiceToken).list('assetCategory')
  )[0]!.code;
  for (let index = 1; index <= 12; index++) {
    const result = await session.fetch(
      '/assetRequests',
      write('POST', {
        operation: 'use',
        category,
        assetIds: [],
        quantity: index,
        purpose: index === 12 ? 'Unique last page match' : `Ordinary ${index}`,
        borrowDueDate: null,
        scrapReason: '',
        photos: [],
        requestId: `paging-${index}`,
      }),
    );
    expect(result.status).toBe(201);
  }
  const sorted = await session.fetch(
    '/assetRequests?page=2&pageSize=5&sortBy=quantity&sortOrder=desc',
  );
  expect(sorted.status).toBe(200);
  const sortedBody = await sorted.json();
  expect(sortedBody.meta).toMatchObject({ total: 12, page: 2, pageSize: 5 });
  expect(
    sortedBody.data.map((row: { quantity: number }) => row.quantity),
  ).toEqual([7, 6, 5, 4, 3]);
  const search = await session.fetch('/assetRequests?search=Unique&pageSize=5');
  expect(search.status).toBe(200);
  const matches = await search.json();
  expect(matches.meta.total).toBe(1);
  expect(matches.data[0].quantity).toBe(12);
  const other = await (
    await outsider.session()
  ).fetch('/assetRequests?search=Unique');
  expect(other.status).toBe(200);
  expect((await other.json()).meta.total).toBe(0);
  expect(
    (await session.fetch('/assetRequests?sortBy=originalValueCents')).status,
  ).toBe(400);
  // Preserve the actual authorization decision while restricting its projected fields.
  const authz = c.resolve(authorizationToken);
  const nativeFor = authz.for.bind(authz);
  const narrow = vi.spyOn(authz, 'for').mockImplementation((identity) => {
    const context = nativeFor(identity);
    return {
      ...context,
      authorize: async (check) => {
        const decision = await context.authorize(check);
        if (
          check.resource.id !== 'oa.assetRequests' ||
          check.action !== 'view' ||
          !decision.conditions?.database?.assetRequests
        )
          return decision;
        return {
          ...decision,
          conditions: {
            ...decision.conditions,
            database: {
              ...decision.conditions.database,
              assetRequests: {
                ...decision.conditions.database.assetRequests,
                read: {
                  scope: true,
                  fields: [
                    'id',
                    'updatedAt',
                    'status',
                    'applicantId',
                    'createdById',
                  ],
                },
              },
            },
          },
        };
      },
    };
  });
  try {
    expect((await session.fetch('/assetRequests?search=Unique')).status).toBe(
      403,
    );
    expect((await session.fetch('/assetRequests?sortBy=quantity')).status).toBe(
      403,
    );
    expect((await session.fetch('/assetRequests?operation=use')).status).toBe(
      403,
    );
    const projected = await session.fetch('/assetRequests');
    expect(projected.status).toBe(200);
    expect((await projected.json()).data[0]).not.toHaveProperty('purpose');
  } finally {
    narrow.mockRestore();
  }
});

test('options reports missing employee archive without granting source selection', async ({
  testApp,
}) => {
  const person = await createPerson(testApp, 'No archive picker');
  const session = await person.session();
  const options = await session.fetch('/assetRequests/options');
  expect(options.status).toBe(200);
  expect((await options.json()).data).toMatchObject({
    eligible: false,
    eligibleReason: 'employeeMissing',
  });
  expect(
    (await session.fetch('/assetRequests/eligibleAssets?purpose=scrap')).status,
  ).toBe(403);
});
