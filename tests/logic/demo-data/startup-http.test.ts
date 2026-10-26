// @vitest-environment node
import path from 'node:path';
import { expect, it } from 'vitest';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import {
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import { createTestApp } from '@nocobase/app-testing/server';
import {
  sampleDataRecordName,
  sampleDataToken,
} from '@nocobase/app-server/sample-data';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { createApp } from '../../../server/app.js';
import runtime from '../../../server/runtime.js';
import { trialSession } from '../../../cli/commands/lib/trial-data/http.js';
import {
  trialEmail,
  trialUsername,
} from '../../../cli/commands/lib/trial-data/accounts.js';
import {
  OA_TEST_DATABASE_ENV,
  OA_TEST_ORIGIN,
  OA_TEST_SERVER,
} from '../oa-test-origin.js';

it('can sign in and use guarded routes while a startup sample is still running', async () => {
  let sampleCompleted = false;
  class StartupHttpSample extends ServiceProvider<Application> {
    readonly name = 'test/startup-http-sample';
    override async ready() {
      const app = this.app;
      const password = 'startup-sample-password';
      await app.container.resolve(userAdministrationServiceToken).create({
        name: 'Startup sample',
        email: trialEmail('employee'),
        username: trialUsername('employee'),
        password,
      });
      const samples = app.container.resolve(sampleDataToken);
      // Exercise one startup HTTP sample against the full application without generating the entire dataset.
      samples.prepare({
        enabled: true,
        ledger: {
          history: async () =>
            ['oa/demo-data', 'oa/role-coverage-v1'].map((name) => ({
              name: sampleDataRecordName(name),
              packageName: 'nb3-oa',
              status: 'executed' as const,
            })),
          record: async () => {},
        },
      });
      samples.register({
        name: 'test/startup-http',
        packageName: 'oa-startup-test',
        async run() {
          const anonymous = await app.router.fetch(
            new Request(`${OA_TEST_ORIGIN}/api/swagger`),
          );
          expect(anonymous.status).toBe(401);
          let timer: ReturnType<typeof setTimeout> | undefined;
          try {
            const session = await Promise.race([
              trialSession(app, 'employee', password),
              new Promise<never>((_, reject) => {
                timer = setTimeout(
                  () =>
                    reject(
                      new Error(
                        'Sample HTTP waited for its own application startup',
                      ),
                    ),
                  5000,
                );
              }),
            ]);
            expect((await session.request('/swagger')).openapi).toMatch(/^3\./);
            sampleCompleted = true;
          } finally {
            if (timer) clearTimeout(timer);
          }
        },
      });
    }
  }
  const standalone = defineStandaloneServer({
    rootDir: path.resolve(import.meta.dirname, '../../..'),
    appRuntime: runtime,
    createServer: async (scope) => {
      const app = createApp(await resolveAppRuntime(runtime, scope));
      app.addServiceProvider(StartupHttpSample);
      return startApplicationInScope(scope, app);
    },
  });
  const fixture = await createTestApp({
    createServer: standalone.create,
    env: OA_TEST_DATABASE_ENV,
    server: OA_TEST_SERVER,
    config: {
      app: { publicOrigin: OA_TEST_ORIGIN },
      secrets: { keys: [{ version: 1, key: 's'.repeat(64) }] },
    },
  });
  try {
    expect(sampleCompleted).toBe(true);
  } finally {
    await fixture.close();
  }
}, 120000);
