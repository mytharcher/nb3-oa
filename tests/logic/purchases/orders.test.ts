// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { budgetServiceToken } from '../../../server/providers/budgets/contract.ts';
import { vendorServiceToken } from '../../../server/providers/vendors/contract.ts';
import type { ApprovalDirectoryService } from '../../../server/providers/approval-directory/contract.ts';
import { createPurchaseOrderService } from '../../../server/providers/purchases/orders.ts';
import type {
  PurchaseRecord,
  PurchasePaymentVerifier,
} from '../../../server/providers/purchases/contract.ts';
import { createPlatformAppTest } from '../platform/helpers.ts';
const test = createPlatformAppTest();
const directory = {
  snapshot: async () => ({
    hasRole: (actor: string, role: string) =>
      actor === 'administrator' && role === 'approval.admin',
  }),
} as unknown as ApprovalDirectoryService;
async function fixture(
  app: Parameters<typeof createPurchaseOrderService>[0]['db'] extends never
    ? never
    : import('@nocobase/app-server/application').Application,
) {
  const db = app.container.resolve(databaseManagerToken),
    audit = app.container.resolve(auditServiceToken),
    budgets = app.container.resolve(budgetServiceToken),
    vendors = app.container.resolve(vendorServiceToken),
    service = createPurchaseOrderService({
      db,
      audit,
      budgets,
      vendors,
      directory,
    }),
    sourceId = randomUUID(),
    account = { departmentId: randomUUID(), year: 2026, subject: 'office' };
  const record = await db.transaction(async (tx) => {
    const vendor = await vendors.create(
      {
        code: `V-${randomUUID()}`,
        name: 'Initial supplier',
        category: 'Office',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        bankName: 'Bank',
        bankAccount: '0001234',
        bankAccountName: 'Company',
        actorId: 'root',
        reason: 'Test vendor',
      },
      tx,
    );
    await budgets.allocate(
      {
        ...account,
        deltaCents: 20000,
        reference: 'allocate',
        requestKey: randomUUID(),
        actorId: 'root',
        reason: 'Annual budget',
      },
      tx,
    );
    await budgets.adjustHold(
      {
        ...account,
        cents: 12000,
        reference: `oa.purchase:${sourceId}`,
        requestKey: randomUUID(),
        actorId: 'root',
        reason: 'Purchase quote',
      },
      tx,
    );
    return {
      id: sourceId,
      orderId: randomUUID(),
      number: `PUR-${randomUUID()}`,
      applicantId: 'employee',
      departmentId: account.departmentId,
      status: 'approved',
      actualCents: 12000,
      heldCents: 12000,
      heldAccount: account,
      selectedVendorId: vendor.id,
      items: [
        {
          id: randomUUID(),
          name: 'Cable',
          specification: 'Ethernet',
          quantity: '0.25',
          unit: 'kg',
        },
      ],
    } as PurchaseRecord;
  });
  const order = await db.transaction((tx) => service.issue(record, 'root', tx));
  return { db, audit, budgets, vendors, service, record, order, account };
}
describe('purchase order source holds, receipt and source-linked payment conservation', () => {
  test('approval retains hold, applicant receipt consumes once and audit failure rolls both receipt and budget back', async ({
    app,
  }) => {
    const { db, audit, budgets, service, record, order, account } =
      await fixture(app);
    expect(await budgets.balance(account)).toMatchObject({
      heldCents: 12000,
      usedCents: 0,
    });
    expect(
      (await db.transaction((tx) => service.issue(record, 'root', tx))).id,
    ).toBe(order.id);
    const input = {
      actorId: 'employee',
      version: 1,
      receiptDate: '2026-10-11',
      reason: 'Received exact requested goods',
      requestKey: randomUUID(),
    };
    await expect(
      db.transaction((tx) =>
        service.accept(order.id, { ...input, actorId: 'stranger' }, tx),
      ),
    ).rejects.toMatchObject({ code: 'PURCHASE_ORDER_ACCEPT_DENIED' });
    const original = audit.record.bind(audit),
      spy = vi.spyOn(audit, 'record').mockImplementation(async (entry, tx) => {
        if (entry.action === 'purchaseOrder.accept')
          throw new Error('Receipt audit failed');
        return original(entry, tx);
      });
    try {
      await expect(
        db.transaction((tx) => service.accept(order.id, input, tx)),
      ).rejects.toThrow('Receipt audit failed');
    } finally {
      spy.mockRestore();
    }
    expect(await budgets.balance(account)).toMatchObject({
      heldCents: 12000,
      usedCents: 0,
    });
    expect(await service.get(order.id)).toMatchObject({
      status: 'awaitingReceipt',
      version: 1,
    });
    const accepted = await db.transaction((tx) =>
      service.accept(order.id, input, tx),
    );
    expect(accepted).toMatchObject({
      status: 'accepted',
      receiptDate: input.receiptDate,
    });
    expect(await budgets.balance(account)).toMatchObject({
      heldCents: 0,
      usedCents: 12000,
    });
    expect(
      (await db.transaction((tx) => service.accept(order.id, input, tx))).id,
    ).toBe(order.id);
    expect(await budgets.balance(account)).toMatchObject({ usedCents: 12000 });
  });
  test('over-approved payments reserve for full staircase, cannot settle through caller flags, and pending/paid references block cancellation', async ({
    app,
  }) => {
    const { db, service, order } = await fixture(app),
      paymentId = randomUUID();
    const reference = await db.transaction((tx) =>
      service.reservePayment(
        {
          orderId: order.id,
          paymentId,
          cents: 12001,
          actorId: 'cashier',
          requestKey: randomUUID(),
        },
        tx,
      ),
    );
    expect(reference).toMatchObject({
      state: 'pending',
      exceedsApproved: true,
      requiresAdditionalApproval: true,
    });
    const approve = (full: boolean): PurchasePaymentVerifier => ({
      confirm: async () => ({
        approved: true,
        requiresFullApproval: true,
        completedFullApproval: full,
        sourceVersion: 1,
      }),
    });
    await expect(
      db.transaction((tx) =>
        service.settlePayment(
          {
            orderId: order.id,
            paymentId,
            actorId: 'cashier',
            requestKey: randomUUID(),
            verifier: approve(false),
          },
          tx,
        ),
      ),
    ).rejects.toMatchObject({
      code: 'PURCHASE_ORDER_ADDITIONAL_APPROVAL_REQUIRED',
    });
    expect(await service.paymentTotals(order.id)).toEqual({
      pendingCents: 12001,
      paidCents: 0,
    });
    const current = (await service.get(order.id))!;
    await expect(
      db.transaction((tx) =>
        service.cancel(
          order.id,
          {
            actorId: 'administrator',
            version: current.version,
            reason: 'Cancel',
            requestKey: randomUUID(),
          },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'PURCHASE_ORDER_CANCEL_DENIED' });
    const paid = await db.transaction((tx) =>
      service.settlePayment(
        {
          orderId: order.id,
          paymentId,
          actorId: 'cashier',
          requestKey: randomUUID(),
          verifier: approve(true),
        },
        tx,
      ),
    );
    expect(paid.state).toBe('paid');
    expect(await service.paymentTotals(order.id)).toEqual({
      pendingCents: 0,
      paidCents: 12001,
    });
    await expect(
      db.transaction((tx) =>
        service.releasePayment(
          {
            orderId: order.id,
            paymentId,
            actorId: 'cashier',
            reason: 'Cannot reverse paid',
          },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'PURCHASE_ORDER_PAYMENT_CONFLICT' });
  });
  test('cancelling an unpaid unreceived order releases its hold and requires protected administrator', async ({
    app,
  }) => {
    const { db, service, order, budgets, account } = await fixture(app),
      input = {
        actorId: 'administrator',
        version: 1,
        reason: 'Supplier order cancelled',
        requestKey: randomUUID(),
      };
    await expect(
      db.transaction((tx) =>
        service.cancel(order.id, { ...input, actorId: 'employee' }, tx),
      ),
    ).rejects.toMatchObject({ code: 'PURCHASE_ORDER_CANCEL_DENIED' });
    expect(
      (await db.transaction((tx) => service.cancel(order.id, input, tx)))
        .status,
    ).toBe('cancelled');
    expect(await budgets.balance(account)).toMatchObject({
      heldCents: 0,
      usedCents: 0,
    });
  });
  test('payment revision acquires source locks once, rebinds released references and rolls all source changes back', async ({
    app,
  }) => {
    const first = await fixture(app),
      second = await fixture(app),
      { db, service } = first,
      paymentId = randomUUID();
    await db.transaction((tx) =>
      service.reservePayment(
        {
          orderId: first.order.id,
          paymentId,
          cents: 1000,
          actorId: 'root',
          requestKey: randomUUID(),
        },
        tx,
      ),
    );
    const before = (await service.get(first.order.id))!.version;
    await expect(
      db.transaction(async (tx) => {
        await service.lockPaymentSources(
          [second.order.id, first.order.id, first.order.id],
          tx,
        );
        expect((await service.get(first.order.id, tx))!.version).toBe(
          before + 1,
        );
        await service.releasePayment(
          {
            orderId: first.order.id,
            paymentId,
            actorId: 'root',
            requestKey: randomUUID(),
          },
          tx,
        );
        await service.reservePayment(
          {
            orderId: second.order.id,
            paymentId,
            cents: 2000,
            actorId: 'root',
            requestKey: randomUUID(),
          },
          tx,
        );
        throw new Error('Payment record update failed');
      }),
    ).rejects.toThrow('Payment record update failed');
    expect((await service.paymentTotals(first.order.id)).pendingCents).toBe(
      1000,
    );
    expect((await service.paymentTotals(second.order.id)).pendingCents).toBe(0);
    expect((await service.get(first.order.id))!.version).toBe(before);
    await db.transaction(async (tx) => {
      await service.lockPaymentSources([second.order.id, first.order.id], tx);
      await service.releasePayment(
        {
          orderId: first.order.id,
          paymentId,
          actorId: 'root',
          requestKey: randomUUID(),
        },
        tx,
      );
      await service.reservePayment(
        {
          orderId: second.order.id,
          paymentId,
          cents: 2000,
          actorId: 'root',
          requestKey: randomUUID(),
        },
        tx,
      );
    });
    expect((await service.paymentTotals(first.order.id)).pendingCents).toBe(0);
    expect((await service.paymentTotals(second.order.id)).pendingCents).toBe(
      2000,
    );
  });
});
