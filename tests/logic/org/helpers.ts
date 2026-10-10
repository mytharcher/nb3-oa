import { OA_TEST_ORIGIN, OA_TEST_SERVER } from '../oa-test-origin.ts';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization/server';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';

import {
  organizationServiceToken,
  type OrganizationService,
  type OrgSettingsItem,
} from '../../../server/providers/org/index.ts';
import { createStandaloneServer } from '../../../server/standalone.ts';

export interface OrgTestApp {
  readonly testApp: TestApp;
  readonly authz: AppAuthorization;
  readonly organization: OrganizationService;
  /** Creates an enabled account and signs it in. */
  createUser(name: string): Promise<TestSession>;
  admin(): Promise<TestSession>;
  /** Creates a permission set holding the settings item's actions and assigns it to the user. */
  grantSettings(
    userId: string,
    item: OrgSettingsItem,
    actions: readonly ('read' | 'update')[],
  ): Promise<void>;
  close(): Promise<void>;
}

let sequence = 0;

/** The whole application on test databases: every plugin, migration and seed, as `pnpm start` runs it. */
export async function startOrgTestApp(): Promise<OrgTestApp> {
  const testApp = await createTestApp({
    createServer: createStandaloneServer,
    server: OA_TEST_SERVER,
    // The employees module encrypts controlled fields and needs a key to start.
    config: {
      secrets: { keys: [{ version: 1, key: 'a'.repeat(64) }] },
      // Cookie-authenticated writes must come from the application's public origin.
      app: { publicOrigin: OA_TEST_ORIGIN },
    },
  });
  const container = testApp.application.container;
  const authz = container.resolve(authorizationToken);
  const users = container.resolve(userAdministrationServiceToken);
  return {
    testApp,
    authz,
    organization: container.resolve(organizationServiceToken),
    async createUser(name) {
      sequence += 1;
      const email = `${name.toLowerCase()}-${sequence}@org.test`;
      const password = 'org-test-password-123';
      await users.create({ name, email, password });
      return signIn(testApp, { email, password });
    },
    admin: () => signIn(testApp, DEFAULT_ADMIN_CREDENTIALS),
    async grantSettings(userId, item, actions) {
      sequence += 1;
      const set = definePermissionSet(`org-test-${sequence}`)
        .grant(authz.settings.grant(item, actions))
        .build();
      await authz.permissionSets.create(set);
      await authz.permissionSets.assign({
        permissionSet: set.key,
        subject: { type: 'user', id: userId },
      });
    },
    close: () => testApp.close(),
  };
}

/** The origin a browser sends; the application refuses a cookie-authenticated write without a same-site origin. */
const ORIGIN = OA_TEST_ORIGIN;

export function json(body: unknown, method = 'POST'): RequestInit {
  return {
    method,
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    body: JSON.stringify(body),
  };
}

/** A write without a body, such as `POST …/enable` or `DELETE`. */
export function send(method: string): RequestInit {
  return { method, headers: { origin: ORIGIN } };
}
