import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import type { TestApp } from '@nocobase/app-testing/server';
import { createEmployee, grantToUser } from '../employees/helpers.js';
export async function prepareRepairs(testApp: TestApp) {
  const a = await createEmployee(testApp, 'Repair A'),
    b = await createEmployee(testApp, 'Repair B'),
    leader = await createEmployee(testApp, 'Repair L'),
    admin = await createEmployee(testApp, 'Repair S');
  const authz = testApp.application.container.resolve(authorizationToken);
  for (const [person, role] of [
    [a, 'employee'],
    [b, 'employee'],
    [leader, 'leader'],
    [admin, 'configuration'],
  ] as const)
    await authz.permissionSets.assign({
      permissionSet: `oa-it-repairs-${role}`,
      subject: { type: 'user', id: person.userId },
    });
  await grantToUser(
    testApp,
    'repair-task-page',
    [
      {
        resource: { type: 'page', id: 'oa.approvals' },
        actions: [{ action: 'access' }],
      },
    ],
    leader.userId,
  );
  return { a, b, leader, admin };
}
