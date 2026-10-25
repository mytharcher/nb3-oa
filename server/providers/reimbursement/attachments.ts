import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryPolicy,
} from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import type { ReimbursementService } from './service.js';
import type { ReimbursementRecord } from './contract.js';

export const MAX_REIMBURSEMENT_FILE_SIZE = 5 * 1024 * 1024;
export const REIMBURSEMENT_FILE_FIELDS = [
  'id',
  'filename',
  'ext',
  'mimeType',
  'size',
  'createdAt',
  'updatedAt',
] as const;
export class ReimbursementAttachmentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Restrict formats both by metadata and their byte signature. No active HTML/SVG or office macros. */
export async function validateReimbursementFile(file: File): Promise<void> {
  if (!file.size || file.size > MAX_REIMBURSEMENT_FILE_SIZE)
    throw new ReimbursementAttachmentError(
      'REIMBURSEMENT_FILE_SIZE',
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
    throw new ReimbursementAttachmentError(
      'REIMBURSEMENT_FILE_TYPE',
      'Only matching PDF, JPEG, PNG and WebP attachments are accepted.',
    );
}

export interface ReimbursementAttachmentService {
  authorize(
    reimbursementId: string,
    actorId: string,
    policy: RepositoryPolicy,
    upload: boolean,
  ): Promise<ReimbursementRecord>;
  assertLinked(
    connection: DatabaseConnection,
    reimbursementId: string,
    fileIds: readonly string[],
  ): Promise<void>;
}
export const reimbursementAttachmentServiceToken =
  createServiceToken<ReimbursementAttachmentService>(
    'oa/reimbursement-attachments',
  );

export function createReimbursementAttachmentService(
  db: DatabaseManager,
  reimbursement: Pick<ReimbursementService, 'attachmentRecord'>,
): ReimbursementAttachmentService {
  return {
    async authorize(reimbursementId, actorId, policy, upload) {
      // Field restrictions apply to bytes as well as JSON metadata: a grant hiding attachments hides downloads.
      const row = await db
        .repository<ReimbursementRecord>('reimbursementRequests')
        .withPolicy(policy)
        .findOne({ filter: { id: reimbursementId } });
      if (!row || !('lines' in row))
        throw new ReimbursementAttachmentError(
          'REIMBURSEMENT_ATTACHMENT_DENIED',
          'The attachment field is outside the granted access.',
        );
      const record = await reimbursement.attachmentRecord(
        reimbursementId,
        actorId,
        policy,
      );
      if (
        upload &&
        (!['draft', 'revision'].includes(record.status) ||
          ![record.applicantId, record.createdById].includes(actorId))
      )
        throw new ReimbursementAttachmentError(
          'REIMBURSEMENT_ATTACHMENT_DENIED',
          'Only the applicant or draft creator may upload to a draft.',
        );
      return record;
    },
    assertLinked: assertReimbursementAttachments,
  };
}

export async function assertReimbursementAttachments(
  connection: DatabaseConnection,
  reimbursementId: string,
  fileIds: readonly string[],
): Promise<void> {
  if (fileIds.length > 2000)
    throw new ReimbursementAttachmentError(
      'REIMBURSEMENT_ATTACHMENT_INVALID',
      'At most 2000 linked attachments are allowed.',
    );
  for (const id of fileIds) {
    const file = await connection
      .repository('reimbursementAttachmentFiles')
      .findOne({ filter: { id, reimbursementId } });
    if (!file)
      throw new ReimbursementAttachmentError(
        'REIMBURSEMENT_ATTACHMENT_INVALID',
        'An attachment does not belong to this reimbursement request.',
      );
  }
}
