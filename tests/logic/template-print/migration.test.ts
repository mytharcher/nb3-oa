// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
const names = [
  'printTemplates',
  'printTemplateFiles',
  'printTemplateRevisions',
  'printTemplateCommands',
];
describeMigration('202610103801_template_print', {
  sources: [
    {
      packageName: 'template-print-migration-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  async up({ connection, expectCollection }) {
    for (const name of names) {
      await expectCollection(name).toExist();
      expect(await connection.collections.getPhysical(name)).toBeDefined();
    }
    await expectCollection('printTemplateCommands').toHaveField('receipt', {
      nullable: true,
    });
    await expectCollection('printTemplateFiles').toHaveField('uploadKey', {
      nullable: false,
    });
    await expectCollection('printTemplateRevisions').toHaveField(
      'contentHash',
      { nullable: false },
    );
  },
  async down({ expectCollection }) {
    for (const name of names) await expectCollection(name).not.toExist();
  },
});
