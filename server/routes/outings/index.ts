import { ApprovalError } from '@nocobase/app-plugin-approval/server';
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
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { LifecycleError, lifecycleErrorFields } from '@nocobase/lifecycle';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { AttendanceError } from '../../providers/attendance/service.js';
import { OutingError } from '../../providers/outings/errors.js';
import { outingServiceToken } from '../../providers/outings/index.js';
import {
  ActionCandidates,
  ActionInput,
  ActionResult,
  CreateOuting,
  Detail,
  List,
  ListQuery,
  OutingInput,
  OutingParams,
  Result,
  TransitionInput,
} from './schemas.js';
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const service = app.container.resolve(outingServiceToken);
    router.use(
      '/outingRequests',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/outingRequests/*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError((error, c) => {
      if (error instanceof OutingError || error instanceof AttendanceError)
        return apiErrorHandler(
          new ApiError({
            status:
              error instanceof OutingError && error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error instanceof OutingError && error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'outing',
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'outing' }) : error,
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
            domain: 'outing',
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
        resource: { type: 'composite', id: 'oa.outing' },
        action,
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.outingRequests;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'outing',
          reason: 'OUTING_ACTION_DENIED',
          message: 'No grant allows this outing business action.',
        });
      return policy;
    }
    async function readPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
    ): Promise<RepositoryPolicy | undefined> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.outing' },
        action: 'view',
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.outingRequests || undefined;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'outing',
          reason: 'OUTING_ACCESS_DENIED',
          message: 'No outing reading permission is granted.',
        });
      const id = c.req.param('id');
      if (id) {
        const row = await app.container
          .resolve(databaseManagerToken)
          .repository('outingRequests')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (!row)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'outing',
            reason: 'OUTING_ACCESS_DENIED',
            message: 'This outing request is outside the granted scope.',
          });
        const required = [
          'id',
          'applicantId',
          'createdById',
          'number',
          'startAt',
          'endAt',
          'location',
          'reason',
          'ruleSnapshot',
          'hrRecipients',
          'managerApproverId',
          'status',
          'lifecycleVersion',
          'createdAt',
        ];
        if (required.some((field) => !(field in row)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'outing',
            reason: 'OUTING_FIELDS_RESTRICTED',
            message: 'Approval details require all reviewed business fields.',
          });
      }
      return policy;
    }
    const doc = (
      operationId: string,
      summary: string,
      schema: z.ZodType = Result,
    ) =>
      describeRoute({
        tags: ['Outing'],
        operationId,
        summary,
        responses: {
          '200': dataResponse(schema),
          ...apiErrorResponses,
          '404': apiErrorResponse(404),
          '409': apiErrorResponse(409),
          '400': apiErrorResponse(400),
        },
      });
    router.get(
      '/outingRequests/options',
      doc(
        'outingRequestsOptions',
        'Application calendar zone',
        z.strictObject({ timeZone: z.string() }),
      ),
      async (c) => {
        await readPolicy(c);
        return c.json({ data: service.options() });
      },
    );
    router.get(
      '/outingRequests',
      doc(
        'listOutingRequests',
        'List my outing requests and approval work',
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
      '/outingRequests',
      doc('createOutingRequest', 'Create a outing draft'),
      apiValidator('json', CreateOuting),
      async (c) => {
        const input = c.req.valid('json');
        const actorId = c.get('auth')!.user.id;
        const policy = await actionPolicy(
          c,
          input.applicantId && input.applicantId !== actorId
            ? 'delegate'
            : 'submit',
        );
        return c.json({
          data: await service.create(input, actorId, input.applicantId, policy),
        });
      },
    );
    router.get(
      '/outingRequests/:id',
      doc(
        'getOutingRequest',
        'Get outing content, stages and offered actions',
        Detail,
      ),
      apiValidator('param', OutingParams),
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
      '/outingRequests/:id/transition',
      doc(
        'transitionOutingRequest',
        'Edit, submit, withdraw or terminate a outing request',
      ),
      apiValidator('param', OutingParams),
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
          const parsed = OutingInput.safeParse(input.input);
          if (!parsed.success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'outing',
              reason: 'OUTING_INVALID_INPUT',
              message: 'The outing form is invalid.',
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
      '/outingRequests/:id/action',
      doc(
        'performOutingAction',
        'Perform an offered outing approval action',
        ActionResult,
      ),
      apiValidator('param', OutingParams),
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
      '/outingRequests/:id/candidates',
      doc(
        'outingActionCandidates',
        'Eligible recipients for an approval action',
        ActionCandidates,
      ),
      apiValidator('param', OutingParams),
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
