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
import { LeaveAttachmentError } from '../../providers/leave-attachments/service.js';
import { LeaveBalanceError } from '../../providers/leave-balances/service.js';
import { LeaveError } from '../../providers/leave/errors.js';
import { leaveServiceToken } from '../../providers/leave/index.js';
import {
  ActionInput,
  ActionCandidates,
  CreateLeave,
  LeaveInput,
  LeaveParams,
  ListQuery,
  TransitionInput,
  Result,
  Detail,
} from './schemas.js';
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const service = app.container.resolve(leaveServiceToken);
    router.use(
      '/leaveRequests',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/leaveRequests/*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError((error, c) => {
      if (
        error instanceof LeaveError ||
        error instanceof LeaveBalanceError ||
        error instanceof LeaveAttachmentError
      )
        return apiErrorHandler(
          new ApiError({
            status:
              error instanceof LeaveError && error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error instanceof LeaveError && error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'leave',
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'leave' }) : error,
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
            domain: 'leave',
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
      const decision = await c
        .get('authz')
        .authorize({ resource: { type: 'composite', id: 'oa.leave' }, action });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.leaveRequests;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'leave',
          reason: 'LEAVE_ACTION_DENIED',
          message: 'No grant allows this leave business action.',
        });
      return policy;
    }
    async function readPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
    ): Promise<RepositoryPolicy | undefined> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.leave' },
        action: 'view',
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.leaveRequests || undefined;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'leave',
          reason: 'LEAVE_ACCESS_DENIED',
          message: 'No leave reading permission is granted.',
        });
      const id = c.req.param('id');
      if (id) {
        const row = await app.container
          .resolve(databaseManagerToken)
          .repository('leaveRequests')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (!row)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'leave',
            reason: 'LEAVE_ACCESS_DENIED',
            message: 'This leave request is outside the granted scope.',
          });
        const required = [
          'id',
          'applicantId',
          'createdById',
          'number',
          'leaveType',
          'startDate',
          'endDate',
          'startHalf',
          'endHalf',
          'days',
          'reason',
          'attachments',
          'handoverUserId',
          'enableDelegation',
          'ruleSnapshot',
          'hrRecipients',
          'requiresHr',
          'managerApproverId',
          'status',
          'lifecycleVersion',
          'createdAt',
        ];
        if (required.some((field) => !(field in row)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'leave',
            reason: 'LEAVE_FIELDS_RESTRICTED',
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
        tags: ['Leave'],
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
      '/leaveRequests',
      doc('listLeaveRequests', 'List my leave requests and approval work'),
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
    router.get(
      '/leaveRequests/options',
      doc('getLeaveOptions', 'Get available leave types'),
      async (c) => c.json({ data: await service.options() }),
    );
    router.post(
      '/leaveRequests/preview',
      doc('previewLeaveRoute', 'Preview working days and approval route'),
      apiValidator('json', LeaveInput),
      async (c) =>
        c.json({
          data: await service.preview(
            c.req.valid('json'),
            c.get('auth')!.user.id,
          ),
        }),
    );
    router.post(
      '/leaveRequests',
      doc('createLeaveRequest', 'Create a leave draft'),
      apiValidator('json', CreateLeave),
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
      '/leaveRequests/:id',
      doc(
        'getLeaveRequest',
        'Get leave content, stages and offered actions',
        Detail,
      ),
      apiValidator('param', LeaveParams),
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
      '/leaveRequests/:id/transition',
      doc(
        'transitionLeaveRequest',
        'Edit, submit, withdraw or terminate a leave request',
      ),
      apiValidator('param', LeaveParams),
      apiValidator('json', TransitionInput),
      async (c) => {
        const input = c.req.valid('json');
        const actorId = c.get('auth')!.user.id;
        let mutationPolicy: RepositoryPolicy | undefined;
        if (['submit', 'edit', 'withdraw'].includes(input.transition)) {
          const detail = await service.detail(
            c.req.valid('param').id,
            actorId,
            await readPolicy(c),
          );
          mutationPolicy = await actionPolicy(
            c,
            detail.record.applicantId === actorId ? 'submit' : 'delegate',
          );
        }
        if (input.transition === 'edit') {
          const parsed = LeaveInput.safeParse(input.input);
          if (!parsed.success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'leave',
              reason: 'LEAVE_INVALID_INPUT',
              message: 'The leave form is invalid.',
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
      '/leaveRequests/:id/action',
      doc('performLeaveAction', 'Perform an offered leave approval action'),
      apiValidator('param', LeaveParams),
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
      '/leaveRequests/:id/candidates',
      doc(
        'leaveActionCandidates',
        'Eligible recipients for an approval action',
        ActionCandidates,
      ),
      apiValidator('param', LeaveParams),
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
