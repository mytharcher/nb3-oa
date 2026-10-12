// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610103502_headcount_replacement_notifications', {
  sources: [
    {
      packageName: 'headcount-notices-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('headcountReplacementNotices').toHaveField('id', {
      nullable: false,
    });
    await expectCollection('headcountReplacementNotices').toHaveField(
      'delivery',
      {
        nullable: false,
      },
    );
    await expectCollection('headcountReplacementNotices').toHaveField(
      'recipients',
      {
        nullable: false,
      },
    );
    await expectCollection('headcountReplacementNotices').toHaveField(
      'statusChangedAt',
      { nullable: false },
    );
    await expectCollection('headcountReplacementNotices').toHaveField(
      'version',
      {
        nullable: false,
      },
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('headcountReplacementNotices').not.toExist();
  },
});
