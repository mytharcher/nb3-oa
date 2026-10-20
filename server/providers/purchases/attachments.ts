import { demoNow } from '../demo-data/context.js';
import { purchaseQuoteBasis } from './quotes.js';
import type { DatabaseConnection } from '@nocobase/db';
export const MAX_PURCHASE_FILE_SIZE = 5 * 1024 * 1024;
export const PURCHASE_FILE_FIELDS = [
  'id',
  'vendorId',
  'quoteBasisHash',
  'filename',
  'ext',
  'mimeType',
  'size',
  'createdAt',
  'updatedAt',
] as const;
export class PurchaseAttachmentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Restrict formats both by metadata and their byte signature. No active HTML/SVG or office macros. */
export async function validatePurchaseFile(file: File): Promise<void> {
  if (!file.size || file.size > MAX_PURCHASE_FILE_SIZE)
    throw new PurchaseAttachmentError(
      'PURCHASE_FILE_SIZE',
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
    throw new PurchaseAttachmentError(
      'PURCHASE_FILE_TYPE',
      'Only matching PDF, JPEG, PNG and WebP attachments are accepted.',
    );
}

export async function assertPurchaseQuoteFiles(
  connection: DatabaseConnection,
  purchaseId: string,
  vendorId: string,
  fileIds: readonly string[],
  quoteBasisHash: string,
): Promise<void> {
  if (
    !fileIds.length ||
    fileIds.length > 10 ||
    new Set(fileIds).size !== fileIds.length
  )
    throw new PurchaseAttachmentError(
      'PURCHASE_ATTACHMENT_INVALID',
      'Each quote requires one to ten different attachments.',
    );
  for (const id of fileIds) {
    const file = await connection
      .repository('purchaseQuoteFiles')
      .findOne({ filter: { id, purchaseId, vendorId, quoteBasisHash } });
    if (!file)
      throw new PurchaseAttachmentError(
        'PURCHASE_ATTACHMENT_INVALID',
        'A quote attachment is not linked to this purchase, vendor and current quotation basis.',
      );
  }
}

import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import {
  APPROVAL_COLLECTIONS,
  type TaskRow,
} from '@nocobase/app-plugin-approval/server';
import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import type { ApprovalDirectoryService } from '../approval-directory/contract.js';
import type { VendorService } from '../vendors/contract.js';
import type { PurchaseService } from './service.js';
import { PURCHASE_LIFECYCLE, type PurchaseRecord } from './contract.js';
export interface PurchaseAttachmentService {
  authorize(
    purchaseId: string,
    vendorId: string | undefined,
    actorId: string,
    policy: RepositoryPolicy,
    upload: boolean,
  ): Promise<PurchaseRecord>;
  assertUpload(
    connection: DatabaseConnection,
    purchaseId: string,
    vendorId: string,
    actorId: string,
    version: number,
  ): Promise<string>;
}
export const purchaseAttachmentServiceToken =
  createServiceToken<PurchaseAttachmentService>('oa/purchase-attachments');
export function createPurchaseAttachmentService(d: {
  db: DatabaseManager;
  purchase: Pick<PurchaseService, 'detail'>;
  directory: ApprovalDirectoryService;
  vendors: VendorService;
}): PurchaseAttachmentService {
  async function assertUpload(
    connection: DatabaseConnection,
    purchaseId: string,
    vendorId: string,
    actorId: string,
    version: number,
  ) {
    const repo = connection.repository<PurchaseRecord>('purchaseRequests'),
      before = await repo.findOne({ filter: { id: purchaseId } });
    if (!before)
      throw new PurchaseAttachmentError(
        'PURCHASE_ATTACHMENT_DENIED',
        'The owning purchase no longer exists.',
      );
    await lockUserForAdministration(connection, before.applicantId);
    const record = await repo.findOne({ filter: { id: purchaseId } });
    if (
      !record ||
      record.status !== 'purchasing' ||
      record.lifecycleVersion !== version
    )
      throw new PurchaseAttachmentError(
        'PURCHASE_ATTACHMENT_DENIED',
        'The purchasing stage changed during upload.',
      );
    await d.vendors.snapshotForPurchase(vendorId, connection);
    const directory = await d.directory.snapshot(connection);
    if (directory.hasRole(actorId, 'approval.admin'))
      return purchaseQuoteBasis(record);
    if (!directory.isActive(actorId) || actorId === record.applicantId)
      throw new PurchaseAttachmentError(
        'PURCHASE_ATTACHMENT_DENIED',
        'An active current purchasing handler is required.',
      );
    // Read-only public TaskRow adapter: File Repository mutations must recheck the current claimed work in
    // their own commit transaction. SDK runViewsFor uses independent transactions; ApprovalService remains
    // the exclusive writer. Business action writes and uploads serialize on the same applicant account lock.
    const tasks = await connection
      .repository<TaskRow>(APPROVAL_COLLECTIONS.tasks)
      .findMany({
        filter: {
          lifecycle: PURCHASE_LIFECYCLE,
          recordId: purchaseId,
          stage: 'purchasing',
          enteredVersion: record.lifecycleVersion,
          kind: 'decide',
          role: 'member',
          depth: 0,
        },
      });
    if (
      !tasks.some(
        (task) =>
          ['pending', 'claimed'].includes(task.status) &&
          (task.assigneeId === actorId ||
            directory.delegateOf?.(
              task.assigneeId,
              PURCHASE_LIFECYCLE,
              demoNow().toISOString(),
              task.createdAt,
            )?.to === actorId),
      )
    )
      throw new PurchaseAttachmentError(
        'PURCHASE_ATTACHMENT_DENIED',
        'The current purchasing task is not assigned to this actor.',
      );
    return purchaseQuoteBasis(record);
  }
  return {
    assertUpload,
    async authorize(purchaseId, vendorId, actorId, policy, upload) {
      const row = await d.db
        .repository<PurchaseRecord>('purchaseRequests')
        .withPolicy(policy)
        .findOne({ filter: { id: purchaseId } });
      if (!row || !('quotes' in row))
        throw new PurchaseAttachmentError(
          'PURCHASE_ATTACHMENT_DENIED',
          'Quote evidence is outside the granted record or field scope.',
        );
      const { record } = await d.purchase.detail(purchaseId, actorId, policy);
      if (upload) {
        if (!vendorId)
          throw new PurchaseAttachmentError(
            'PURCHASE_ATTACHMENT_INVALID',
            'Choose the quote vendor before upload.',
          );
        await d.db.transaction((tx) =>
          assertUpload(
            tx,
            purchaseId,
            vendorId,
            actorId,
            record.lifecycleVersion,
          ),
        );
      }
      return record;
    },
  };
}
