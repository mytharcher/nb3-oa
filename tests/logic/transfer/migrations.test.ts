// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
const sources = [
  {
    packageName: 'transfer-candidate',
    directory: path.resolve(
      import.meta.dirname,
      '../../fixtures/transfer/migrations',
    ),
  },
];
describeMigration('202610105001_create_employee_assignment_origins', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('employeeAssignmentOrigins').toHaveField(
      'fingerprint',
      { nullable: false },
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('employeeAssignmentOrigins').not.toExist();
  },
});
describeMigration('202610105002_create_transfer_requests', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('transferRequests').toHaveField('effectiveDate', {
      nullable: false,
    });
    await expectCollection('transferRequests').not.toHaveField('targetSalary');
    await expectCollection('transferSalaryRevisions').toHaveField(
      'targetCents',
      { nullable: false },
    );
    await expectCollection('transferCommands').toHaveField('fingerprint', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('transferRequests').not.toExist();
    await expectCollection('transferSalaryRevisions').not.toExist();
    await expectCollection('transferCommands').not.toExist();
  },
});
