import path from 'node:path';
import { createAppTest } from '@nocobase/app-testing/server';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import {
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import { createApp } from '../../../server/app.js';
import base from '../../../server/runtime.js';
import { OA_TEST_ORIGIN, OA_TEST_SERVER } from '../oa-test-origin.js';
const runtime = base;
const standalone = defineStandaloneServer({
  rootDir: path.resolve(import.meta.dirname, '../../..'),
  appRuntime: runtime,
  createServer: async (scope) =>
    startApplicationInScope(
      scope,
      createApp(await resolveAppRuntime(runtime, scope)),
    ),
});
export const test = createAppTest({
  createServer: standalone.create,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'v'.repeat(64) }] },
    app: { publicOrigin: OA_TEST_ORIGIN },
  },
});
