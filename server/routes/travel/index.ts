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
import { TravelAttachmentError } from '../../providers/travel/attachments.js';
import { TravelError } from '../../providers/travel/errors.js';
import { travelServiceToken } from '../../providers/travel/index.js';
import {
  OptionsQuery,
  ActionInput,
  CandidatesResult,
  CreateTravel,
  TravelInput,
  TravelParams,
  ListQuery,
  TransitionInput,
  Result,
  Detail,
  List,
  ActionResult,
} from './schemas.js';
const INPUT_ERROR_FIELDS: Record<string, string> = {
  TRAVEL_ITINERARY_REQUIRED: 'attachments',
  TRAVEL_COMPANION_INACTIVE: 'companionIds',
  TRAVEL_COMPANIONS_INVALID: 'companionIds',
  TRAVEL_INVALID_DATE: 'endAt',
  TRAVEL_OVERLAP: 'startAt',
};
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const service = app.container.resolve(travelServiceToken);
    router.use(
      '/travelRequests',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/travelRequests/*',
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
      if (
        error instanceof TravelError ||
        error instanceof TravelAttachmentError
      )
        return apiErrorHandler(
          new ApiError({
            status:
              error instanceof TravelError && error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error instanceof TravelError && error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : error instanceof TravelAttachmentError
                    ? error.code === 'TRAVEL_ATTACHMENT_DENIED'
                      ? 'PERMISSION_DENIED'
                      : 'INVALID_ARGUMENT'
                    : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'travel',
            message: error.message,
            ...(INPUT_ERROR_FIELDS[error.code]
              ? {
                  fieldViolations: [
                    {
                      field: INPUT_ERROR_FIELDS[error.code],
                      description: error.message,
                    },
                  ],
                }
              : {}),
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'travel' }) : error,
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
            domain: 'travel',
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
        resource: { type: 'composite', id: 'oa.travel' },
        action,
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.travelRequests;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'travel',
          reason: 'TRAVEL_ACTION_DENIED',
          message: 'No grant allows this travel request business action.',
        });
      return policy;
    }
    async function readPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
    ): Promise<RepositoryPolicy | undefined> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.travel' },
        action: 'view',
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.travelRequests || undefined;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'travel',
          reason: 'TRAVEL_ACCESS_DENIED',
          message: 'No travel request reading permission is granted.',
        });
      const id = c.req.param('id');
      if (id) {
        const row = await app.container
          .resolve(databaseManagerToken)
          .repository('travelRequests')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (!row)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'travel',
            reason: 'TRAVEL_ACCESS_DENIED',
            message:
              'This travel request request is outside the granted scope.',
          });
        const required = [
          'id',
          'applicantId',
          'createdById',
          'number',
          'departmentId',
          'destination',
          'international',
          'startAt',
          'endAt',
          'companionIds',
          'attachments',
          'transportCents',
          'lodgingCents',
          'allowanceCents',
          'amountCents',
          'needsLoan',
          'needsBooking',
          'approvalGrantedAt',
          'originalHeadApproverId',
          'bookingInformation',
          'exceptionReason',
          'cancelledAt',
          'cancellationId',
          'standardSnapshot',
          'managerApproverId',
          'headMerged',
          'ruleSnapshot',
          'headApproverId',
          'executiveApproverId',
          'gmApproverId',
          'gmMerged',
          'authorizationId',
          'authorizationSourceId',
          'approvalGeneration',
          'reason',
          'status',
          'lifecycleVersion',
          'createdAt',
        ];
        if (required.some((field) => !(field in row)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'travel',
            reason: 'TRAVEL_FIELDS_RESTRICTED',
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
        tags: ['Travel'],
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
      '/travelRequests/options',
      doc(
        'travelOptions',
        'Get company time zone and permitted applicant travel standard',
        z.json(),
      ),
      apiValidator('query', OptionsQuery),
      async (c) => {
        const decisions = await Promise.all(
          ['view', 'submit', 'delegate'].map((action) =>
            c.get('authz').authorize({
              resource: { type: 'composite', id: 'oa.travel' },
              action,
            }),
          ),
        );
        if (
          !decisions.some(
            (d) =>
              d.effect !== 'deny' &&
              (
                d.conditions?.database as
                  Record<string, RepositoryPolicy | false> | undefined
              )?.travelRequests,
          )
        )
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'travel',
            reason: 'TRAVEL_OPTIONS_DENIED',
            message: 'An travel business grant is required.',
          });
        const actorId = c.get('auth')!.user.id,
          applicantId = c.req.valid('query').applicantId ?? actorId;
        return c.json({
          data: await service.options(
            actorId,
            applicantId,
            applicantId === actorId
              ? undefined
              : await actionPolicy(c, 'delegate'),
          ),
        });
      },
    );
    router.get(
      '/travelRequests',
      doc(
        'listTravels',
        'List my travel request requests and approval work',
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
      '/travelRequests',
      doc('createTravel', 'Create a travel request draft', Result, '201'),
      apiValidator('json', CreateTravel),
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
      '/travelRequests/:id',
      doc(
        'getTravel',
        'Get travel request content, stages and offered actions',
        Detail,
      ),
      apiValidator('param', TravelParams),
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
      '/travelRequests/:id/transition',
      doc(
        'transitionTravel',
        'Edit, submit, withdraw or terminate a travel request request',
      ),
      apiValidator('param', TravelParams),
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
          const parsed = TravelInput.safeParse(input.input);
          if (!parsed.success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'travel',
              reason: 'TRAVEL_INVALID_INPUT',
              message: 'The travel request form is invalid.',
              fieldViolations: parsed.error.issues.map((issue) => ({
                field: issue.path.map(String).join('.'),
                description: issue.message,
              })),
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
      '/travelRequests/:id/action',
      doc(
        'performTravelAction',
        'Perform an offered travel request approval action',
        ActionResult,
      ),
      apiValidator('param', TravelParams),
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
      '/travelRequests/:id/candidates',
      doc(
        'travelActionCandidates',
        'Eligible recipients for an approval action',
        CandidatesResult,
      ),
      apiValidator('param', TravelParams),
      apiValidator(
        'query',
        z.strictObject({
          taskId: z.string().min(1),
          action: z.enum(['transfer', 'addSigner', 'cc']),
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
import attachmentRoutes from './attachments.js';
import cancellationRoutes from './cancellations.js';
export default [...routes, ...attachmentRoutes, ...cancellationRoutes];
