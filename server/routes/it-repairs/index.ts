import { getReportTranslator } from '../reports/i18n.js';
import { stream as streamResponse } from 'hono/streaming';
import { SUMMARY_FIELDS } from '../../providers/it-repairs/reporting.js';
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
import { STATES, ACTIONS } from '../../providers/it-repairs/handling.js';
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
                e.code === 'REPORTS_PREPARING'
                  ? 'UNAVAILABLE'
                  : e.code === 'ACCESS_DENIED'
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
        status: z.enum(STATES).optional(),
        groupId: z.string().max(64).optional(),
        assigneeId: z.string().max(64).optional(),
        category: z.string().max(32).optional(),
        priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
        from: z.iso.datetime({ offset: true }).optional(),
        to: z.iso.datetime({ offset: true }).optional(),
        dateField: z
          .enum([
            'submittedAt',
            'createdAt',
            'updatedAt',
            'firstRespondedAt',
            'metricEndedAt',
          ])
          .optional(),
        overdue: z.enum(['all', 'response', 'solution', 'either']).optional(),
        cohort: z
          .enum([
            'submitted',
            'responses',
            'responseMet',
            'userClosed',
            'solutionMet',
            'managementClosed',
            'cancelled',
            'currentOpen',
            'responseOverdue',
            'solutionOverdue',
            'rated',
            'waiting',
          ])
          .optional(),
        sort: z
          .enum([
            'createdAt',
            'updatedAt',
            'submittedAt',
            'responseDueAt',
            'resolutionDueAt',
            'priority',
          ])
          .default('updatedAt'),
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
        validateRange(q);
        return ctx.json({
          data: await service.query.list(
            actor(ctx),
            await policy(ctx, 'view'),
            q.page,
            q.pageSize,
            q,
          ),
        });
      },
    );
    async function queryPolicy(ctx: Context<Env>, action: string) {
      const view = await policy(ctx, 'view'),
        operation = await policy(ctx, action);
      return db
        .repository('itRepairs')
        .withPolicy(operation)
        .narrow(view)
        .explainPolicy();
    }
    function validateRange(q: { from?: string; to?: string }) {
      if (q.from && q.to && +new Date(q.from) >= +new Date(q.to))
        fail('INVALID_INPUT', 'to');
    }
    r.get(
      '/itRepairs/queryOptions',
      describeRoute({
        summary: 'Read authorized repair filter choices',
        responses: response,
      }),
      async (ctx) =>
        ctx.json({
          data: await service.queryOptions(
            actor(ctx),
            await policy(ctx, 'view'),
          ),
        }),
    );
    r.get(
      '/itRepairs/reports',
      describeRoute({
        summary: 'Read scoped repair operating statistics',
        responses: response,
      }),
      apiValidator('query', query),
      async (ctx) => {
        const q = ctx.req.valid('query');
        validateRange(q);
        return ctx.json({
          data: await service.query.reports(
            actor(ctx),
            await queryPolicy(ctx, 'reports'),
            q,
          ),
        });
      },
    );
    r.post(
      '/itRepairs/export',
      describeRoute({
        summary:
          'Export the authorized public repair cohort and audit the request',
        responses: response,
      }),
      apiValidator(
        'json',
        z
          .object({ requestKey: z.string().min(1).max(100), query: query })
          .strict(),
      ),
      async (ctx) => {
        const { requestKey, query: q } = ctx.req.valid('json');
        validateRange(q);
        const p = await queryPolicy(ctx, 'export');
        await service.auditExport(actor(ctx), requestKey, q, p);
        const { t } = await getReportTranslator(app, ctx);
        const options = await service.queryOptions(actor(ctx), p);
        const columns = SUMMARY_FIELDS.filter(
          (k) => !['id', 'requesterId', 'version'].includes(k),
        );
        ctx.header('Content-Type', 'text/csv; charset=utf-8');
        ctx.header(
          'Content-Disposition',
          'attachment; filename="it-repairs.csv"',
        );
        ctx.header('Cache-Control', 'no-store');
        const csv = (value: unknown) => {
          let v =
            value === null || value === undefined
              ? ''
              : value instanceof Date
                ? value.toISOString()
                : typeof value === 'string'
                  ? value
                  : typeof value === 'number' || typeof value === 'boolean'
                    ? String(value)
                    : '';
          if (/^\s*[=+\-@]|^[\t\r]/.test(v)) v = "'" + v;
          return '"' + v.replaceAll('"', '""') + '"';
        };
        return streamResponse(ctx, async (stream) => {
          await stream.write(
            '\uFEFF' +
              columns
                .map((k) =>
                  csv(
                    t(
                      k === 'title'
                        ? 'itRepairs.titleField'
                        : k === 'number'
                          ? 'itRepairs.number'
                          : k === 'status'
                            ? 'itRepairs.status'
                            : `itRepairs.query.${k}`,
                    ),
                  ),
                )
                .join(',') +
              '\r\n',
          );
          let after: string | undefined;
          while (!stream.aborted) {
            const { repo, filter } = await service.query.prepare(
              actor(ctx),
              p,
              q,
            );
            const rows = await repo.findMany({
              filter,
              select: (s) => s.fields(...SUMMARY_FIELDS),
              sort: (s) => s.field('id').asc(),
              cursor: after ? { id: after } : undefined,
              direction: after ? 'forward' : undefined,
              limit: 100,
            });
            if (!rows.length) break;
            for (const row of rows)
              await stream.write(
                columns
                  .map((k) =>
                    csv(
                      k === 'status'
                        ? t(`itRepairs.states.${String(row[k])}`)
                        : k === 'category'
                          ? t(`itRepairs.options.${String(row[k])}`)
                          : k === 'groupId'
                            ? (options.groups.find((g) => g.id === row[k])
                                ?.title ?? '')
                            : k === 'assigneeId'
                              ? (options.engineers.find((e) => e.id === row[k])
                                  ?.name ?? '')
                              : row[k],
                    ),
                  )
                  .join(',') + '\r\n',
              );
            after = rows.at(-1)!.id;
            if (rows.length < 100) break;
          }
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
            security: z.boolean().optional(),
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
    r.post(
      '/itRepairs/groups/:id/recoverRouting',
      describeRoute({
        summary: 'Recover a bounded batch of unassigned triage repairs',
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
            expectedVersion: z.number().int().min(1),
          })
          .strict(),
      ),
      async (ctx) => {
        await settings(ctx, 'update');
        return ctx.json({
          data: await service.recoverRouting({
            actorId: actor(ctx),
            id: ctx.req.valid('param').id,
            ...ctx.req.valid('json'),
          }),
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
        const explicit = await ctx.get('authz').authorize({
          resource: { type: 'composite', id: 'oa.assets' },
          action: 'reportRepair',
        });
        const ep =
          explicit.effect !== 'deny'
            ? explicit.conditions?.database?.assets
            : undefined;
        if (!p && !ep) fail('ACCESS_DENIED');
        const employee = await c
          .resolve(employeeServiceToken)
          .getByUserId(actor(ctx));
        if (!employee) fail('ACCESS_DENIED');
        const q = ctx.req.valid('query');
        const owner = c.resolve(assetServiceToken);
        const held = p
          ? await owner.list(
              { ...q, holderEmployeeId: employee.id },
              db.connection(),
              p,
            )
          : { rows: [], total: 0 };
        const extra = ep
          ? await owner.list(q, db.connection(), ep)
          : { rows: [], total: 0 };
        const unique = [
          ...new Map(
            [...held.rows, ...extra.rows]
              .filter((a) => a.status !== 'scrapped')
              .map((a) => [a.id, a]),
          ).values(),
        ];
        const list = {
          rows: unique.slice(0, q.pageSize),
          total: held.total + extra.total,
        };
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
          for (const action of ['viewHeld', 'reportRepair']) {
            const decision = await ctx.get('authz').authorize({
              resource: { type: 'composite', id: 'oa.assets' },
              action,
            });
            const p =
              decision.effect === 'deny'
                ? undefined
                : decision.conditions?.database?.assets;
            if (!p) continue;
            const asset = await c
              .resolve(assetServiceToken)
              .read(row.assetId, db.connection(), p);
            if (asset?.name && asset.code) {
              assetLabel = `${asset.code} · ${asset.name}`;
              break;
            }
          }
        }
        return ctx.json({
          data: {
            ...(await service.present(row, actor(ctx))),
            ...((await service.fullAccess(row, actor(ctx)))
              ? { assetLabel }
              : {}),
          },
        });
      },
    );
    r.get(
      '/itRepairs/:id/handling',
      describeRoute({
        summary: 'Read scoped handling context',
        responses: response,
      }),
      apiValidator('param', z.object({ id: z.uuid() })),
      apiValidator(
        'query',
        z.object({
          historyPage: z.coerce.number().int().min(1).max(10000).default(1),
        }),
      ),
      async (ctx) => {
        const result = await service.handling(
          ctx.req.valid('param').id,
          actor(ctx),
          await policy(ctx, 'view'),
          ctx.req.valid('query').historyPage,
        );
        const sourcePolicies: Record<
          string,
          import('@nocobase/db').RepositoryPolicy | undefined
        > = {};
        for (const [kind, resource, collection] of [
          ['purchase', 'oa.purchase', 'purchaseRequests'],
          ['expensePlan', 'oa.expensePlan', 'expensePlans'],
        ] as const) {
          const decision = await ctx.get('authz').authorize({
            resource: { type: 'composite', id: resource },
            action: 'view',
          });
          sourcePolicies[kind] =
            decision.effect === 'deny'
              ? undefined
              : decision.conditions?.database?.[collection];
        }
        const references = await service.referenceSummaries(
          ctx.req.valid('param').id,
          actor(ctx),
          await policy(ctx, 'view'),
          sourcePolicies,
        );
        const actions = [];
        for (const action of result.actions) {
          try {
            await policy(ctx, action);
            actions.push(action);
          } catch {
            /* No grant means no control. */
          }
        }
        return ctx.json({ data: { ...result, actions, references } });
      },
    );
    r.post(
      '/itRepairs/:id/actions',
      describeRoute({
        summary: 'Perform a versioned repair action',
        responses: response,
      }),
      apiValidator('param', z.object({ id: z.uuid() })),
      apiValidator(
        'json',
        command.extend({
          expectedVersion: z.number().int().min(1),
          action: z.enum(ACTIONS),
          data: z.record(z.string(), z.unknown()),
        }),
      ),
      async (ctx) => {
        const { action, data, ...input } = ctx.req.valid('json');
        let referencePolicy;
        if (action === 'link') {
          const kind =
            data.kind === 'purchase'
              ? ['oa.purchase', 'purchaseRequests']
              : data.kind === 'expensePlan'
                ? ['oa.expensePlan', 'expensePlans']
                : null;
          if (!kind) fail('INVALID_INPUT', 'kind');
          const decision = await ctx.get('authz').authorize({
            resource: { type: 'composite', id: kind[0] },
            action: 'view',
          });
          referencePolicy =
            decision.effect !== 'deny'
              ? decision.conditions?.database?.[kind[1]]
              : undefined;
          if (!referencePolicy) fail('ACCESS_DENIED');
        }
        return ctx.json({
          data: await service.act(
            { ...input, id: ctx.req.valid('param').id, actorId: actor(ctx) },
            action,
            data,
            await policy(ctx, action),
            referencePolicy,
          ),
        });
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
        const explicit = await ctx.get('authz').authorize({
          resource: { type: 'composite', id: 'oa.assets' },
          action: 'reportRepair',
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
            explicit.effect !== 'deny'
              ? explicit.conditions?.database?.assets
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
          'x-file-purpose': z
            .enum(['fault', 'processing', 'resolution'])
            .default('fault'),
          'x-file-visibility': z.enum(['public', 'internal']).default('public'),
        }),
      ),
      bodyLimit({
        maxSize: 20 * 1024 * 1024 + 65536,
        onError: () => {
          throw new RepairError('INVALID_ATTACHMENT');
        },
      }),
      async (ctx) => {
        const headers = ctx.req.valid('header');
        const current = await service.get(
          ctx.req.valid('param').id,
          actor(ctx),
          await policy(ctx, 'view'),
        );
        const p = await policy(
          ctx,
          current.status === 'draft'
            ? 'edit'
            : headers['x-file-visibility'] === 'internal'
              ? 'internal'
              : 'comment',
        );
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
          {
            purpose: headers['x-file-purpose'],
            visibility: headers['x-file-visibility'],
          },
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
