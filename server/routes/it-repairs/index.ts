import type { NotificationConfig } from '@nocobase/app-plugin-notification';
import { employeeServiceToken } from '../../providers/employees/contract.js';
import { assetServiceToken } from '../../providers/assets/contract.js';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { bodyLimit } from 'hono/body-limit';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import {
  authenticationToken,
  userAdministrationServiceToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken } from '@nocobase/db';
import {
  repairServiceToken,
  RepairError,
  fail,
} from '../../providers/it-repairs/index.js';
import attachments from './attachments.js';
type Env = AuthEnv & AuthorizationEnv;
const command = z
  .object({
    requestKey: z.string().min(1).max(100),
    expectedVersion: z.number().int().min(1).optional(),
  })
  .strict();
const draft = z
  .object({
    title: z.string().max(120),
    description: z.string().max(5000),
    category: z.string().max(32),
    impact: z.string().max(32),
    location: z.string().max(200),
    contact: z.string().max(200),
    occurredAt: z.iso.datetime({ offset: true }).nullable(),
    assetId: z.string().max(64).nullable(),
  })
  .strict();
export default [
  defineApiRoutes<Application>((app) => {
    const r = new Hono<Env>(),
      c = app.container,
      db = c.resolve(databaseManagerToken),
      service = c.resolve(repairServiceToken);
    r.use(
      '/itRepairs/*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    r.use(
      '/itRepairs',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    r.onError((e, ctx) =>
      apiErrorHandler(
        e instanceof RepairError
          ? new ApiError({
              domain: 'itRepairs',
              reason: e.code,
              message: e.code,
              status:
                e.code === 'ACCESS_DENIED'
                  ? 'PERMISSION_DENIED'
                  : e.code.includes('CONFLICT')
                    ? 'ABORTED'
                    : 'INVALID_ARGUMENT',
              ...(e.field
                ? { fieldViolations: [{ field: e.field, description: e.code }] }
                : {}),
            })
          : e,
        ctx,
      ),
    );
    const actor = (ctx: Context<Env>) => ctx.get('auth')!.user.id;
    async function policy(ctx: Context<Env>, action: string) {
      const decision = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.itRepairs' },
        action,
      });
      const p =
        decision.effect === 'deny'
          ? undefined
          : decision.conditions?.database?.itRepairs;
      if (!p) fail('ACCESS_DENIED');
      return p;
    }
    async function settings(ctx: Context<Env>, action: string) {
      const decision = await ctx.get('authz').authorize({
        resource: { type: 'settings', id: 'oa.itRepairGroups' },
        action,
      });
      if (decision.effect !== 'permit') fail('ACCESS_DENIED');
    }
    const response = { 200: dataResponse(z.unknown()), ...apiErrorResponses };
    const query = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
        q: z.string().max(120).default(''),
        status: z.enum(['draft', 'triage']).optional(),
        sort: z.enum(['createdAt', 'updatedAt']).default('updatedAt'),
        direction: z.enum(['asc', 'desc']).default('desc'),
      })
      .strict();
    r.get(
      '/itRepairs',
      describeRoute({
        summary: 'List authorized IT repairs',
        responses: response,
      }),
      apiValidator('query', query),
      async (ctx) => {
        const q = ctx.req.valid('query');
        return ctx.json({
          data: await service.list(
            actor(ctx),
            await policy(ctx, 'view'),
            q.page,
            q.pageSize,
            q.q,
            q.status,
            q.sort,
            q.direction,
          ),
        });
      },
    );
    r.get(
      '/itRepairs/diagnostics',
      describeRoute({
        summary: 'Read repair notification health without business records',
        responses: response,
      }),
      async (ctx) => {
        await settings(ctx, 'read');
        const name = app.config.get<{ inbox: string | null }>(
          'oaApprovals',
        )?.inbox;
        const channel = name
          ? app.config.get<NotificationConfig>('notification')?.channels[name]
          : undefined;
        return ctx.json({
          data: {
            ...(await service.notificationHealth()),
            configured:
              !!channel &&
              channel.enabled !== false &&
              (channel.type ?? channel.provider) === 'in-app',
          },
        });
      },
    );
    r.get(
      '/itRepairs/calendar',
      describeRoute({
        summary: 'Read versioned repair working windows',
        responses: response,
      }),
      async (ctx) => {
        await settings(ctx, 'read');
        return ctx.json({ data: await service.calendarConfiguration() });
      },
    );
    r.post(
      '/itRepairs/calendar',
      describeRoute({
        summary: 'Change repair working windows for new submissions',
        responses: response,
      }),
      apiValidator(
        'json',
        z
          .object({
            requestKey: z.string().min(1).max(100),
            expectedRevision: z.string().length(64),
            windows: z.tuple([
              z
                .object({
                  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
                  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
                })
                .strict(),
              z
                .object({
                  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
                  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
                })
                .strict(),
            ]),
          })
          .strict(),
      ),
      async (ctx) => {
        await settings(ctx, 'update');
        const input = ctx.req.valid('json');
        return ctx.json({
          data: await service.configureCalendar(
            { actorId: actor(ctx), requestKey: input.requestKey },
            input.expectedRevision,
            input.windows,
          ),
        });
      },
    );
    r.get(
      '/itRepairs/groupCandidates',
      describeRoute({
        summary: 'Search eligible service-group members',
        responses: response,
      }),
      apiValidator(
        'query',
        z
          .object({
            q: z.string().max(120).default(''),
            pageSize: z.coerce.number().int().min(1).max(100).default(20),
            status: z.literal('enabled').optional(),
          })
          .strict(),
      ),
      async (ctx) => {
        await settings(ctx, 'read');
        const q = ctx.req.valid('query');
        const users = await c
          .resolve(userAdministrationServiceToken)
          .list({ search: q.q, pageSize: q.pageSize, status: 'enabled' });
        const employees = await c
          .resolve(employeeServiceToken)
          .getByUserIds(users.items.map((u) => u.id));
        return ctx.json({
          data: users.items
            .filter((u) => {
              const e = employees.get(u.id);
              return e?.active && e.status !== 'left';
            })
            .map((u) => ({ id: u.id, name: u.name, email: '' })),
          meta: { page: 1, pageSize: q.pageSize, total: users.total },
        });
      },
    );
    r.get(
      '/itRepairs/groups',
      describeRoute({
        summary: 'Read IT service group configuration',
        responses: response,
      }),
      async (ctx) => {
        await settings(ctx, 'read');
        return ctx.json({
          data: await db.repository('itRepairGroups').findMany(),
        });
      },
    );
    r.post(
      '/itRepairs/groups/:id',
      describeRoute({
        summary: 'Configure an IT service group',
        responses: response,
      }),
      apiValidator(
        'param',
        z.object({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/) }),
      ),
      apiValidator(
        'json',
        z
          .object({
            requestKey: z.string().min(1).max(100),
            expectedVersion: z.number().int().min(0),
            title: z.string().trim().min(1).max(120),
            leaderIds: z.array(z.string().max(64)).max(100),
            engineerIds: z.array(z.string().max(64)).max(1000),
            categories: z.array(
              z.enum(['device', 'network', 'software', 'account', 'other']),
            ),
            active: z.boolean(),
          })
          .strict(),
      ),
      async (ctx) => {
        await settings(ctx, 'update');
        const { requestKey, expectedVersion, ...g } = ctx.req.valid('json');
        const id = ctx.req.valid('param').id;
        return ctx.json({
          data: await service.configure(
            { actorId: actor(ctx), id, requestKey, expectedVersion },
            { id, ...g },
          ),
        });
      },
    );
    r.get(
      '/itRepairs/assets',
      describeRoute({
        summary: 'List held assets eligible for repair',
        responses: response,
      }),
      apiValidator('query', query),
      async (ctx) => {
        await policy(ctx, 'create');
        const decision = await ctx.get('authz').authorize({
          resource: { type: 'composite', id: 'oa.assets' },
          action: 'viewHeld',
        });
        const p =
          decision.effect !== 'deny'
            ? decision.conditions?.database?.assets
            : undefined;
        if (!p) fail('ACCESS_DENIED');
        const employee = await c
          .resolve(employeeServiceToken)
          .getByUserId(actor(ctx));
        if (!employee) fail('ACCESS_DENIED');
        const q = ctx.req.valid('query');
        const list = await c
          .resolve(assetServiceToken)
          .list({ ...q, holderEmployeeId: employee.id }, db.connection(), p);
        return ctx.json({
          data: {
            items: list.rows.map((row) => ({
              id: row.id,
              code: row.code,
              name: row.name,
            })),
            total: list.total,
          },
        });
      },
    );
    r.get(
      '/itRepairs/:id',
      describeRoute({
        summary: 'Read an authorized IT repair',
        responses: response,
      }),
      apiValidator('param', z.object({ id: z.uuid() })),
      async (ctx) => {
        const row = await service.get(
          ctx.req.valid('param').id,
          actor(ctx),
          await policy(ctx, 'view'),
        );
        let assetLabel: string | null = null;
        if (row.assetId) {
          const decision = await ctx.get('authz').authorize({
            resource: { type: 'composite', id: 'oa.assets' },
            action: 'viewHeld',
          });
          const p =
            decision.effect === 'deny'
              ? undefined
              : decision.conditions?.database?.assets;
          if (p) {
            const asset = await c
              .resolve(assetServiceToken)
              .read(row.assetId, db.connection(), p);
            if (asset?.name && asset.code)
              assetLabel = `${asset.code} · ${asset.name}`;
          }
        }
        return ctx.json({ data: { ...row, assetLabel } });
      },
    );
    r.post(
      '/itRepairs/save',
      describeRoute({
        summary: 'Save an IT repair draft',
        responses: response,
      }),
      apiValidator('json', command.extend({ id: z.uuid().optional(), draft })),
      async (ctx) => {
        const { draft, ...input } = ctx.req.valid('json');
        return ctx.json({
          data: await service.save(
            { ...input, actorId: actor(ctx) },
            draft,
            await policy(ctx, input.id ? 'edit' : 'create'),
          ),
        });
      },
    );
    r.post(
      '/itRepairs/:id/submit',
      describeRoute({
        summary: 'Submit an IT repair for triage',
        responses: response,
      }),
      apiValidator('param', z.object({ id: z.uuid() })),
      apiValidator(
        'json',
        command.extend({ expectedVersion: z.number().int().min(1) }),
      ),
      async (ctx) => {
        const p = await policy(ctx, 'submit');
        const asset = await ctx.get('authz').authorize({
          resource: { type: 'composite', id: 'oa.assets' },
          action: 'viewHeld',
        });
        return ctx.json({
          data: await service.submit(
            {
              ...ctx.req.valid('json'),
              id: ctx.req.valid('param').id,
              actorId: actor(ctx),
            },
            p,
            asset.effect !== 'deny'
              ? asset.conditions?.database?.assets
              : undefined,
          ),
        });
      },
    );
    r.post(
      '/itRepairs/:id/upload',
      describeRoute({
        summary: 'Upload private fault material',
        responses: response,
      }),
      apiValidator('param', z.object({ id: z.uuid() })),
      apiValidator(
        'header',
        z.object({
          'x-request-key': z.string().min(1).max(100),
          'x-expected-version': z.coerce.number().int().min(1),
        }),
      ),
      bodyLimit({
        maxSize: 20 * 1024 * 1024 + 65536,
        onError: () => {
          throw new RepairError('INVALID_ATTACHMENT');
        },
      }),
      async (ctx) => {
        const p = await policy(ctx, 'edit');
        const form = await ctx.req.raw.formData();
        const files = form.getAll('file');
        if (files.length !== 1 || !(files[0] instanceof File))
          fail('INVALID_ATTACHMENT');
        const result = await service.upload(
          {
            id: ctx.req.valid('param').id,
            actorId: actor(ctx),
            requestKey: ctx.req.valid('header')['x-request-key'],
            expectedVersion: ctx.req.valid('header')['x-expected-version'],
          },
          files[0],
          p,
        );
        return ctx.json({
          data: {
            ...result,
            file: {
              ...result.file,
              contentUrl: `${(app.publicBasePath ?? '').replace(/\/$/, '')}${result.file.contentUrl}`,
            },
          },
        });
      },
    );
    const mount = new Hono();
    mount.route('/', r);
    return mount;
  }),
  ...attachments,
];
