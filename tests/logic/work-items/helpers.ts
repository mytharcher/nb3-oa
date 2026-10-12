import { createAppTest } from '@nocobase/app-testing/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import { OA_TEST_ORIGIN, OA_TEST_SERVER } from '../oa-test-origin.js';
/** Exercise production migration/seed discovery, without candidate fallbacks. */
export function createWorkItemAppTest() {
  return createAppTest({
    createServer: createStandaloneServer,
    server: OA_TEST_SERVER,
    config: {
      secrets: { keys: [{ version: 1, key: 'p'.repeat(64) }] },
      app: { publicOrigin: OA_TEST_ORIGIN },
    },
  });
}
