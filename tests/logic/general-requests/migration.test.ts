// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610101601_create_general_requests', {
  sources: [
    {
      packageName: 'general-requests-migration-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('generalRequests').toHaveField('extraApproverIds', {
      nullable: false,
    });
    await expectCollection('generalRequests').toHaveField('body', {
      nullable: false,
    });
    await expectCollection('generalAttachmentFiles').toHaveField(
      'uploadVersion',
      { nullable: false },
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('generalRequests').not.toExist();
    await expectCollection('generalAttachmentFiles').not.toExist();
  },
});
