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
import { approvalDirectoryServiceToken } from '../../providers/approval-directory/contract.js';
import { AttendanceChangeAttachmentError } from '../../providers/attendance-change-attachments/service.js';
import { AttendanceChangeError } from '../../providers/attendance-change/errors.js';
import { attendanceChangeServiceToken } from '../../providers/attendance-change/index.js';
import { AttendanceError } from '../../providers/attendance/service.js';
import {
  ActionCandidates,
  ActionInput,
  ActionResult,
  AttendanceChangeInput,
  AttendanceChangeParams,
  CreateAttendanceChange,
  Detail,
  List,
  ListQuery,
  Result,
  TransitionInput,
} from './schemas.js';
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const service = app.container.resolve(attendanceChangeServiceToken);
    router.use(
      '/attendanceChangeRequests',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/attendanceChangeRequests/*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError((error, c) => {
      if (error instanceof AttendanceChangeAttachmentError)
        return apiErrorHandler(
          new ApiError({
            status: 'INVALID_ARGUMENT',
            domain: 'attendanceChange',
            reason: error.code,
            message: error.message,
          }),
          c,
        );
      if (
        error instanceof AttendanceChangeError ||
        error instanceof AttendanceError ||
        error instanceof AttendanceChangeAttachmentError
      )
        return apiErrorHandler(
          new ApiError({
            status:
              error instanceof AttendanceChangeError &&
              error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error instanceof AttendanceChangeError &&
                    error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'attendanceChange',
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields
            ? new ApiError({ ...fields, domain: 'attendanceChange' })
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
            domain: 'attendanceChange',
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
        resource: { type: 'composite', id: 'oa.attendanceChange' },
        action,
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.attendanceChangeRequests;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'attendanceChange',
          reason: 'ATTENDANCE_CHANGE_ACTION_DENIED',
          message: 'No grant allows this attendanceChange business action.',
        });
      return policy;
    }
    async function readPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
    ): Promise<RepositoryPolicy | undefined> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.attendanceChange' },
        action: 'view',
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.attendanceChangeRequests || undefined;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'attendanceChange',
          reason: 'ATTENDANCE_CHANGE_ACCESS_DENIED',
          message: 'No attendanceChange reading permission is granted.',
        });
      const id = c.req.param('id');
      if (id) {
        const row = await app.container
          .resolve(databaseManagerToken)
          .repository('attendanceChangeRequests')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (!row)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'attendanceChange',
            reason: 'ATTENDANCE_CHANGE_ACCESS_DENIED',
            message:
              'This attendanceChange request is outside the granted scope.',
          });
        const required = [
          'id',
          'applicantId',
          'createdById',
          'number',
          'date',
          'originalAttendanceId',
          'originalVersion',
          'correctionAt',
          'proof',
          'attachments',
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
            domain: 'attendanceChange',
            reason: 'ATTENDANCE_CHANGE_FIELDS_RESTRICTED',
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
        tags: ['AttendanceChange'],
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
      '/attendanceChangeRequests/missingPunches',
      doc(
        'attendanceChangeMissingPunches',
        'Missing-punch evidence eligible for correction',
        z.array(
          z.strictObject({
            id: z.string(),
            date: z.string(),
            punchKind: z.enum(['in', 'out']),
            version: z.number().int(),
          }),
        ),
      ),
      apiValidator(
        'query',
        z.strictObject({
          applicantId: z.string().min(1).optional(),
          excludeRequestId: z.string().min(1).optional(),
        }),
      ),
      async (c) => {
        const actorId = c.get('auth')!.user.id;
        const applicantId = c.req.valid('query').applicantId ?? actorId;
        await actionPolicy(c, applicantId === actorId ? 'submit' : 'delegate');
        if (applicantId !== actorId) {
          const directory = await app.container
            .resolve(approvalDirectoryServiceToken)
            .snapshot();
          if (!directory.hasRole(actorId, 'hr'))
            throw new ApiError({
              status: 'PERMISSION_DENIED',
              reason: 'ATTENDANCE_CHANGE_DELEGATE_DENIED',
              message: 'Only HR may prepare another employee correction.',
              domain: 'attendanceChange',
            });
        }
        return c.json({
          data: await service.missingPunches(
            applicantId,
            c.req.valid('query').excludeRequestId,
          ),
        });
      },
    );
    router.get(
      '/attendanceChangeRequests/options',
      doc(
        'attendanceChangeRequestsOptions',
        'Application calendar zone',
        z.strictObject({ timeZone: z.string() }),
      ),
      async (c) => {
        await readPolicy(c);
        return c.json({ data: service.options() });
      },
    );
    router.get(
      '/attendanceChangeRequests',
      doc(
        'listAttendanceChangeRequests',
        'List my attendanceChange requests and approval work',
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
      '/attendanceChangeRequests',
      doc('createAttendanceChangeRequest', 'Create a attendanceChange draft'),
      apiValidator('json', CreateAttendanceChange),
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
      '/attendanceChangeRequests/:id',
      doc(
        'getAttendanceChangeRequest',
        'Get attendanceChange content, stages and offered actions',
        Detail,
      ),
      apiValidator('param', AttendanceChangeParams),
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
      '/attendanceChangeRequests/:id/transition',
      doc(
        'transitionAttendanceChangeRequest',
        'Edit, submit, withdraw or terminate a attendanceChange request',
      ),
      apiValidator('param', AttendanceChangeParams),
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
          const parsed = AttendanceChangeInput.safeParse(input.input);
          if (!parsed.success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'attendanceChange',
              reason: 'ATTENDANCE_CHANGE_INVALID_INPUT',
              message: 'The attendanceChange form is invalid.',
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
      '/attendanceChangeRequests/:id/action',
      doc(
        'performAttendanceChangeAction',
        'Perform an offered attendanceChange approval action',
        ActionResult,
      ),
      apiValidator('param', AttendanceChangeParams),
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
      '/attendanceChangeRequests/:id/candidates',
      doc(
        'attendanceChangeActionCandidates',
        'Eligible recipients for an approval action',
        ActionCandidates,
      ),
      apiValidator('param', AttendanceChangeParams),
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
