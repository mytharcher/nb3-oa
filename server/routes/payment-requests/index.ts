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
import { ContractError } from '../../providers/contracts/errors.js';
import { InvoiceError } from '../../providers/invoices/service.js';
import { paymentRequestServiceToken } from '../../providers/payment-requests/contract.js';
import { PaymentRequestError } from '../../providers/payment-requests/errors.js';
import type { PaymentRequestService } from '../../providers/payment-requests/service.js';
import { PurchaseOrderError } from '../../providers/purchases/orders.js';
import { VendorError } from '../../providers/vendors/service.js';
import { routes as attachments } from './attachments.js';
import {
  ActionInput,
  CandidatesQuery,
  CandidatesResult,
  CorrectPayee,
  CreatePaymentRequest,
  Detail,
  ListQuery,
  OptionsQuery,
  Params,
  Payee,
  PaymentRequestInput,
  Record as RecordSchema,
  Result,
  TransitionInput,
} from './schemas.js';
type Env = AuthEnv & AuthorizationEnv;
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<Env>();
    const service = app.container.resolve(
      paymentRequestServiceToken,
    ) as PaymentRequestService;
    const db = app.container.resolve(databaseManagerToken);
    router.use(
      '/paymentRequests',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/paymentRequests/*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError((error, c) => {
      if (
        error instanceof PaymentRequestError ||
        error instanceof ContractError ||
        error instanceof InvoiceError ||
        error instanceof PurchaseOrderError ||
        error instanceof VendorError
      )
        return apiErrorHandler(
          new ApiError({
            status:
              error instanceof ContractError &&
              /DENIED|RESTRICTED/.test(error.code)
                ? 'PERMISSION_DENIED'
                : error instanceof PaymentRequestError
                  ? error.kind === 'permission'
                    ? 'PERMISSION_DENIED'
                    : error.kind === 'notFound'
                      ? 'NOT_FOUND'
                      : error.kind === 'conflict'
                        ? 'ABORTED'
                        : 'FAILED_PRECONDITION'
                  : error.code.includes('CONFLICT')
                    ? 'ABORTED'
                    : 'FAILED_PRECONDITION',
            domain: 'paymentRequest',
            reason: error.code,
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields
            ? new ApiError({ ...fields, domain: 'paymentRequest' })
            : error,
          c,
        );
      }
      if (
        error instanceof ApprovalError &&
        !['INTERNAL', 'INVALID_EFFECT'].includes(error.code)
      )
        return apiErrorHandler(
          new ApiError({
            status:
              error.code === 'CONFLICT'
                ? 'ABORTED'
                : error.code === 'TASK_NOT_FOUND'
                  ? 'NOT_FOUND'
                  : [
                        'NOT_ASSIGNEE',
                        'INACTIVE',
                        'NOT_ALLOWED',
                        'NOT_IN_POOL',
                        'NOT_QUALIFIED',
                      ].includes(error.code)
                    ? 'PERMISSION_DENIED'
                    : 'FAILED_PRECONDITION',
            domain: 'paymentRequest',
            reason: error.code,
            message: error.message,
          }),
          c,
        );
      return apiErrorHandler(error, c);
    });
    const doc = (
      operationId: string,
      summary: string,
      schema: z.ZodType = Result,
      success = '200',
    ) =>
      describeRoute({
        tags: ['Payment requests'],
        operationId,
        summary,
        responses: { [success]: dataResponse(schema), ...apiErrorResponses },
      });
    async function actionPolicy(c: Context<Env>, action: string) {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.payment' },
        action,
      });
      const p =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false> | undefined
            )?.paymentRequests;
      if (!p)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'paymentRequest',
          reason: 'PAYMENT_REQUEST_ACCESS_DENIED',
          message: 'No grant permits this payment business action.',
        });
      return p;
    }
    async function readPolicy(c: Context<Env>, action = 'view') {
      const p = await actionPolicy(c, action);
      const id = c.req.param('id');
      if (id) {
        const row = await db
          .repository('paymentRequests')
          .withPolicy(p)
          .findOne({ filter: { id } });
        if (!row)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'paymentRequest',
            reason: 'PAYMENT_REQUEST_ACCESS_DENIED',
            message: 'The payment is outside the granted scope.',
          });
        const required = [
          'id',
          'applicantId',
          'createdById',
          ...Object.keys(PaymentRequestInput.shape),
          'departmentId',
          'sourceOrderId',
          'sourceHeldCents',
          'sourceApprovedCents',
          'sourceCumulativeCents',
          'fullApprovalRequired',
          'voucherAttachments',
          'status',
          'lifecycleVersion',
        ];
        if (required.some((field) => !(field in row)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'paymentRequest',
            reason: 'PAYMENT_REQUEST_FIELDS_RESTRICTED',
            message: 'The payment business fields are outside this grant.',
          });
      }
      return p;
    }
    async function contractSourcePolicy(c: Context<Env>) {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.contract' },
        action: 'ledger',
      });
      const policy =
        decision.effect !== 'deny'
          ? (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false> | undefined
            )?.contracts
          : undefined;
      return policy || undefined;
    }
    async function requireContractSource(c: Context<Env>, id: string) {
      const policy = await contractSourcePolicy(c);
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'paymentRequest',
          reason: 'PAYMENT_REQUEST_CONTRACT_DENIED',
          message: 'Ordinary contract ledger access is required.',
        });
      const sources = await app.container
        .resolve(
          (await import('../../providers/contracts/contract.js'))
            .contractLedgerServiceToken,
        )
        .listForPayment(c.get('auth')!.user.id, policy, db.connection());
      if (!sources.some((source) => source.id === id))
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'paymentRequest',
          reason: 'PAYMENT_REQUEST_CONTRACT_DENIED',
          message: 'This contract is outside the granted scope.',
        });
    }
    router.get(
      '/paymentRequests/options',
      doc(
        'paymentRequestOptions',
        'Eligible payees, approved orders and payment methods',
        z.json(),
      ),
      apiValidator('query', OptionsQuery),
      async (c) => {
        const decisions = await Promise.all(
          ['view', 'submit', 'delegate'].map((action) =>
            c.get('authz').authorize({
              resource: { type: 'composite', id: 'oa.payment' },
              action,
            }),
          ),
        );
        if (
          !decisions.some(
            (decision) =>
              decision.effect !== 'deny' &&
              decision.conditions?.database?.paymentRequests,
          )
        )
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'paymentRequest',
            reason: 'PAYMENT_REQUEST_ACCESS_DENIED',
            message: 'A payment business grant is required.',
          });
        const actorId = c.get('auth')!.user.id;
        const { applicantId = actorId, recordId } = c.req.valid('query');
        const access = await actionPolicy(
          c,
          recordId ? 'view' : applicantId === actorId ? 'submit' : 'delegate',
        );
        const read = access.read;
        const readableFields = read && read !== true ? read.fields : undefined;
        if (
          !read ||
          (read !== true &&
            (read.fields === false ||
              (Array.isArray(readableFields) &&
                [
                  'purchaseOrderId',
                  'contractId',
                  'vendorId',
                  'amountCents',
                ].some((field) => !readableFields.includes(field)))))
        )
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'paymentRequest',
            reason: 'PAYMENT_REQUEST_FIELDS_RESTRICTED',
            message:
              'Source candidates require explicit read access to source, vendor and amount fields.',
          });
        return c.json({
          data: await service.options(
            actorId,
            applicantId,
            access,
            recordId,
            await contractSourcePolicy(c),
          ),
        });
      },
    );
    router.get(
      '/paymentRequests',
      doc(
        'listPaymentRequests',
        'Payment applications and approval work',
        z.array(RecordSchema),
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
      '/paymentRequests',
      doc(
        'createPaymentRequest',
        'Create an idempotent draft payment application',
        Result,
        '201',
      ),
      apiValidator('json', CreatePaymentRequest),
      async (c) => {
        const { applicantId, requestId, ...input } = c.req.valid('json');
        const actorId = c.get('auth')!.user.id;
        const p = await actionPolicy(
          c,
          applicantId && applicantId !== actorId ? 'delegate' : 'submit',
        );
        if (input.contractId) await requireContractSource(c, input.contractId);
        return c.json(
          {
            data: await service.create(
              input,
              actorId,
              applicantId,
              p,
              requestId,
              (await contractSourcePolicy(c)) ?? false,
            ),
          },
          201,
        );
      },
    );
    router.get(
      '/paymentRequests/:id',
      doc(
        'getPaymentRequest',
        'Payment content and offered approval actions',
        Detail,
      ),
      apiValidator('param', Params),
      async (c) => {
        const detail = await service.detail(
          c.req.valid('param').id,
          c.get('auth')!.user.id,
          await readPolicy(c),
        );
        const names = detail.record.contractId
          ? await app.container
              .resolve(
                (await import('../../providers/contracts/contract.js'))
                  .contractLedgerServiceToken,
              )
              .names(
                [detail.record.contractId],
                await contractSourcePolicy(c),
                db.connection(),
              )
          : new Map<string, string>();
        return c.json({
          data: {
            ...detail,
            contractName: detail.record.contractId
              ? (names.get(detail.record.contractId) ?? null)
              : null,
          },
        });
      },
    );
    router.post(
      '/paymentRequests/:id/transition',
      doc(
        'transitionPaymentRequest',
        'Edit, submit, withdraw or recover an exception',
      ),
      apiValidator('param', Params),
      apiValidator('json', TransitionInput),
      async (c) => {
        const input = c.req.valid('json');
        const actorId = c.get('auth')!.user.id;
        const read = await readPolicy(c);
        const record = await service.accessFacts(
          c.req.valid('param').id,
          actorId,
          read,
        );
        const write = [
          'edit',
          'submit',
          'withdraw',
          'retryCash',
          'reviseBusiness',
        ].includes(input.transition)
          ? await actionPolicy(
              c,
              record.applicantId === actorId ? 'submit' : 'delegate',
            )
          : undefined;
        if (['edit', 'reviseBusiness'].includes(input.transition)) {
          const parsed = PaymentRequestInput.safeParse(input.input);
          if (!parsed.success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'paymentRequest',
              reason: 'PAYMENT_REQUEST_INVALID_INPUT',
              message: 'The payment form is invalid.',
              fieldViolations: parsed.error.issues.map((issue) => ({
                field: issue.path.map(String).join('.'),
                description: issue.message,
              })),
            });
          input.input = parsed.data;
        }
        const sourceId = ['edit', 'reviseBusiness'].includes(input.transition)
          ? input.input.contractId
          : record.contractId;
        if (
          typeof sourceId === 'string' &&
          ['edit', 'reviseBusiness', 'submit'].includes(input.transition)
        )
          await requireContractSource(c, sourceId);
        return c.json({
          data: await service.transition(
            c.req.valid('param').id,
            input.transition,
            actorId,
            input.version,
            input.requestId,
            input.input,
            read,
            write,
            (await contractSourcePolicy(c)) ?? false,
          ),
        });
      },
    );
    router.post(
      '/paymentRequests/:id/action',
      doc(
        'performPaymentRequestAction',
        'Perform a current offered approval or cashier action',
        z.json(),
      ),
      apiValidator('param', Params),
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
      '/paymentRequests/:id/candidates',
      doc(
        'paymentRequestCandidates',
        'Eligible recipients for a current task or run action',
        CandidatesResult,
      ),
      apiValidator('param', Params),
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
    router.get(
      '/paymentRequests/:id/paymentAccount',
      doc(
        'paymentRequestAccount',
        'Read separately protected payee bank details',
        Payee.nullable(),
      ),
      apiValidator('param', Params),
      async (c) =>
        c.json({
          data: await service.paymentAccount(
            c.req.valid('param').id,
            c.get('auth')!.user.id,
            await readPolicy(c, 'paymentAccount'),
            await readPolicy(c),
          ),
        }),
    );
    router.patch(
      '/paymentRequests/:id/paymentAccount',
      doc(
        'correctPaymentRequestAccount',
        'Correct only the private account of an exception payment',
        z.strictObject({ version: z.number().int() }),
      ),
      apiValidator('param', Params),
      apiValidator('json', CorrectPayee),
      async (c) => {
        const input = c.req.valid('json');
        return c.json({
          data: await service.correctPaymentAccount(
            c.req.valid('param').id,
            c.get('auth')!.user.id,
            input.lifecycleVersion,
            input.payeeVersion,
            input.account,
            input.reason,
            await readPolicy(c, 'paymentAccount'),
            await readPolicy(c),
          ),
        });
      },
    );
    const root = new Hono();
    root.route('/', router);
    return root;
  }),
  ...attachments,
];
export default routes;
