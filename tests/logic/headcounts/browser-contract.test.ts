// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { test } from './helpers.js';
import { createEmployee, grantToUser } from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/index.js';
import { write } from '../platform/helpers.js';

test('scoped creation options and complete roster preview require independent fields and never initialize on GET', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    service = c.resolve(headcountServiceToken);
  const hr = await createEmployee(testApp, 'Roster HR'),
    head = await createEmployee(testApp, 'Roster head');
  await org.addDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
  const department = await org.createDepartment(
    { title: 'Browser roster', managerId: head.userId },
    { actorId: hr.userId },
  );
  const other = await org.createDepartment(
    { title: 'Outside options' },
    { actorId: hr.userId },
  );
  const position = await org.createPosition(
    { code: randomUUID(), title: 'Roster position' },
    { actorId: hr.userId },
  );
  const people = [];
  for (const status of ['regular', 'probation', 'leaving'] as const) {
    const p = await createEmployee(testApp, `Roster ${status}`, {
      positionId: position.id,
      status,
    });
    await org.addMember(
      { departmentId: department.id, userId: p.userId, primary: true },
      { actorId: hr.userId },
    );
    people.push(p);
  }
  const hs = await hr.session(),
    ds = await head.session();
  expect((await ds.fetch('/headcounts/createOptions')).status).toBe(403);
  const options = await hs.fetch('/headcounts/createOptions?year=2026&limit=5');
  expect(options.status).toBe(200);
  expect((await options.json()).data.targets).toContainEqual({
    department: { id: department.id, name: department.title },
    position: { id: position.id, name: position.title },
  });
  const create = await hs.fetch(
    '/headcounts',
    write('POST', {
      departmentId: department.id,
      positionId: position.id,
      year: 2026,
      limit: 5,
      reason: 'Browser fixture',
      requestKey: randomUUID(),
    }),
  );
  expect(create.status).toBe(201);
  const a = (await create.json()).data;
  expect(a.department.name).toBe(department.title);
  expect(a.position.name).toBe(position.title);
  const response = await hs.fetch(`/headcounts/${a.id}/reconciliationPreview`);
  expect(response.status).toBe(200);
  const preview = (await response.json()).data;
  expect(preview.initialized).toBe(false);
  expect(preview.employees.map((e: { id: string }) => e.id).sort()).toEqual(
    people.map((p) => p.employeeId).sort(),
  );
  expect(
    preview.employees.every(
      (e: object) => Object.keys(e).sort().join(',') === 'id,name,status',
    ),
  ).toBe(true);
  expect((await service.balance(a.id, db.connection()))?.initialized).toBe(
    false,
  );
  const incomplete = await hs.fetch(
    `/headcounts/${a.id}/reconcile`,
    write('POST', {
      employeeIds: preview.employees.slice(1).map((e: { id: string }) => e.id),
      expectedVersion: preview.version,
      reason: 'Incomplete',
      requestKey: randomUUID(),
    }),
  );
  expect(incomplete.status).toBe(400);
  expect((await incomplete.json()).error.reason).toBe(
    'HEADCOUNT_INCOMPLETE_ROSTER',
  );
  await grantToUser(
    testApp,
    'headcounts-browser-scope',
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
  const scoped = (
    await (await ds.fetch('/headcounts/createOptions?year=2027&limit=5')).json()
  ).data.targets;
  expect(
    scoped.some(
      (t: { department: { id: string } }) => t.department.id === department.id,
    ),
  ).toBe(true);
  expect(
    scoped.some(
      (t: { department: { id: string } }) => t.department.id === other.id,
    ),
  ).toBe(false);
  // Department heads already have employee read access for their department.
  expect(
    (await ds.fetch(`/headcounts/${a.id}/reconciliationPreview`)).status,
  ).toBe(200);
  const limited = await createEmployee(testApp, 'Capacity only');
  await grantToUser(
    testApp,
    'headcounts-no-employee-read',
    [
      {
        resource: { type: 'composite', id: 'oa.headcounts' },
        actions: ['manage'],
      },
    ],
    limited.userId,
  );
  const ls = await limited.session();
  expect(
    (await ls.fetch(`/headcounts/${a.id}/reconciliationPreview`)).status,
  ).toBe(403);
  const initialized = await hs.fetch(
    `/headcounts/${a.id}/reconcile`,
    write('POST', {
      employeeIds: preview.employees.map((e: { id: string }) => e.id),
      expectedVersion: preview.version,
      reason: 'Complete roster',
      requestKey: randomUUID(),
    }),
  );
  expect(initialized.status).toBe(200);
  expect((await initialized.json()).data.used).toBe(3);
});

test('derived capacity sorts the complete authorized set across batches and pages', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    service = c.resolve(headcountServiceToken);
  const actor = await createEmployee(testApp, 'Sort owner');
  const d = await org.createDepartment(
      { title: 'Sorted accounts', managerId: actor.userId },
      { actorId: actor.userId },
    ),
    p = await org.createPosition(
      { code: randomUUID(), title: 'Sort position' },
      { actorId: actor.userId },
    );
  const ids = await db.transaction(async (tx) => {
    const ids = [];
    for (let n = 0; n < 132; n++) {
      const a = await service.create(
        {
          departmentId: d.id,
          positionId: p.id,
          year: 2000 + n,
          limit: n + 1,
          actorId: actor.userId,
          reason: 'Global sorting fixture',
          requestKey: randomUUID(),
        },
        tx,
      );
      ids.push(a.id);
    }
    return ids;
  });
  const policy = { read: true, create: false, update: false, delete: false };
  const first = await service.list(
    {
      page: 1,
      pageSize: 10,
      departmentId: d.id,
      orderBy: 'available',
      desc: true,
    },
    db.connection(),
    policy,
  );
  expect(first.total).toBe(132);
  expect(first.items.map((a) => a.available)).toEqual([
    132, 131, 130, 129, 128, 127, 126, 125, 124, 123,
  ]);
  const next = await service.list(
    {
      page: 2,
      pageSize: 10,
      departmentId: d.id,
      orderBy: 'available',
      desc: true,
    },
    db.connection(),
    policy,
  );
  expect(next.items.map((a) => a.available)).toEqual([
    122, 121, 120, 119, 118, 117, 116, 115, 114, 113,
  ]);
  const scoped = await service.list(
    { page: 1, pageSize: 10, orderBy: 'available', desc: true },
    db.connection(),
    {
      ...policy,
      read: {
        fields: [
          'id',
          'departmentId',
          'positionId',
          'year',
          'limit',
          'initialized',
          'version',
          'createdAt',
          'updatedAt',
        ],
        scope: { id: ids[0] },
      },
    },
  );
  expect(scoped.total).toBe(1);
  expect(scoped.items.map((a) => a.id)).toEqual([ids[0]]);
  await expect(
    service.list(
      { page: 1, pageSize: 10, orderBy: 'available' },
      db.connection(),
      { ...policy, read: { scope: true, fields: ['id'] } },
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_FIELD_ACCESS_DENIED' });
});
