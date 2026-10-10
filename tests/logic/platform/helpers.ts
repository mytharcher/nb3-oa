import { OA_TEST_ORIGIN, OA_TEST_SERVER } from '../oa-test-origin.ts';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  signIn,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createAppTest, type TestApp } from '@nocobase/app-testing/server';

import { createStandaloneServer } from '../../../server/standalone.ts';

/** The origin a browser sends with a write; the application refuses a cookie-authenticated write without it. */
export const ORIGIN = OA_TEST_ORIGIN;

/** Request options for a JSON write from the application's own origin. */
export function write(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

/** The whole application on test databases, with the secrets the authentication plugin needs. */
export function createPlatformAppTest(): ReturnType<typeof createAppTest> {
  return createAppTest({
    createServer: createStandaloneServer,
    server: OA_TEST_SERVER,
    config: {
      secrets: { keys: [{ version: 1, key: 'p'.repeat(64) }] },
      // Cookie-authenticated writes must come from the application's public origin.
      app: { publicOrigin: ORIGIN },
    },
  });
}

const PASSWORD = 'platform-test-password';
let sequence = 0;

/** Creates an enabled account with no permission set of its own and signs it in. */
export async function createUser(
  testApp: TestApp,
  name: string,
): Promise<TestSession> {
  sequence += 1;
  const email = `platform-${sequence}-${Date.now()}@example.test`;
  await testApp.application.container
    .resolve(userAdministrationServiceToken)
    .create({ name, email, password: PASSWORD });
  return signIn(testApp, { email, password: PASSWORD });
}

/** Creates a permission set holding the settings item's actions and assigns it to the user. */
export async function grantSettings(
  testApp: TestApp,
  userId: string,
  id: string,
  actions: readonly ('read' | 'update')[],
): Promise<void> {
  const authz = testApp.application.container.resolve(authorizationToken);
  sequence += 1;
  const key = `platform-test-${sequence}`;
  await authz.permissionSets.create({
    key,
    title: key,
    grants: [authz.settings.grant(id, [...actions])],
  });
  await authz.permissionSets.assign({
    permissionSet: key,
    subject: { type: 'user', id: userId },
  });
}

export async function json<T = unknown>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
