// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610104221_knowledge_notifications', {
  sources: [
    {
      packageName: 'knowledge-notices-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('knowledgeVersionNotices').toHaveField('id', {
      nullable: false,
    });
    await expectCollection('knowledgeVersionNotices').toHaveField('delivery', {
      nullable: false,
    });
    await expectCollection('knowledgeVersionNotices').toHaveField('targets', {
      nullable: false,
    });
    await expectCollection('knowledgeVersionNotices').toHaveField(
      'statusChangedAt',
      { nullable: false },
    );
    await expectCollection('knowledgeVersionNotices').toHaveField('version', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('knowledgeVersionNotices').not.toExist();
  },
});
