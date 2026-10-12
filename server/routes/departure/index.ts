import { Hono, type Context } from 'hono';
import { z } from 'zod';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import type { RepositoryPolicy } from '@nocobase/db';
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
import { LifecycleError, lifecycleErrorFields } from '@nocobase/lifecycle';
import { ApprovalError } from '@nocobase/app-plugin-approval/server';
import { departureServiceToken } from '../../providers/departure/contract.js';
import { DepartureError } from '../../providers/departure/service.js';
import {
  Options,
  HandoverCandidates,
  CandidatesQuery,
  Candidates,
  Create,
  Params,
  WorkParams,
  Transition,
  Action,
  WorkAction,
  Record,
  Detail,
  Result,
} from './schemas.js';
type Env = AuthEnv & AuthorizationEnv;
export default [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<Env>();
    const service = app.container.resolve(departureServiceToken);
    const auth = app.container.resolve(authenticationToken).required();
    const authz = app.container.resolve(authorizationToken).middleware();
    router.use('/departureRequests', auth, authz);
    router.use('/departureRequests/*', auth, authz);
    router.onError((error, c) => {
      if (error instanceof DepartureError)
        return apiErrorHandler(
          new ApiError({
            status:
              error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : 'FAILED_PRECONDITION',
            domain: 'departure',
            reason: error.code,
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'departure' }) : error,
          c,
        );
      }
      if (error instanceof ApprovalError)
        return apiErrorHandler(
          new ApiError({
            status: ['NOT_ASSIGNEE', 'NOT_ELIGIBLE', 'FORBIDDEN'].includes(
              error.code,
            )
              ? 'PERMISSION_DENIED'
              : error.code === 'CONFLICT'
                ? 'ABORTED'
                : 'FAILED_PRECONDITION',
            domain: 'departure',
            reason: error.code,
            message: error.message,
          }),
          c,
        );
      return apiErrorHandler(error, c);
    });
    const doc = (
      operationId: string,
      summary: string,
      schema: z.ZodType,
      list = false,
    ) =>
      describeRoute({
        tags: ['Departure'],
        operationId,
        summary,
        responses: {
          200: list ? listResponse(schema) : dataResponse(schema),
          ...apiErrorResponses,
        },
      });
    async function policies(c: Context<Env>, action: string) {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.departure' },
        action,
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (decision.conditions?.database as
              Record<string, RepositoryPolicy | false | undefined> | undefined);
      if (!policy?.departureRequests)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'departure',
          reason: 'DEPARTURE_ACTION_DENIED',
          message: 'No grant permits this operation.',
        });
      return {
        record: policy.departureRequests,
        work: policy.departureWorkItems,
      };
    }
    router.get(
      '/departureRequests',
      doc(
        'listDepartureRequests',
        'List authorized departure requests',
        Record,
        true,
      ),
      apiValidator(
        'query',
        z.strictObject({
          view: z
            .enum(['all', 'mine', 'pending', 'done', 'copied'])
            .default('all'),
        }),
      ),
      async (c) =>
        c.json({
          data: await service.list(
            c.get('auth')!.user.id,
            (await policies(c, 'view')).record,
            c.req.valid('query').view,
          ),
        }),
    );
    router.get(
      '/departureRequests/options',
      doc('departureOptions', 'Read departure application options', Options),
      async (c) => {
        await policies(c, 'view');
        const allowed = async (action: string) => {
          const decision = await c.get('authz').authorize({
            resource: { type: 'composite', id: 'oa.departure' },
            action,
          });
          return (
            decision.effect !== 'deny' &&
            !!decision.conditions?.database?.departureRequests
          );
        };
        return c.json({
          data: await service.options(c.get('auth')!.user.id, {
            self: await allowed('submit'),
            manual: await allowed('delegate'),
          }),
        });
      },
    );
    router.get(
      '/departureRequests/handoverCandidates',
      doc(
        'departureHandoverCandidates',
        'Find eligible handover recipients',
        HandoverCandidates,
      ),
      apiValidator(
        'query',
        z.strictObject({
          employeeId: z.string().optional(),
          search: z.string().max(200).optional(),
          offset: z.coerce.number().int().nonnegative().default(0),
          limit: z.coerce.number().int().min(1).max(100).default(50),
        }),
      ),
      async (c) => {
        const query = c.req.valid('query');
        await policies(c, query.employeeId ? 'delegate' : 'submit');
        return c.json({
          data: await service.handoverCandidates(c.get('auth')!.user.id, query),
        });
      },
    );
    router.post(
      '/departureRequests',
      doc(
        'createDepartureRequest',
        'Create an unsubmitted departure draft',
        Result,
      ),
      apiValidator('json', Create),
      async (c) => {
        const input = c.req.valid('json');
        const policy = await policies(
          c,
          input.employeeId ? 'delegate' : 'submit',
        );
        return c.json(
          {
            data: await service.create(
              input,
              c.get('auth')!.user.id,
              policy.record,
            ),
          },
          201,
        );
      },
    );
    router.get(
      '/departureRequests/:id',
      doc(
        'departureRequestDetail',
        'Read departure approval and handover work',
        Detail,
      ),
      apiValidator('param', Params),
      async (c) => {
        const policy = await policies(c, 'view');
        if (!policy.work)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'departure',
            reason: 'DEPARTURE_WORK_DENIED',
            message: 'No handover read grant permits this detail.',
          });
        return c.json({
          data: await service.detail(
            c.req.valid('param').id,
            c.get('auth')!.user.id,
            policy.record,
            policy.work,
          ),
        });
      },
    );
    router.post(
      '/departureRequests/:id/transitions',
      doc(
        'transitionDepartureRequest',
        'Apply an authorized departure transition',
        Result,
      ),
      apiValidator('param', Params),
      apiValidator('json', Transition),
      async (c) => {
        const input = c.req.valid('json');
        const view = await policies(c, 'view');
        const write = await policies(
          c,
          input.transition === 'requestCancellation'
            ? 'cancel'
            : input.transition === 'settle'
              ? 'settle'
              : 'submit',
        );
        return c.json({
          data: await service.transition(
            c.req.valid('param').id,
            input.transition,
            c.get('auth')!.user.id,
            input.version,
            input.requestId,
            input.input,
            view.record,
            write.record,
          ),
        });
      },
    );
    router.post(
      '/departureRequests/:id/actions',
      doc(
        'performDepartureApprovalAction',
        'Perform an offered departure approval operation',
        z.unknown(),
      ),
      apiValidator('param', Params),
      apiValidator('json', Action),
      async (c) => {
        const id = c.req.valid('param').id,
          actorId = c.get('auth')!.user.id;
        const view = await policies(c, 'view');
        const detail = await service.detail(id, actorId, view.record);
        const cancellation =
          detail.record.status === 'cancellationReview'
            ? await policies(c, 'cancel')
            : undefined;
        return c.json({
          data: await service.action(
            id,
            c.req.valid('json'),
            actorId,
            view.record,
            cancellation?.record,
          ),
        });
      },
    );
    router.get(
      '/departureRequests/:id/candidates',
      doc(
        'departureCandidates',
        'List exact eligible operation recipients',
        Candidates,
      ),
      apiValidator('param', Params),
      apiValidator('query', CandidatesQuery),
      async (c) => {
        const { taskId, runId, action, ...query } = c.req.valid('query');
        const target = taskId ? { taskId } : { runId: runId! };
        return c.json({
          data: await service.candidates(
            c.req.valid('param').id,
            target,
            action,
            c.get('auth')!.user.id,
            query,
            (await policies(c, 'view')).record,
          ),
        });
      },
    );
    router.post(
      '/departureRequests/:id/workItems/:workId/actions',
      doc(
        'performDepartureWorkAction',
        'Claim or complete independent departure handover work',
        z.unknown(),
      ),
      apiValidator('param', WorkParams),
      apiValidator('json', WorkAction),
      async (c) => {
        const view = await policies(c, 'view');
        const work = await policies(c, 'work');
        if (!work.work)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'departure',
            reason: 'DEPARTURE_WORK_DENIED',
            message: 'No grant permits this work item.',
          });
        const { id, workId } = c.req.valid('param');
        const input = c.req.valid('json');
        return c.json({
          data: await service.workAction(
            id,
            workId,
            input.action,
            c.get('auth')!.user.id,
            input.version,
            input.requestId,
            input.input,
            view.record,
            work.work,
          ),
        });
      },
    );
    const root = new Hono();
    root.route('/', router);
    return root;
  }),
];
