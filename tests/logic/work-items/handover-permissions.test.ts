// @vitest-environment node
import { randomUUID } from 'node:crypto';
import {
  copyFile,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect } from 'vitest';
import { createSeeder, databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createWorkItemAppTest } from './helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { installConfirmationHandoverPermissions } from '../../../database/main/seeds/202610104512_work_item_confirmation_handover_permissions.js';

const test = createWorkItemAppTest();
const employeeKey = 'oa-work-items-employee';
const maintenanceKey = 'oa-work-items-confirmation-maintenance';
const seedName = '202610104512_work_item_confirmation_handover_permissions';

test('main initialization authorizes real HR/admin handover and successor return/confirm, with current role revocation', async ({
  testApp,
}) => {
  const creator = await createEmployee(testApp, 'Permission creator');
  const worker = await createEmployee(testApp, 'Permission worker');
  const successor = await createEmployee(testApp, 'Permission successor');
  const hr = await createEmployee(testApp, 'Permission HR');
  const admin = await createEmployee(testApp, 'Permission administrator');
  const org = testApp.application.container.resolve(organizationServiceToken);
  const cs = await creator.session(),
    ws = await worker.session(),
    ss = await successor.session(),
    hs = await hr.session(),
    as = await admin.session();
  await org.addDutyRoleMember('hr', hr.userId, { actorId: creator.userId });
  await org.addDutyRoleMember('admin', admin.userId, {
    actorId: creator.userId,
  });
  const created = await cs.fetch(
    '/workItems',
    write('POST', {
      requestId: randomUUID(),
      title: 'Default confirmation grants',
      description: 'Independent permission upgrade',
      targetUserId: worker.userId,
      dutyRoleCode: null,
      dueAt: '2035-01-01T00:00:00Z',
      requiresConfirmation: true,
      attachments: [],
    }),
  );
  expect(created.status).toBe(200);
  let item = (await created.json()).data;
  const act = async (session: typeof cs, action: string, extra = {}) => {
    const response = await session.fetch(
      `/workItems/${item.id}/${action}`,
      write('POST', {
        requestId: randomUUID(),
        expectedVersion: item.version,
        ...extra,
      }),
    );
    expect(response.status).toBe(200);
    item = (await response.json()).data;
  };
  await act(cs, 'dispatch');
  await act(ws, 'complete', { result: 'Actual completion' });
  const payload = {
    requestId: randomUUID(),
    expectedVersion: item.version,
    fromUserId: creator.userId,
    toUserId: successor.userId,
    reason: 'Current confirmation responsibility',
  };
  expect(
    (
      await cs.fetch(
        `/workItems/${item.id}/handoverConfirmation`,
        write('POST', payload),
      )
    ).status,
  ).toBe(403);
  const handed = await hs.fetch(
    `/workItems/${item.id}/handoverConfirmation`,
    write('POST', payload),
  );
  expect(handed.status).toBe(200);
  item = (await handed.json()).data;
  expect(item.creator.id).toBe(creator.userId);
  expect(item.confirmationOwner.id).toBe(successor.userId);
  expect(
    (await (await ss.fetch(`/workItems/${item.id}`)).json()).data.actions,
  ).toEqual(['confirm', 'return']);
  expect((await (await cs.fetch('/workItems/pending')).json()).data.count).toBe(
    0,
  );
  expect((await (await ss.fetch('/workItems/pending')).json()).data.count).toBe(
    1,
  );
  expect(
    (
      await cs.fetch(
        `/workItems/${item.id}/confirm`,
        write('POST', {
          requestId: randomUUID(),
          expectedVersion: item.version,
        }),
      )
    ).status,
  ).toBe(403);
  await org.removeDutyRoleMember('hr', hr.userId, { actorId: creator.userId });
  expect(
    (
      await hs.fetch(
        `/workItems/${item.id}/handoverConfirmation`,
        write('POST', payload),
      )
    ).status,
  ).toBe(403);
  await act(as, 'handoverConfirmation', {
    fromUserId: successor.userId,
    toUserId: creator.userId,
    reason: 'Admin authorized handover',
  });
  await act(as, 'handoverConfirmation', {
    fromUserId: creator.userId,
    toUserId: successor.userId,
    reason: 'Restore successor',
  });
  await act(ss, 'return', { reason: 'Complete missing evidence' });
  await act(ws, 'complete', { result: 'Corrected evidence' });
  await act(ss, 'confirm');
  expect(item.status).toBe('completed');
});

