import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryPolicy,
} from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import type { PaymentRequestService } from './service.js';
import type { PaymentRequestRecord } from './contract.js';

export const MAX_PAYMENT_FILE_SIZE = 5 * 1024 * 1024;
export const PAYMENT_FILE_FIELDS = [
  'id',
  'filename',
  'ext',
  'mimeType',
  'size',
  'createdAt',
  'updatedAt',
] as const;
export class PaymentAttachmentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Restrict formats both by metadata and their byte signature. No active HTML/SVG or office macros. */
export async function validatePaymentFile(file: File): Promise<void> {
  if (!file.size || file.size > MAX_PAYMENT_FILE_SIZE)
    throw new PaymentAttachmentError(
      'PAYMENT_FILE_SIZE',
      'Attachments must be nonempty and at most 5 MiB.',
    );
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = (at: number, value: string) =>
    [...value].every((v, i) => b[at + i] === v.charCodeAt(0));
  const ext = file.name.split('.').at(-1)?.toLowerCase();
  const allowed =
    (ext === 'pdf' && file.type === 'application/pdf' && ascii(0, '%PDF-')) ||
    (['jpg', 'jpeg'].includes(ext ?? '') &&
      file.type === 'image/jpeg' &&
      b[0] === 255 &&
      b[1] === 216 &&
      b[2] === 255) ||
    (ext === 'png' &&
      file.type === 'image/png' &&
      [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v)) ||
    (ext === 'webp' &&
      file.type === 'image/webp' &&
      ascii(0, 'RIFF') &&
      ascii(8, 'WEBP'));
  if (!allowed)
    throw new PaymentAttachmentError(
      'PAYMENT_FILE_TYPE',
      'Only matching PDF, JPEG, PNG and WebP attachments are accepted.',
    );
}

export interface PaymentAttachmentService {
  authorize(
    paymentRequestId: string,
    actorId: string,
    policy: RepositoryPolicy,
    upload: boolean,
    purpose: 'invoice' | 'voucher',
  ): Promise<PaymentRequestRecord & { canViewUnselectedVoucher: boolean }>;
  assertLinked(
    connection: DatabaseConnection,
    paymentRequestId: string,
    fileIds: readonly string[],
    purpose: 'invoice' | 'voucher',
  ): Promise<void>;
}
export const paymentAttachmentServiceToken =
  createServiceToken<PaymentAttachmentService>('oa/payment-attachments');

export function createPaymentAttachmentService(
  db: DatabaseManager,
  payment: Pick<PaymentRequestService, 'detail'>,
): PaymentAttachmentService {
  return {
    async authorize(paymentRequestId, actorId, policy, upload, purpose) {
      // Field restrictions apply to bytes as well as JSON metadata: a grant hiding attachments hides downloads.
      const row = await db
        .repository<PaymentRequestRecord>('paymentRequests')
        .withPolicy(policy)
        .findOne({ filter: { id: paymentRequestId } });
      const field =
        purpose === 'invoice' ? 'attachments' : 'voucherAttachments';
      if (!row || !(field in row))
        throw new PaymentAttachmentError(
          'PAYMENT_ATTACHMENT_DENIED',
          'The attachment field is outside the granted access.',
        );
      const detail = await payment.detail(paymentRequestId, actorId, policy);
      const { record } = detail;
      if (
        upload &&
        purpose === 'invoice' &&
        (!['draft', 'revision'].includes(record.status) ||
          ![record.applicantId, record.createdById].includes(actorId))
      )
        throw new PaymentAttachmentError(
          'PAYMENT_ATTACHMENT_DENIED',
          'Only the applicant or draft creator may upload to a draft.',
        );
      if (
        upload &&
        purpose === 'voucher' &&
        (record.status !== 'cashier' ||
          !detail.taskActions.some((task) =>
            task.actions.some((action) => action.name === 'complete'),
          ))
      )
        throw new PaymentAttachmentError(
          'PAYMENT_ATTACHMENT_DENIED',
          'Only the claimed cashier may upload payment voucher evidence.',
        );
      return {
        ...record,
        canViewUnselectedVoucher:
          record.status === 'cashier' &&
          detail.taskActions.some((task) =>
            task.actions.some((action) => action.name === 'complete'),
          ),
      };
    },
    assertLinked: assertPaymentAttachments,
  };
}

export async function assertPaymentAttachments(
  connection: DatabaseConnection,
  paymentRequestId: string,
  fileIds: readonly string[],
  purpose: 'invoice' | 'voucher',
): Promise<void> {
  if (fileIds.length > 2000)
    throw new PaymentAttachmentError(
      'PAYMENT_ATTACHMENT_INVALID',
      'At most 2000 linked attachments are allowed.',
    );
  for (const id of fileIds) {
    const file = await connection
      .repository('paymentAttachmentFiles')
      .findOne({ filter: { id, paymentRequestId, purpose } });
    if (!file)
      throw new PaymentAttachmentError(
        'PAYMENT_ATTACHMENT_INVALID',
        'An attachment does not belong to this payment request.',
      );
  }
}
