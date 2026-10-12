// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610100901_create_leave_attachments', {
  sources: [
    {
      packageName: 'leave-attachments-migration-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('leaveAttachmentFiles').toExist();
    for (const field of [
      'id',
      'disk',
      'key',
      'filename',
      'ext',
      'mimeType',
      'size',
      'createdAt',
      'updatedAt',
      'leaveId',
      'ownerId',
      'uploadVersion',
    ])
      await expectCollection('leaveAttachmentFiles').toHaveField(field, {
        nullable: false,
      });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('leaveAttachmentFiles').not.toExist();
  },
});
