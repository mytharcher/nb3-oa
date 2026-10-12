// @vitest-environment node
import type { HeadcountBalance } from '../../../server/providers/headcounts/contract.js';
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { test } from './helpers.js';
import { createEmployee, grantToUser } from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/index.js';
import { installHeadcountPermissions } from '../../../database/main/seeds/202610103511_headcounts_permissions.js';
import { write } from '../platform/helpers.js';
import {
  findUndeclaredApiRoutes,
  findApiDocumentSchemaProblems,
  apiDocsToken,
} from '@nocobase/app-server/router';
test('default HR and department-head policies enforce scope, fields, audit, authentication and seed repeat preservation', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    authz = c.resolve(authorizationToken);
  await db.transaction((tx) => installHeadcountPermissions(tx.query));
  const hr = await createEmployee(testApp, 'Capacity HR'),
    head = await createEmployee(testApp, 'Quota head'),
    ordinary = await createEmployee(testApp, 'Ordinary quota viewer');
  await org.addDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
  const own = await org.createDepartment(
      { title: 'Own quota', managerId: head.userId },
      { actorId: hr.userId },
    ),
    outside = await org.createDepartment(
      { title: 'Other quota' },
      { actorId: hr.userId },
    ),
    position = await org.createPosition(
      { code: randomUUID(), title: 'Actual position' },
      { actorId: hr.userId },
    );
  const hs = await hr.session(),
    ds = await head.session(),
    os = await ordinary.session();
  const payload = {
    departmentId: own.id,
    positionId: position.id,
    year: 2026,
    limit: 2,
    requestKey: 'create-own',
    reason: 'Yearly quota',
  };
  expect((await testApp.request('/headcounts')).status).toBe(401);
  expect((await os.fetch('/headcounts')).status).toBe(403);
  expect((await ds.fetch('/headcounts', write('POST', payload))).status).toBe(
    403,
  );
  expect(
    (await hs.fetch('/headcounts', write('POST', { ...payload, used: 1 })))
      .status,
  ).toBe(400);
  const response = await hs.fetch('/headcounts', write('POST', payload));
  expect(response.status).toBe(201);
  let a = ((await response.json()) as { data: HeadcountBalance }).data;
  expect(a).toMatchObject({ initialized: false, used: 0, limit: 2 });
  const second = await hs.fetch(
    '/headcounts',
    write('POST', {
      ...payload,
      departmentId: outside.id,
      requestKey: 'create-other',
    }),
  );
  expect(second.status).toBe(201);
  const b = ((await second.json()) as { data: HeadcountBalance }).data;
  const list = await ds.fetch('/headcounts');
  expect(list.status).toBe(200);
  const listed = (await list.json()) as {
    data: HeadcountBalance[];
    meta: { total: number };
  };
  expect(listed.meta.total).toBe(1);
  expect(listed.data.map((v: { id: string }) => v.id)).toEqual([a.id]);
  expect((await ds.fetch(`/headcounts/${b.id}`)).status).toBe(404);
  expect((await ds.fetch(`/headcounts/${a.id}/journal`)).status).toBe(403);
  const initialized = await hs.fetch(
    `/headcounts/${a.id}/reconcile`,
    write('POST', {
      expectedVersion: a.version,
      employeeIds: [],
      requestKey: 'initialize',
      reason: 'Complete empty actual roster',
    }),
  );
  expect(initialized.status).toBe(200);
  a = ((await initialized.json()) as { data: HeadcountBalance }).data;
  const adjust = {
    expectedVersion: a.version,
    limit: 3,
    requestKey: 'adjust',
    reason: 'Approved capacity change',
  };
  expect(
    (await hs.fetch(`/headcounts/${a.id}`, write('PATCH', adjust))).status,
  ).toBe(200);
  expect(
    (await hs.fetch(`/headcounts/${a.id}`, write('PATCH', adjust))).status,
  ).toBe(200);
  expect(
    (
      await hs.fetch(
        `/headcounts/${a.id}`,
        write('PATCH', { ...adjust, limit: 4 }),
      )
    ).status,
  ).toBe(409);
  const ledger = await hs.fetch(`/headcounts/${a.id}/journal`);
  expect(ledger.status).toBe(200);
  const rows = (
    (await ledger.json()) as { data: { actor: { name: string } }[] }
  ).data;
  expect(rows).toHaveLength(3);
  expect(
    rows.every(
      (v: { actor: { name: string } }) => v.actor.name === 'Capacity HR',
    ),
  ).toBe(true);
  const scopedKey = 'headcounts-scoped-management';
  await grantToUser(
    testApp,
    scopedKey,
    [
      {
        resource: { type: 'composite', id: 'oa.headcounts' },
        actions: [
          {
            action: 'manage',
            policy: {
              type: 'composite',
              scopes: { headcountAccounts: 'oa.headcounts.headedDepartments' },
            },
          },
        ],
      },
    ],
    head.userId,
  );
  expect(
    (
      await ds.fetch(
        '/headcounts',
        write('POST', {
          ...payload,
          year: 2027,
          departmentId: outside.id,
          requestKey: 'forbidden-other-year',
        }),
      )
    ).status,
  ).toBe(403);
  expect(
    await db
      .repository('headcountAccounts')
      .count({ filter: { departmentId: outside.id, year: 2027 } }),
  ).toBe(0);
  expect(
    (
      await ds.fetch(
        `/headcounts/${b.id}`,
        write('PATCH', {
          expectedVersion: b.version,
          limit: 5,
          requestKey: 'outside-write',
          reason: 'Scoped forbidden',
        }),
      )
    ).status,
  ).toBe(404);
  await expect(
    c.resolve(headcountServiceToken).balance(a.id, db.connection(), {
      read: { fields: ['id'], scope: true },
      create: false,
      update: false,
      delete: false,
    }),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_FIELD_ACCESS_DENIED' });
  expect(
    (
      await ds.fetch(
        '/headcounts',
        write('POST', {
          ...payload,
          departmentId: outside.id,
          requestKey: 'existing-outside-probe',
        }),
      )
    ).status,
  ).toBe(403);
  const ownCreate = { ...payload, year: 2028, requestKey: 'scoped-own-create' };
  expect((await ds.fetch('/headcounts', write('POST', ownCreate))).status).toBe(
    201,
  );
  await org.updateDepartment(
    own.id,
    { managerId: ordinary.userId },
    { actorId: hr.userId },
  );
  expect((await ds.fetch('/headcounts', write('POST', ownCreate))).status).toBe(
    403,
  );
  const sets = db.repository('authorizationPermissionSets'),
    before = await sets.findOne({ filter: { key: 'oa-headcounts-hr' } });
  await db.transaction((tx) => installHeadcountPermissions(tx.query));
  expect(await sets.findOne({ filter: { key: 'oa-headcounts-hr' } })).toEqual(
    before,
  );
  await sets.updateMany({
    filter: { key: 'oa-headcounts-hr' },
    values: { grants: '[]' },
  });
  await db.transaction((tx) => installHeadcountPermissions(tx.query));
  expect(
    (await sets.findOne({ filter: { key: 'oa-headcounts-hr' } }))!.grants,
  ).toBe('[]');
  expect(
    await db
      .repository('authorizationPermissionSetAssignments')
      .count({ filter: { permissionSetKey: 'oa-headcounts-hr' } }),
  ).toBe(1);
  const document = await c.resolve(apiDocsToken).getDocument();
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  expect(document.paths?.['/api/headcounts']?.get?.operationId).toBe(
    'listHeadcounts',
  );
  expect(
    document.paths?.['/api/headcounts/{accountId}/reconcile']?.post
      ?.operationId,
  ).toBe('reconcileHeadcountAccount');
  // Provider owns every contribution; actual API documentation sees its declarations.
  expect(
    findUndeclaredApiRoutes(testApp.application).filter((v) =>
      String(v.path).includes('headcounts'),
    ),
  ).toEqual([]);
  expect(
    (await authz.permissionSets.get('oa-headcounts-head'))!.grants,
  ).toHaveLength(1);
});
