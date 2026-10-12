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
describeMigration('202610104701_create_employee_archive_references', {
  sources,
  async up({ expectCollection }) {
    await expectCollection('employeeArchiveReferences').toExist();
    await expectCollection('employeeArchiveReferences').toHaveField(
      'contentHash',
      { nullable: false },
    );
    await expectCollection('employeeArchiveReferences').toHaveField(
      'sensitivity',
      { nullable: false },
    );
  },
  async down({ expectCollection }) {
    await expectCollection('employeeArchiveReferences').not.toExist();
  },
});
