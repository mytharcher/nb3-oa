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
  defineApiRoutes,
  describeRoute,
  apiValidator,
  dataResponse,
  apiErrorResponses,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { LifecycleError, lifecycleErrorFields } from '@nocobase/lifecycle';
import { ApprovalError } from '@nocobase/app-plugin-approval/server';
import {
  databaseManagerToken,
  type RepositoryPolicy,
  type DatabaseConnection,
} from '@nocobase/db';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import { vehicleRequestServiceToken } from '../../providers/vehicles/index.js';
import { VehicleError } from '../../providers/vehicles/errors.js';
import { approvalDirectoryServiceToken } from '../../providers/approval-directory/contract.js';
import * as s from './schemas.js';
import { registerVehicleBrowserRoutes } from './browser.js';
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>(),
      c = app.container,
      service = c.resolve(vehicleRequestServiceToken),
      db = c.resolve(databaseManagerToken);
    for (const path of [
      '/vehicleBrowser/*',
      '/vehicleRequests',
      '/vehicleRequests/*',
      '/vehicles',
      '/vehicles/*',
      '/vehicleDrivers',
      '/vehicleDrivers/*',
    ])
      router.use(
        path,
        c.resolve(authenticationToken).required(),
        c.resolve(authorizationToken).middleware(),
      );
    router.onError(async (error, context) => {
      const i18n = c.resolve(i18nToken),
        locale = getRequestLocale(context) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      const translate = (key: string) =>
        i18n.getFixedT('nb3-oa', locale)(`vehicles.errors.${key}`);
      if (error instanceof VehicleError)
        return apiErrorHandler(
          new ApiError({
            status: error.code.includes('NOT_FOUND')
              ? 'NOT_FOUND'
              : error.code.includes('DENIED') ||
                  error.code.includes('RESTRICTED') ||
                  error.code.includes('NOT_OFFERED')
                ? 'PERMISSION_DENIED'
                : error.code.includes('REUSED') ||
                    error.code.includes('CONFLICT')
                  ? 'ABORTED'
                  : 'FAILED_PRECONDITION',
            domain: 'vehicles',
            reason: error.code,
            message: translate(
              error instanceof VehicleError
                ? error.code
                : 'VEHICLE_APPROVAL_REFUSED',
            ),
          }),
          context,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'vehicles' }) : error,
          context,
        );
      }
      if (error instanceof ApprovalError)
        return apiErrorHandler(
          new ApiError({
            status: [
              'NOT_ALLOWED',
              'NOT_ASSIGNEE',
              'NOT_IN_POOL',
              'NOT_QUALIFIED',
              'INACTIVE',
            ].includes(error.code)
              ? 'PERMISSION_DENIED'
              : 'FAILED_PRECONDITION',
            domain: 'vehicles',
            reason: error.code,
            message: translate(
              error instanceof VehicleError
                ? error.code
                : 'VEHICLE_APPROVAL_REFUSED',
            ),
          }),
          context,
        );
      return apiErrorHandler(error, context);
    });
    const actor = (context: Context<AuthEnv & AuthorizationEnv>) =>
      context.get('auth')!.user.id;
    async function policy(
      context: Context<AuthEnv & AuthorizationEnv>,
      resource: string,
      action: string,
      collection: string,
    ): Promise<RepositoryPolicy> {
      const decision = await context
        .get('authz')
        .authorize({ resource: { type: 'composite', id: resource }, action });
      const p =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.[collection];
      if (!p)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'vehicles',
          reason: 'VEHICLE_ACCESS_DENIED',
          message: c
            .resolve(i18nToken)
            .getFixedT(
              'nb3-oa',
              getRequestLocale(context) ??
                c.resolve(i18nToken).getDefaultLocale(),
            )('vehicles.errors.VEHICLE_ACCESS_DENIED'),
        });
      return p;
    }
    const description = (id: string, summary: string, response: z.ZodType) =>
      describeRoute({
        operationId: id,
        summary,
        tags: ['Vehicles'],
        responses: {
          200: dataResponse(response),
          ...apiErrorResponses,
        },
      });
    async function projectedWrite(
      tx: DatabaseConnection,
      p: RepositoryPolicy,
      collection: string,
      write: () => Promise<{ id: string }>,
    ) {
      const result = await write();
      const row = await tx
        .repository(collection)
        .withPolicy(p)
        .findOne({ filter: { id: result.id } });
      if (!row)
        throw new VehicleError(
          'VEHICLE_FIELDS_RESTRICTED',
          'The resulting garage record must be readable.',
        );
      return row;
    }
    registerVehicleBrowserRoutes(router, app);
    router.get(
      '/vehicleRequests',
      description(
        'listVehicleRequests',
        'List readable vehicle requests',
        s.List,
      ),
      apiValidator('query', s.Query),
      async (context) => {
        const p = await policy(
            context,
            'oa.vehicleRequests',
            'view',
            'vehicleRequests',
          ),
          q = context.req.valid('query'),
          repo = db.repository('vehicleRequests').withPolicy(p);
        return context.json({
          data: {
            items: await repo.findMany({
              offset: (q.page - 1) * q.pageSize,
              limit: q.pageSize,
            }),
            total: await repo.count(),
          },
        });
      },
    );
    router.post(
      '/vehicleRequests',
      description(
        'createVehicleRequest',
        'Create a vehicle request draft',
        s.Result,
      ),
      apiValidator('json', s.CreateInput),
      async (context) => {
        const p = await policy(
          context,
          'oa.vehicleRequests',
          'submit',
          'vehicleRequests',
        );
        const { requestId, ...input } = context.req.valid('json');
        return context.json({
          data: await service.create(input, actor(context), p, requestId),
        });
      },
    );
    router.get(
      '/vehicleRequests/:id',
      description(
        'getVehicleRequest',
        'Read a vehicle request and offered operations',
        s.Detail,
      ),
      apiValidator('param', s.Params),
      async (context) => {
        return context.json({
          data: await service.detail(
            context.req.valid('param').id,
            actor(context),
            await policy(
              context,
              'oa.vehicleRequests',
              'view',
              'vehicleRequests',
            ),
          ),
        });
      },
    );
    router.post(
      '/vehicleRequests/:id/transitions',
      description(
        'transitionVehicleRequest',
        'Edit, submit, withdraw or terminate a vehicle request',
        s.Result,
      ),
      apiValidator('param', s.Params),
      apiValidator('json', s.Transition),
      async (context) => {
        const p = await policy(
            context,
            'oa.vehicleRequests',
            'view',
            'vehicleRequests',
          ),
          body = context.req.valid('json'),
          mutation = await policy(
            context,
            'oa.vehicleRequests',
            body.transition === 'terminate' ? 'operate' : 'submit',
            'vehicleRequests',
          );
        return context.json({
          data: await service.transition(
            context.req.valid('param').id,
            body.transition,
            actor(context),
            body.version,
            body.requestId,
            'input' in body ? body.input : {},
            p,
            body.transition === 'terminate' ? undefined : mutation,
          ),
        });
      },
    );
    router.post(
      '/vehicleRequests/:id/actions',
      description(
        'performVehicleRequestAction',
        'Perform an actual offered approval or handling operation',
        s.ActionResult,
      ),
      apiValidator('param', s.Params),
      apiValidator('json', s.Action),
      async (context) => {
        const p = await policy(
            context,
            'oa.vehicleRequests',
            'operate',
            'vehicleRequests',
          ),
          body = context.req.valid('json');
        const { privateInput, ...input } =
          'privateInput' in body ? body : { ...body, privateInput: {} };
        return context.json({
          data: await service.action(
            context.req.valid('param').id,
            input,
            actor(context),
            privateInput,
            p,
          ),
        });
      },
    );
    router.get(
      '/vehicleRequests/:id/dispatchCandidates',
      description(
        'getVehicleDispatchCandidates',
        'Read candidates for an actual allowed dispatch task',
        s.Candidates,
      ),
      apiValidator('param', s.Params),
      async (context) =>
        context.json({
          data: await service.dispatchCandidates(
            context.req.valid('param').id,
            actor(context),
            await policy(
              context,
              'oa.vehicleRequests',
              'operate',
              'vehicleRequests',
            ),
          ),
        }),
    );
    router.get(
      '/vehicleRequests/:id/usageCost',
      description(
        'getVehicleUsageCost',
        'Read private fuel after both business and amount authorization',
        s.Cost,
      ),
      apiValidator('param', s.Params),
      async (context) => {
        const id = context.req.valid('param').id;
        await service.detail(
          id,
          actor(context),
          await policy(
            context,
            'oa.vehicleRequests',
            'view',
            'vehicleRequests',
          ),
        );
        const amountPolicy = await policy(
            context,
            'oa.vehicleRequests',
            'viewCost',
            'vehicleUsageCosts',
          ),
          receipt = await db
            .repository<{ id: string; sourceId: string }>(
              'vehicleUsageReceipts',
            )
            .findOne({ filter: { sourceId: id } });
        const row =
          receipt &&
          (await db
            .repository('vehicleUsageCosts')
            .withPolicy(amountPolicy)
            .findOne({ filter: { id: receipt.id } }));
        if (
          !row ||
          row.id === undefined ||
          row.fuelCents === undefined ||
          !Number.isSafeInteger(Number(row.fuelCents)) ||
          Number(row.fuelCents) < 0
        )
          throw new VehicleError(
            'VEHICLE_COST_NOT_FOUND',
            'Usage cost is not readable.',
          );
        return context.json({
          data: { id: row.id, fuelCents: Number(row.fuelCents) },
        });
      },
    );
    async function admin(context: Context<AuthEnv & AuthorizationEnv>) {
      const directory = await c
        .resolve(approvalDirectoryServiceToken)
        .snapshot();
      if (
        !directory.isActive(actor(context)) ||
        !directory.hasRole(actor(context), 'admin')
      )
        throw new VehicleError(
          'VEHICLE_GARAGE_DENIED',
          'An active administrative duty member is required.',
        );
    }
    router.get(
      '/vehicles',
      description('listVehicles', 'Read vehicle garage records', s.GarageList),
      apiValidator('query', s.Query),
      async (context) => {
        const p = await policy(context, 'oa.vehicleGarage', 'view', 'vehicles'),
          q = context.req.valid('query');
        return context.json({
          data: {
            items: await db
              .repository('vehicles')
              .withPolicy(p)
              .findMany({
                offset: (q.page - 1) * q.pageSize,
                limit: q.pageSize,
              }),
          },
        });
      },
    );
    router.post(
      '/vehicles',
      description('createVehicle', 'Record a real vehicle', s.VehicleRecord),
      apiValidator('json', s.Vehicle),
      async (context) => {
        await admin(context);
        const p = await policy(
          context,
          'oa.vehicleGarage',
          'manage',
          'vehicles',
        );
        return context.json({
          data: await db.transaction((tx) =>
            projectedWrite(tx, p, 'vehicles', () =>
              service.vehicles.create(
                { ...context.req.valid('json'), actorId: actor(context) },
                tx,
                p,
              ),
            ),
          ),
        });
      },
    );
    router.patch(
      '/vehicles/:id',
      description(
        'updateVehicle',
        'Update vehicle metadata without erasing actual use',
        s.VehicleRecord.partial(),
      ),
      apiValidator('param', s.Params),
      apiValidator('json', s.VehicleUpdate),
      async (context) => {
        await admin(context);
        const p = await policy(
          context,
          'oa.vehicleGarage',
          'manage',
          'vehicles',
        );
        return context.json({
          data: await db.transaction((tx) =>
            projectedWrite(tx, p, 'vehicles', () =>
              service.vehicles.update(
                context.req.valid('param').id,
                { ...context.req.valid('json'), actorId: actor(context) },
                tx,
                p,
              ),
            ),
          ),
        });
      },
    );
    router.post(
      '/vehicleDrivers',
      description(
        'setVehicleDriver',
        'Maintain a real qualified driver roster',
        s.DriverRecord.partial(),
      ),
      apiValidator('json', s.Driver),
      async (context) => {
        await admin(context);
        const p = await policy(
          context,
          'oa.vehicleGarage',
          'manage',
          'vehicleDrivers',
        );
        return context.json({
          data: await db.transaction((tx) =>
            projectedWrite(tx, p, 'vehicleDrivers', () =>
              service.vehicles.setDriver(
                { ...context.req.valid('json'), actorId: actor(context) },
                tx,
                p,
              ),
            ),
          ),
        });
      },
    );
    const root = new Hono();
    root.route('/', router);
    return root;
  }),
];
export default routes;
