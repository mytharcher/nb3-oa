import { employeeServiceToken } from '../../providers/employees/contract.js';
import { Hono, type Context } from 'hono';
import {
  authenticationToken,
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
  RepositoryError,
  type RepositoryPolicy,
} from '@nocobase/db';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import { assetServiceToken, AssetError } from '../../providers/assets/index.js';
import {
  Params,
  ListQuery,
  CreateInput,
  UpdateInput,
  AssetSchema,
  Meta,
  ReturnHeldInput,
  ReturnHeldReceipt,
} from './schemas.js';
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      service = c.resolve(assetServiceToken),
      db = c.resolve(databaseManagerToken),
      i18n = c.resolve(i18nToken);
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    router.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    router.onError(async (error, ctx) => {
      const denied =
        error instanceof RepositoryError &&
        error.status === 'PERMISSION_DENIED';
      if (!(error instanceof AssetError) && !denied)
        return apiErrorHandler(error, ctx);
      const reason = denied
        ? 'ASSET_ACCESS_DENIED'
        : error instanceof AssetError
          ? error.code
          : 'ASSET_ACCESS_DENIED';
      const locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      const message = i18n.getFixedT('nb3-oa', locale)(
        `assets.errors.${reason}`,
        { defaultValue: error.message },
      );
      return apiErrorHandler(
        new ApiError({
          status:
            denied ||
            (error instanceof AssetError && error.kind === 'permission')
              ? 'PERMISSION_DENIED'
              : error instanceof AssetError && error.kind === 'notFound'
                ? 'NOT_FOUND'
                : error instanceof AssetError && error.kind === 'conflict'
                  ? 'ABORTED'
                  : 'INVALID_ARGUMENT',
          domain: 'assets',
          reason,
          message: error.message,
          localizedMessage: { locale, message },
          metadata: { ns: 'nb3-oa', key: `assets.errors.${reason}` },
          cause: error,
        }),
        ctx,
      );
    });
    async function policy(
      ctx: Context<AuthEnv & AuthorizationEnv>,
      action: 'view' | 'viewHeld' | 'manage' | 'returnHeld',
      required = true,
    ): Promise<RepositoryPolicy | undefined> {
      const decision = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.assets' },
        action,
      });
      const scoped =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.assets;
      if (!scoped && required)
        throw new AssetError(
          'ASSET_ACCESS_DENIED',
          'No grant permits this asset operation.',
          'permission',
        );
      return scoped || undefined;
    }
    async function readPolicy(ctx: Context<AuthEnv & AuthorizationEnv>) {
      const full =
        (await policy(ctx, 'view', false)) ??
        (await policy(ctx, 'manage', false));
      if (full) return { policy: full, holderEmployeeId: undefined };
      const scoped = (await policy(ctx, 'viewHeld'))!;
      const employee = await c
        .resolve(employeeServiceToken)
        .getByUserId(ctx.get('auth')!.user.id);
      // A configurable grant scope may widen record access. This business endpoint always requires actual self custody for viewHeld.
      return { policy: scoped, holderEmployeeId: employee?.id ?? null };
    }
    const doc = (
      operationId: string,
      summary: string,
      list = false,
      create = false,
    ) =>
      describeRoute({
        tags: ['Assets'],
        operationId,
        summary,
        responses: {
          [create ? '201' : '200']: list
            ? listResponse(AssetSchema, Meta)
            : dataResponse(AssetSchema),
          ...apiErrorResponses,
        },
      });
    router.get(
      '/',
      doc('listAssets', 'List authorized asset fields', true),
      apiValidator('query', ListQuery),
      async (ctx) => {
        const query = ctx.req.valid('query'),
          access = await readPolicy(ctx);
        const result =
          access.holderEmployeeId === null
            ? { rows: [], total: 0 }
            : await service.list(
                { ...query, holderEmployeeId: access.holderEmployeeId },
                db.connection(),
                access.policy,
              );
        return ctx.json({
          data: result.rows,
          meta: { ...query, total: result.total },
        });
      },
    );
    router.get(
      '/:assetId',
      doc('getAsset', 'Read authorized asset fields'),
      apiValidator('param', Params),
      async (ctx) => {
        const access = await readPolicy(ctx);
        const data =
          access.holderEmployeeId === null
            ? null
            : await service.read(
                ctx.req.valid('param').assetId,
                db.connection(),
                access.policy,
                access.holderEmployeeId,
              );
        if (!data)
          throw new AssetError(
            'ASSET_NOT_FOUND',
            'Asset not found.',
            'notFound',
          );
        return ctx.json({ data });
      },
    );
    router.post(
      '/returnHeld',
      describeRoute({
        tags: ['Assets'],
        operationId: 'returnHeldAsset',
        summary: 'Confirm physical return of a legacy held asset',
        responses: {
          '200': dataResponse(ReturnHeldReceipt),
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', ReturnHeldInput),
      async (ctx) => {
        const scoped = (await policy(ctx, 'returnHeld'))!;
        const data = await db.transaction((tx) =>
          service.returnHeld(
            { ...ctx.req.valid('json'), actorId: ctx.get('auth')!.user.id },
            tx,
            scoped,
          ),
        );
        return ctx.json({ data });
      },
    );
    router.post(
      '/',
      doc('createAsset', 'Record an available asset', false, true),
      apiValidator('json', CreateInput),
      async (ctx) => {
        const scoped = (await policy(ctx, 'manage'))!;
        const data = await db.transaction(async (tx) => {
          const row = await service.create(
            { ...ctx.req.valid('json'), actorId: ctx.get('auth')!.user.id },
            tx,
            scoped,
          );
          return service.read(row.id, tx, scoped);
        });
        return ctx.json({ data }, 201);
      },
    );
    router.patch(
      '/:assetId',
      doc('updateAsset', 'Correct asset descriptive fields'),
      apiValidator('param', Params),
      apiValidator('json', UpdateInput),
      async (ctx) => {
        const scoped = (await policy(ctx, 'manage'))!;
        const data = await db.transaction(async (tx) => {
          const row = await service.update(
            ctx.req.valid('param').assetId,
            { ...ctx.req.valid('json'), actorId: ctx.get('auth')!.user.id },
            tx,
            scoped,
          );
          return service.read(row.id, tx, scoped);
        });
        return ctx.json({ data });
      },
    );
    const root = new Hono();
    root.route('/assets', router);
    return root;
  }),
];
