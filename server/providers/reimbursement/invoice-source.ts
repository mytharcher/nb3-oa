import { FILE_COLUMNS } from '@nocobase/app-plugin-file/server';
import { createHash } from 'node:crypto';
import { createServiceToken } from '@nocobase/service-provider';
import type { RepositoryPolicy } from '@nocobase/db';
import type { NocoBaseDriveManager } from '@nocobase/drive';
import type { ServerFileRepositoryManager } from '@nocobase/app-plugin-file/server';
import type { ReimbursementService } from './service.js';
import {
  ReimbursementAttachmentError,
  MAX_REIMBURSEMENT_FILE_SIZE,
} from './attachments.js';
import type { ReimbursementAttachmentService } from './attachments.js';
import type { InvoiceFacts } from '../invoice-recognition/gateway.js';
export interface ReimbursementInvoiceSource {
  read(input: {
    recordId: string;
    lineId: string;
    fileId: string;
    actorId: string;
    policy: RepositoryPolicy;
    mode: 'read' | 'recognize' | 'verify';
  }): Promise<{
    recordId: string;
    lineId: string;
    fileId: string;
    ownerId: string;
    fileHash: string;
    mimeType: string;
    bytes: Uint8Array;
    facts?: InvoiceFacts;
  }>;
}
export const reimbursementInvoiceSourceToken =
  createServiceToken<ReimbursementInvoiceSource>(
    'oa/reimbursement-invoice-source',
  );
export function createReimbursementInvoiceSource(
  attachments: ReimbursementAttachmentService,
  service: ReimbursementService,
  files: ServerFileRepositoryManager,
  drive: NocoBaseDriveManager,
): ReimbursementInvoiceSource {
  const denied = (): never => {
    throw new ReimbursementAttachmentError(
      'REIMBURSEMENT_ATTACHMENT_DENIED',
      'Invoice source is outside the current business access.',
    );
  };
  return {
    async read(input) {
      const record = await attachments.authorize(
        input.recordId,
        input.actorId,
        input.policy,
        input.mode === 'recognize',
      );
      const owner = [record.applicantId, record.createdById].includes(
        input.actorId,
      );
      const line = record.lines.find((value) => value.id === input.lineId);
      if (
        (input.mode === 'verify' ||
          !owner ||
          !['draft', 'revision'].includes(record.status)) &&
        (!line || !line.attachmentIds.includes(input.fileId))
      )
        denied();
      if (input.mode === 'verify' && !owner) {
        const detail = await service.detail(
          input.recordId,
          input.actorId,
          input.policy,
        );
        if (
          !detail.taskActions.some(
            (value) =>
              value.task.stage === 'finance' &&
              value.task.subject === input.lineId &&
              value.actions.some((action) =>
                ['approve', 'returnItem', 'reject'].includes(action.name),
              ),
          )
        )
          denied();
      }
      // The repository is policy-bound after the original document/field/actor checks above.
      const repository = files.repository('reimbursementAttachmentFiles', {
        connection: 'main',
        disk: 'local',
        accessPath: '/uploads/reimbursement',
        policy: {
          read: {
            scope: { reimbursementId: input.recordId, id: input.fileId },
            fields: FILE_COLUMNS,
          },
          create: false,
          update: false,
          delete: false,
        },
      });
      const file = await repository.findOne({ filter: { id: input.fileId } });
      if (!file) return denied();
      if (
        !['application/pdf', 'image/jpeg', 'image/png'].includes(
          file.mimeType,
        ) ||
        Number(file.size) > MAX_REIMBURSEMENT_FILE_SIZE
      )
        throw new ReimbursementAttachmentError(
          'REIMBURSEMENT_FILE_TYPE',
          'Invoice recognition supports PDF, JPEG and PNG within the reimbursement attachment size limit.',
        );
      const stream = await drive.use(file.disk).getStream(file.key),
        chunks: Buffer[] = [];
      let size = 0;
      try {
        for await (const value of stream) {
          const bytes = Buffer.from(value as Uint8Array);
          size += bytes.length;
          if (size > MAX_REIMBURSEMENT_FILE_SIZE)
            throw new ReimbursementAttachmentError(
              'REIMBURSEMENT_FILE_SIZE',
              'Invoice attachment exceeds its allowed size.',
            );
          chunks.push(bytes);
        }
      } finally {
        stream.destroy();
      }
      const bytes = Buffer.concat(chunks);
      return {
        recordId: record.id,
        lineId: input.lineId,
        fileId: file.id,
        ownerId: record.applicantId,
        fileHash: createHash('sha256').update(bytes).digest('hex'),
        mimeType: file.mimeType,
        bytes,
        ...(line
          ? {
              facts: {
                number: line.invoiceNumber,
                date: line.date,
                amountCents: line.amountCents,
              },
            }
          : {}),
      };
    },
  };
}
