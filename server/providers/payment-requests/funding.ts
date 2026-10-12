import type { ContractLedgerService } from '../contracts/contract.js';
import type { DatabaseConnection } from '@nocobase/db';
import type { InvoiceService } from '../invoices/contract.js';
import type {
  PurchaseOrderService,
  PurchasePaymentVerifier,
} from '../purchases/contract.js';
import type { AuditService } from '../audit/index.js';
import type { PaymentRequestRecord } from './contract.js';
import { PaymentRequestError } from './errors.js';

export function createPaymentRequestFunding(d: {
  orders: PurchaseOrderService;
  contracts: ContractLedgerService;
  invoices: InvoiceService;
  audit: AuditService;
}) {
  const command = (
    record: PaymentRequestRecord,
    actorId: string,
    requestKey: string,
    reason: string,
  ) => ({ documentId: `oa.payment:${record.id}`, actorId, requestKey, reason });
  return {
    /** Caller holds sorted old/new purchase source locks before locking the payment/application. */
    async reserve(
      record: PaymentRequestRecord,
      actorId: string,
      requestKey: string,
      tx: DatabaseConnection,
    ) {
      if (!Number.isSafeInteger(record.amountCents) || record.amountCents <= 0)
        throw new PaymentRequestError(
          'PAYMENT_REQUEST_INVALID_AMOUNT',
          'The payment requires positive exact integer cents.',
        );
      if (
        record.sourceOrderId &&
        (record.sourceOrderId !== record.purchaseOrderId ||
          record.sourceHeldCents !== record.amountCents)
      )
        await d.orders.releasePayment(
          {
            orderId: record.sourceOrderId,
            paymentId: record.id,
            actorId,
            reason: 'Payment business revision',
          },
          tx,
        );
      if (
        record.sourceContractId &&
        record.sourceContractId !== record.contractId
      )
        await d.contracts.release(
          {
            actorId,
            requestKey: `release:${requestKey}`,
            reason: 'Payment source revision',
            contractId: record.sourceContractId,
            reference: `oa.payment:${record.id}:${record.sourceContractId}`,
          },
          tx,
        );
      const changedSource =
        (record.sourceOrderId &&
          record.sourceOrderId !== record.purchaseOrderId) ||
        (record.sourceContractId &&
          record.sourceContractId !== record.contractId);
      if (changedSource) {
        // A newly selected counterparty must never retain the previous private account.
        const payee = await tx
          .repository('paymentPayees')
          .findOne({ filter: { requestId: record.id } });
        if (payee)
          await tx
            .repository('paymentPayees')
            .updateOne({
              filter: { requestId: record.id },
              values: {
                bankName: '',
                bankAccount: '',
                bankAccountName: '',
                version: Number(payee.version) + 1,
              },
            });
      }
      let sourceContractVersion: number | null = null;
      let fullApprovalRequired = record.sourceMode === 'none';
      let sourceApprovedCents: number | null = null;
      let sourceCumulativeCents: number | null = null;
      if (record.sourceMode === 'purchase') {
        if (!record.purchaseOrderId)
          throw new PaymentRequestError(
            'PAYMENT_REQUEST_SOURCE_REQUIRED',
            'An approved purchase order is required.',
          );
        const order = await d.orders.get(record.purchaseOrderId, tx);
        if (
          !order ||
          order.status === 'cancelled' ||
          order.vendor.id !== record.vendorId
        )
          throw new PaymentRequestError(
            'PAYMENT_REQUEST_SOURCE_INVALID',
            'Choose an effective approved order and its original vendor.',
          );
        const reservation = await d.orders.reservePayment(
          {
            orderId: order.id,
            paymentId: record.id,
            cents: record.amountCents,
            actorId,
            requestKey,
          },
          tx,
        );
        fullApprovalRequired = reservation.exceedsApproved;
        sourceApprovedCents = order.actualCents;
        const totals = await d.orders.paymentTotals(order.id, tx);
        const cumulative =
          BigInt(totals.pendingCents) + BigInt(totals.paidCents);
        // A retained reservation never relaxes its original extra approval.
        // A returned/resubmitted request also observes later cumulative money.
        fullApprovalRequired ||= cumulative > BigInt(order.actualCents);
        if (cumulative > BigInt(Number.MAX_SAFE_INTEGER))
          throw new PaymentRequestError(
            'PAYMENT_REQUEST_INVALID_AMOUNT',
            'Cumulative payments exceed the exact monetary limit.',
          );
        sourceCumulativeCents = Number(cumulative);
      } else if (record.sourceMode === 'contract') {
        const contract = record.contractId
          ? await d.contracts.source(record.contractId, tx)
          : null;
        if (
          !contract ||
          record.purchaseOrderId ||
          (contract.facts.counterparty.kind === 'vendor'
            ? contract.facts.counterparty.id
            : null) !== record.vendorId
        )
          throw new PaymentRequestError(
            'PAYMENT_REQUEST_SOURCE_INVALID',
            'An effective contract and its original counterparty are required.',
          );
        const reservation = await d.contracts.reservePayment(
          {
            actorId,
            requestKey,
            reason: 'Reserve payment contract',
            contractId: contract.id,
            expectedVersion: contract.version,
            reference: `oa.payment:${record.id}:${contract.id}`,
            cents: record.amountCents,
          },
          tx,
        );
        const totals = (await d.contracts.source(contract.id, tx))!;
        sourceApprovedCents = contract.amountCents;
        sourceCumulativeCents = totals.heldCents + totals.paidCents;
        sourceContractVersion = contract.version;
        fullApprovalRequired = reservation.requiresFullApproval;
      } else if (
        record.purchaseOrderId ||
        record.contractId ||
        !record.noPriorApprovalReason.trim()
      )
        throw new PaymentRequestError(
          'PAYMENT_REQUEST_SOURCE_REQUIRED',
          'No-prior-approval payments require an explanation and no linked order.',
        );
      await d.invoices.reserveLines(
        {
          ...command(record, actorId, requestKey, 'Reserve payment invoice'),
          applicantId: record.applicantId,
          lines: [
            {
              lineId: 'payment',
              invoiceNumber: record.invoiceNumber,
              cents: record.amountCents,
              attachmentIds: record.attachments,
            },
          ],
        },
        tx,
      );
      return {
        sourceContractId:
          record.sourceMode === 'contract' ? record.contractId : null,
        sourceContractVersion,
        sourceOrderId:
          record.sourceMode === 'purchase' ? record.purchaseOrderId : null,
        sourceHeldCents: record.sourceMode !== 'none' ? record.amountCents : 0,
        sourceApprovedCents,
        sourceCumulativeCents,
        fullApprovalRequired,
      };
    },
    async release(
      record: PaymentRequestRecord,
      actorId: string,
      requestKey: string,
      reason: string,
      tx: DatabaseConnection,
    ) {
      if (record.sourceOrderId)
        await d.orders.releasePayment(
          {
            orderId: record.sourceOrderId,
            paymentId: record.id,
            actorId,
            reason,
          },
          tx,
        );
      if (record.sourceContractId)
        await d.contracts.release(
          {
            actorId,
            requestKey,
            reason,
            contractId: record.sourceContractId,
            reference: `oa.payment:${record.id}:${record.sourceContractId}`,
          },
          tx,
        );
      await d.invoices.releaseDocument(
        command(record, actorId, requestKey, reason),
        tx,
      );
    },
    async settle(
      record: PaymentRequestRecord,
      actorId: string,
      requestKey: string,
      now: Date,
      forced: boolean,
      verifier: PurchasePaymentVerifier,
      tx: DatabaseConnection,
    ) {
      const ledger = tx.repository('paymentRequestLedger');
      const existing = await ledger.findOne({
        filter: { requestId: record.id },
      });
      if (existing)
        throw new PaymentRequestError(
          'PAYMENT_REQUEST_ALREADY_PAID',
          'A settled payment cannot be paid again.',
          'conflict',
        );
      if (
        !forced &&
        (!record.voucherNumber?.trim() || !record.voucherAttachments.length)
      )
        throw new PaymentRequestError(
          'PAYMENT_REQUEST_VOUCHER_REQUIRED',
          'Payment completion requires a voucher number and protected evidence.',
        );
      if (record.sourceOrderId)
        await d.orders.settlePayment(
          {
            orderId: record.sourceOrderId,
            paymentId: record.id,
            actorId,
            requestKey,
            verifier,
          },
          tx,
        );
      if (record.sourceContractId) {
        if (forced)
          throw new PaymentRequestError(
            'PAYMENT_REQUEST_CONTRACT_ACTUAL_PAYMENT_REQUIRED',
            'Forced completion does not establish actual contract payment.',
          );
        await d.contracts.settlePayment(
          {
            actorId,
            requestKey,
            reason: 'Actual cashier payment',
            contractId: record.sourceContractId,
            expectedVersion: record.sourceContractVersion!,
            reference: `oa.payment:${record.id}:${record.sourceContractId}`,
          },
          (connection) =>
            verifier.confirm(
              {
                paymentId: record.id,
                purchaseOrderId: '',
                contractId: record.sourceContractId!,
                actorId,
                cents: record.amountCents,
              } as Parameters<PurchasePaymentVerifier['confirm']>[0],
              connection,
            ) as Promise<
              import('../contracts/contract.js').ContractPaymentProof
            >,
          tx,
        );
      }
      await d.invoices.useDocument(
        command(
          record,
          actorId,
          requestKey,
          forced
            ? 'Administratively confirmed payment'
            : 'Cashier confirmed payment',
        ),
        tx,
      );
      const id = crypto.randomUUID();
      await ledger.createOne({
        values: {
          id,
          requestId: record.id,
          purchaseOrderId: record.sourceOrderId,
          contractId: record.sourceContractId ?? null,
          vendorId: record.vendorId,
          cents: record.amountCents,
          voucherNumber: record.voucherNumber,
          voucherAttachments: record.voucherAttachments,
          forced,
          reason: forced ? record.forcedReason : null,
          actorId,
          paidAt: now,
        },
      });
      await d.audit.record(
        {
          actorId,
          action: forced ? 'paymentRequest.forcedPaid' : 'paymentRequest.paid',
          targetType: 'paymentRequests',
          targetId: record.id,
          before: null,
          after: {
            paymentId: id,
            cents: record.amountCents,
            purchaseOrderId: record.sourceOrderId,
            contractId: record.sourceContractId ?? null,
            forced,
            voucherNumber: record.voucherNumber,
            voucherAttachments: record.voucherAttachments,
            reason: record.forcedReason,
          },
        },
        tx,
      );
      return { paymentId: id, paidAt: now.toISOString(), sourceHeldCents: 0 };
    },
  };
}
