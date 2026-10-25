// @vitest-environment node
import { expect, vi } from 'vitest';
import { hrMasterDataToken } from '../../../server/providers/hr-master-data/index.js';
import {
  createEmployeesAppTest,
  createPerson,
  grantToUser,
} from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
const test = createEmployeesAppTest();
test('HR source ownership, atomic synchronization, revisions and explicit local-conflict reclaim', async ({
  testApp,
}) => {
  const hr = await createPerson(testApp, 'HR sync operator'),
    outsider = await createPerson(testApp, 'Other integration'),
    person = await createPerson(testApp, 'Incoming employee');
  await grantToUser(
    testApp,
    'hr-sync-management',
    [
      {
        resource: { type: 'settings', id: 'oa.hrMasterData' },
        actions: ['read', 'sync', 'manage'].map((action) => ({ action })),
      },
      ...['oa.org.departments', 'oa.org.grades'].map((id) => ({
        resource: { type: 'settings' as const, id },
        actions: [{ action: 'read' }, { action: 'update' }],
      })),
      {
        resource: { type: 'composite', id: 'oa.employees.archive' },
        actions: ['view', 'manage', 'correctStatus'].map((action) => ({
          action,
          policy: {
            type: 'composite' as const,
            scopes: { employees: 'allRecords' },
          },
        })),
      },
    ],
    hr.userId,
  );
  await grantToUser(
    testApp,
    'hr-sync-other-read',
    [
      {
        resource: { type: 'settings', id: 'oa.hrMasterData' },
        actions: [{ action: 'read' }, { action: 'sync' }],
      },
    ],
    outsider.userId,
  );
  const session = await hr.session(),
    other = await outsider.session();
  expect((await testApp.request('/hrMasterData/sources')).status).toBe(401);
  expect(
    (
      await session.fetch(
        '/hrMasterData/sources',
        write('PUT', {
          id: 'test-hr',
          name: 'Synthetic HR gateway',
          principalId: hr.userId,
          active: true,
        }),
      )
    ).status,
  ).toBe(200);
  expect(
    (await other.fetch('/hrMasterData/batches?source=test-hr')).status,
  ).toBe(403);
  const batch = {
    source: 'test-hr',
    eventId: 'initial',
    items: [
      {
        entity: 'department',
        externalId: 'dept',
        revision: 1,
        operation: 'upsert',
        data: { title: 'External department', code: 'EXT-D' },
      },
      {
        entity: 'grade',
        externalId: 'grade',
        revision: 1,
        operation: 'upsert',
        data: { title: 'External grade', code: 'EXT-G', rank: 1 },
      },
      {
        entity: 'employee',
        externalId: 'employee',
        revision: 1,
        operation: 'upsert',
        data: {
          userId: person.userId,
          code: 'EXT-E',
          name: 'Incoming employee',
          gradeExternalId: 'grade',
          departmentExternalId: 'dept',
        },
      },
    ],
  };
  const initial = await session.fetch(
    '/hrMasterData/batches',
    write('POST', batch),
  );
  expect(initial.status).toBe(200);
  expect((await initial.json()).data.state).toBe('completed');
  const concurrent = await Promise.all([
    session.fetch('/hrMasterData/batches', write('POST', batch)),
    session.fetch('/hrMasterData/batches', write('POST', batch)),
  ]);
  expect(concurrent.map((r) => r.status)).toEqual([200, 200]);
  const mappings = (
    await (await session.fetch('/hrMasterData/mappings?source=test-hr')).json()
  ).data;
  expect(mappings).toHaveLength(3);
  const department = mappings.find(
    (r: { entity: string }) => r.entity === 'department',
  );
  const employees = testApp.application.container.resolve(employeeServiceToken);
  expect((await employees.getByUserId(person.userId))?.name).toBe(
    'Incoming employee',
  );
  const org = testApp.application.container.resolve(organizationServiceToken);
  expect((await org.primaryDepartmentOf(person.userId))?.id).toBe(
    department.localId,
  );
  await org.updateDepartment(
    department.localId,
    { title: 'Local correction' },
    { actorId: hr.userId },
  );
  const update = {
    source: 'test-hr',
    eventId: 'department-update',
    items: [
      {
        ...batch.items[0],
        revision: 2,
        data: { title: 'External update', code: 'EXT-D' },
      },
    ],
  };
  const conflict = await session.fetch(
    '/hrMasterData/batches',
    write('POST', update),
  );
  expect(conflict.status).toBe(400);
  expect((await conflict.json()).error.reason).toBe('LOCAL_CHANGE_CONFLICT');
  expect((await org.getDepartment(department.localId))?.title).toBe(
    'Local correction',
  );
  expect(
    (
      await session.fetch(
        `/hrMasterData/mappings/${department.id}/reclaim`,
        write('POST', { reason: 'HR explicitly restores external ownership' }),
      )
    ).status,
  ).toBe(200);
  const runs = (
    await (await session.fetch('/hrMasterData/batches?source=test-hr')).json()
  ).data;
  const failed = runs.find((r: { state: string }) => r.state === 'failed');
  expect(failed.payload).toBeUndefined();
  expect(
    (
      await session.fetch(
        `/hrMasterData/batches/${failed.id}/replay`,
        write('POST', {}),
      )
    ).status,
  ).toBe(200);
  expect((await org.getDepartment(department.localId))?.title).toBe(
    'External update',
  );
  let entered!: () => void, release!: () => void;
  const paused = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const resume = new Promise<void>((resolve) => {
    release = resolve;
  });
  const originalUpdate = org.updateDepartment.bind(org);
  const spy = vi
    .spyOn(org, 'updateDepartment')
    .mockImplementation(async (id, input, context) => {
      if (context.reason?.startsWith('HR sync test-hr/concurrent')) {
        entered();
        await resume;
      }
      return originalUpdate(id, input, context);
    });
  try {
    const syncing = session.fetch(
      '/hrMasterData/batches',
      write('POST', {
        source: 'test-hr',
        eventId: 'concurrent',
        items: [
          {
            ...batch.items[0],
            revision: 3,
            data: { title: 'Synchronized version', code: 'EXT-D' },
          },
        ],
      }),
    );
    await paused;
    let manualFinished = false;
    const manual = org
      .updateDepartment(
        department.localId,
        { title: 'Manual final correction' },
        { actorId: hr.userId },
      )
      .then(() => {
        manualFinished = true;
      });
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(manualFinished).toBe(false);
    release();
    expect((await syncing).status).toBe(200);
    await manual;
    expect((await org.getDepartment(department.localId))?.title).toBe(
      'Manual final correction',
    );
    expect(
      (
        await session.fetch(
          '/hrMasterData/batches',
          write('POST', {
            source: 'test-hr',
            eventId: 'after-manual',
            items: [
              {
                ...batch.items[0],
                revision: 4,
                data: { title: 'Cannot silently overwrite', code: 'EXT-D' },
              },
            ],
          }),
        )
      ).status,
    ).toBe(400);
  } finally {
    release();
    spy.mockRestore();
  }
  const failedBatch = {
    source: 'test-hr',
    eventId: 'rollback',
    items: [
      {
        ...batch.items[0],
        externalId: 'must-rollback',
        data: { title: 'Must rollback' },
      },
      {
        ...batch.items[2],
        externalId: 'bad',
        data: {
          userId: person.userId,
          code: 'DUP',
          name: 'Duplicate account',
          gradeExternalId: 'missing',
        },
      },
    ],
  };
  expect(
    (await session.fetch('/hrMasterData/batches', write('POST', failedBatch)))
      .status,
  ).toBe(400);
  expect((await org.listTree()).some((r) => r.title === 'Must rollback')).toBe(
    false,
  );
  expect(
    (
      await session.fetch(
        '/hrMasterData/batches',
        write('POST', { ...batch, items: [] }),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await session.fetch(
        '/hrMasterData/batches',
        write('POST', { ...batch, eventId: 'stale', items: [batch.items[0]] }),
      )
    ).status,
  ).toBe(400);
  expect(
    (await other.fetch('/hrMasterData/batches', write('POST', batch))).status,
  ).toBe(403);
  const service = testApp.application.container.resolve(hrMasterDataToken);
  await expect(
    service.run(
      {
        source: 'test-hr',
        eventId: 'hidden-fields',
        items: [
          {
            entity: 'employee',
            externalId: 'employee',
            revision: 2,
            operation: 'upsert',
            data: { code: 'EXT-E', name: 'Must not change' },
          },
        ],
      },
      {
        actorId: hr.userId,
        manage: true,
        departments: true,
        grades: true,
        employees: {
          read: { fields: ['id'], scope: true },
          create: false,
          update: true,
          delete: false,
        },
      },
    ),
  ).rejects.toMatchObject({ reason: 'FIELDS_RESTRICTED' });
  expect((await employees.getByUserId(person.userId))?.name).toBe(
    'Incoming employee',
  );
  expect(
    (
      await session.fetch(
        '/hrMasterData/batches',
        write('POST', {
          ...batch,
          items: [
            {
              ...batch.items[0],
              data: { title: 'Same key different content' },
            },
          ],
        }),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await session.fetch(
        '/hrMasterData/sources',
        write('PUT', {
          id: 'test-hr',
          name: 'Synthetic HR gateway',
          principalId: hr.userId,
          active: false,
        }),
      )
    ).status,
  ).toBe(200);
  expect(
    (await session.fetch('/hrMasterData/batches', write('POST', batch))).status,
  ).toBe(400);
  const createdKey = await session.fetch(
    '/auth/api-key/create',
    write('POST', { name: 'synthetic-hr-gateway' }),
  );
  expect(createdKey.status).toBe(200);
  const key = await createdKey.json();
  const keyed = await testApp.request('/hrMasterData/sources', {
    headers: { 'x-api-key': key.key },
  });
  expect(keyed.status).toBe(200);
  expect(
    (await keyed.json()).data.map((row: { id: string }) => row.id),
  ).toContain('test-hr');
  expect(
    (
      await session.fetch(
        '/auth/api-key/delete',
        write('POST', { keyId: key.id }),
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await testApp.request('/hrMasterData/sources', {
        headers: { 'x-api-key': key.key },
      })
    ).status,
  ).toBe(401);
}, 120000);
