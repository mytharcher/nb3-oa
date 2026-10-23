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
import { BudgetAdjustmentError } from '../../providers/budget-adjustments/errors.js';
import { budgetAdjustmentServiceToken } from '../../providers/budget-adjustments/index.js';
import { BudgetError } from '../../providers/budgets/service.js';
import { dictionaryServiceToken } from '../../providers/platform/index.js';
import {
  ActionInput,
  ActionResult,
  BudgetAdjustmentInput,
  BudgetAdjustmentParams,
  CandidatesResult,
  CreateBudgetAdjustment,
  Detail,
  List,
  ListQuery,
  Result,
  TransitionInput,
} from './schemas.js';
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const service = app.container.resolve(budgetAdjustmentServiceToken);
    router.use(
      '/budgetAdjustments',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/budgetAdjustments/*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError((error, c) => {
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
            domain: 'budgetAdjustment',
            message: error.message,
            cause: error,
            ...(error.code === 'BUDGET_INSUFFICIENT'
              ? {
                  fieldViolations: [
                    { field: 'amountCents', description: error.message },
                  ],
                }
              : {}),
          }),
          c,
        );
      if (error instanceof BudgetAdjustmentError)
        return apiErrorHandler(
          new ApiError({
            status:
              error instanceof BudgetAdjustmentError &&
              error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error instanceof BudgetAdjustmentError &&
                    error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'budgetAdjustment',
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields
            ? new ApiError({ ...fields, domain: 'budgetAdjustment' })
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
            domain: 'budgetAdjustment',
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
        resource: { type: 'composite', id: 'oa.budgetAdjustment' },
        action,
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.budgetAdjustments;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'budgetAdjustment',
          reason: 'BUDGET_ADJUSTMENT_ACTION_DENIED',
          message: 'No grant allows this budget adjustment business action.',
        });
      return policy;
    }
    async function readPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
    ): Promise<RepositoryPolicy | undefined> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.budgetAdjustment' },
        action: 'view',
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.budgetAdjustments || undefined;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'budgetAdjustment',
          reason: 'BUDGET_ADJUSTMENT_ACCESS_DENIED',
          message: 'No budget adjustment reading permission is granted.',
        });
      const id = c.req.param('id');
      if (id) {
        const row = await app.container
          .resolve(databaseManagerToken)
          .repository('budgetAdjustments')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (!row)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'budgetAdjustment',
            reason: 'BUDGET_ADJUSTMENT_ACCESS_DENIED',
            message:
              'This budget adjustment request is outside the granted scope.',
          });
        const required = [
          'id',
          'applicantId',
          'createdById',
          'number',
          'departmentId',
          'year',
          'subject',
          'adjustmentType',
          'sourceSubject',
          'amountCents',
          'reason',
          'heldAccount',
          'heldCents',
          'ruleSnapshot',
          'headApproverId',
          'status',
          'lifecycleVersion',
          'createdAt',
        ];
        if (required.some((field) => !(field in row)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'budgetAdjustment',
            reason: 'BUDGET_ADJUSTMENT_FIELDS_RESTRICTED',
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
        tags: ['BudgetAdjustment'],
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
      '/budgetAdjustments/options',
      doc(
        'budgetAdjustmentOptions',
        'List active and historical budget subjects',
        z.object({
          subjects: z.array(
            z.object({
              code: z.string(),
              label: z.record(z.string(), z.string()),
              active: z.boolean(),
            }),
          ),
        }),
      ),
      async (c) => {
        const decisions = await Promise.all(
          ['view', 'submit', 'delegate'].map((action) =>
            c.get('authz').authorize({
              resource: { type: 'composite', id: 'oa.budgetAdjustment' },
              action,
            }),
          ),
        );
        if (
          !decisions.some(
            (decision) =>
              decision.effect !== 'deny' &&
              (
                decision.conditions?.database as
                  | Record<string, RepositoryPolicy | false | undefined>
                  | undefined
              )?.budgetAdjustments,
          )
        )
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'BUDGET_ADJUSTMENT_OPTIONS_DENIED',
            domain: 'budgetAdjustment',
            message: 'No budget adjustment business grant permits options.',
          });
        const entries = await app.container
          .resolve(dictionaryServiceToken)
          .list('budgetSubject', { includeInactive: true });
        return c.json({
          data: {
            subjects: entries.map((entry) => ({
              code: entry.code,
              label: entry.label,
              active: entry.active,
            })),
          },
        });
      },
    );
    router.get(
      '/budgetAdjustments',
      doc(
        'listBudgetAdjustments',
        'List my budget adjustment requests and approval work',
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
      '/budgetAdjustments',
      doc(
        'createBudgetAdjustment',
        'Create a budget adjustment draft',
        Result,
        '201',
      ),
      apiValidator('json', CreateBudgetAdjustment),
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
      '/budgetAdjustments/:id',
      doc(
        'getBudgetAdjustment',
        'Get budget adjustment content, stages and offered actions',
        Detail,
      ),
      apiValidator('param', BudgetAdjustmentParams),
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
      '/budgetAdjustments/:id/transition',
      doc(
        'transitionBudgetAdjustment',
        'Edit, submit, withdraw or terminate a budget adjustment request',
      ),
      apiValidator('param', BudgetAdjustmentParams),
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
          const parsed = BudgetAdjustmentInput.safeParse(input.input);
          if (!parsed.success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'budgetAdjustment',
              reason: 'BUDGET_ADJUSTMENT_INVALID_INPUT',
              message: 'The budget adjustment form is invalid.',
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
      '/budgetAdjustments/:id/action',
      doc(
        'performBudgetAdjustmentAction',
        'Perform an offered budget adjustment approval action',
        ActionResult,
      ),
      apiValidator('param', BudgetAdjustmentParams),
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
      '/budgetAdjustments/:id/candidates',
      doc(
        'budgetAdjustmentActionCandidates',
        'Eligible recipients for an approval action',
        CandidatesResult,
      ),
      apiValidator('param', BudgetAdjustmentParams),
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
