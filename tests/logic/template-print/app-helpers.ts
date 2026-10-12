import { createTestApp } from '@nocobase/app-testing/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import { OA_TEST_ORIGIN, OA_TEST_SERVER } from '../oa-test-origin.js';
export async function printApp() {
  return createTestApp({
    createServer: createStandaloneServer,
    server: OA_TEST_SERVER,
    config: {
      secrets: { keys: [{ version: 1, key: 'a'.repeat(64) }] },
      app: { publicOrigin: OA_TEST_ORIGIN },
    },
  });
}
