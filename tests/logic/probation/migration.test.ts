// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610102801_create_probation_requests', {
  sources: [
    {
      packageName: 'probation-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('probationDraftCycles').toHaveField(
      'probationEndDate',
      { nullable: false },
    );
    await expectCollection('probationRequests').toHaveField(
      'compensationProposalId',
      { nullable: true },
    );
    await expectCollection('probationRequests').toHaveField(
      'probationEndDate',
      { nullable: false },
    );
    await expectCollection('probationCompensationProposals').toHaveField(
      'baseSalary',
      { nullable: false },
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('probationDraftCycles').not.toExist();
    await expectCollection('probationCompensationProposals').not.toExist();
    await expectCollection('probationRequests').not.toExist();
  },
});
