// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610103902_create_requisition_commands', {
  sources: [
    {
      packageName: 'recruitment-candidate',
      directory: path.resolve(
        import.meta.dirname,
        '../../fixtures/recruitment/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('requisitionCommands').toHaveField('fingerprint', {
      nullable: false,
    });
    await expectCollection('requisitionCommands').toHaveField('result', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('requisitionCommands').not.toExist();
  },
});
