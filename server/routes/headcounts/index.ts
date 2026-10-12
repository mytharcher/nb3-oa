import { createHash } from 'node:crypto';
import { Hono, type Context } from 'hono';
import {
  authenticationToken,
  userAdministrationServiceToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import {
  databaseManagerToken,
  type RepositoryPolicy,
  type DatabaseConnection,
  RepositoryError,
  normalizeRepositoryPolicy,
} from '@nocobase/db';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import {
  headcountServiceToken,
  HeadcountError,
} from '../../providers/headcounts/index.js';
import * as S from './schemas.js';
import { admitsCandidate } from './candidate-scope.js';
import { organizationServiceToken } from '../../providers/org/index.js';
import { calendarServiceToken } from '../../providers/platform/index.js';
import type { HeadcountBalance } from '../../providers/headcounts/contract.js';
type HeadcountEnv = AuthEnv &
  AuthorizationEnv & {
    Variables: {
      headcountPolicies: {
        action: string;
        value: Record<string, RepositoryPolicy>;
      };
    };
  };
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      db = c.resolve(databaseManagerToken),
      service = c.resolve(headcountServiceToken),
      i18n = c.resolve(i18nToken);
    const organization = c.resolve(organizationServiceToken);
    async function view(value: HeadcountBalance) {
      const [department, positions] = await Promise.all([
        organization.getDepartment(value.departmentId),
        organization.listPositions(),
      ]);
      const position = positions.find((p) => p.id === value.positionId);
      return S.BalanceView.parse({
        ...value,
        department: department
          ? { id: department.id, name: department.title }
          : null,
        position: position ? { id: position.id, name: position.title } : null,
      });
    }
    const r = new Hono<HeadcountEnv>();
    r.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    r.onError(async (error, ctx) => {
      if (
        !(error instanceof HeadcountError) &&
        !(
          error instanceof RepositoryError &&
          error.status === 'PERMISSION_DENIED'
        )
      )
        return apiErrorHandler(error, ctx);
      const denied =
          error instanceof RepositoryError &&
          error.status === 'PERMISSION_DENIED',
        code =
          error instanceof HeadcountError
            ? error.code
            : denied
              ? 'HEADCOUNT_ACCESS_DENIED'
              : 'HEADCOUNT_ACCESS_DENIED';
      const locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      const message = i18n.getFixedT('nb3-oa', locale)(
        `headcounts.errors.${code}`,
        { defaultValue: error.message },
      );
      return apiErrorHandler(
        new ApiError({
          domain: 'headcounts',
          reason: code,
          status:
            denied || code.includes('ACCESS_DENIED')
              ? 'PERMISSION_DENIED'
              : code.includes('NOT_FOUND')
                ? 'NOT_FOUND'
                : code === 'HEADCOUNT_ALREADY_EXISTS'
                  ? 'ALREADY_EXISTS'
                  : code.includes('CONFLICT')
                    ? 'ABORTED'
                    : code.includes('INVALID')
                      ? 'INVALID_ARGUMENT'
                      : 'FAILED_PRECONDITION',
          message: error.message,
          localizedMessage: { locale, message },
          metadata: { ns: 'nb3-oa', key: `headcounts.errors.${code}` },
          cause: error,
        }),
        ctx,
      );
    });
    async function policies(
      ctx: Context<HeadcountEnv>,
      action: 'view' | 'manage' | 'viewJournal',
    ) {
      const cached = ctx.get('headcountPolicies');
      if (cached?.action === action) return cached.value;
      const d = await ctx.get('authz').authorize({
          resource: { type: 'composite', id: 'oa.headcounts' },
          action,
        }),
        p =
          d.effect === 'deny'
            ? undefined
            : (d.conditions?.database as
                Record<string, RepositoryPolicy | false> | undefined);
      if (
        !p?.headcountAccounts ||
        (action === 'viewJournal' && !p.headcountJournal)
      )
        throw new HeadcountError(
          'HEADCOUNT_ACCESS_DENIED',
          'This headcount operation is not authorized.',
        );
      const value = p as Record<string, RepositoryPolicy>;
      ctx.set('headcountPolicies', { action, value });
      return value;
    }
    async function ensureUpdateScope(
      tx: DatabaseConnection,
      policy: RepositoryPolicy,
      id: string,
      changes: Record<string, unknown>,
    ) {
      const update = normalizeRepositoryPolicy(policy).update;
      if (!update)
        throw new HeadcountError(
          'HEADCOUNT_ACCESS_DENIED',
          'Account updates are not authorized.',
        );
      const row = await tx
        .repository('headcountAccounts')
        .withPolicy({
          read:
            update === true
              ? true
              : {
                  scope: update.scope,
                  fields: [
                    'id',
                    'departmentId',
                    'positionId',
                    'year',
                    'limit',
                    'initialized',
                    'version',
                    'createdAt',
                    'updatedAt',
                  ],
                },
          create: false,
          update: false,
          delete: false,
        })
        .findOne({ filter: { id } });
      if (
        !row ||
        !admitsCandidate(update === true ? true : update.scope, {
          ...row,
          ...changes,
        })
      )
        throw new HeadcountError(
          'HEADCOUNT_ACCESS_DENIED',
          'The account or resulting values are outside the update scope.',
        );
    }
    const guard =
      (action: 'view' | 'manage' | 'viewJournal') =>
      async (ctx: Context<HeadcountEnv>, next: () => Promise<void>) => {
        await policies(ctx, action);
        await next();
      };
    const doc = (id: string, summary: string, list = false) =>
      describeRoute({
        tags: ['Headcounts'],
        operationId: id,
        summary,
        responses: {
          '200': list
            ? listResponse(S.BalanceView, S.Meta)
            : dataResponse(S.BalanceView),
          ...apiErrorResponses,
        },
      });
    r.get(
      '/',
      guard('view'),
      doc('listHeadcounts', 'List authorized annual headcount balances', true),
      apiValidator('query', S.ListQuery),
      async (ctx) => {
        const q = ctx.req.valid('query'),
          p = await policies(ctx, 'view'),
          result = await service.list(q, db.connection(), p.headcountAccounts);
        return ctx.json({
          data: await Promise.all(result.items.map(view)),
          meta: { ...q, total: result.total },
        });
      },
    );
    r.post(
      '/',
      guard('manage'),
      describeRoute({
        tags: ['Headcounts'],
        operationId: 'createHeadcountAccount',
        summary: 'Create an uninitialized annual headcount account',
        responses: {
          '201': dataResponse(S.BalanceView),
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', S.CreateInput),
      async (ctx) => {
        const input = ctx.req.valid('json'),
          p = await policies(ctx, 'manage');
        const value = await db.transaction(async (tx) => {
          const checked = await tx
            .repository('headcountAccounts')
            .withPolicy(p.headcountAccounts)
            .validateMutation({
              operation: 'createOne',
              values: {
                departmentId: input.departmentId,
                positionId: input.positionId,
                year: input.year,
                limit: input.limit,
                id: createHash('sha256')
                  .update(
                    JSON.stringify([
                      input.departmentId,
                      input.positionId,
                      input.year,
                    ]),
                  )
                  .digest('hex'),
                initialized: false,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          if (!checked.valid)
            throw new HeadcountError(
              'HEADCOUNT_ACCESS_DENIED',
              'The write is outside the authorized scope or fields.',
            );
          const created = await service.create(
            { ...input, actorId: ctx.get('auth')!.user.id },
            tx,
            p.headcountAccounts,
          );
          // Replays re-check present record access before returning their immutable receipt.
          if (!(await service.balance(created.id, tx, p.headcountAccounts)))
            throw new HeadcountError(
              'HEADCOUNT_ACCESS_DENIED',
              'The account lies outside the current authorized scope.',
            );
          return created;
        });
        return ctx.json({ data: await view(value) }, 201);
      },
    );
    r.get(
      '/createOptions',
      guard('manage'),
      describeRoute({
        tags: ['Headcounts'],
        operationId: 'headcountCreateOptions',
        summary:
          'List currently authorized annual account targets without writing',
        responses: {
          '200': dataResponse(S.CreateOptions),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', S.CreateOptionsQuery),
      async (ctx) => {
        const p = await policies(ctx, 'manage'),
          input = ctx.req.valid('query');
        const year =
          input.year ??
          Number(
            c.resolve(calendarServiceToken).localDate(new Date()).slice(0, 4),
          );
        const normalized = normalizeRepositoryPolicy(p.headcountAccounts);
        const read = normalized.read;
        if (
          !read ||
          (read !== true &&
            ![
              'id',
              'departmentId',
              'positionId',
              'year',
              'limit',
              'initialized',
              'version',
              'createdAt',
              'updatedAt',
            ].every(
              (k) => Array.isArray(read.fields) && read.fields.includes(k),
            ))
        )
          throw new HeadcountError(
            'HEADCOUNT_FIELD_ACCESS_DENIED',
            'Complete account fields are required.',
          );
        const targets: {
          department: { id: string; name: string };
          position: { id: string; name: string };
        }[] = [];
        await db.transaction(async (tx) => {
          const repo = tx
            .repository('headcountAccounts')
            .withPolicy(p.headcountAccounts);
          for (const department of await organization.listTree(tx)) {
            if (!(await organization.activeChain(department.id, tx))) continue;
            for (const position of (
              await organization.listPositions(tx)
            ).filter((p) => p.active)) {
              const values = {
                id: createHash('sha256')
                  .update(JSON.stringify([department.id, position.id, year]))
                  .digest('hex'),
                departmentId: department.id,
                positionId: position.id,
                year,
                limit: input.limit,
                initialized: false,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              if (
                (
                  await repo.validateMutation({
                    operation: 'createOne',
                    values,
                  })
                ).valid &&
                !!normalized.create &&
                admitsCandidate(
                  normalized.create === true ? true : normalized.create.scope,
                  values,
                ) &&
                admitsCandidate(read === true ? true : read.scope, values)
              )
                targets.push({
                  department: { id: department.id, name: department.title },
                  position: { id: position.id, name: position.title },
                });
            }
          }
        });
        return ctx.json({ data: S.CreateOptions.parse({ year, targets }) });
      },
    );
    r.get(
      '/:accountId/reconciliationPreview',
      guard('manage'),
      describeRoute({
        tags: ['Headcounts'],
        operationId: 'headcountReconciliationPreview',
        summary:
          'Read the complete independently authorized minimal actual roster',
        responses: {
          '200': dataResponse(S.RosterPreview),
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', S.Params),
      async (ctx) => {
        const p = await policies(ctx, 'manage'),
          id = ctx.req.valid('param').accountId;
        const decision = await ctx.get('authz').authorize({
          resource: { type: 'composite', id: 'oa.employees.archive' },
          action: 'view',
        });
        const employeePolicy =
          decision.effect !== 'deny'
            ? decision.conditions?.database?.employees
            : undefined;
        if (!employeePolicy)
          throw new HeadcountError(
            'HEADCOUNT_ROSTER_ACCESS_DENIED',
            'The complete employee roster is not readable.',
          );
        const result = await db.transaction((tx) =>
          service.within(tx, async (locked) => {
            const a = await service.balance(id, locked, p.headcountAccounts);
            if (!a)
              throw new HeadcountError(
                'HEADCOUNT_NOT_FOUND',
                'Account not found.',
              );
            await ensureUpdateScope(locked, p.headcountAccounts, id, {
              initialized: true,
            });
            const checked = await locked
              .repository('headcountAccounts')
              .withPolicy(p.headcountAccounts)
              .validateMutation({
                operation: 'updateOne',
                filter: { id },
                values: {
                  initialized: true,
                  version: a.version + 1,
                  updatedAt: new Date(),
                },
              });
            if (!checked.valid)
              throw new HeadcountError(
                'HEADCOUNT_ACCESS_DENIED',
                'Initialization fields are not writable.',
              );
            return {
              version: a.version,
              initialized: a.initialized,
              employees: await service.roster(id, locked, employeePolicy),
            };
          }),
        );
        return ctx.json({ data: S.RosterPreview.parse(result) });
      },
    );
    r.get(
      '/:accountId',
      guard('view'),
      doc('getHeadcountAccount', 'Read an authorized headcount account'),
      apiValidator('param', S.Params),
      async (ctx) => {
        const p = await policies(ctx, 'view'),
          value = await service.balance(
            ctx.req.valid('param').accountId,
            db.connection(),
            p.headcountAccounts,
          );
        if (!value)
          throw new HeadcountError(
            'HEADCOUNT_NOT_FOUND',
            'Headcount account not found.',
          );
        return ctx.json({ data: await view(value) });
      },
    );
    r.get(
      '/:accountId/journal',
      guard('viewJournal'),
      describeRoute({
        tags: ['Headcounts'],
        operationId: 'listHeadcountJournal',
        summary: 'Read authorized immutable headcount source events',
        responses: {
          '200': listResponse(S.JournalSchema, S.Meta),
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', S.Params),
      apiValidator('query', S.ListQuery),
      async (ctx) => {
        const p = await policies(ctx, 'viewJournal'),
          id = ctx.req.valid('param').accountId;
        if (!(await service.balance(id, db.connection(), p.headcountAccounts)))
          throw new HeadcountError(
            'HEADCOUNT_NOT_FOUND',
            'Headcount account not found.',
          );
        const q = ctx.req.valid('query');
        const result = await service.journal(
            id,
            db.connection(),
            p.headcountJournal,
            q,
          ),
          ids = [...new Set(result.items.map((v) => String(v.actorId)))];
        const users = ids.length
            ? (
                await c
                  .resolve(userAdministrationServiceToken)
                  .list({ userIds: ids, pageSize: 100, kind: 'all' })
              ).items
            : [],
          names = new Map(users.map((u) => [u.id, u.name]));
        return ctx.json({
          meta: { page: q.page, pageSize: q.pageSize, total: result.total },
          data: await Promise.all(
            result.items.map(async (v) =>
              S.JournalSchema.parse({
                sourceLink: await sourceLink(ctx, v.evidence),
                ...v,
                actor: {
                  id: v.actorId,
                  name: names.get(String(v.actorId)) ?? String(v.actorId),
                },
              }),
            ),
          ),
        });
      },
    );
    r.post(
      '/:accountId/reconcile',
      guard('manage'),
      doc(
        'reconcileHeadcountAccount',
        'Verify the complete real employee roster and initialize occupancy',
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.ReconcileInput),
      async (ctx) => {
        const id = ctx.req.valid('param').accountId,
          input = ctx.req.valid('json'),
          p = await policies(ctx, 'manage');
        const value = await db.transaction(async (tx) => {
          const repo = tx
            .repository('headcountAccounts')
            .withPolicy(p.headcountAccounts);
          if (!(await repo.exists({ filter: { id } })))
            throw new HeadcountError(
              'HEADCOUNT_NOT_FOUND',
              'Headcount account not found.',
            );
          await ensureUpdateScope(tx, p.headcountAccounts, id, {
            initialized: true,
          });
          const checked = await repo.validateMutation({
            operation: 'updateOne',
            filter: { id },
            values: {
              initialized: true,
              version: input.expectedVersion + 1,
              updatedAt: new Date(),
            },
          });
          if (!checked.valid)
            throw new HeadcountError(
              'HEADCOUNT_ACCESS_DENIED',
              'The write is outside the authorized scope or fields.',
            );
          return service.reconcile(
            { ...input, accountId: id, actorId: ctx.get('auth')!.user.id },
            tx,
          );
        });
        return ctx.json({ data: await view(value) });
      },
    );
    r.patch(
      '/:accountId',
      guard('manage'),
      doc(
        'adjustHeadcountLimit',
        'Adjust the annual limit with version and audit',
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.AdjustInput),
      async (ctx) => {
        const id = ctx.req.valid('param').accountId,
          input = ctx.req.valid('json'),
          p = await policies(ctx, 'manage');
        const value = await db.transaction(async (tx) => {
          const repo = tx
            .repository('headcountAccounts')
            .withPolicy(p.headcountAccounts);
          if (!(await repo.exists({ filter: { id } })))
            throw new HeadcountError(
              'HEADCOUNT_NOT_FOUND',
              'Headcount account not found.',
            );
          await ensureUpdateScope(tx, p.headcountAccounts, id, {
            limit: input.limit,
          });
          const checked = await repo.validateMutation({
            operation: 'updateOne',
            filter: { id },
            values: {
              limit: input.limit,
              version: input.expectedVersion + 1,
              updatedAt: new Date(),
            },
          });
          if (!checked.valid)
            throw new HeadcountError(
              'HEADCOUNT_ACCESS_DENIED',
              'The write is outside the authorized scope or fields.',
            );
          return service.adjustLimit(
            { ...input, accountId: id, actorId: ctx.get('auth')!.user.id },
            tx,
          );
        });
        return ctx.json({ data: await view(value) });
      },
    );
    async function sourceLink(ctx: Context<HeadcountEnv>, evidence: unknown) {
      const source = (
        evidence as { source?: { kind?: string; id?: string } } | null
      )?.source;
      if (!source?.id || !source.kind) return null;
      const target =
        source.kind === 'oa.recruitment'
          ? {
              resource: 'oa.recruitment',
              collection: 'recruitmentRequests',
              path: '/recruitment-requests',
            }
          : source.kind === 'oa.transfer'
            ? {
                resource: 'oa.transfer',
                collection: 'transferRequests',
                path: '/personnel-changes',
              }
            : null;
      if (!target) return null;
      const decision = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: target.resource },
        action: 'view',
      });
      const policy =
        decision.effect !== 'deny'
          ? decision.conditions?.database?.[target.collection]
          : undefined;
      if (!policy) return null;
      const record = await db
        .repository(target.collection)
        .withPolicy(policy)
        .findOne({ filter: { id: source.id } });
      return record?.id
        ? {
            kind: source.kind,
            id: source.id,
            path: `${target.path}/${encodeURIComponent(source.id)}`,
          }
        : null;
    }
    const mount = new Hono();
    mount.route('/headcounts', r);
    return mount;
  }),
];
