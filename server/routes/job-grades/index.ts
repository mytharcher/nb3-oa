import { calendarServiceToken } from '../../providers/platform/index.js';
import { salaryGradeServiceToken } from '../../providers/job-grades/contract.js';
import { SalaryTableError } from '../../providers/job-grades/service.js';
import { SalaryRangeError } from '../../providers/job-grades/ranges.js';
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
import {
  databaseManagerToken,
  type RepositoryPolicy,
  RepositoryError,
} from '@nocobase/db';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  apiValidator,
  apiErrorResponses,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import * as S from './schemas.js';
type Env = AuthEnv & AuthorizationEnv;
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      db = c.resolve(databaseManagerToken),
      users = c.resolve(userAdministrationServiceToken),
      calendar = c.resolve(calendarServiceToken),
      i18n = c.resolve(i18nToken);
    const r = new Hono<Env>();
    // This isolated router owns only salary-grade paths; its wildcard cannot protect unrelated routes.
    r.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    r.onError(async (error, ctx) => {
      const reason =
        error instanceof SalaryTableError || error instanceof SalaryRangeError
          ? error.reason
          : error instanceof RepositoryError &&
              error.status === 'PERMISSION_DENIED'
            ? 'ACCESS_DENIED'
            : undefined;
      if (!reason) return apiErrorHandler(error, ctx);
      const locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      return apiErrorHandler(
        new ApiError({
          domain: 'salaryGrades',
          reason,
          status:
            reason === 'ACCESS_DENIED'
              ? 'PERMISSION_DENIED'
              : ['VERSION_CONFLICT', 'IDEMPOTENCY_CONFLICT'].includes(reason)
                ? 'ABORTED'
                : [
                      'INVALID_RANGE',
                      'DUPLICATE_GRADE',
                      'INVALID_PUBLICATION',
                      'OUTSIDE_RANGE',
                    ].includes(reason)
                  ? 'INVALID_ARGUMENT'
                  : 'FAILED_PRECONDITION',
          message: i18n.getFixedT(
            'nb3-oa',
            locale,
          )(`jobGrades.errors.${reason}`),
        }),
        ctx,
      );
    });
    async function fail(
      ctx: Context<Env>,
      reason: 'ACCESS_DENIED' | 'NOT_FOUND',
    ): Promise<never> {
      const locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      throw new ApiError({
        domain: 'salaryGrades',
        reason,
        status: reason === 'ACCESS_DENIED' ? 'PERMISSION_DENIED' : 'NOT_FOUND',
        message: i18n.getFixedT('nb3-oa', locale)(`jobGrades.errors.${reason}`),
      });
    }
    async function policies(
      ctx: Context<Env>,
      action: 'view' | 'viewSalary' | 'manage',
    ) {
      const decision = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.salaryGrades' },
        action,
      });
      const value =
        decision.effect === 'deny'
          ? undefined
          : (decision.conditions?.database as
              Record<string, RepositoryPolicy | false> | undefined);
      if (
        !value?.salaryGradeRevisions ||
        (action !== 'view' && !value.salaryGradeCurrent)
      )
        return fail(ctx, 'ACCESS_DENIED');
      return value as Record<string, RepositoryPolicy>;
    }
    async function dto(
      ctx: Context<Env>,
      row: Record<string, unknown>,
      privateFields: boolean,
    ) {
      const required = [
        'id',
        'version',
        'createdById',
        'createdAt',
        ...(privateFields ? ['bands', 'reason'] : []),
      ];
      if (required.some((field) => !Object.hasOwn(row, field)))
        return fail(ctx, 'ACCESS_DENIED');
      if (
        typeof row.createdById !== 'string' ||
        !(typeof row.createdAt === 'string' || row.createdAt instanceof Date)
      )
        return fail(ctx, 'ACCESS_DENIED');
      const value = {
        id: row.id,
        version: row.version,
        createdBy: {
          id: row.createdById,
          name: (await users.get(row.createdById))?.name ?? row.createdById,
        },
        createdAt: new Date(row.createdAt).toISOString(),
        ...(privateFields
          ? {
              bands: row.bands,
              reason: row.reason,
              timeZone: calendar.timeZone(),
            }
          : {}),
      };
      return privateFields
        ? S.TimedRevision.parse(value)
        : S.Metadata.parse(value);
    }
    r.post(
      '/',
      describeRoute({
        tags: ['SalaryGrades'],
        operationId: 'publishSalaryGradeTable',
        summary:
          'Publish one immutable salary grade table with actor-bound durable replay and atomic audit',
        responses: { 201: dataResponse(S.TimedRevision), ...apiErrorResponses },
      }),
      apiValidator('json', S.PublishInput),
      async (ctx) => {
        const p = await policies(ctx, 'manage'),
          input = ctx.req.valid('json');
        const row = await db.transaction(async (tx) => {
          const pointer = await tx
            .repository('salaryGradeCurrent')
            .withPolicy(p.salaryGradeCurrent)
            .findOne({ filter: { id: 'current' } });
          if (
            !pointer ||
            !Object.hasOwn(pointer, 'version') ||
            !Object.hasOwn(pointer, 'revisionId')
          )
            return fail(ctx, 'ACCESS_DENIED');
          const published = await c
            .resolve(salaryGradeServiceToken)
            .publish({ ...input, actorId: ctx.get('auth')!.user.id }, tx, {
              pointer: p.salaryGradeCurrent,
              revision: p.salaryGradeRevisions,
            });
          const visible = await tx
            .repository('salaryGradeRevisions')
            .withPolicy(p.salaryGradeRevisions)
            .findOne({ filter: { id: published.id } });
          if (
            !visible ||
            [
              'id',
              'version',
              'createdById',
              'createdAt',
              'bands',
              'reason',
            ].some((field) => !Object.hasOwn(visible, field))
          )
            return fail(ctx, 'ACCESS_DENIED');
          return visible;
        });
        // Resolve publisher on the released connection; a failed response can replay the same durable request key.
        return ctx.json({ data: await dto(ctx, row, true) }, 201);
      },
    );
    r.get(
      '/',
      describeRoute({
        tags: ['SalaryGrades'],
        operationId: 'listSalaryGradeHistory',
        summary:
          'List authorized publication metadata without salary bands or freeform reasons',
        responses: {
          200: listResponse(S.Metadata, S.ListMeta),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', S.ListQuery),
      async (ctx) => {
        const p = await policies(ctx, 'view'),
          q = ctx.req.valid('query');
        const repository = db
          .repository('salaryGradeRevisions')
          .withPolicy(p.salaryGradeRevisions);
        const version = /^\d+$/.test(q.search) ? Number(q.search) : NaN;
        const filter = !q.search
          ? undefined
          : Number.isSafeInteger(version) && version > 0
            ? { version }
            : { version: -1 };
        const total = await repository.count({ filter });
        const rows = await repository.findMany({
          filter,
          sort: (sort) => [
            q.direction === 'asc'
              ? sort.field(q.sort).asc()
              : sort.field(q.sort).desc(),
            ...(q.sort === 'version' ? [] : [sort.field('version').desc()]),
          ],
          limit: q.pageSize,
          offset: (q.page - 1) * q.pageSize,
        });
        return ctx.json({
          data: await Promise.all(rows.map((row) => dto(ctx, row, false))),
          meta: {
            page: q.page,
            pageSize: q.pageSize,
            total,
            timeZone: calendar.timeZone(),
          },
        });
      },
    );
    r.get(
      '/current',
      describeRoute({
        tags: ['SalaryGrades'],
        operationId: 'readCurrentSalaryGradeTable',
        summary:
          'Read private current salary ranges through record and field policies',
        responses: { 200: dataResponse(S.Current), ...apiErrorResponses },
      }),
      async (ctx) => {
        const p = await policies(ctx, 'viewSalary');
        const data = await db.transaction(async (tx) => {
          const pointer = await tx
            .repository('salaryGradeCurrent')
            .withPolicy(p.salaryGradeCurrent)
            .findOne({ filter: { id: 'current' } });
          if (
            !pointer ||
            !Object.hasOwn(pointer, 'version') ||
            !Object.hasOwn(pointer, 'revisionId')
          )
            return fail(ctx, 'ACCESS_DENIED');
          if (pointer.revisionId === null)
            return { version: pointer.version, revision: null };
          if (typeof pointer.revisionId !== 'string')
            return fail(ctx, 'ACCESS_DENIED');
          const row = await tx
            .repository('salaryGradeRevisions')
            .withPolicy(p.salaryGradeRevisions)
            .findOne({ filter: { id: pointer.revisionId } });
          if (!row) return fail(ctx, 'ACCESS_DENIED');
          if (row.version !== pointer.version)
            return fail(ctx, 'ACCESS_DENIED');
          return { version: pointer.version, revision: row };
        });
        // User administration reads use the normal connection; resolve names only after the source transaction releases it.
        return ctx.json({
          data: S.Current.parse({
            version: data.version,
            revision: data.revision
              ? await dto(ctx, data.revision, true)
              : null,
          }),
        });
      },
    );
    r.get(
      '/:revisionId',
      describeRoute({
        tags: ['SalaryGrades'],
        operationId: 'readSalaryGradeRevision',
        summary: 'Read an authorized immutable private salary revision',
        responses: { 200: dataResponse(S.TimedRevision), ...apiErrorResponses },
      }),
      apiValidator('param', S.RevisionParams),
      async (ctx) => {
        const p = await policies(ctx, 'viewSalary');
        const row = await db
          .repository('salaryGradeRevisions')
          .withPolicy(p.salaryGradeRevisions)
          .findOne({ filter: { id: ctx.req.valid('param').revisionId } });
        if (!row) return fail(ctx, 'NOT_FOUND');
        return ctx.json({ data: await dto(ctx, row, true) });
      },
    );
    const root = new Hono();
    root.route('/salaryGradeTables', r);
    return root;
  }),
];
