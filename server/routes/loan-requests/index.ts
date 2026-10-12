import { LoanLedgerError } from '../../providers/loan-ledger/service.js';
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
import { LoanRequestError } from '../../providers/loan-requests/errors.js';
import { loanRequestServiceToken } from '../../providers/loan-requests/contract.js';
import type { LoanRequestService } from '../../providers/loan-requests/service.js';
import {
  ActionInput,
  CandidatesQuery,
  CandidatesResult,
  CreateLoanRequest,
  LoanRequestInput,
  LoanRequestParams,
  ListQuery,
  TransitionInput,
  Result,
  Detail,
  List,
  ActionResult,
  RepaymentInput,
} from './schemas.js';
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const service = app.container.resolve(
      loanRequestServiceToken,
    ) as LoanRequestService;
    router.use(
      '/loanRequests',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/loanRequests/*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError((error, c) => {
      if (error instanceof LoanLedgerError)
        return apiErrorHandler(
          new ApiError({
            status: error.code.includes('CONFLICT')
              ? 'ABORTED'
              : error.code.includes('INVALID')
                ? 'INVALID_ARGUMENT'
                : error.code.includes('FORBIDDEN')
                  ? 'PERMISSION_DENIED'
                  : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'loanRequest',
            message: error.message,
            cause: error,
          }),
          c,
        );
      if (error instanceof LoanRequestError)
        return apiErrorHandler(
          new ApiError({
            status:
              error.field === 'permission' ||
              error.code.includes('ACCESS_DENIED')
                ? 'PERMISSION_DENIED'
                : error.field === 'notFound'
                  ? 'NOT_FOUND'
                  : error.code.includes('CONFLICT')
                    ? 'ABORTED'
                    : error.code.includes('INVALID')
                      ? 'INVALID_ARGUMENT'
                      : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'loanRequest',
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'loanRequest' }) : error,
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
            domain: 'loanRequest',
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
        resource: { type: 'composite', id: 'oa.loan' },
        action,
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.loanRequests;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'loanRequest',
          reason: 'LOAN_REQUEST_ACTION_DENIED',
          message: 'No grant allows this loan business action.',
        });
      return policy;
    }
    async function readPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
    ): Promise<RepositoryPolicy | undefined> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.loan' },
        action: 'view',
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.loanRequests || undefined;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'loanRequest',
          reason: 'LOAN_REQUEST_ACCESS_DENIED',
          message: 'No loan reading permission is granted.',
        });
      const id = c.req.param('id');
      if (id) {
        const row = await app.container
          .resolve(databaseManagerToken)
          .repository('loanRequests')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (!row)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'loanRequest',
            reason: 'LOAN_REQUEST_ACCESS_DENIED',
            message: 'This loan request is outside the granted scope.',
          });
        const required = [
          'id',
          'applicantId',
          'createdById',
          'number',
          'amountCents',
          'reason',
          'dueDate',
          'travelId',
          'heldCents',
          'ruleSnapshot',
          'status',
          'lifecycleVersion',
        ];
        if (required.some((field) => !(field in row)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'loanRequest',
            reason: 'LOAN_REQUEST_FIELDS_RESTRICTED',
            message: 'Approval details require all reviewed business fields.',
          });
      }
      return policy;
    }
    async function recordActionPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
      action: string,
      field?: string,
    ) {
      const policy = await actionPolicy(c, action);
      const row = await app.container
        .resolve(databaseManagerToken)
        .repository('loanRequests')
        .withPolicy(policy)
        .findOne({ filter: { id: c.req.param('id') } });
      if (!row || (field && !(field in row)))
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'loanRequest',
          reason: 'LOAN_REQUEST_ACTION_DENIED',
          message:
            'This action does not grant the requested record or protected field.',
        });
      return policy;
    }
    const doc = (
      operationId: string,
      summary: string,
      schema: z.ZodType = Result,
      success: '200' | '201' = '200',
    ) =>
      describeRoute({
        tags: ['LoanRequest'],
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
      '/loanRequests/options',
      doc(
        'loanRequestOptions',
        'Get application matter types, subjects and own department',
        z.json(),
      ),
      async (c) => {
        const decisions = await Promise.all(
          ['view', 'submit', 'delegate'].map((action) =>
            c.get('authz').authorize({
              resource: { type: 'composite', id: 'oa.loan' },
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
              )?.loanRequests,
          )
        )
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'loanRequest',
            reason: 'LOAN_REQUEST_OPTIONS_DENIED',
            message: 'An loan business grant is required.',
          });
        return c.json({ data: await service.options(c.get('auth')!.user.id) });
      },
    );
    router.get(
      '/loanRequests',
      doc('listLoanRequests', 'List my loan requests and approval work', List),
      apiValidator('query', ListQuery),
      async (c) => {
        const query = c.req.valid('query');
        let rows = await service.list(
          c.get('auth')!.user.id,
          query.view,
          await readPolicy(c),
        );
        const search = query.search.trim().toLocaleLowerCase();
        rows = rows.filter(
          (r) =>
            (!query.status || r.status === query.status) &&
            (!search ||
              [r.number, r.reason, r.applicant?.name].some((v) =>
                v?.toLocaleLowerCase().includes(search),
              )),
        );
        rows.sort((a, b) => {
          const av = a[query.sort],
            bv = b[query.sort];
          const compared =
            typeof av === 'number' && typeof bv === 'number'
              ? av - bv
              : String(av ?? '').localeCompare(String(bv ?? ''));
          return (
            (query.order === 'asc' ? compared : -compared) ||
            a.id.localeCompare(b.id)
          );
        });
        const total = rows.length;
        const page = Math.min(
          query.page,
          Math.max(1, Math.ceil(total / query.pageSize)),
        );
        return c.json({
          data: rows.slice((page - 1) * query.pageSize, page * query.pageSize),
          meta: { page, pageSize: query.pageSize, total },
        });
      },
    );
    router.post(
      '/loanRequests',
      doc('createLoanRequest', 'Create a loan draft', Result, '201'),
      apiValidator('json', CreateLoanRequest),
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
              {
                reason: input.reason,
                amountCents: input.amountCents,
                dueDate: input.dueDate,
                travelId: input.travelId,
              },
              actorId,
              input.applicantId,
              policy,
              input.requestId,
            ),
          },
          201,
        );
      },
    );
    router.get(
      '/loanRequests/:id',
      doc(
        'getLoanRequest',
        'Get loan content, stages and offered actions',
        Detail,
      ),
      apiValidator('param', LoanRequestParams),
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
      '/loanRequests/:id/transition',
      doc(
        'transitionLoanRequest',
        'Edit, submit, withdraw or terminate a loan request',
      ),
      apiValidator('param', LoanRequestParams),
      apiValidator('json', TransitionInput),
      async (c) => {
        const input = c.req.valid('json');
        const actorId = c.get('auth')!.user.id;
        let mutationPolicy: RepositoryPolicy | undefined;
        if (
          ['submit', 'edit', 'withdraw', 'retryCash'].includes(input.transition)
        ) {
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
          const parsed = LoanRequestInput.safeParse(input.input);
          if (!parsed.success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'loanRequest',
              reason: 'LOAN_REQUEST_INVALID_INPUT',
              message: 'The loan form is invalid.',
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
      '/loanRequests/:id/action',
      doc(
        'performLoanRequestAction',
        'Perform an offered loan approval action',
        ActionResult,
      ),
      apiValidator('param', LoanRequestParams),
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
      '/loanRequests/:id/candidates',
      doc(
        'loanRequestActionCandidates',
        'Eligible recipients for an approval action',
        CandidatesResult,
      ),
      apiValidator('param', LoanRequestParams),
      apiValidator('query', CandidatesQuery),
      async (c) => {
        const { taskId, runId, action, ...query } = c.req.valid('query');
        return c.json({
          data: await service.candidates(
            c.req.valid('param').id,
            (runId ?? taskId)!,
            action,
            c.get('auth')!.user.id,
            query,
            await readPolicy(c),
          ),
        });
      },
    );
    router.get(
      '/loanRequests/:id/paymentAccount',
      doc(
        'loanPaymentAccount',
        'Read the protected payment account snapshot',
        z.json(),
      ),
      apiValidator('param', LoanRequestParams),
      async (c) => {
        await recordActionPolicy(c, 'payment', 'paymentAccount');
        return c.json({
          data: await service.paymentInfo(
            c.req.valid('param').id,
            c.get('auth')!.user.id,
            await readPolicy(c),
          ),
        });
      },
    );
    router.get(
      '/loanRequests/:id/repayments',
      doc(
        'loanRepayments',
        'Read loan balance and repayment confirmations',
        z.json(),
      ),
      apiValidator('param', LoanRequestParams),
      async (c) =>
        c.json({
          data: await service.repayments(
            c.req.valid('param').id,
            c.get('auth')!.user.id,
            await readPolicy(c),
          ),
        }),
    );
    router.post(
      '/loanRequests/:id/repayments',
      doc(
        'loanCashRepayment',
        'Record, confirm or cancel a cash repayment',
        z.json(),
      ),
      apiValidator('param', LoanRequestParams),
      apiValidator('json', RepaymentInput),
      async (c) => {
        const input = c.req.valid('json');
        await recordActionPolicy(
          c,
          input.operation === 'confirm' ? 'confirmRepayment' : 'cashRepayment',
        );
        return c.json({
          data: await service.cashRepayment(
            c.req.valid('param').id,
            input,
            c.get('auth')!.user.id,
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
