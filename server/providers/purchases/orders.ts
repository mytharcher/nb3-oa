import { randomUUID } from 'node:crypto';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { BudgetService } from '../budgets/contract.js';
import type { VendorService } from '../vendors/contract.js';
import type { ApprovalDirectoryService } from '../approval-directory/contract.js';
import type {
  PurchaseOrder,
  PurchaseOrderService,
  PurchasePaymentReference,
} from './contract.js';
export class PurchaseOrderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PurchaseOrderError';
  }
}
function fail(code: string, message: string): never {
  throw new PurchaseOrderError(`PURCHASE_ORDER_${code}`, message);
}
function cents(value: unknown, positive = true): number {
  if (
    (typeof value !== 'number' &&
      typeof value !== 'string' &&
      typeof value !== 'bigint') ||
    (typeof value === 'string' && !/^\d+$/.test(value))
  )
    fail('INVALID_AMOUNT', 'Money must be exact nonnegative integer cents.');
  const n = Number(value);
  if (!Number.isSafeInteger(n) || (positive ? n <= 0 : n < 0))
    fail('INVALID_AMOUNT', 'Money must be bounded exact integer cents.');
  return n;
}
const normalize = (row: PurchaseOrder) => ({
  ...row,
  actualCents: cents(row.actualCents),
});
const reference = 'oa.purchase';
export function createPurchaseOrderService(d: {
  db: DatabaseManager;
  budgets: BudgetService;
  vendors: VendorService;
  audit: AuditService;
  directory: ApprovalDirectoryService;
}): PurchaseOrderService {
  const get = async (id: string, tx = d.db.connection()) => {
    const row = await tx
      .repository<PurchaseOrder>('purchaseOrders')
      .findOne({ filter: { id } });
    return row ? normalize(row) : null;
  };
  async function lock(id: string, tx: DatabaseConnection, version?: number) {
    const repo = tx.repository<PurchaseOrder>('purchaseOrders');
    const result = await repo.updateMany({
      filter: { id, ...(version === undefined ? {} : { version }) },
      values: { version: { increment: 1 } },
    });
    if (!result.updatedCount)
      fail('VERSION_CONFLICT', 'The order changed or is unavailable.');
    return (await get(id, tx))!;
  }
  async function entries(id: string, tx: DatabaseConnection) {
    return (
      await tx
        .repository<PurchasePaymentReference>('purchasePaymentReferences')
        .findMany({ filter: { orderId: id } })
    ).map((r) => ({ ...r, cents: cents(r.cents) }));
  }
  async function totals(id: string, tx: DatabaseConnection) {
    const rows = await entries(id, tx);
    let pending = 0n,
      paid = 0n;
    for (const r of rows)
      if (r.state === 'pending') pending += BigInt(r.cents);
      else if (r.state === 'paid') paid += BigInt(r.cents);
    if (pending + paid > BigInt(Number.MAX_SAFE_INTEGER))
      fail(
        'INVALID_AMOUNT',
        'Cumulative payments exceed the exact monetary limit.',
      );
    return { pendingCents: Number(pending), paidCents: Number(paid) };
  }
  function command(i: {
    actorId: string;
    requestKey?: string;
    reason?: string;
  }) {
    if (
      !i.actorId ||
      i.actorId.length > 64 ||
      (i.requestKey !== undefined &&
        (!i.requestKey || i.requestKey.length > 128))
    )
      fail('INVALID_COMMAND', 'An actor and stable command key are required.');
  }
  return {
    async lockPaymentSources(orderIds, connection) {
      for (const id of [...new Set(orderIds)].sort()) {
        if (!id) fail('INVALID_COMMAND', 'A purchase order id is required.');
        await lock(id, connection);
      }
    },
    get,
    async list(query, policy, tx = d.db.connection()) {
      const rows = (
        await tx
          .repository<PurchaseOrder>('purchaseOrders')
          .withPolicy(policy)
          .findMany({
            sort: (s) =>
              query.direction === 'asc'
                ? [s.field(query.sort).asc(), s.field('id').asc()]
                : [s.field(query.sort).desc(), s.field('id').desc()],
          })
      ).map((r) => {
        if (
          !r.id ||
          r.actualCents === undefined ||
          !r.vendor ||
          !r.items ||
          !r.account ||
          !r.applicantId
        )
          fail(
            'FIELDS_RESTRICTED',
            'The grant must expose the complete order.',
          );
        return normalize(r as PurchaseOrder);
      });
      const page = Math.min(
        query.page,
        Math.max(1, Math.ceil(rows.length / query.pageSize)),
      );
      return {
        data: rows.slice((page - 1) * query.pageSize, page * query.pageSize),
        meta: { page, pageSize: query.pageSize, total: rows.length },
      };
    },
    async issue(record, actorId, connection) {
      return connection.transaction(async (tx) => {
        if (
          record.status !== 'approved' ||
          !record.orderId ||
          !record.selectedVendorId ||
          record.actualCents === null ||
          !record.heldAccount ||
          !record.number ||
          !record.departmentId
        )
          fail(
            'INVALID_SOURCE',
            'An approved priced purchase with its reservation is required.',
          );
        const amount = cents(record.actualCents);
        if (amount !== cents(record.heldCents))
          fail('INVALID_SOURCE', 'The order price must match its held funds.');
        const previous = await tx
          .repository<PurchaseOrder>('purchaseOrders')
          .findOne({ filter: { purchaseId: record.id } });
        if (previous) {
          if (
            previous.id !== record.orderId ||
            cents(previous.actualCents) !== amount ||
            previous.vendor.id !== record.selectedVendorId ||
            previous.applicantId !== record.applicantId ||
            previous.number !== record.number ||
            previous.departmentId !== record.departmentId ||
            previous.account.departmentId !== record.heldAccount.departmentId ||
            previous.account.year !== record.heldAccount.year ||
            previous.account.subject !== record.heldAccount.subject ||
            JSON.stringify(
              previous.items.map((i) => [
                i.id,
                i.name,
                i.specification,
                i.quantity,
                i.unit,
              ]),
            ) !==
              JSON.stringify(
                record.items.map((i) => [
                  i.id,
                  i.name,
                  i.specification,
                  i.quantity,
                  i.unit,
                ]),
              )
          )
            fail(
              'SOURCE_CONFLICT',
              'An immutable order already exists for this purchase.',
            );
          return normalize(previous);
        }
        const vendor = await d.vendors.snapshotForPurchase(
            record.selectedVendorId,
            tx,
          ),
          row: PurchaseOrder = {
            id: record.orderId,
            purchaseId: record.id,
            number: record.number,
            applicantId: record.applicantId,
            departmentId: record.departmentId,
            items: record.items,
            actualCents: amount,
            vendor,
            account: record.heldAccount,
            status: 'awaitingReceipt',
            version: 1,
            createdAt: new Date(),
            acceptedAt: null,
            acceptedById: null,
            receiptDate: null,
            receiptReason: null,
          };
        await tx
          .repository<PurchaseOrder>('purchaseOrders')
          .createOne({ values: { ...row } });
        await d.audit.record(
          {
            actorId,
            action: 'purchaseOrder.issue',
            targetType: 'purchaseOrders',
            targetId: row.id,
            after: row,
          },
          tx,
        );
        return row;
      });
    },
    async accept(id, input, connection) {
      command(input);
      return connection.transaction(async (tx) => {
        const before = await get(id, tx);
        if (!before || before.applicantId !== input.actorId)
          fail(
            'ACCEPT_DENIED',
            'Only the purchase applicant may confirm receipt.',
          );
        if (
          before.status === 'accepted' &&
          before.acceptedById === input.actorId &&
          before.receiptDate === input.receiptDate &&
          before.receiptReason === input.reason.trim()
        )
          return before;
        const order = await lock(id, tx, input.version);
        if (order.status !== 'awaitingReceipt')
          fail(
            'INVALID_STATE',
            'Only an awaiting receipt order may be accepted.',
          );
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(input.receiptDate) ||
          !Number.isFinite(Date.parse(input.receiptDate)) ||
          new Date(input.receiptDate).toISOString().slice(0, 10) !==
            input.receiptDate ||
          !input.reason.trim() ||
          input.reason.length > 5000
        )
          fail(
            'INVALID_RECEIPT',
            'A valid receipt date and confirmation reason are required.',
          );
        await d.budgets.settle(
          {
            ...order.account,
            reference: `${reference}:${order.purchaseId}`,
            actorId: input.actorId,
            requestKey: input.requestKey,
            reason: input.reason,
          },
          tx,
        );
        const after = {
          ...order,
          status: 'accepted' as const,
          acceptedAt: new Date(),
          acceptedById: input.actorId,
          receiptDate: input.receiptDate,
          receiptReason: input.reason.trim(),
        };
        await tx.repository<PurchaseOrder>('purchaseOrders').updateMany({
          filter: { id, version: order.version },
          values: {
            status: after.status,
            acceptedAt: after.acceptedAt,
            acceptedById: after.acceptedById,
            receiptDate: after.receiptDate,
            receiptReason: after.receiptReason,
          },
        });
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'purchaseOrder.accept',
            targetType: 'purchaseOrders',
            targetId: id,
            before,
            after,
            reason: input.reason,
          },
          tx,
        );
        return after;
      });
    },
    async cancel(id, input, connection) {
      command(input);
      return connection.transaction(async (tx) => {
        const directory = await d.directory.snapshot(tx);
        if (
          !directory.hasRole(input.actorId, 'approval.admin') ||
          !input.reason.trim()
        )
          fail(
            'CANCEL_DENIED',
            'A protected approval administrator and reason are required.',
          );
        const order = await lock(id, tx, input.version),
          t = await totals(id, tx);
        if (order.status !== 'awaitingReceipt' || t.pendingCents || t.paidCents)
          fail(
            'CANCEL_DENIED',
            'Only an unreceived order without in-flight or completed payments may be cancelled.',
          );
        await d.budgets.release(
          {
            ...order.account,
            reference: `${reference}:${order.purchaseId}`,
            actorId: input.actorId,
            requestKey: input.requestKey,
            reason: input.reason,
          },
          tx,
        );
        const after = { ...order, status: 'cancelled' as const };
        await tx
          .repository<PurchaseOrder>('purchaseOrders')
          .updateMany({ filter: { id }, values: { status: 'cancelled' } });
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'purchaseOrder.cancel',
            targetType: 'purchaseOrders',
            targetId: id,
            before: { ...order, version: input.version },
            after,
            reason: input.reason,
          },
          tx,
        );
        return after;
      });
    },
    async paymentTotals(id, tx = d.db.connection()) {
      return totals(id, tx);
    },
    async reservePayment(input, connection) {
      command(input);
      const amount = cents(input.cents);
      return connection.transaction(async (tx) => {
        const order = await lock(input.orderId, tx);
        if (order.status === 'cancelled')
          fail('INVALID_STATE', 'A cancelled order cannot have new payments.');
        const repo = tx.repository<PurchasePaymentReference>(
            'purchasePaymentReferences',
          ),
          previous = await repo.findOne({
            filter: { paymentId: input.paymentId },
          });
        if (previous && previous.state !== 'released') {
          if (previous.orderId !== order.id || cents(previous.cents) !== amount)
            fail(
              'PAYMENT_CONFLICT',
              'The payment already has a different source or amount.',
            );
          return {
            ...previous,
            cents: amount,
            exceedsApproved: previous.requiresAdditionalApproval,
          };
        }
        const t = await totals(order.id, tx),
          cumulative =
            BigInt(t.pendingCents) + BigInt(t.paidCents) + BigInt(amount);
        if (cumulative > BigInt(Number.MAX_SAFE_INTEGER))
          fail(
            'INVALID_AMOUNT',
            'Cumulative payments exceed the exact monetary limit.',
          );
        const exceedsApproved = cumulative > BigInt(order.actualCents),
          row: PurchasePaymentReference = {
            id: previous?.id ?? randomUUID(),
            orderId: order.id,
            paymentId: input.paymentId,
            cents: amount,
            state: 'pending',
            requiresAdditionalApproval: exceedsApproved,
            createdAt: new Date(),
          };
        if (previous) {
          const changed = await repo.updateMany({
            filter: { id: previous.id, state: 'released' },
            values: { ...row },
          });
          if (changed.updatedCount !== 1)
            fail(
              'PAYMENT_CONFLICT',
              'The released payment reference changed concurrently.',
            );
        } else await repo.createOne({ values: { ...row } });
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'purchaseOrder.reservePayment',
            targetType: 'purchaseOrders',
            targetId: order.id,
            before: previous,
            after: row,
          },
          tx,
        );
        return { ...row, exceedsApproved };
      });
    },
    async releasePayment(input, connection) {
      command(input);
      return connection.transaction(async (tx) => {
        await lock(input.orderId, tx);
        const repo = tx.repository<PurchasePaymentReference>(
            'purchasePaymentReferences',
          ),
          row = await repo.findOne({
            filter: { orderId: input.orderId, paymentId: input.paymentId },
          });
        if (!row || row.state === 'released') return;
        if (row.state === 'paid')
          fail('PAYMENT_CONFLICT', 'A paid reference cannot be released.');
        await repo.updateMany({
          filter: { id: row.id, state: 'pending' },
          values: { state: 'released' },
        });
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'purchaseOrder.releasePayment',
            targetType: 'purchaseOrders',
            targetId: input.orderId,
            before: row,
            after: { ...row, state: 'released' },
            reason: input.reason,
          },
          tx,
        );
      });
    },
    async settlePayment(input, connection) {
      command(input);
      return connection.transaction(async (tx) => {
        const order = await lock(input.orderId, tx),
          repo = tx.repository<PurchasePaymentReference>(
            'purchasePaymentReferences',
          ),
          row = await repo.findOne({
            filter: { orderId: order.id, paymentId: input.paymentId },
          });
        if (!row || row.state === 'released' || order.status === 'cancelled')
          fail('PAYMENT_CONFLICT', 'A live payment reference is required.');
        const amount = cents(row.cents),
          proof = await input.verifier.confirm(
            {
              paymentId: input.paymentId,
              purchaseOrderId: order.id,
              actorId: input.actorId,
              cents: amount,
            },
            tx,
          );
        if (
          proof.approved !== true ||
          !Number.isSafeInteger(proof.sourceVersion) ||
          proof.sourceVersion < 1 ||
          ((row.requiresAdditionalApproval || proof.requiresFullApproval) &&
            !proof.completedFullApproval)
        )
          fail(
            'ADDITIONAL_APPROVAL_REQUIRED',
            'The trusted payment flow must confirm its immutable source, amount and completed full approval when required.',
          );
        if (row.state === 'paid') return { ...row, cents: amount };
        await repo.updateMany({
          filter: { id: row.id, state: 'pending' },
          values: { state: 'paid' },
        });
        const after = { ...row, cents: amount, state: 'paid' as const };
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'purchaseOrder.settlePayment',
            targetType: 'purchaseOrders',
            targetId: order.id,
            before: row,
            after: { ...after, paymentSourceVersion: proof.sourceVersion },
            reason: 'Approved cashier payment',
          },
          tx,
        );
        return after;
      });
    },
  };
}
