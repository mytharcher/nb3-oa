// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610103903_create_recruitment_commands', {
  sources: [
    {
      packageName: 'recruitment-request-commands',
      directory: path.resolve(
        import.meta.dirname,
        '../../fixtures/recruitment/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('recruitmentCommands').toHaveField('fingerprint', {
      nullable: false,
    });
    await expectCollection('recruitmentCommands').toHaveField('result', {
      nullable: false,
    });
    await expectCollection('recruitmentCommands').not.toHaveField(
      'minimumCents',
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('recruitmentCommands').not.toExist();
  },
});
