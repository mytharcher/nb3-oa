import { createHash } from 'node:crypto';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Application } from '@nocobase/app-server/application';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import type { FinanceIntegrationConfig } from '../../config/finance-integration.js';
import type { FinanceSourceFact } from '../../providers/finance-integration/contract.js';
import { auditServiceToken } from '../../providers/audit/index.js';
import { FINANCE_INTEGRATION } from '../../providers/finance-integration/index.js';
import {
  createFinanceDispatcher,
  FinanceDispatchConflict,
  type FinanceDispatch,
} from '../../providers/finance-integration/dispatch.js';
import {
  financeEnvelope,
  FinanceGateway,
} from '../../providers/finance-integration/gateway.js';
import { reimbursementServiceToken } from '../../providers/reimbursement/index.js';
import { paymentRequestServiceToken } from '../../providers/payment-requests/contract.js';
import { ReimbursementError } from '../../providers/reimbursement/errors.js';
import { PaymentRequestError } from '../../providers/payment-requests/errors.js';

const Params = z.object({
  kind: z.enum(['reimbursement', 'payment']),
  id: z.string().min(1).max(128),
});
const Result = z.object({
  enabled: z.boolean(),
  state: z.enum([
    'not_sent',
    'sending',
    'accepted',
    'posted',
    'rejected',
    'unknown',
  ]),
  voucherNumber: z.string().nullable(),
  externalId: z.string().nullable(),
  resultCode: z.string().nullable(),
  updatedAt: z.string().nullable(),
  busy: z.boolean(),
});
const source = {
  reimbursement: {
    resource: 'oa.reimbursement',
    collection: 'reimbursementRequests',
  },
  payment: { resource: 'oa.payment', collection: 'paymentRequests' },
} as const;
function denied(): never {
  throw new ApiError({
    status: 'PERMISSION_DENIED',
    domain: 'financeIntegration',
    reason: 'ACCESS_DENIED',
    message: 'Finance integration and source-record access are both required.',
  });
}
function result(row: FinanceDispatch | undefined, enabled: boolean) {
  return {
    enabled,
    state:
      row?.state === 'pending'
        ? ('not_sent' as const)
        : (row?.state ?? ('not_sent' as const)),
    voucherNumber: row?.voucherNumber ?? null,
    externalId: row?.externalId ?? null,
    resultCode: row?.resultCode ?? null,
    updatedAt: row ? new Date(row.updatedAt).toISOString() : null,
    busy: !!row?.leaseUntil && new Date(row.leaseUntil).getTime() > Date.now(),
  };
}
export default [
  defineApiRoutes<Application>((app) => {
    const container = app.container;
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    router.use(
      '/financeIntegration/*',
      container.resolve(authenticationToken).required(),
      container.resolve(authorizationToken).middleware(),
    );
    router.onError((error, c) => {
      if (error instanceof FinanceDispatchConflict)
        return apiErrorHandler(
          new ApiError({
            status: 'ABORTED',
            domain: 'financeIntegration',
            reason: 'SOURCE_CHANGED',
            message:
              'Reconcile the existing external finance entry before changing the source or destination.',
          }),
          c,
        );
      if (
        error instanceof ReimbursementError ||
        error instanceof PaymentRequestError
      )
        return apiErrorHandler(
          new ApiError({
            status:
              error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : 'FAILED_PRECONDITION',
            domain: 'financeIntegration',
            reason: 'SOURCE_UNAVAILABLE',
            message:
              'The paid source record is not available with the required fields.',
          }),
          c,
        );
      return apiErrorHandler(error, c);
    });
    const store = createFinanceDispatcher(
      container.resolve(databaseManagerToken).connection(),
      container.resolve(auditServiceToken),
    );
    const doc = (operationId: string) =>
      describeRoute({
        tags: ['Finance integration'],
        operationId,
        summary:
          'Read or synchronize authorized paid business facts with the finance gateway',
        responses: { 200: dataResponse(Result), ...apiErrorResponses },
      });
    for (const mode of ['read', 'submit', 'lookup'] as const) {
      const route = `/financeIntegration/:kind/:id${mode === 'read' ? '' : mode === 'submit' ? '/send' : '/refresh'}`;
      router.on(
        mode === 'read' ? 'GET' : 'POST',
        route,
        doc(`financeIntegration.${mode}`),
        apiValidator('param', Params),
        async (c) => {
          const { kind, id } = c.req.valid('param'),
            actorId = c.get('auth')!.user.id;
          await c.get('authz').require({
            resource: { type: 'settings', id: FINANCE_INTEGRATION },
            action: mode === 'read' ? 'read' : 'send',
          });
          const decision = await c.get('authz').authorize({
            resource: { type: 'composite', id: source[kind].resource },
            action: 'view',
          });
          const policy =
            decision.effect === 'deny'
              ? undefined
              : (
                  decision.conditions?.database as
                    Record<string, RepositoryPolicy | false> | undefined
                )?.[source[kind].collection];
          if (!policy) denied();
          const facts: FinanceSourceFact =
            kind === 'reimbursement'
              ? await container
                  .resolve(reimbursementServiceToken)
                  .financeExport(id, actorId, policy)
              : await container
                  .resolve(paymentRequestServiceToken)
                  .financeExport(id, actorId, policy);
          const config = app.config.get<FinanceIntegrationConfig>(
            'financeIntegration',
          ) ?? { enabled: false, baseUrl: '', token: '', instanceId: '' };
          if (mode === 'read')
            return c.json({
              data: result(await store.read(kind, id), config.enabled),
            });
          // No caller-provided URLs, accounting facts or identities may influence a dispatch.
          const input: unknown = await c.req.json().catch(() => undefined);
          if (!z.object({}).strict().safeParse(input).success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'financeIntegration',
              reason: 'INVALID_INPUT',
              message:
                'Supply an empty JSON object; source facts are server-owned.',
            });
          if (!config.enabled)
            throw new ApiError({
              status: 'FAILED_PRECONDITION',
              domain: 'financeIntegration',
              reason: 'NOT_CONFIGURED',
              message: 'The finance gateway is not configured.',
            });
          const gateway = new FinanceGateway(config);
          const base = new URL(config.baseUrl);
          if (!base.pathname.endsWith('/')) base.pathname += '/';
          const destination = createHash('sha256')
            .update(JSON.stringify([config.instanceId, base.href]))
            .digest('hex');
          const envelope = financeEnvelope({
            schemaVersion: 1,
            source: {
              instanceId: config.instanceId,
              kind,
              id: facts.id,
              number: facts.number,
            },
            currency: 'CNY',
            applicantId: facts.applicantId,
            departmentId: facts.departmentId,
            amountCents: facts.amountCents,
            offsetCents: facts.offsetCents,
            paidCents: facts.paidCents,
            forced: facts.forced,
            lines: facts.lines,
            ...(facts.vendorId !== undefined
              ? {
                  vendorId: facts.vendorId,
                  purchaseOrderId: facts.purchaseOrderId,
                  contractId: facts.contractId,
                }
              : {}),
          });
          return c.json({
            data: result(
              await store.dispatch(
                envelope,
                destination,
                actorId,
                gateway,
                mode,
              ),
              true,
            ),
          });
        },
      );
    }
    return new Hono().route('/', router);
  }),
];
