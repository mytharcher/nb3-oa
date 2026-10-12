// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610102601_create_vendors', {
  sources: [
    {
      packageName: 'vendor-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('vendors').toHaveField('bankAccount', {
      nullable: false,
    });
    await expectCollection('vendors').toHaveField('status', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('vendors').not.toExist();
  },
});
