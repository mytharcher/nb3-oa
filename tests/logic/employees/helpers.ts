import {
  OA_TEST_ORIGIN,
  OA_TEST_SERVER,
  OA_TEST_DATABASE_ENV,
} from '../oa-test-origin.ts';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  signIn,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import type { PermissionGrant } from '@nocobase/authorization/core';
import { createAppTest, type TestApp } from '@nocobase/app-testing/server';
import type { RepositoryPolicy } from '@nocobase/db';

import {
  employeeModuleService,
  employeeServiceToken,
} from '../../../server/providers/employees/index.ts';
import type {
  CreateEmployeeInput,
  EmployeeModuleService,
} from '../../../server/providers/employees/service.ts';
import { createStandaloneServer } from '../../../server/standalone.ts';

/** A whole-application test with the secrets the authentication plugin needs. */
export function createEmployeesAppTest(): ReturnType<typeof createAppTest> {
  return createAppTest({
    createServer: createStandaloneServer,
    env: OA_TEST_DATABASE_ENV,
    server: OA_TEST_SERVER,
    config: {
      secrets: { keys: [{ version: 1, key: 'e'.repeat(64) }] },
      // The origin the sign-in helper addresses, so cookie-authenticated writes pass the CSRF origin check.
      app: { publicOrigin: OA_TEST_ORIGIN },
    },
  });
}

/** Unrestricted policy for setting up fixtures through the archive service. */
export const ALL: RepositoryPolicy = {
  read: true,
  create: true,
  update: true,
  delete: true,
};

export const PASSWORD = 'employee-test-password';

let sequence = 0;

export interface TestPerson {
  userId: string;
  email: string;
  session(): Promise<TestSession>;
}

export async function createPerson(
  testApp: TestApp,
  name: string,
): Promise<TestPerson> {
  sequence += 1;
  const email = `${name.toLowerCase().replace(/\W+/gu, '')}-${sequence}-${Date.now()}@example.test`;
  const user = await testApp.application.container
    .resolve(userAdministrationServiceToken)
    .create({ name, email, password: PASSWORD });
  return {
    userId: user.id,
    email,
    session: () => signIn(testApp, { email, password: PASSWORD }),
  };
}

export function employees(testApp: TestApp): EmployeeModuleService {
  return employeeModuleService(
    testApp.application.container.resolve(employeeServiceToken),
  );
}

let codeSequence = 0;

/** Creates a person with an account and an archive. */
export async function createEmployee(
  testApp: TestApp,
  name: string,
  input: Partial<CreateEmployeeInput> = {},
): Promise<TestPerson & { employeeId: string }> {
  const person = await createPerson(testApp, name);
  codeSequence += 1;
  const view = await employees(testApp).createEmployee(
    {
      userId: person.userId,
      code: `E${Date.now()}${codeSequence}`,
      name,
      status: 'regular',
      hireDate: '2025-01-01',
      ...input,
    },
    ALL,
    person.userId,
  );
  return { ...person, employeeId: view.id };
}

/** Creates a permission set with the grants and assigns it to the user. */
export async function grantToUser(
  testApp: TestApp,
  key: string,
  grants: readonly PermissionGrant[],
  userId: string,
): Promise<void> {
  const authz = testApp.application.container.resolve(authorizationToken);
  if (!(await authz.permissionSets.get(key)))
    await authz.permissionSets.create({ key, title: key, grants: [...grants] });
  const existing = await authz.permissionSets.listAssignments(key);
  if (
    existing.some((a) => a.subject.type === 'user' && a.subject.id === userId)
  )
    return;
  await authz.permissionSets.assign({
    permissionSet: key,
    subject: { type: 'user', id: userId },
  });
}

export const archivePage: PermissionGrant = {
  resource: { type: 'settings', id: 'oa.employees' },
  actions: [{ action: 'read' }],
};

/** A composite grant with one data scope per action. */
export function composite(
  id: string,
  actions: Record<string, Record<string, string>>,
): PermissionGrant {
  return {
    resource: { type: 'composite', id },
    actions: Object.entries(actions).map(([action, scopes]) => ({
      action,
      policy: { type: 'composite', scopes },
    })),
  } as PermissionGrant;
}
