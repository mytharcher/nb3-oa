import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryPolicy,
} from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import type { ContractService } from './service.js';
import type { ContractRequest } from './types.js';

export const MAX_CONTRACT_FILE_SIZE = 5 * 1024 * 1024;
export const CONTRACT_FILE_FIELDS = [
  'id',
  'filename',
  'ext',
  'mimeType',
  'size',
  'createdAt',
  'updatedAt',
] as const;
export class ContractAttachmentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Restrict formats both by metadata and their byte signature. No active HTML/SVG or office macros. */
export async function validateContractFile(file: File): Promise<void> {
  if (!file.size || file.size > MAX_CONTRACT_FILE_SIZE)
    throw new ContractAttachmentError(
      'CONTRACT_FILE_SIZE',
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
    throw new ContractAttachmentError(
      'CONTRACT_FILE_TYPE',
      'Only matching PDF, JPEG, PNG and WebP attachments are accepted.',
    );
}

export interface ContractAttachmentService {
  authorize(
    requestId: string,
    actorId: string,
    policy: RepositoryPolicy,
    upload: boolean,
    purpose?: 'text' | 'evidence',
  ): Promise<ContractRequest>;
  assertLinked(
    connection: DatabaseConnection,
    requestId: string,
    fileIds: readonly string[],
  ): Promise<void>;
}
export const contractAttachmentServiceToken =
  createServiceToken<ContractAttachmentService>('oa/contracts-attachments');

export function createContractAttachmentService(
  db: DatabaseManager,
  contracts: Pick<ContractService, 'detail'>,
): ContractAttachmentService {
  return {
    async authorize(requestId, actorId, policy, upload, purpose = 'evidence') {
      // Field restrictions apply to bytes as well as JSON metadata: a grant hiding attachments hides downloads.
      const row = await db
        .repository<ContractRequest>('contractRequests')
        .withPolicy(policy)
        .findOne({ filter: { id: requestId } });
      if (
        !row ||
        !((purpose === 'text' ? 'textVersionId' : 'attachments') in row)
      )
        throw new ContractAttachmentError(
          'CONTRACT_ATTACHMENT_DENIED',
          'The attachment field is outside the granted access.',
        );
      const { record } = await contracts.detail(requestId, actorId, policy);
      if (
        upload &&
        (!['draft', 'revision'].includes(record.status) ||
          ![record.applicantId, record.creatorId].includes(actorId))
      )
        throw new ContractAttachmentError(
          'CONTRACT_ATTACHMENT_DENIED',
          'Only the applicant or draft creator may upload to a draft.',
        );
      return record;
    },
    assertLinked: assertContractAttachments,
  };
}

export async function assertContractAttachments(
  connection: DatabaseConnection,
  requestId: string,
  fileIds: readonly string[],
): Promise<void> {
  if (fileIds.length > 10 || new Set(fileIds).size !== fileIds.length)
    throw new ContractAttachmentError(
      'CONTRACT_ATTACHMENT_INVALID',
      'At most ten distinct attachments are allowed.',
    );
  for (const id of fileIds) {
    const file = await connection
      .repository('contractAttachmentFiles')
      .findOne({ filter: { id, requestId, purpose: 'evidence' } });
    if (!file)
      throw new ContractAttachmentError(
        'CONTRACT_ATTACHMENT_INVALID',
        'An attachment does not belong to this contract application.',
      );
  }
}

export async function assertContractText(
  tx: DatabaseConnection,
  requestId: string,
  textVersionId: string | null,
) {
  if (!textVersionId) return;
  const version = await tx
    .repository('contractTextVersions')
    .findOne({ filter: { id: textVersionId, requestId } });
  if (!version)
    throw new ContractAttachmentError(
      'CONTRACT_TEXT_INVALID',
      'The text version does not belong to this application.',
    );
  const file = await tx.repository('contractAttachmentFiles').findOne({
    filter: {
      id: typeof version.fileId === 'string' ? version.fileId : 'invalid',
      requestId,
      purpose: 'text',
    },
  });
  if (!file)
    throw new ContractAttachmentError(
      'CONTRACT_TEXT_INVALID',
      'The immutable text file is unavailable.',
    );
}
