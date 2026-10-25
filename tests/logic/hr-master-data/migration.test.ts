// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610250006_hr_master_data', {
  sources: [
    {
      packageName: 'oa-main',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('hrSyncSources').toHaveField('principalId', {
      nullable: false,
    });
    await expectCollection('hrSyncMappings').toHaveField('localHash', {
      nullable: false,
    });
    await expectCollection('hrSyncBatches').toHaveField('payloadHash', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    for (const name of ['hrSyncBatches', 'hrSyncMappings', 'hrSyncSources'])
      await expectCollection(name).not.toExist();
  },
});
