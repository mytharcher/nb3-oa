import path from 'node:path';
import { databaseManagerToken } from '@nocobase/db';
import { createAppTest } from '@nocobase/app-testing/server';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import {
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import { createApp } from '../../../server/app.js';
import base from '../../../server/runtime.js';
import transferRoutes from '../../../server/routes/transfer/index.js';
import TransferProvider from '../../../server/providers/transfer/index.js';
import { OA_TEST_ORIGIN, OA_TEST_SERVER } from '../oa-test-origin.js';
/** Install candidate tables before the real provider starts so its lifecycle executors are exercised. */
class CandidateTransferProvider extends TransferProvider {
  public override async start() {
    const db = this.app.container.resolve(databaseManagerToken);
    if (!(await db.connection().collections.get('transferCommands')))
      await db
        .createMigrator({
          sources: [
            {
              packageName: 'transfer-candidate',
              directory: path.resolve(
                import.meta.dirname,
                '../../fixtures/transfer/migrations',
              ),
            },
          ],
          tableName: 'transferCandidateMigrations',
        })
        .latest();
    await super.start();
  }
}
const runtime = {
  ...base,
  routes: [
    ...base.routes,
    ...transferRoutes.filter((route) => !base.routes.includes(route)),
  ],
  serviceProviders: [
    ...base.serviceProviders.filter(
      (provider) => provider !== TransferProvider,
    ),
    CandidateTransferProvider,
  ],
};
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
    secrets: { keys: [{ version: 1, key: 't'.repeat(64) }] },
    app: { publicOrigin: OA_TEST_ORIGIN },
  },
});
