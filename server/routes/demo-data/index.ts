import type { Application } from '@nocobase/app-server/application';
import {
  apiValidator,
  dataResponse,
  apiErrorResponses,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  DEMO_SETTINGS,
  demoDataServiceToken,
} from '../../providers/demo-data/index.js';
const Account = z.object({
  role: z.string(),
  id: z.string(),
  name: z.string(),
  email: z.string(),
  username: z.string(),
});
const Status = z.object({
  datasetId: z.string().optional(),
  locale: z.enum(['zh-CN', 'en-US']).optional(),
  baseDate: z.string().optional(),
  timeZone: z.string(),
  state: z.enum([
    'absent',
    'importing',
    'ready',
    'importFailed',
    'removing',
    'removeFailed',
  ]),
  version: z.number(),
  completedSteps: z.number(),
  totalSteps: z.number(),
  stage: z
    .enum([
      'preparing',
      'generating',
      'validating',
      'removing',
      'complete',
      'failed',
    ])
    .optional(),
  importedAt: z.string().optional(),
  moduleCoverage: z.array(z.object({ key: z.string(), count: z.number() })),
  safeFailures: z.array(
    z.object({
      key: z.string(),
      reason: z.string(),
      module: z.string().optional(),
    }),
  ),
  accounts: z.array(Account),
});
const Target = z.strictObject({
  datasetId: z.string().min(1).max(64),
  expectedVersion: z.number().int().nonnegative(),
});
const Import = z.strictObject({
  locale: z.enum(['zh-CN', 'en-US']),
  expectedVersion: z.number().int().nonnegative(),
  requestKey: z.string().min(1).max(128),
});
const Remove = Target.extend({
  previewToken: z.string().uuid(),
  requestKey: z.string().min(1).max(128),
});
export default [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const auth = app.container.resolve(authenticationToken),
      authz = app.container.resolve(authorizationToken),
      service = app.container.resolve(demoDataServiceToken);
    router.use('/demoData', auth.required(), authz.middleware());
    router.use('/demoData/*', auth.required(), authz.middleware());
    const description = (
      operationId: string,
      summary: string,
      schema: z.ZodType,
      status = 200,
    ) =>
      describeRoute({
        tags: ['DemoData'],
        operationId,
        summary,
        responses: { [status]: dataResponse(schema), ...apiErrorResponses },
      });
    router.get(
      '/demoData/presence',
      description(
        'getDemoDataPresence',
        'Get demo data presence',
        z.object({ present: z.boolean(), busy: z.boolean() }),
      ),
      async (c) => c.json({ data: await service.presence() }),
    );
    router.get(
      '/demoData',
      description('getDemoData', 'Get demo data management status', Status),
      async (c) => {
        await c.get('authz').require({
          resource: { type: 'settings', id: DEMO_SETTINGS },
          action: 'read',
        });
        return c.json({ data: await service.status() });
      },
    );
    router.post(
      '/demoData/import',
      description(
        'importDemoData',
        'Import or resume fictional business data',
        Status.extend({ operationId: z.string() }),
        202,
      ),
      apiValidator('json', Import),
      async (c) => {
        await c.get('authz').require({
          resource: { type: 'settings', id: DEMO_SETTINGS },
          action: 'import',
        });
        return c.json(
          {
            data: await service.import(
              c.req.valid('json'),
              c.get('auth')!.user.id,
            ),
          },
          202,
        );
      },
    );
    router.post(
      '/demoData/removePreview',
      description(
        'previewDemoDataRemoval',
        'Check references before removing a demo dataset',
        z.object({
          previewToken: z.string(),
          records: z.number(),
          accounts: z.number(),
          blocked: z.boolean(),
          version: z.number(),
        }),
      ),
      apiValidator('json', Target),
      async (c) => {
        await c.get('authz').require({
          resource: { type: 'settings', id: DEMO_SETTINGS },
          action: 'remove',
        });
        return c.json({ data: await service.preview(c.req.valid('json')) });
      },
    );
    router.post(
      '/demoData/remove',
      description(
        'removeDemoData',
        'Remove dataset-owned demo data',
        Status.extend({ operationId: z.string() }),
        202,
      ),
      apiValidator('json', Remove),
      async (c) => {
        await c.get('authz').require({
          resource: { type: 'settings', id: DEMO_SETTINGS },
          action: 'remove',
        });
        return c.json(
          {
            data: await service.remove(
              c.req.valid('json'),
              c.get('auth')!.user.id,
            ),
          },
          202,
        );
      },
    );
    router.post(
      '/demoData/credentials',
      description(
        'getDemoDataCredentials',
        'Explicitly reveal demo sign-in credentials',
        z.object({
          accounts: z.array(Account.extend({ password: z.string() })),
        }),
      ),
      apiValidator('json', Target),
      async (c) => {
        await c.get('authz').require({
          resource: { type: 'settings', id: DEMO_SETTINGS },
          action: 'credentials',
        });
        c.header('Cache-Control', 'no-store');
        const i = c.req.valid('json');
        return c.json({
          data: await service.credentials(i.datasetId, i.expectedVersion),
        });
      },
    );
    return new Hono().route('/', router);
  }),
];
