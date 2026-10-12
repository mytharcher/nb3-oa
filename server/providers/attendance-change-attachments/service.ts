import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryPolicy,
} from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import type {
  AttendanceChangeService,
  AttendanceChangeRecord,
} from '../attendance-change/service.js';

export const MAX_ATTENDANCE_CHANGE_FILE_SIZE = 5 * 1024 * 1024;
export const ATTENDANCE_CHANGE_FILE_FIELDS = [
  'id',
  'filename',
  'ext',
  'mimeType',
  'size',
  'createdAt',
  'updatedAt',
] as const;
export class AttendanceChangeAttachmentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Restrict formats both by metadata and their byte signature. No active HTML/SVG or office macros. */
export async function validateAttendanceChangeFile(file: File): Promise<void> {
  if (!file.size || file.size > MAX_ATTENDANCE_CHANGE_FILE_SIZE)
    throw new AttendanceChangeAttachmentError(
      'ATTENDANCE_CHANGE_FILE_SIZE',
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
    throw new AttendanceChangeAttachmentError(
      'ATTENDANCE_CHANGE_FILE_TYPE',
      'Only matching PDF, JPEG, PNG and WebP attachments are accepted.',
    );
}

export interface AttendanceChangeAttachmentService {
  authorize(
    attendanceChangeId: string,
    actorId: string,
    policy: RepositoryPolicy,
    upload: boolean,
  ): Promise<AttendanceChangeRecord>;
  assertLinked(
    connection: DatabaseConnection,
    attendanceChangeId: string,
    fileIds: readonly string[],
  ): Promise<void>;
}
export const attendanceChangeAttachmentServiceToken =
  createServiceToken<AttendanceChangeAttachmentService>(
    'oa/attendanceChange-attachments',
  );

export function createAttendanceChangeAttachmentService(
  db: DatabaseManager,
  attendanceChange: Pick<AttendanceChangeService, 'detail'>,
): AttendanceChangeAttachmentService {
  return {
    async authorize(attendanceChangeId, actorId, policy, upload) {
      // Field restrictions apply to bytes as well as JSON metadata: a grant hiding attachments hides downloads.
      const row = await db
        .repository<AttendanceChangeRecord>('attendanceChangeRequests')
        .withPolicy(policy)
        .findOne({ filter: { id: attendanceChangeId } });
      if (!row || !('attachments' in row))
        throw new AttendanceChangeAttachmentError(
          'ATTENDANCE_CHANGE_ATTACHMENT_DENIED',
          'The attachment field is outside the granted access.',
        );
      const { record } = await attendanceChange.detail(
        attendanceChangeId,
        actorId,
        policy,
      );
      if (
        upload &&
        (!['draft', 'revision'].includes(record.status) ||
          ![record.applicantId, record.createdById].includes(actorId))
      )
        throw new AttendanceChangeAttachmentError(
          'ATTENDANCE_CHANGE_ATTACHMENT_DENIED',
          'Only the applicant or draft creator may upload to a draft.',
        );
      return record;
    },
    async assertLinked(connection, attendanceChangeId, fileIds) {
      if (fileIds.length > 10 || new Set(fileIds).size !== fileIds.length)
        throw new AttendanceChangeAttachmentError(
          'ATTENDANCE_CHANGE_ATTACHMENT_INVALID',
          'At most ten distinct attachments are allowed.',
        );
      for (const id of fileIds) {
        const file = await connection
          .repository('attendanceChangeAttachmentFiles')
          .findOne({ filter: { id, attendanceChangeId } });
        if (!file)
          throw new AttendanceChangeAttachmentError(
            'ATTENDANCE_CHANGE_ATTACHMENT_INVALID',
            'An attachment does not belong to this attendanceChange request.',
          );
      }
    },
  };
}
