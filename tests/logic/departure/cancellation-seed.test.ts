// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { installDepartureCancellationPermissions } from '../../../database/main/seeds/202610110006_departure_cancellation_permissions.js';
import { createEmployeesAppTest } from '../employees/helpers.js';

const test = createEmployeesAppTest();
test('HR cancellation defaults repeat without restoring revoked or customized permissions', async ({
  testApp,
}) => {
  const c = testApp.application.container;
  const db = c.resolve(databaseManagerToken);
  const sets = c.resolve(authorizationToken).permissionSets;
  const key = 'oa-departure-cancellation-hr';
  const initial = (await sets.get(key))!;
  const base = (await sets.get('oa-departure-hr'))!;
  expect(initial.grants).toEqual([
    {
      resource: { type: 'composite', id: 'oa.departure' },
      actions: [
        {
          action: 'cancel',
          policy: {
            type: 'composite',
            scopes: { departureRequests: 'oa.departureReadable' },
          },
        },
      ],
    },
  ]);
  const assigned = await sets.listAssignments(key);
  expect(assigned).toHaveLength(1);
  expect(assigned[0]).toMatchObject({
    subject: { type: 'org.dutyRole', id: 'hr' },
  });
  const install = () =>
    db.transaction((tx) => installDepartureCancellationPermissions(tx.query));
  await install();
  expect(await sets.get(key)).toEqual(initial);
  await sets.update(key, { ...initial, grants: [] });
  await sets.revoke(assigned[0]!.id);
  await install();
  expect((await sets.get(key))!.grants).toEqual([]);
  expect(await sets.listAssignments(key)).toEqual([]);

  await sets.delete(key);
  await sets.update(base.key, { ...base, grants: [] });
  await install();
  expect(await sets.get(key)).toBeUndefined();
  await sets.update(base.key, { ...base, title: 'Custom HR job' });
  await install();
  expect(await sets.get(key)).toBeUndefined();
  await sets.update(base.key, base);
  const baseAssignment = (await sets.listAssignments(base.key)).find(
    (row) => row.subject.type === 'org.dutyRole' && row.subject.id === 'hr',
  )!;
  await sets.revoke(baseAssignment.id);
  await install();
  expect(await sets.get(key)).toBeUndefined();
});
