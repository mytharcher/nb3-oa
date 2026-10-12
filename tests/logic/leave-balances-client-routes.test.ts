import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { expect, it } from 'vitest';
import routes from '../../client/routes.js';
function flatten(
  items: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] {
  return items.flatMap((item) => [item, ...flatten(item.children ?? [])]);
}
it('separates signed-in balances, HR reads and guarded adjustment URLs', () => {
  const items = flatten(
    resolveAppClientContributions([
      { packageName: 'nb3-oa', routes, source: 'application' },
    ]).routes,
  );
  const mine = items.find((item) => item.name === 'oa-leave-balances');
  const hr = items.find(
    (item) => item.name === 'oa-leave-balance-administration',
  );
  const adjust = items.find((item) => item.name === 'oa-leave-balance-adjust');
  expect(mine).toMatchObject({
    path: '/leaveBalances',
    auth: 'required',
    authz: 'skip',
  });
  expect(hr).toMatchObject({
    path: '/leaveBalanceAdministration',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'oa.leaveBalances' },
      action: 'read',
    },
  });
  expect(adjust).toMatchObject({
    path: '/leaveBalanceAdministration/adjust/:employeeId/:leaveType',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'oa.leaveBalances' },
      action: 'update',
    },
  });
  expect(adjust?.navigation).toBeUndefined();
});
