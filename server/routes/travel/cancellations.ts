import { ExpenseAuthorizationError } from '../../providers/expense-authorizations/service.js';
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
  apiErrorResponse,
  apiErrorResponses,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { LifecycleError, lifecycleErrorFields } from '@nocobase/lifecycle';
import { ApprovalError } from '@nocobase/app-plugin-approval/server';
import { z } from 'zod';
import { Hono, type Context } from 'hono';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { TravelCancellationError } from '../../providers/travel/errors.js';
import { travelCancellationServiceToken } from '../../providers/travel/cancellation-provider.js';
import {
  ActionInput,
  CandidatesResult,
  CreateTravelCancellation,
  TravelCancellationInput,
  TravelCancellationParams,
  ListQuery,
  TransitionInput,
  Result,
  Detail,
  List,
  ActionResult,
} from './cancellation-schemas.js';
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const service = app.container.resolve(travelCancellationServiceToken);
    router.use(
      '/travelCancellations',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/travelCancellations/*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError((error, c) => {
      if (error instanceof ExpenseAuthorizationError)
        return apiErrorHandler(
          new ApiError({
            status: 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'travel',
            message: error.message,
          }),
          c,
        );
      if (error instanceof TravelCancellationError)
        return apiErrorHandler(
          new ApiError({
            status:
              error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'travelCancellation',
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields
            ? new ApiError({ ...fields, domain: 'travelCancellation' })
            : error,
          c,
        );
      }
      if (
        error instanceof ApprovalError &&
        ['INTERNAL', 'INVALID_EFFECT'].includes(error.code)
      )
        return apiErrorHandler(error, c);
      if (error instanceof ApprovalError)
        return apiErrorHandler(
          new ApiError({
            status:
              error.code === 'TASK_NOT_FOUND'
                ? 'NOT_FOUND'
                : error.code === 'CONFLICT'
                  ? 'ABORTED'
                  : [
                        'NOT_ASSIGNEE',
                        'INACTIVE',
                        'NOT_ALLOWED',
                        'APPLICANT_NOT_ELIGIBLE',
                        'NOT_QUALIFIED',
                        'NOT_IN_POOL',
                      ].includes(error.code)
                    ? 'PERMISSION_DENIED'
                    : 'FAILED_PRECONDITION',
            domain: 'travelCancellation',
            reason: error.code,
            message: error.message,
          }),
          c,
        );
      return apiErrorHandler(error, c);
    });
    async function actionPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
      action: string,
    ): Promise<RepositoryPolicy> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.travelCancellation' },
        action,
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.travelCancellations;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'travelCancellation',
          reason: 'TRAVEL_CANCELLATION_ACTION_DENIED',
          message: 'No grant allows this travelCancellation business action.',
        });
      return policy;
    }
    async function readPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
    ): Promise<RepositoryPolicy | undefined> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.travelCancellation' },
        action: 'view',
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.travelCancellations || undefined;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'travelCancellation',
          reason: 'TRAVEL_CANCELLATION_ACCESS_DENIED',
          message: 'No travelCancellation reading permission is granted.',
        });
      const id = c.req.param('id');
      if (id) {
        const row = await app.container
          .resolve(databaseManagerToken)
          .repository('travelCancellations')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (!row)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'travelCancellation',
            reason: 'TRAVEL_CANCELLATION_ACCESS_DENIED',
            message:
              'This travelCancellation request is outside the granted scope.',
          });
        const required = [
          'id',
          'applicantId',
          'createdById',
          'number',
          'sourceId',
          'needsUnbooking',
          'unbookingInformation',
          'exceptionReason',
          'reason',
          'baseline',
          'ruleSnapshot',
          'managerApproverId',
          'status',
          'lifecycleVersion',
          'createdAt',
        ];
        if (required.some((field) => !(field in row)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'travelCancellation',
            reason: 'TRAVEL_CANCELLATION_FIELDS_RESTRICTED',
            message: 'Approval details require all reviewed business fields.',
          });
      }
      return policy;
    }
    const doc = (
      operationId: string,
      summary: string,
      schema: z.ZodType = Result,
      success: '200' | '201' = '200',
    ) =>
      describeRoute({
        tags: ['TravelCancellation'],
        operationId,
        summary,
        responses: {
          [success]: dataResponse(schema),
          ...apiErrorResponses,
          '404': apiErrorResponse(404),
          '409': apiErrorResponse(409),
          '400': apiErrorResponse(400),
        },
      });
    router.get(
      '/travelCancellations',
      doc(
        'listTravelCancellations',
        'List my travelCancellation requests and approval work',
        List,
      ),
      apiValidator('query', ListQuery),
      async (c) =>
        c.json({
          data: await service.list(
            c.get('auth')!.user.id,
            c.req.valid('query').view,
            await readPolicy(c),
          ),
        }),
    );
    router.post(
      '/travelCancellations',
      doc(
        'createTravelCancellation',
        'Create a travelCancellation draft',
        Result,
        '201',
      ),
      apiValidator('json', CreateTravelCancellation),
      async (c) => {
        const input = c.req.valid('json');
        const actorId = c.get('auth')!.user.id;
        const policy = await actionPolicy(
          c,
          input.applicantId && input.applicantId !== actorId
            ? 'delegate'
            : 'submit',
        );
        return c.json(
          {
            data: await service.create(
              input,
              actorId,
              input.applicantId,
              policy,
            ),
          },
          201,
        );
      },
    );
    router.get(
      '/travelCancellations/:id',
      doc(
        'getTravelCancellation',
        'Get travelCancellation content, stages and offered actions',
        Detail,
      ),
      apiValidator('param', TravelCancellationParams),
      async (c) =>
        c.json({
          data: await service.detail(
            c.req.valid('param').id,
            c.get('auth')!.user.id,
            await readPolicy(c),
          ),
        }),
    );
    router.post(
      '/travelCancellations/:id/transition',
      doc(
        'transitionTravelCancellation',
        'Edit, submit, withdraw or terminate a travelCancellation request',
      ),
      apiValidator('param', TravelCancellationParams),
      apiValidator('json', TransitionInput),
      async (c) => {
        const input = c.req.valid('json');
        const actorId = c.get('auth')!.user.id;
        let mutationPolicy: RepositoryPolicy | undefined;
        if (['submit', 'edit', 'withdraw'].includes(input.transition)) {
          const detail = await service.accessFacts(
            c.req.valid('param').id,
            actorId,
            await readPolicy(c),
          );
          mutationPolicy = await actionPolicy(
            c,
            detail.applicantId === actorId ? 'submit' : 'delegate',
          );
        }
        if (input.transition === 'edit') {
          const parsed = TravelCancellationInput.safeParse(input.input);
          if (!parsed.success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'travelCancellation',
              reason: 'TRAVEL_CANCELLATION_INVALID_INPUT',
              message: 'The travelCancellation form is invalid.',
            });
          input.input = parsed.data;
        }
        return c.json({
          data: await service.transition(
            c.req.valid('param').id,
            input.transition,
            c.get('auth')!.user.id,
            input.version,
            input.requestId,
            input.input,
            await readPolicy(c),
            mutationPolicy,
          ),
        });
      },
    );
    router.post(
      '/travelCancellations/:id/action',
      doc(
        'performTravelCancellationAction',
        'Perform an offered travelCancellation approval action',
        ActionResult,
      ),
      apiValidator('param', TravelCancellationParams),
      apiValidator('json', ActionInput),
      async (c) =>
        c.json({
          data: await service.action(
            c.req.valid('param').id,
            c.req.valid('json'),
            c.get('auth')!.user.id,
            await readPolicy(c),
          ),
        }),
    );
    router.get(
      '/travelCancellations/:id/candidates',
      doc(
        'travelCancellationActionCandidates',
        'Eligible recipients for an approval action',
        CandidatesResult,
      ),
      apiValidator('param', TravelCancellationParams),
      apiValidator(
        'query',
        z.strictObject({
          taskId: z.string().min(1),
          action: z.enum(['transfer', 'addSigner']),
          search: z.string().max(200).optional(),
          offset: z.coerce.number().int().nonnegative().default(0),
          limit: z.coerce.number().int().min(1).max(100).default(20),
        }),
      ),
      async (c) => {
        const { taskId, action, ...query } = c.req.valid('query');
        return c.json({
          data: await service.candidates(
            c.req.valid('param').id,
            taskId,
            action,
            c.get('auth')!.user.id,
            query,
            await readPolicy(c),
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
