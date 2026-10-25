import type { Application } from '@nocobase/app-server/application';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import {
  ApiError,
  apiErrorHandler,
  apiValidator,
  defineApiRoutes,
  describeRoute,
  dataResponse,
  apiErrorResponses,
} from '@nocobase/app-server/router';
import { bodyLimit } from 'hono/body-limit';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { hrMasterDataToken } from '../../providers/hr-master-data/index.js';
import { Batch, Source } from '../../providers/hr-master-data/schema.js';
import type { SyncAccess } from '../../providers/hr-master-data/service.js';
export default [
  defineApiRoutes<Application>((app) => {
    const r = new Hono<AuthEnv & AuthorizationEnv>();
    r.use(
      '/hrMasterData/*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
      bodyLimit({
        maxSize: 128 * 1024,
        onError: () => {
          throw new ApiError({
            status: 'INVALID_ARGUMENT',
            domain: 'hrMasterData',
            reason: 'BODY_TOO_LARGE',
            message: 'The synchronization batch is too large.',
          });
        },
      }),
    );
    r.onError(apiErrorHandler);
    const service = app.container.resolve(hrMasterDataToken);
    const documentation = (operationId: string) =>
      describeRoute({
        tags: ['HR integration'],
        operationId,
        responses: { 200: dataResponse(z.unknown()), ...apiErrorResponses },
      });
    async function access(
      ctx: Context<AuthEnv & AuthorizationEnv>,
      operation: 'read' | 'sync' | 'manage',
    ): Promise<SyncAccess> {
      const authz = ctx.get('authz');
      await authz.require({
        resource: { type: 'settings', id: 'oa.hrMasterData' },
        action: operation,
      });
      const manage = await authz.can({
        resource: { type: 'settings', id: 'oa.hrMasterData' },
        action: 'manage',
      });
      const result: SyncAccess = {
        actorId: ctx.get('auth')!.user.id,
        manage,
        departments: false,
        grades: false,
      };
      if (operation === 'sync') {
        result.departments = await authz.can({
          resource: { type: 'settings', id: 'oa.org.departments' },
          action: 'update',
        });
        result.grades = await authz.can({
          resource: { type: 'settings', id: 'oa.org.grades' },
          action: 'update',
        });
        for (const [key, action] of [
          ['employees', 'manage'],
          ['status', 'correctStatus'],
        ] as const) {
          const decision = await authz.authorize({
            resource: { type: 'composite', id: 'oa.employees.archive' },
            action,
          });
          if (decision.effect !== 'deny')
            result[key] = decision.conditions?.database?.employees;
        }
      }
      return result;
    }
    r.get(
      '/hrMasterData/sources',
      documentation('listHrSyncSources'),
      async (ctx) =>
        ctx.json({ data: await service.sources(await access(ctx, 'read')) }),
    );
    r.put(
      '/hrMasterData/sources',
      documentation('saveHrSyncSource'),
      apiValidator('json', Source),
      async (ctx) =>
        ctx.json({
          data: await service.saveSource(
            ctx.req.valid('json'),
            await access(ctx, 'manage'),
          ),
        }),
    );
    r.get(
      '/hrMasterData/batches',
      documentation('listHrSyncBatches'),
      apiValidator('query', z.object({ source: z.string().min(1).max(80) })),
      async (ctx) =>
        ctx.json({
          data: await service.batches(
            ctx.req.valid('query').source,
            await access(ctx, 'read'),
          ),
        }),
    );
    r.post(
      '/hrMasterData/batches',
      documentation('receiveHrSyncBatch'),
      apiValidator('json', Batch),
      async (ctx) =>
        ctx.json({
          data: await service.run(
            ctx.req.valid('json'),
            await access(ctx, 'sync'),
          ),
        }),
    );
    r.post(
      '/hrMasterData/batches/:id/replay',
      documentation('replayHrSyncBatch'),
      async (ctx) =>
        ctx.json({
          data: await service.replay(
            ctx.req.param('id'),
            await access(ctx, 'sync'),
          ),
        }),
    );
    r.get(
      '/hrMasterData/mappings',
      documentation('listHrSyncMappings'),
      apiValidator(
        'query',
        z.object({
          source: z.string().min(1).max(80),
          externalId: z.string().max(160).optional(),
        }),
      ),
      async (ctx) =>
        ctx.json({
          data: await service.mappings(
            ctx.req.valid('query').source,
            await access(ctx, 'manage'),
            ctx.req.valid('query').externalId,
          ),
        }),
    );
    r.post(
      '/hrMasterData/mappings/:id/reclaim',
      documentation('reclaimHrSyncMapping'),
      apiValidator(
        'json',
        z.object({ reason: z.string().trim().min(1).max(500) }).strict(),
      ),
      async (ctx) =>
        ctx.json({
          data: await service.reclaim(
            ctx.req.param('id'),
            ctx.req.valid('json').reason,
            await access(ctx, 'sync'),
          ),
        }),
    );
    return new Hono().route('/', r);
  }),
];