test('forward seed upgrades only untouched actions and preserves custom grants and removed maintenance assignments on retry', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    authz = c.resolve(authorizationToken);
  const employee = (await authz.permissionSets.get(employeeKey))!;
  const grants = employee.grants.map((grant) =>
    grant.resource.type === 'composite' && grant.resource.id === 'oa.workItems'
      ? {
          ...grant,
          actions: grant.actions
            .filter((a) => a.action !== 'confirm')
            .map((a) =>
              a.action === 'return'
                ? {
                    ...a,
                    policy: {
                      type: 'composite' as const,
                      scopes: { workItems: 'oa.workItemsOwned' },
                    },
                  }
                : a,
            ),
        }
      : grant,
  );
  // A removed confirm grant is not reintroduced; the exact legacy return action is upgraded.
  await authz.permissionSets.update(employeeKey, {
    ...employee,
    title: 'Custom employee title',
    grants,
  });
  const maintenance = (await authz.permissionSets.get(maintenanceKey))!;
  await authz.permissionSets.update(maintenanceKey, {
    ...maintenance,
    title: 'Custom maintenance',
    grants: [],
  });
  const assignments =
    await authz.permissionSets.listAssignments(maintenanceKey);
  for (const assignment of assignments)
    await authz.permissionSets.revoke(assignment.id);
  await db.transaction((tx) =>
    installConfirmationHandoverPermissions(tx.repository.bind(tx)),
  );
  const upgraded = (await authz.permissionSets.get(employeeKey))!;
  expect(upgraded.title).toBe('Custom employee title');
  const actions = upgraded.grants.flatMap((grant) => grant.actions);
  expect(actions.some((a) => a.action === 'confirm')).toBe(false);
  expect(actions.find((a) => a.action === 'return')?.policy).toEqual({
    type: 'composite',
    scopes: { workItems: 'oa.workItemsConfirmationOwned' },
  });
  const customGrants = upgraded.grants.map((grant) => ({
    ...grant,
    actions: grant.actions.map((a) =>
      a.action === 'return'
        ? {
            ...a,
            policy: { type: 'composite' as const, scopes: { workItems: '' } },
          }
        : a,
    ),
  }));
  await authz.permissionSets.update(employeeKey, {
    ...upgraded,
    grants: customGrants,
  });
  await db.transaction((tx) =>
    installConfirmationHandoverPermissions(tx.repository.bind(tx)),
  );
  await db.transaction((tx) =>
    installConfirmationHandoverPermissions(tx.repository.bind(tx)),
  );
  expect((await authz.permissionSets.get(employeeKey))?.grants).toEqual(
    customGrants,
  );
  expect((await authz.permissionSets.get(maintenanceKey))?.grants).toEqual([]);
  expect((await authz.permissionSets.get(maintenanceKey))?.title).toBe(
    'Custom maintenance',
  );
  expect(await authz.permissionSets.listAssignments(maintenanceKey)).toEqual(
    [],
  );
});

test('transactional seed failure rolls back grants, assignments and execution history; repair runs once', async ({
  testApp,
}) => {
  const db = testApp.application.container.resolve(databaseManagerToken);
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'work-item-permission-seed-'),
  );
  const source = path.resolve(
    import.meta.dirname,
    '../../../database/main/seeds',
    `${seedName}.ts`,
  );
  const target = path.join(directory, `${seedName}.ts`);
  try {
    await db.transaction(async (tx) => {
      await tx
        .repository('authorizationPermissionSetAssignments')
        .deleteMany({ filter: { permissionSetKey: maintenanceKey } });
      await tx
        .repository('authorizationPermissionSets')
        .deleteMany({ filter: { key: maintenanceKey } });
      const set = (await tx
        .repository<{ id: string; grants: string }>(
          'authorizationPermissionSets',
        )
        .findOne({ filter: { key: employeeKey } }))!;
      const grants = JSON.parse(set.grants).map(
        (g: { actions: { action: string; policy: unknown }[] }) => ({
          ...g,
          actions: g.actions.map((a) =>
            ['confirm', 'return'].includes(a.action)
              ? {
                  ...a,
                  policy: {
                    type: 'composite',
                    scopes: { workItems: 'oa.workItemsOwned' },
                  },
                }
              : a,
          ),
        }),
      );
      await tx.repository('authorizationPermissionSets').updateOne({
        filter: { id: set.id },
        values: { grants: JSON.stringify(grants) },
      });
    });
    const before = await db
      .repository('authorizationPermissionSets')
      .findOne({ filter: { key: employeeKey } });
    await symlink(
      path.resolve(import.meta.dirname, '../../../node_modules'),
      path.join(directory, 'node_modules'),
      'dir',
    );
    const text = await readFile(source, 'utf8');
    await writeFile(
      target,
      text.replace(
        'run: (context) =>\n    installConfirmationHandoverPermissions(context.repository.bind(context)),',
        "run: async ({ repository }) => { await installConfirmationHandoverPermissions(repository); throw new Error('Injected seed failure'); },",
      ),
    );
    const options = {
      database: db,
      directory,
      packageName: 'work-item-seed-failure',
      tableName: 'workItemTestSeedHistory',
      lockTableName: 'workItemTestSeedLocks',
    };
    const failing = createSeeder(options);
    await expect(failing.run()).rejects.toThrow('Injected seed failure');
    expect(await failing.history()).toEqual([]);
    expect(
      await db
        .repository('authorizationPermissionSets')
        .findOne({ filter: { key: employeeKey } }),
    ).toEqual(before);
    expect(
      await db
        .repository('authorizationPermissionSets')
        .exists({ filter: { key: maintenanceKey } }),
    ).toBe(false);
    expect(
      await db
        .repository('authorizationPermissionSetAssignments')
        .count({ filter: { permissionSetKey: maintenanceKey } }),
    ).toBe(0);
    await copyFile(source, target);
    const repaired = createSeeder(options);
    expect((await repaired.run()).executed).toEqual([seedName]);
    expect((await repaired.run()).executed).toEqual([]);
    expect(await repaired.history()).toHaveLength(1);
    expect(
      await db
        .repository('authorizationPermissionSetAssignments')
        .count({ filter: { permissionSetKey: maintenanceKey } }),
    ).toBe(2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
