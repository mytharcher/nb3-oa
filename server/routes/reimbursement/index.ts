import { ReimbursementAttachmentError } from '../../providers/reimbursement/attachments.js';
import attachmentRoutes from './attachments.js';
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
import { ReimbursementAmountError } from '../../providers/reimbursement/amounts.js';
import { InvoiceError } from '../../providers/invoices/service.js';
import { ExpenseAuthorizationError } from '../../providers/expense-authorizations/service.js';
import { LoanLedgerError } from '../../providers/loan-ledger/service.js';
import { ReimbursementError } from '../../providers/reimbursement/errors.js';
import { reimbursementServiceToken } from '../../providers/reimbursement/index.js';
import {
  ActionInput,
  CandidatesResult,
  CandidatesQuery,
  CreateReimbursement,
  ReimbursementInput,
  ReimbursementParams,
  ListQuery,
  TransitionInput,
  Result,
  Detail,
  List,
  ActionResult,
  PaymentAccount,
  CorrectPaymentAccount,
} from './schemas.js';
export const routes: readonly AppRouteContribution<Application>[] = [
  ...attachmentRoutes,
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const service = app.container.resolve(reimbursementServiceToken);
    router.use(
      '/reimbursementRequests',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/reimbursementRequests/*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError((error, c) => {
      if (error instanceof ReimbursementAttachmentError)
        return apiErrorHandler(
          new ApiError({
            status:
              error.code === 'REIMBURSEMENT_ATTACHMENT_DENIED'
                ? 'PERMISSION_DENIED'
                : 'INVALID_ARGUMENT',
            domain: 'reimbursement',
            reason: error.code,
            message: error.message,
          }),
          c,
        );
      if (
        error instanceof ReimbursementError ||
        error instanceof ReimbursementAmountError ||
        error instanceof InvoiceError ||
        error instanceof ExpenseAuthorizationError ||
        error instanceof LoanLedgerError
      )
        return apiErrorHandler(
          new ApiError({
            status:
              error instanceof ReimbursementError && error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error instanceof ReimbursementError &&
                    error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : error instanceof ReimbursementError &&
                      error.kind === 'conflict'
                    ? 'ABORTED'
                    : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'reimbursement',
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'reimbursement' }) : error,
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
            domain: 'reimbursement',
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
        resource: { type: 'composite', id: 'oa.reimbursement' },
        action,
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.reimbursementRequests;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'reimbursement',
          reason: 'REIMBURSEMENT_ACTION_DENIED',
          message: 'No grant allows this reimbursement business action.',
        });
      return policy;
    }
    async function readPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
    ): Promise<RepositoryPolicy | undefined> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.reimbursement' },
        action: 'view',
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.reimbursementRequests || undefined;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'reimbursement',
          reason: 'REIMBURSEMENT_ACCESS_DENIED',
          message: 'No reimbursement reading permission is granted.',
        });
      const id = c.req.param('id');
      if (id) {
        const row = await app.container
          .resolve(databaseManagerToken)
          .repository('reimbursementRequests')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (!row)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'reimbursement',
            reason: 'REIMBURSEMENT_ACCESS_DENIED',
            message: 'This reimbursement request is outside the granted scope.',
          });
        const required = [
          'id',
          'applicantId',
          'createdById',
          'number',
          'reason',
          'authorizationId',
          'loanId',
          'bindingCaptured',
          'boundAuthorizationId',
          'boundLoanId',
          'debtHeldCents',
          'debtHoldRecorded',
          'offsetCents',
          'overrunReason',
          'lines',
          'totalCents',
          'lastSubmittedTotalCents',
          'departmentId',
          'managerId',
          'headId',
          'accountantId',
          'executiveId',
          'gmId',
          'ruleSnapshot',
          'managerReviewBasis',
          'headReviewBasis',
          'financeLineFacts',
          'financeCorrectionLines',
          'exceptionContentHash',
          'handlingFailureReason',
          'voucherNumber',
          'paymentId',
          'forcedReason',
          'status',
          'lifecycleVersion',
          'createdAt',
        ];
        if (required.some((field) => !(field in row)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'reimbursement',
            reason: 'REIMBURSEMENT_FIELDS_RESTRICTED',
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
        tags: ['Reimbursement'],
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
      '/reimbursementRequests/options',
      doc(
        'reimbursementOptions',
        'Get payment account readiness, company time zone and eligible applicant sources',
        z.json(),
      ),
      apiValidator(
        'query',
        z.object({
          applicantId: z.string().min(1).max(64).optional(),
          recordId: z.string().min(1).max(64).optional(),
        }),
      ),
      async (c) => {
        const decisions = await Promise.all(
          ['view', 'submit', 'delegate'].map((action) =>
            c.get('authz').authorize({
              resource: { type: 'composite', id: 'oa.reimbursement' },
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
              )?.reimbursementRequests,
          )
        )
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'reimbursement',
            reason: 'REIMBURSEMENT_OPTIONS_DENIED',
            message: 'An reimbursement business grant is required.',
          });
        const actorId = c.get('auth')!.user.id;
        const { applicantId = actorId, recordId } = c.req.valid('query');
        return c.json({
          data: await service.options(
            actorId,
            applicantId,
            recordId
              ? await readPolicy(c)
              : applicantId !== actorId
                ? await actionPolicy(c, 'delegate')
                : undefined,
            recordId,
          ),
        });
      },
    );
    router.get(
      '/reimbursementRequests',
      doc(
        'listReimbursements',
        'List my reimbursement requests and approval work',
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
      '/reimbursementRequests',
      doc('createReimbursement', 'Create a reimbursement draft', Result, '201'),
      apiValidator('json', CreateReimbursement),
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
              Object.fromEntries(
                Object.entries(input).filter(
                  ([key]) => !['applicantId', 'requestId'].includes(key),
                ),
              ) as Omit<typeof input, 'applicantId'>,
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
      '/reimbursementRequests/:id',
      doc(
        'getReimbursement',
        'Get reimbursement content, stages and offered actions',
        Detail,
      ),
      apiValidator('param', ReimbursementParams),
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
      '/reimbursementRequests/:id/transition',
      doc(
        'transitionReimbursement',
        'Edit, submit, withdraw or terminate a reimbursement request',
      ),
      apiValidator('param', ReimbursementParams),
      apiValidator('json', TransitionInput),
      async (c) => {
        const input = c.req.valid('json');
        const actorId = c.get('auth')!.user.id;
        let mutationPolicy: RepositoryPolicy | undefined;
        if (
          [
            'submit',
            'edit',
            'withdraw',
            'retryCash',
            'reviseBusiness',
          ].includes(input.transition)
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
          const parsed = ReimbursementInput.safeParse(input.input);
          if (!parsed.success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'reimbursement',
              reason: 'REIMBURSEMENT_INVALID_INPUT',
              message: 'The reimbursement form is invalid.',
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
      '/reimbursementRequests/:id/action',
      doc(
        'performReimbursementAction',
        'Perform an offered reimbursement approval action',
        ActionResult,
      ),
      apiValidator('param', ReimbursementParams),
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
      '/reimbursementRequests/:id/candidates',
      doc(
        'reimbursementActionCandidates',
        'Eligible recipients for an approval action',
        CandidatesResult,
      ),
      apiValidator('param', ReimbursementParams),
      apiValidator('query', CandidatesQuery),
      async (c) => {
        const { taskId, runId, action, ...query } = c.req.valid('query');
        return c.json({
          data: await service.candidates(
            c.req.valid('param').id,
            runId ? { runId } : { taskId: taskId! },
            action,
            c.get('auth')!.user.id,
            query,
            await readPolicy(c),
          ),
        });
      },
    );
    async function paymentAccountPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
    ): Promise<void> {
      const policy = await actionPolicy(c, 'paymentAccount');
      // The public business read grant and the private bank grant are separate.
      // Domain involvement can permit canRead; it must never widen the bank policy.
      const accessible = await app.container
        .resolve(databaseManagerToken)
        .repository('reimbursementRequests')
        .withPolicy(policy)
        .findOne({ filter: { id: c.req.param('id') } });
      if (!accessible)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'reimbursement',
          reason: 'REIMBURSEMENT_PAYMENT_ACCOUNT_DENIED',
          message:
            'This reimbursement is outside the private account permission scope.',
        });
    }
    router.get(
      '/reimbursementRequests/:id/paymentAccount',
      doc(
        'getReimbursementPaymentAccount',
        'Read the authorized private reimbursement payment account',
        PaymentAccount,
      ),
      apiValidator('param', ReimbursementParams),
      async (c) => {
        await paymentAccountPolicy(c);
        return c.json({
          data: await service.paymentAccount(
            c.req.valid('param').id,
            c.get('auth')!.user.id,
            await readPolicy(c),
          ),
        });
      },
    );
    router.patch(
      '/reimbursementRequests/:id/paymentAccount',
      doc(
        'correctReimbursementPaymentAccount',
        'Correct an account in the current cashier exception without changing approval content',
        z.strictObject({ version: z.number().int() }),
      ),
      apiValidator('param', ReimbursementParams),
      apiValidator('json', CorrectPaymentAccount),
      async (c) => {
        await paymentAccountPolicy(c);
        const id = c.req.valid('param').id,
          actorId = c.get('auth')!.user.id,
          policy = await readPolicy(c),
          detail = await service.detail(id, actorId, policy);
        await actionPolicy(
          c,
          detail.record.applicantId === actorId ? 'submit' : 'delegate',
        );
        const input = c.req.valid('json');
        return c.json({
          data: await service.correctPaymentAccount(
            id,
            actorId,
            input.version,
            input.payeeVersion,
            input.account,
            policy,
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
