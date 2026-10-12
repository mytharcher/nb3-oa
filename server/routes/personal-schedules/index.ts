import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
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
import { databaseManagerToken, RepositoryError } from '@nocobase/db';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import {
  personalScheduleServiceToken,
  PersonalScheduleError,
  type PersonalSchedule,
} from '../../providers/personal-schedules/index.js';
import * as S from './schemas.js';
type Env = AuthEnv & AuthorizationEnv;
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      db = c.resolve(databaseManagerToken),
      service = c.resolve(personalScheduleServiceToken),
      r = new Hono<Env>();
    r.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    r.onError(async (e, ctx) => {
      if (
        e instanceof RepositoryError &&
        [
          'SCOPE_VIOLATION',
          'RECORD_OUTSIDE_SCOPE',
          'RECORD_NOT_FOUND',
          'WRITE_FORBIDDEN',
          'READ_FORBIDDEN',
          'FIELD_WRITE_FORBIDDEN',
          'FIELD_READ_FORBIDDEN',
        ].includes(e.code)
      )
        e = new PersonalScheduleError('ACCESS_DENIED');
      if (!(e instanceof PersonalScheduleError)) return apiErrorHandler(e, ctx);
      const i18n = c.resolve(i18nToken),
        locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      return apiErrorHandler(
        new ApiError({
          domain: 'personalSchedules',
          reason: e.code,
          message: e.code,
          status:
            e.code === 'ACCESS_DENIED'
              ? 'PERMISSION_DENIED'
              : e.code === 'NOT_FOUND'
                ? 'NOT_FOUND'
                : e.code === 'VERSION_CONFLICT'
                  ? 'ABORTED'
                  : 'INVALID_ARGUMENT',
          localizedMessage: {
            locale,
            message: i18n.getFixedT(
              'nb3-oa',
              locale,
            )(`personalSchedules.errors.${e.code}`),
          },
        }),
        ctx,
      );
    });
    const actor = (ctx: Context<Env>) => ctx.get('auth')!.user.id;
    async function policy(ctx: Context<Env>, action: string) {
      const d = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.personalSchedules' },
        action,
      });
      const p =
        d.effect === 'deny'
          ? undefined
          : d.conditions?.database?.personalSchedules;
      if (!p) throw new PersonalScheduleError('ACCESS_DENIED');
      return p;
    }
    async function dto(row: PersonalSchedule) {
      const owner = await c
        .resolve(userAdministrationServiceToken)
        .get(row.ownerUserId);
      return S.Schedule.parse({
        ...row,
        owner: { id: row.ownerUserId, name: owner?.name ?? '' },
        startAt: new Date(row.startAt).toISOString(),
        endAt: new Date(row.endAt).toISOString(),
      });
    }
    const doc = (operationId: string, list = false) =>
      describeRoute({
        tags: ['Personal schedules'],
        operationId,
        summary: operationId,
        responses: {
          200: list ? listResponse(S.Schedule) : dataResponse(S.Schedule),
          ...apiErrorResponses,
          400: apiErrorResponse(400),
          404: apiErrorResponse(404),
          409: apiErrorResponse(409),
        },
      });
    r.get('/', doc('listOwnPersonalSchedules', true), async (ctx) => {
      const rows = await service.list(
        actor(ctx),
        db.connection(),
        await policy(ctx, 'view'),
      );
      return ctx.json({ data: await Promise.all(rows.map(dto)) });
    });
    r.get(
      '/:id',
      doc('getOwnPersonalSchedule'),
      apiValidator('param', S.Params),
      async (ctx) =>
        ctx.json({
          data: await dto(
            await service.get(
              ctx.req.valid('param').id,
              actor(ctx),
              db.connection(),
              await policy(ctx, 'view'),
            ),
          ),
        }),
    );
    r.post(
      '/',
      doc('createOwnPersonalSchedule'),
      apiValidator('json', S.Input),
      async (ctx) =>
        ctx.json({
          data: await dto(
            await service.create(
              ctx.req.valid('json'),
              actor(ctx),
              db.connection(),
              await policy(ctx, 'create'),
            ),
          ),
        }),
    );
    r.patch(
      '/:id',
      doc('editOwnPersonalSchedule'),
      apiValidator('param', S.Params),
      apiValidator('json', S.Edit),
      async (ctx) => {
        const { expectedVersion, ...input } = ctx.req.valid('json');
        return ctx.json({
          data: await dto(
            await service.edit(
              ctx.req.valid('param').id,
              expectedVersion,
              input,
              actor(ctx),
              db.connection(),
              await policy(ctx, 'edit'),
            ),
          ),
        });
      },
    );
    r.delete(
      '/:id',
      describeRoute({
        tags: ['Personal schedules'],
        operationId: 'deleteOwnPersonalSchedule',
        summary: 'Delete own personal schedule',
        responses: {
          204: { description: 'Deleted' },
          ...apiErrorResponses,
          400: apiErrorResponse(400),
          404: apiErrorResponse(404),
          409: apiErrorResponse(409),
        },
      }),
      apiValidator('param', S.Params),
      apiValidator('json', S.Remove),
      async (ctx) => {
        await service.remove(
          ctx.req.valid('param').id,
          ctx.req.valid('json').expectedVersion,
          actor(ctx),
          db.connection(),
          await policy(ctx, 'delete'),
        );
        return ctx.body(null, 204);
      },
    );
    const mount = new Hono();
    mount.route('/personalSchedules', r);
    return mount;
  }),
];
