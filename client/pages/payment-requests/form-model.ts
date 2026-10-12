import { z } from 'zod';
import type { PaymentInput, PaymentRecord } from './types.js';
import { centsText, parseCents } from './money.js';
export interface PaymentFormValues {
  applicantId: string;
  reason: string;
  sourceMode: 'purchase' | 'contract' | 'none';
  purchaseOrderId: string;
  contractId: string;
  contractVersion: number | null;
  noPriorApprovalReason: string;
  vendorId: string;
  amount: string;
  invoiceNumber: string;
  attachments: string[];
  paymentMethod: string;
}
export function paymentDefaults(
  record?: PaymentRecord,
  actorId = '',
): PaymentFormValues {
  return {
    applicantId: record?.applicantId ?? actorId,
    reason: record?.reason ?? '',
    sourceMode: record?.sourceMode ?? 'purchase',
    purchaseOrderId: record?.purchaseOrderId ?? '',
    contractId: record?.contractId ?? '',
    contractVersion:
      record?.contractVersion ?? record?.sourceContractVersion ?? null,
    noPriorApprovalReason: record?.noPriorApprovalReason ?? '',
    vendorId: record?.vendorId ?? '',
    amount: centsText(record?.amountCents ?? 0),
    invoiceNumber: record?.invoiceNumber ?? '',
    attachments: record?.attachments ?? [],
    paymentMethod: record?.paymentMethod ?? '',
  };
}
export function paymentFormSchema(message: (key: string) => string) {
  return z.object({
    applicantId: z.string().min(1, message('required')),
    reason: z.string().max(10000, message('limit')),
    sourceMode: z.enum(['purchase', 'contract', 'none']),
    purchaseOrderId: z.string(),
    contractId: z.string(),
    contractVersion: z.number().int().nullable(),
    noPriorApprovalReason: z.string().max(10000, message('limit')),
    vendorId: z.string(),
    amount: z
      .string()
      .refine((v) => parseCents(v) !== null, message('amountInvalid')),
    invoiceNumber: z.string().max(128, message('limit')),
    attachments: z.array(z.string()).max(10, message('maxFiles')),
    paymentMethod: z.string().max(64, message('limit')),
  });
}
export function paymentInput(values: PaymentFormValues): PaymentInput {
  const cents = parseCents(values.amount);
  if (cents === null) throw new Error('Invalid amount');
  return {
    reason: values.reason,
    sourceMode: values.sourceMode,
    purchaseOrderId:
      values.sourceMode === 'purchase' ? values.purchaseOrderId || null : null,
    noPriorApprovalReason: values.noPriorApprovalReason,
    vendorId: values.vendorId || null,
    amountCents: cents,
    invoiceNumber: values.invoiceNumber,
    attachments: values.attachments,
    paymentMethod: values.paymentMethod,
    contractId:
      values.sourceMode === 'contract' ? values.contractId || null : null,
    contractVersion:
      values.sourceMode === 'contract' ? values.contractVersion : null,
  };
}
export const emptyPaymentInput: PaymentInput = {
  reason: '',
  sourceMode: 'purchase',
  purchaseOrderId: null,
  contractId: null,
  noPriorApprovalReason: '',
  vendorId: null,
  amountCents: 0,
  invoiceNumber: '',
  attachments: [],
  paymentMethod: '',
};

/** Availability may be negative, or exceed Number's safe range after summing
 * separate pending and paid totals; preserve every cent without float math. */
export function availableMoney(
  approved: number,
  paid: number,
  pending: number,
  locale: string,
): string {
  const value = BigInt(approved) - BigInt(paid) - BigInt(pending),
    abs = value < 0n ? -value : value;
  const decimal =
    new Intl.NumberFormat(locale)
      .formatToParts(1.1)
      .find((p) => p.type === 'decimal')?.value ?? '.';
  return `${value < 0n ? '-' : ''}${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(abs / 100n)}${decimal}${String(abs % 100n).padStart(2, '0')}`;
}
