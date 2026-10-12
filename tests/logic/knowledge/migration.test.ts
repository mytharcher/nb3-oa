// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610104201_create_knowledge', {
  sources: [
    {
      packageName: 'knowledge-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    for (const collection of [
      'knowledgeFolders',
      'knowledgeDocuments',
      'knowledgeVersions',
      'knowledgeCommands',
      'knowledgeFiles',
      'knowledgeTreeLock',
    ])
      await expectCollection(collection).toHaveField('id', { nullable: false });
    await expectCollection('knowledgeVersions').toHaveField('markdown');
    await expectCollection('knowledgeFiles').toHaveField('uploadKey');
  },
  down: async ({ expectCollection }) => {
    for (const collection of [
      'knowledgeFolders',
      'knowledgeDocuments',
      'knowledgeVersions',
      'knowledgeCommands',
      'knowledgeFiles',
      'knowledgeTreeLock',
    ])
      await expectCollection(collection).not.toExist();
  },
});
