import { ExpenseAuthorizationError } from '../../providers/expense-authorizations/service.js';
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
import { ExpensePlanError } from '../../providers/expense-plan/errors.js';
import { expensePlanServiceToken } from '../../providers/expense-plan/index.js';
import {
  ActionInput,
  CandidatesResult,
  CreateExpensePlan,
  ExpensePlanInput,
  ExpensePlanParams,
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
    const service = app.container.resolve(expensePlanServiceToken);
    router.use(
      '/expensePlans',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/expensePlans/*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError((error, c) => {
      if (error instanceof ExpenseAuthorizationError)
        return apiErrorHandler(
          new ApiError({
            status: error.code.includes('CONFLICT')
              ? 'ABORTED'
              : error.code.includes('INVALID')
                ? 'INVALID_ARGUMENT'
                : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'expensePlan',
            message: error.message,
            cause: error,
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
            domain: 'expensePlan',
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
      if (error instanceof ExpensePlanError)
        return apiErrorHandler(
          new ApiError({
            status:
              error instanceof ExpensePlanError && error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error instanceof ExpensePlanError && error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'expensePlan',
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'expensePlan' }) : error,
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
            domain: 'expensePlan',
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
        resource: { type: 'composite', id: 'oa.expensePlan' },
        action,
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.expensePlans;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'expensePlan',
          reason: 'EXPENSE_PLAN_ACTION_DENIED',
          message: 'No grant allows this expense preapproval business action.',
        });
      return policy;
    }
    async function readPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
    ): Promise<RepositoryPolicy | undefined> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.expensePlan' },
        action: 'view',
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.expensePlans || undefined;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'expensePlan',
          reason: 'EXPENSE_PLAN_ACCESS_DENIED',
          message: 'No expense preapproval reading permission is granted.',
        });
      const id = c.req.param('id');
      if (id) {
        const row = await app.container
          .resolve(databaseManagerToken)
          .repository('expensePlans')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (!row)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'expensePlan',
            reason: 'EXPENSE_PLAN_ACCESS_DENIED',
            message:
              'This expense preapproval request is outside the granted scope.',
          });
        const required = [
          'id',
          'applicantId',
          'createdById',
          'number',
          'departmentId',
          'year',
          'subject',
          'matterType',
          'eventDate',
          'participants',
          'executiveApproverId',
          'gmApproverId',
          'gmMerged',
          'authorizationId',
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
            domain: 'expensePlan',
            reason: 'EXPENSE_PLAN_FIELDS_RESTRICTED',
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
        tags: ['ExpensePlan'],
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
      '/expensePlans/options',
      doc(
        'expensePlanOptions',
        'Get application matter types, subjects and own department',
        z.json(),
      ),
      async (c) => {
        const decisions = await Promise.all(
          ['view', 'submit', 'delegate'].map((action) =>
            c.get('authz').authorize({
              resource: { type: 'composite', id: 'oa.expensePlan' },
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
              )?.expensePlans,
          )
        )
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'expensePlan',
            reason: 'EXPENSE_PLAN_OPTIONS_DENIED',
            message: 'An expense plan business grant is required.',
          });
        return c.json({ data: await service.options(c.get('auth')!.user.id) });
      },
    );
    router.get(
      '/expensePlans',
      doc(
        'listExpensePlans',
        'List my expense preapproval requests and approval work',
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
      '/expensePlans',
      doc(
        'createExpensePlan',
        'Create a expense preapproval draft',
        Result,
        '201',
      ),
      apiValidator('json', CreateExpensePlan),
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
      '/expensePlans/:id',
      doc(
        'getExpensePlan',
        'Get expense preapproval content, stages and offered actions',
        Detail,
      ),
      apiValidator('param', ExpensePlanParams),
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
      '/expensePlans/:id/transition',
      doc(
        'transitionExpensePlan',
        'Edit, submit, withdraw or terminate a expense preapproval request',
      ),
      apiValidator('param', ExpensePlanParams),
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
          const parsed = ExpensePlanInput.safeParse(input.input);
          if (!parsed.success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'expensePlan',
              reason: 'EXPENSE_PLAN_INVALID_INPUT',
              message: 'The expense preapproval form is invalid.',
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
      '/expensePlans/:id/action',
      doc(
        'performExpensePlanAction',
        'Perform an offered expense preapproval approval action',
        ActionResult,
      ),
      apiValidator('param', ExpensePlanParams),
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
      '/expensePlans/:id/candidates',
      doc(
        'expensePlanActionCandidates',
        'Eligible recipients for an approval action',
        CandidatesResult,
      ),
      apiValidator('param', ExpensePlanParams),
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
