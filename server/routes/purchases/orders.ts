import { Hono, type Context } from 'hono';
import { z } from 'zod';
import type { Application } from '@nocobase/app-server/application';
import {
  authenticationToken,
  type AuthEnv,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import {
  databaseManagerToken,
  type DatabaseConnection,
  type RepositoryPolicy,
} from '@nocobase/db';
import {
  defineApiRoutes,
  ApiError,
  apiErrorHandler,
  apiValidator,
  describeRoute,
  dataResponse,
  apiErrorResponses,
} from '@nocobase/app-server/router';
import {
  purchaseOrderServiceToken,
  type PurchaseOrder,
} from '../../providers/purchases/contract.js';
import { PurchaseOrderError } from '../../providers/purchases/orders.js';
import { approvalDirectoryServiceToken } from '../../providers/approval-directory/contract.js';
import { calendarServiceToken } from '../../providers/platform/index.js';
import { BudgetError } from '../../providers/budgets/service.js';
const Params = z.strictObject({ id: z.string().min(1).max(64) });
const Mutation = z.strictObject({
  version: z.number().int().nonnegative(),
  reason: z.string().trim().min(1).max(5000),
  requestKey: z.string().min(1).max(128),
});
const Query = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'number', 'actualCents']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});
type Env = AuthEnv & AuthorizationEnv;
export const routes = defineApiRoutes<Application>((app) => {
  const router = new Hono<Env>(),
    c = app.container,
    db = c.resolve(databaseManagerToken),
    service = c.resolve(purchaseOrderServiceToken),
    users = c.resolve(userAdministrationServiceToken);
  router.use(
    '/purchaseOrders',
    c.resolve(authenticationToken).required(),
    c.resolve(authorizationToken).middleware(),
  );
  router.use(
    '/purchaseOrders/*',
    c.resolve(authenticationToken).required(),
    c.resolve(authorizationToken).middleware(),
  );
  router.onError((error, context) =>
    apiErrorHandler(
      error instanceof PurchaseOrderError || error instanceof BudgetError
        ? new ApiError({
            status: error.code.includes('DENIED')
              ? 'PERMISSION_DENIED'
              : error.code.includes('NOT_FOUND')
                ? 'NOT_FOUND'
                : error.code.includes('VERSION') ||
                    error.code.includes('CONFLICT')
                  ? 'ABORTED'
                  : error.code.includes('INVALID')
                    ? 'INVALID_ARGUMENT'
                    : 'FAILED_PRECONDITION',
            domain: 'purchase',
            reason: error.code,
            message: error.message,
          })
        : error,
      context,
    ),
  );
  async function policy(
    context: Context<Env>,
    action: string,
  ): Promise<RepositoryPolicy> {
    const d = await context.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.purchase' },
        action,
      }),
      p =
        d.effect !== 'deny'
          ? d.conditions?.database?.purchaseOrders
          : undefined;
    if (!p)
      throw new ApiError({
        status: 'PERMISSION_DENIED',
        domain: 'purchase',
        reason: 'PURCHASE_ORDER_ACCESS_DENIED',
        message: 'No grant allows this purchase order operation.',
      });
    return p;
  }
  async function visible(context: Context<Env>, action = 'orders') {
    const id = context.req.param('id')!,
      p = await policy(context, action),
      row = await db
        .repository('purchaseOrders')
        .withPolicy(p)
        .findOne({ filter: { id } });
    if (!row)
      throw new ApiError({
        status: 'NOT_FOUND',
        domain: 'purchase',
        reason: 'PURCHASE_ORDER_NOT_FOUND',
        message: 'The order is outside the granted scope.',
      });
    if (action === 'accept') {
      const update = p.update;
      const required = [
        'status',
        'version',
        'acceptedAt',
        'acceptedById',
        'receiptDate',
        'receiptReason',
      ];
      const writable =
        update &&
        (update === true ||
          required.every(
            (field) =>
              Array.isArray(update.fields) && update.fields.includes(field),
          ))
          ? await db
              .repository('purchaseOrders')
              .withPolicy({
                ...p,
                read:
                  update === true
                    ? true
                    : { scope: update.scope, fields: ['id'] },
              })
              .findOne({ filter: { id } })
          : undefined;
      if (!writable)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'purchase',
          reason: 'PURCHASE_ORDER_UPDATE_DENIED',
          message:
            'The receipt update is outside the granted record or field scope.',
        });
    }
    const fields = [
      'id',
      'purchaseId',
      'number',
      'applicantId',
      'departmentId',
      'items',
      'actualCents',
      'vendor',
      'account',
      'status',
      'version',
      'createdAt',
      'acceptedAt',
      'acceptedById',
      'receiptDate',
      'receiptReason',
    ];
    if (fields.some((k) => !(k in row)))
      throw new ApiError({
        status: 'PERMISSION_DENIED',
        domain: 'purchase',
        reason: 'PURCHASE_ORDER_FIELDS_RESTRICTED',
        message: 'The complete immutable order fields are required.',
      });
    return id;
  }
  async function enrich(row: PurchaseOrder, connection?: DatabaseConnection) {
    // Mutation responses must reuse their transaction instead of borrowing a
    // second pooled connection while the business write is still uncommitted.
    const lookup = connection ? users.withConnection(connection) : users;
    const applicant = await lookup.get(row.applicantId),
      acceptedBy = row.acceptedById
        ? await lookup.get(row.acceptedById)
        : undefined;
    return {
      ...row,
      applicant: applicant ? { id: applicant.id, name: applicant.name } : null,
      acceptedBy: acceptedBy
        ? { id: acceptedBy.id, name: acceptedBy.name }
        : null,
    };
  }
  const doc = (operationId: string, summary: string) =>
    describeRoute({
      tags: ['Purchases'],
      operationId,
      summary,
      responses: { '200': dataResponse(z.json()), ...apiErrorResponses },
    });
  router.get(
    '/purchaseOrders',
    doc(
      'listPurchaseOrders',
      'List immutable purchase orders with server ordering and pagination',
    ),
    apiValidator('query', Query),
    async (context) => {
      const result = await service.list(
        context.req.valid('query'),
        await policy(context, 'orders'),
      );
      return context.json({
        ...result,
        timeZone: c.resolve(calendarServiceToken).timeZone(),
        data: await Promise.all(result.data.map((row) => enrich(row))),
      });
    },
  );
  router.get(
    '/purchaseOrders/:id',
    doc('getPurchaseOrder', 'Read a purchase order and linked payment totals'),
    apiValidator('param', Params),
    async (context) => {
      const id = await visible(context),
        row = await service.get(id);
      if (!row)
        throw new ApiError({
          status: 'NOT_FOUND',
          domain: 'purchase',
          reason: 'PURCHASE_ORDER_NOT_FOUND',
          message: 'The order no longer exists.',
        });
      const payments = await service.paymentTotals(id);
      const actorId = context.get('auth')!.user.id;
      let canAccept = false;
      if (row.status === 'awaitingReceipt' && row.applicantId === actorId) {
        try {
          await visible(context, 'accept');
          canAccept = true;
        } catch (error) {
          if (!(error instanceof ApiError)) throw error;
        }
      }
      const directory = await c
        .resolve(approvalDirectoryServiceToken)
        .snapshot(db.connection());
      return context.json({
        data: {
          record: await enrich(row),
          payments,
          timeZone: c.resolve(calendarServiceToken).timeZone(),
          actions: {
            accept: canAccept,
            cancel:
              row.status === 'awaitingReceipt' &&
              payments.paidCents === 0 &&
              payments.pendingCents === 0 &&
              directory.hasRole(actorId, 'approval.admin'),
          },
        },
      });
    },
  );
  router.post(
    '/purchaseOrders/:id/accept',
    doc(
      'acceptPurchaseOrder',
      'Applicant confirms receipt and settles the held purchase budget',
    ),
    apiValidator('param', Params),
    apiValidator(
      'json',
      Mutation.safeExtend({
        receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    ),
    async (context) => {
      const id = await visible(context, 'accept'),
        input = context.req.valid('json');
      return context.json({
        data: await db.transaction(async (tx) =>
          enrich(
            await service.accept(
              id,
              { ...input, actorId: context.get('auth')!.user.id },
              tx,
            ),
            tx,
          ),
        ),
      });
    },
  );
  router.post(
    '/purchaseOrders/:id/cancel',
    doc(
      'cancelPurchaseOrder',
      'Approval administrator cancels an unreceived unpaid purchase order',
    ),
    apiValidator('param', Params),
    apiValidator('json', Mutation),
    async (context) => {
      const id = await visible(context),
        input = context.req.valid('json');
      return context.json({
        data: await db.transaction(async (tx) =>
          enrich(
            await service.cancel(
              id,
              { ...input, actorId: context.get('auth')!.user.id },
              tx,
            ),
            tx,
          ),
        ),
      });
    },
  );
  const root = new Hono();
  root.route('/', router);
  return root;
});
export default routes;
