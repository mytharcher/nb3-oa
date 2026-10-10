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
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';
import {
  approvalDirectoryServiceToken,
  DELEGATION_SETTINGS,
  DelegationError,
  type ApprovalDelegation,
} from '../../providers/approval-directory/index.js';
import {
  DelegationInputSchema,
  DelegationParams,
  DelegationSchema,
} from './schemas.js';

type Env = AuthEnv & AuthorizationEnv;
export const approvalDelegationsApiRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const service = app.container.resolve(approvalDirectoryServiceToken);
    const users = app.container.resolve(userAdministrationServiceToken);
    const auth = app.container.resolve(authenticationToken);
    const authz = app.container.resolve(authorizationToken);
    const router = new Hono<Env>();
    router.use('*', auth.required(), authz.middleware());
    router.onError((error, c) =>
      apiErrorHandler(
        error instanceof DelegationError
          ? new ApiError({
              status:
                error.code === 'DELEGATION_NOT_FOUND'
                  ? 'NOT_FOUND'
                  : error.code === 'DELEGATION_OVERLAP'
                    ? 'ALREADY_EXISTS'
                    : 'INVALID_ARGUMENT',
              reason: error.code,
              domain: 'approvalDelegations',
              message: error.message,
            })
          : error,
        c,
      ),
    );
    const permit =
      (action: 'read' | 'update'): MiddlewareHandler<Env> =>
      async (c, next) => {
        await c.get('authz').require({
          resource: { type: 'settings', id: DELEGATION_SETTINGS },
          action,
        });
        await next();
      };
    const enrich = async (entries: ApprovalDelegation[]) => {
      const names = new Map<string, string>();
      const ids = [
        ...new Set(
          entries.flatMap((entry) => [entry.principalId, entry.delegateId]),
        ),
      ];
      for (let offset = 0; offset < ids.length; offset += 100) {
        const page = await users.list({
          userIds: ids.slice(offset, offset + 100),
          page: 1,
          pageSize: 100,
          kind: 'all',
        });
        for (const user of page.items) names.set(user.id, user.name);
      }
      return entries.map((entry) => ({
        ...entry,
        principal: {
          id: entry.principalId,
          name: names.get(entry.principalId) ?? entry.principalId,
        },
        delegate: {
          id: entry.delegateId,
          name: names.get(entry.delegateId) ?? entry.delegateId,
        },
      }));
    };
    const errors = {
      ...apiErrorResponses,
      400: apiErrorResponse(400),
      409: apiErrorResponse(409),
    };
    const tags = ['Approval delegations'];
    router.get(
      '/',
      permit('read'),
      describeRoute({
        tags,
        summary: 'List approval delegations',
        operationId: 'listApprovalDelegations',
        responses: {
          200: listResponse(DelegationSchema),
          ...apiErrorResponses,
        },
      }),
      async (c) => {
        const data = await enrich(await service.list());
        return c.json({ data, meta: { total: data.length } });
      },
    );
    router.post(
      '/',
      permit('update'),
      describeRoute({
        tags,
        summary: 'Create a manual approval delegation',
        operationId: 'createApprovalDelegation',
        responses: { 201: dataResponse(DelegationSchema), ...errors },
      }),
      apiValidator('json', DelegationInputSchema),
      async (c) =>
        c.json(
          {
            data: (
              await enrich([
                await service.createManualDelegation(c.req.valid('json'), {
                  actorId: c.get('auth')!.user.id,
                }),
              ])
            )[0],
          },
          201,
        ),
    );
    router.patch(
      '/:id',
      permit('update'),
      describeRoute({
        tags,
        summary: 'Update a manual approval delegation',
        operationId: 'updateApprovalDelegation',
        responses: {
          200: dataResponse(DelegationSchema),
          ...errors,
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', DelegationParams),
      apiValidator('json', DelegationInputSchema),
      async (c) =>
        c.json({
          data: (
            await enrich([
              await service.updateManualDelegation(
                c.req.valid('param').id,
                c.req.valid('json'),
                { actorId: c.get('auth')!.user.id },
              ),
            ])
          )[0],
        }),
    );
    router.post(
      '/:id/disable',
      permit('update'),
      describeRoute({
        tags,
        summary: 'Disable a manual approval delegation',
        operationId: 'disableApprovalDelegation',
        responses: {
          200: dataResponse(DelegationSchema),
          ...apiErrorResponses,
          400: apiErrorResponse(400),
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', DelegationParams),
      async (c) =>
        c.json({
          data: (
            await enrich([
              await service.disableManualDelegation(c.req.valid('param').id, {
                actorId: c.get('auth')!.user.id,
              }),
            ])
          )[0],
        }),
    );
    const root = new Hono();
    root.route('/approvalDelegations', router);
    return root;
  });
const routes: readonly AppRouteContribution<Application>[] = [
  approvalDelegationsApiRoutes,
];
export default routes;
