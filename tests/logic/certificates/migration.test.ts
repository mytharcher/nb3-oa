// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
const sources = [
  {
    packageName: 'certificates-candidate',
    directory: path.resolve(
      import.meta.dirname,
      '../../fixtures/certificates/migrations',
    ),
  },
];
const names = [
  'certificateRequests',
  'certificatePreparations',
  'certificatePreparationPrivate',
  'certificateIssues',
  'certificateCommands',
  'certificateFiles',
];
describeMigration('202610104702_create_certificates', {
  sources,
  async up({ expectCollection }) {
    for (const name of names) await expectCollection(name).toExist();
    await expectCollection('certificatePreparationPrivate').toHaveField(
      'monthlyCents',
      { nullable: false },
    );
    await expectCollection('certificateIssues').toHaveField('contentHash', {
      nullable: false,
    });
  },
  async down({ expectCollection }) {
    for (const name of names) await expectCollection(name).not.toExist();
  },
});
