import { ServiceProvider } from '@nocobase/service-provider';
import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../audit/index.js';
import { leaveServiceToken, type LeaveRecord } from '../leave/service.js';
import {
  createLeaveAttachmentService,
  leaveAttachmentServiceToken,
  LeaveAttachmentError,
} from './service.js';
export * from './service.js';

export default class LeaveAttachmentsProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/leave-attachments';
  private unsubscribe?: () => void;
  public override register(): void {
    this.app.container.singleton(leaveAttachmentServiceToken, () =>
      createLeaveAttachmentService(
        this.app.container.resolve(databaseManagerToken),
        {
          detail: (...args) =>
            this.app.container.resolve(leaveServiceToken).detail(...args),
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
      { id: 'oa/leave-upload', collections: ['leaveAttachmentFiles'] },
      {
        inTransaction: async (event, connection) => {
          if (event.granularity !== 'rows') return;
          for (const change of event.changes) {
            if (
              change.collection !== 'leaveAttachmentFiles' ||
              change.kind !== 'created'
            )
              continue;
            const file = await connection
              .repository<{
                id: string;
                leaveId: string;
                ownerId: string;
                uploadVersion: number;
              }>('leaveAttachmentFiles')
              .findOne({ filter: { id: String(change.key.id) } });
            if (!file)
              throw new LeaveAttachmentError(
                'LEAVE_ATTACHMENT_INVALID',
                'Uploaded metadata is missing.',
              );
            const before = await connection
              .repository<LeaveRecord>('leaveRequests')
              .findOne({ filter: { id: file.leaveId } });
            if (!before)
              throw new LeaveAttachmentError(
                'LEAVE_ATTACHMENT_DENIED',
                'The owning draft no longer exists.',
              );
            // Submit/edit use the same applicant lock. Re-read after acquiring it: never mutate
            // lifecycle-owned state just to obtain a database lock.
            await lockUserForAdministration(connection, before.applicantId);
            const row = await connection
              .repository<LeaveRecord>('leaveRequests')
              .findOne({ filter: { id: file.leaveId } });
            if (
              !row ||
              !['draft', 'revision'].includes(row.status) ||
              row.lifecycleVersion !== file.uploadVersion ||
              ![row.applicantId, row.createdById].includes(file.ownerId)
            )
              throw new LeaveAttachmentError(
                'LEAVE_ATTACHMENT_DENIED',
                'The draft changed during upload.',
              );
            await audit.record(
              {
                actorId: String(file.ownerId),
                action: 'leaveAttachment.upload',
                targetType: 'leaveRequests',
                targetId: String(file.leaveId),
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
