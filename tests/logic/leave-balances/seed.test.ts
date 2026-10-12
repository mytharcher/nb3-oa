// @vitest-environment node
import { databaseManagerToken } from '@nocobase/db';
import { expect } from 'vitest';
import { installLeaveBalancePermissions } from '../../../database/main/seeds/202610100811_leave_balance_permissions.ts';
import { createPlatformAppTest } from '../platform/helpers.ts';
const test = createPlatformAppTest();
test('permission seed repeats without overwriting administrator changes and its failed fresh run rolls back', async ({
  app,
}) => {
  const db = app.container.resolve(databaseManagerToken);
  const key = 'oa-leave-balances-hr';
  const read = () =>
    db
      .query()
      .selectFrom('authorizationPermissionSets')
      .select(['id', 'grants', 'title'])
      .where('key', '=', key)
      .executeTakeFirstOrThrow();
  const fresh = await read();
  expect(JSON.parse(String(fresh.grants))).toEqual([
    {
      resource: { type: 'settings', id: 'oa.leaveBalances' },
      actions: [{ action: 'read' }, { action: 'update' }],
    },
  ]);
  await db.transaction((tx) => installLeaveBalancePermissions(tx.query));
  expect(await read()).toEqual(fresh);
  await db
    .query()
    .updateTable('authorizationPermissionSets')
    .set({ grants: '[]', title: 'Administrator customization' })
    .where('key', '=', key)
    .execute();
  const custom = await read();
  await db.transaction((tx) => installLeaveBalancePermissions(tx.query));
  expect(await read()).toEqual(custom);
  await expect(
    db.transaction(async (tx) => {
      await tx.query
        .deleteFrom('authorizationPermissionSetAssignments')
        .where('permissionSetKey', '=', key)
        .execute();
      await tx.query
        .deleteFrom('authorizationPermissionSets')
        .where('key', '=', key)
        .execute();
      await installLeaveBalancePermissions(tx.query);
      throw new Error('failed-seed');
    }),
  ).rejects.toThrow('failed-seed');
  expect(await read()).toEqual(custom);
  expect(
    await db
      .repository('authorizationPermissionSetAssignments')
      .count({ filter: { permissionSetKey: key } }),
  ).toBe(3);
});
