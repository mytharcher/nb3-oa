// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  authorizationToken,
  condition,
} from '@nocobase/app-plugin-authorization/server';
import { defineRecordAccess } from '@nocobase/authorization/core';
import {
  createEmployeesAppTest,
  createEmployee,
  createPerson,
  grantToUser,
} from '../employees/helpers.ts';
import { write } from '../platform/helpers.ts';
import { assetServiceToken } from '../../../server/providers/assets/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
const test = createEmployeesAppTest();
const grants = (action: string, scope = 'allRecords') => [
  {
    resource: { type: 'composite' as const, id: 'oa.assets' },
    actions: [
      {
        action,
        policy: { type: 'composite' as const, scopes: { assets: scope } },
      },
    ],
  },
];
test('asset HTTP honors real grants, own employee custody, paging and confidential value projection', async ({
  testApp,
  request,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    service = c.resolve(assetServiceToken),
    dictionary = c.resolve(dictionaryServiceToken);
  const own = await createEmployee(testApp, 'Asset holder'),
    other = await createEmployee(testApp, 'Other holder'),
    admin = await createPerson(testApp, 'Asset administrator'),
    outsider = await createPerson(testApp, 'No asset access');
  await grantToUser(
    testApp,
    `assets-own-${randomUUID()}`,
    grants('viewHeld'),
    own.userId,
  );
  await grantToUser(
    testApp,
    `assets-admin-${randomUUID()}`,
    grants('manage'),
    admin.userId,
  );
  const category = (await dictionary.list('assetCategory'))[0]!.code;
  const input = {
    code: `A-${randomUUID()}`,
    category,
    name: 'Precise value laptop',
    serialNumber: null,
    originalValueCents: 10001,
    reason: 'Receipt',
  };
  const session = await admin.session();
  expect((await request('/assets')).status).toBe(401);
  const outsiderSession = await outsider.session();
  const outsiderList = await outsiderSession.fetch('/assets');
  expect(outsiderList.status).toBe(200);
  expect((await outsiderList.json()).meta.total).toBe(0);
  expect(
    (await outsiderSession.fetch('/assets', write('POST', input))).status,
  ).toBe(403);
  const response = await session.fetch('/assets', write('POST', input));
  expect(response.status).toBe(201);
  const asset = (await response.json()).data;
  expect(asset).toMatchObject({
    originalValueCents: 10001,
    status: 'available',
    version: 1,
  });
  const noArchive = await createPerson(testApp, 'Unlinked asset reader');
  await grantToUser(
    testApp,
    `assets-unlinked-${randomUUID()}`,
    grants('viewHeld'),
    noArchive.userId,
  );
  const unlinked = await noArchive.session();
  expect((await (await unlinked.fetch('/assets')).json()).meta.total).toBe(0);
  expect((await unlinked.fetch(`/assets/${asset.id}`)).status).toBe(404);
  const foreign = await db.transaction((tx) =>
    service.create(
      { ...input, code: `A-${randomUUID()}`, actorId: admin.userId },
      tx,
    ),
  );
  await db.repository('assets').updateMany({
    filter: { id: asset.id },
    values: {
      status: 'borrowed',
      holderEmployeeId: own.employeeId,
      borrowDueDate: '2026-12-01',
    },
  });
  await db.repository('assets').updateMany({
    filter: { id: foreign.id },
    values: { status: 'assigned', holderEmployeeId: other.employeeId },
  });
  const held = await own.session(),
    list = await (await held.fetch('/assets?pageSize=1')).json();
  expect(list.meta).toEqual({ page: 1, pageSize: 1, total: 1 });
  expect(list.data).toHaveLength(1);
  expect(list.data[0]).toMatchObject({
    id: asset.id,
    holderEmployeeId: own.employeeId,
    status: 'borrowed',
  });
  expect(list.data[0]).not.toHaveProperty('originalValueCents');
  const detail = await (await held.fetch(`/assets/${asset.id}`)).json();
  expect(detail.data).not.toHaveProperty('originalValueCents');
  expect((await held.fetch(`/assets/${foreign.id}`)).status).toBe(404);
  expect(
    (
      await held.fetch(
        `/assets/${asset.id}`,
        write('PATCH', { name: 'Forbidden', version: 1, reason: 'Test' }),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await session.fetch(
        `/assets/${asset.id}`,
        write('PATCH', {
          status: 'available',
          version: 1,
          reason: 'False return',
        }),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await session.fetch(
        '/assets',
        write('POST', {
          ...input,
          code: `A-${randomUUID()}`,
          actorId: own.userId,
        }),
      )
    ).status,
  ).toBe(400);
  for (const amount of [1.5, -1, Number.MAX_SAFE_INTEGER + 1])
    expect(
      (
        await session.fetch(
          '/assets',
          write('POST', {
            ...input,
            code: `A-${randomUUID()}`,
            originalValueCents: amount,
          }),
        )
      ).status,
    ).toBe(400);
  expect(
    (
      await session.fetch(
        '/assets',
        write('POST', {
          ...input,
          code: `A-${randomUUID()}`,
          category: 'unknown',
        }),
      )
    ).status,
  ).toBe(400);
  expect((await session.fetch('/assets', write('POST', input))).status).toBe(
    409,
  );
  const update = await session.fetch(
    `/assets/${asset.id}`,
    write('PATCH', {
      name: 'Corrected',
      version: 1,
      reason: 'Label correction',
    }),
  );
  expect(update.status).toBe(200);
  expect((await update.json()).data).toMatchObject({
    name: 'Corrected',
    status: 'borrowed',
    holderEmployeeId: own.employeeId,
    borrowDueDate: '2026-12-01',
    version: 2,
  });
  expect(
    (
      await session.fetch(
        `/assets/${asset.id}`,
        write('PATCH', { name: 'Stale', version: 1, reason: 'Stale' }),
      )
    ).status,
  ).toBe(409);
  expect(
    (await session.fetch(`/assets/${asset.id}`, write('DELETE'))).status,
  ).toBe(404);
  const audit = c.resolve(auditServiceToken),
    fail = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('Audit unavailable'));
  try {
    expect(
      (
        await session.fetch(
          `/assets/${asset.id}`,
          write('PATCH', {
            name: 'Must roll back',
            version: 2,
            reason: 'Test audit failure',
          }),
        )
      ).status,
    ).toBe(500);
  } finally {
    fail.mockRestore();
  }
  expect(await service.get(asset.id, db.connection())).toMatchObject({
    name: 'Corrected',
    version: 2,
  });
});
test('scoped asset managers cannot read or change another register row', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    authz = c.resolve(authorizationToken),
    service = c.resolve(assetServiceToken);
  const person = await createPerson(testApp, 'Scoped register manager'),
    code = `A-${randomUUID()}`;
  const scope = `oa.assets.test-${randomUUID()}`;
  authz.recordAccess.define(
    defineRecordAccess(scope, (s) =>
      s
        .title('Test asset scope')
        .collections('assets')
        .resolver(async () => condition('code', '$eq', code)),
    ),
  );
  await grantToUser(
    testApp,
    `assets-scoped-${randomUUID()}`,
    grants('manage', scope),
    person.userId,
  );
  const input = {
    code,
    category: (
      await c.resolve(dictionaryServiceToken).list('assetCategory')
    )[0]!.code,
    name: 'Scoped asset',
    serialNumber: null,
    originalValueCents: 0,
    actorId: person.userId,
    reason: 'Test scoped grant',
  };
  const own = await db.transaction((tx) => service.create(input, tx)),
    foreign = await db.transaction((tx) =>
      service.create({ ...input, code: `A-${randomUUID()}` }, tx),
    );
  const session = await person.session();
  const response = await session.fetch('/assets');
  expect(response.status).toBe(200);
  const list = await response.json();
  expect(list.meta.total).toBe(1);
  expect(list.data[0].id).toBe(own.id);
  expect((await session.fetch(`/assets/${foreign.id}`)).status).toBe(404);
  expect(
    (
      await session.fetch(
        `/assets/${foreign.id}`,
        write('PATCH', { name: 'Unauthorized', version: 1, reason: 'Attempt' }),
      )
    ).status,
  ).toBe(404);
  expect(await service.get(foreign.id, db.connection())).toMatchObject({
    name: 'Scoped asset',
    version: 1,
  });
});
