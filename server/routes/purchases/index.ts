import { VendorError } from '../../providers/vendors/service.js';
import { PurchaseAttachmentError } from '../../providers/purchases/attachments.js';
import { PurchaseOrderError } from '../../providers/purchases/orders.js';
import { routes as orderRoutes } from './orders.js';
import { routes as attachmentRoutes } from './attachments.js';
import { BudgetError } from '../../providers/budgets/service.js';
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
import { PurchaseError } from '../../providers/purchases/errors.js';
import { purchaseServiceToken } from '../../providers/purchases/index.js';
import {
  ActionInput,
  CandidatesResult,
  CandidatesQuery,
  CreatePurchase,
  PurchaseInput,
  PurchaseParams,
  ListQuery,
  TransitionInput,
  Result,
  Detail,
  List,
  ActionResult,
} from './schemas.js';
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const service = app.container.resolve(purchaseServiceToken);
    router.use(
      '/purchaseRequests',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/purchaseRequests/*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError((error, c) => {
      if (
        error instanceof VendorError ||
        error instanceof PurchaseAttachmentError ||
        error instanceof PurchaseOrderError
      )
        return apiErrorHandler(
          new ApiError({
            status: error.code.includes('DENIED')
              ? 'PERMISSION_DENIED'
              : error.code.includes('CONFLICT')
                ? 'ABORTED'
                : error instanceof VendorError && error.kind === 'notFound'
                  ? 'FAILED_PRECONDITION'
                  : 'INVALID_ARGUMENT',
            domain: 'purchase',
            reason: error.code,
            message: error.message,
          }),
          c,
        );
      if (error instanceof BudgetError)
        return apiErrorHandler(
          new ApiError({
            status:
              error.code === 'BUDGET_IDEMPOTENCY_CONFLICT'
                ? 'ABORTED'
                : error.code.includes('INVALID')
                  ? 'INVALID_ARGUMENT'
                  : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'purchase',
            message: error.message,
            cause: error,
            ...(error.code === 'BUDGET_INSUFFICIENT'
              ? {
                  fieldViolations: [
                    { field: 'estimatedCents', description: error.message },
                  ],
                }
              : {}),
          }),
          c,
        );
      if (error instanceof PurchaseError)
        return apiErrorHandler(
          new ApiError({
            status:
              error instanceof PurchaseError && error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error instanceof PurchaseError && error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'purchase',
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'purchase' }) : error,
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
            domain: 'purchase',
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
        resource: { type: 'composite', id: 'oa.purchase' },
        action,
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.purchaseRequests;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'purchase',
          reason: 'PURCHASE_ACTION_DENIED',
          message: 'No grant allows this purchase business action.',
        });
      return policy;
    }
    async function readPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
    ): Promise<RepositoryPolicy | undefined> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.purchase' },
        action: 'view',
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.purchaseRequests || undefined;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'purchase',
          reason: 'PURCHASE_ACCESS_DENIED',
          message: 'No purchase reading permission is granted.',
        });
      const id = c.req.param('id');
      if (id) {
        const row = await app.container
          .resolve(databaseManagerToken)
          .repository('purchaseRequests')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (!row)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'purchase',
            reason: 'PURCHASE_ACCESS_DENIED',
            message: 'This purchase request is outside the granted scope.',
          });
        const required = [
          'id',
          'applicantId',
          'createdById',
          'number',
          'items',
          'subject',
          'estimatedCents',
          'expectedDate',
          'suggestedVendorId',
          'purpose',
          'actualCents',
          'selectedVendorId',
          'quotes',
          'departmentId',
          'year',
          'heldAccount',
          'heldCents',
          'headApproverId',
          'executiveApproverId',
          'gmApproverId',
          'gmMerged',
          'ruleSnapshot',
          'handlingFailureReason',
          'approvedFingerprint',
          'financeEntered',
          'priceConfirmationRequired',
          'handlingForced',
          'handlingActorId',
          'orderId',
          'status',
          'lifecycleVersion',
          'createdAt',
        ];
        if (required.some((field) => !(field in row)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'purchase',
            reason: 'PURCHASE_FIELDS_RESTRICTED',
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
        tags: ['Purchase'],
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
      '/purchaseRequests/options',
      doc(
        'purchaseOptions',
        'Get application matter types, subjects and own department',
        z.json(),
      ),
      async (c) => {
        const decisions = await Promise.all(
          ['view', 'submit'].map((action) =>
            c.get('authz').authorize({
              resource: { type: 'composite', id: 'oa.purchase' },
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
              )?.purchaseRequests,
          )
        )
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'purchase',
            reason: 'PURCHASE_OPTIONS_DENIED',
            message: 'An purchase business grant is required.',
          });
        return c.json({ data: await service.options(c.get('auth')!.user.id) });
      },
    );
    router.get(
      '/purchaseRequests',
      doc('listPurchases', 'List my purchase requests and approval work', List),
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
      '/purchaseRequests',
      doc('createPurchase', 'Create a purchase draft', Result, '201'),
      apiValidator('json', CreatePurchase),
      async (c) => {
        const input = c.req.valid('json');
        const actorId = c.get('auth')!.user.id;
        const policy = await actionPolicy(c, 'submit');
        return c.json(
          {
            data: await service.create(input, actorId, actorId, policy),
          },
          201,
        );
      },
    );
    router.get(
      '/purchaseRequests/:id',
      doc(
        'getPurchase',
        'Get purchase content, stages and offered actions',
        Detail,
      ),
      apiValidator('param', PurchaseParams),
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
      '/purchaseRequests/:id/transition',
      doc(
        'transitionPurchase',
        'Edit, submit, withdraw or terminate a purchase request',
      ),
      apiValidator('param', PurchaseParams),
      apiValidator('json', TransitionInput),
      async (c) => {
        const input = c.req.valid('json');
        let mutationPolicy: RepositoryPolicy | undefined;
        if (['submit', 'edit', 'withdraw'].includes(input.transition)) {
          mutationPolicy = await actionPolicy(c, 'submit');
        }
        if (input.transition === 'edit') {
          const parsed = PurchaseInput.safeParse(input.input);
          if (!parsed.success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'purchase',
              reason: 'PURCHASE_INVALID_INPUT',
              message: 'The purchase form is invalid.',
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
      '/purchaseRequests/:id/action',
      doc(
        'performPurchaseAction',
        'Perform an offered purchase approval action',
        ActionResult,
      ),
      apiValidator('param', PurchaseParams),
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
      '/purchaseRequests/:id/candidates',
      doc(
        'purchaseActionCandidates',
        'Eligible recipients for an approval action',
        CandidatesResult,
      ),
      apiValidator('param', PurchaseParams),
      apiValidator('query', CandidatesQuery),
      async (c) => {
        const input = c.req.valid('query');
        const { action, search, offset, limit } = input;
        const target =
          'runId' in input ? { runId: input.runId } : { taskId: input.taskId };
        return c.json({
          data: await service.candidates(
            c.req.valid('param').id,
            target,
            action,
            c.get('auth')!.user.id,
            { search, offset, limit },
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
export default [...routes, ...attachmentRoutes, orderRoutes];
