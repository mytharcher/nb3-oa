import { ServiceProvider } from '@nocobase/service-provider';
import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../audit/index.js';
import {
  attendanceChangeServiceToken,
  type AttendanceChangeRecord,
} from '../attendance-change/service.js';
import {
  createAttendanceChangeAttachmentService,
  attendanceChangeAttachmentServiceToken,
  AttendanceChangeAttachmentError,
} from './service.js';
export * from './service.js';

export default class AttendanceChangeAttachmentsProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/attendanceChange-attachments';
  private unsubscribe?: () => void;
  public override register(): void {
    this.app.container.singleton(attendanceChangeAttachmentServiceToken, () =>
      createAttendanceChangeAttachmentService(
        this.app.container.resolve(databaseManagerToken),
        {
          detail: (...args) =>
            this.app.container
              .resolve(attendanceChangeServiceToken)
              .detail(...args),
        },
      ),
    );
  }
  public override async start(): Promise<void> {
    const db = this.app.container.resolve(databaseManagerToken);
    const audit = this.app.container.resolve(auditServiceToken);
    // The File Repository owns upload and storage. This transactional observer protects its commit,
    // including direct server uploads, and audits the file association in the same transaction.
    this.unsubscribe = db.connection().onRepositoryMutation(
      {
        id: 'oa/attendanceChange-upload',
        collections: ['attendanceChangeAttachmentFiles'],
      },
      {
        inTransaction: async (event, connection) => {
          if (event.granularity !== 'rows') return;
          for (const change of event.changes) {
            if (
              change.collection !== 'attendanceChangeAttachmentFiles' ||
              change.kind !== 'created'
            )
              continue;
            const file = await connection
              .repository<{
                id: string;
                attendanceChangeId: string;
                ownerId: string;
                uploadVersion: number;
              }>('attendanceChangeAttachmentFiles')
              .findOne({ filter: { id: String(change.key.id) } });
            if (!file)
              throw new AttendanceChangeAttachmentError(
                'ATTENDANCE_CHANGE_ATTACHMENT_INVALID',
                'Uploaded metadata is missing.',
              );
            const before = await connection
              .repository<AttendanceChangeRecord>('attendanceChangeRequests')
              .findOne({ filter: { id: file.attendanceChangeId } });
            if (!before)
              throw new AttendanceChangeAttachmentError(
                'ATTENDANCE_CHANGE_ATTACHMENT_DENIED',
                'The owning draft no longer exists.',
              );
            // Submit/edit use the same applicant lock. Re-read after acquiring it: never mutate
            // lifecycle-owned state just to obtain a database lock.
            await lockUserForAdministration(connection, before.applicantId);
            const row = await connection
              .repository<AttendanceChangeRecord>('attendanceChangeRequests')
              .findOne({ filter: { id: file.attendanceChangeId } });
            if (
              !row ||
              !['draft', 'revision'].includes(row.status) ||
              row.lifecycleVersion !== file.uploadVersion ||
              ![row.applicantId, row.createdById].includes(file.ownerId)
            )
              throw new AttendanceChangeAttachmentError(
                'ATTENDANCE_CHANGE_ATTACHMENT_DENIED',
                'The draft changed during upload.',
              );
            await audit.record(
              {
                actorId: String(file.ownerId),
                action: 'attendanceChangeAttachment.upload',
                targetType: 'attendanceChangeRequests',
                targetId: String(file.attendanceChangeId),
                after: { fileId: file.id },
              },
              connection,
            );
          }
        },
      },
    );
  }
  public override async shutdown(): Promise<void> {
    this.unsubscribe?.();
  }
}
