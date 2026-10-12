import path from 'node:path';
import { createAppTest } from '@nocobase/app-testing/server';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import {
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import { createApp } from '../../../server/app.js';
import base from '../../../server/runtime.js';
import OnboardingProvider from '../../../server/providers/onboarding/index.js';
import routes from '../../../server/routes/onboarding/index.js';
import { OA_TEST_ORIGIN, OA_TEST_SERVER } from '../oa-test-origin.js';
const runtime = {
  locales: {
    ...base.locales,
    'en-US': async () => ({
      default: {
        ...(await import('../../../server/locales/en-US.js')).default,
        ...(await import('../../../server/locales/modules/onboarding.en-US.js'))
          .default,
      },
    }),
    'zh-CN': async () => ({
      default: {
        ...(await import('../../../server/locales/zh-CN.js')).default,
        ...(await import('../../../server/locales/modules/onboarding.zh-CN.js'))
          .default,
      },
    }),
  },
  ...base,
  serviceProviders: base.serviceProviders.includes(OnboardingProvider)
    ? base.serviceProviders
    : [...base.serviceProviders, OnboardingProvider],
  routes: base.serviceProviders.includes(OnboardingProvider)
    ? base.routes
    : [...base.routes, ...routes],
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
    notification: { channels: { inbox: { provider: 'in-app' } } },
    secrets: { keys: [{ version: 1, key: 'o'.repeat(64) }] },
    app: { publicOrigin: OA_TEST_ORIGIN },
  },
});
