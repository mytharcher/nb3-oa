// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610103901_create_recruitment_requests', {
  sources: [
    {
      packageName: 'recruitment-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../fixtures/recruitment/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('recruitmentRequests').toHaveField(
      'privateSalaryRevisionId',
      { nullable: false },
    );
    await expectCollection('recruitmentRequests').toHaveField('snapshot');
    await expectCollection('recruitmentRequests').not.toHaveField(
      'minimumCents',
    );
    await expectCollection('recruitmentSalaryRevisions').toHaveField(
      'minimumCents',
      { nullable: false },
    );
    await expectCollection('requisitions').toHaveField('sourceVersion', {
      nullable: false,
    });
    await expectCollection('requisitions').toHaveField('remaining', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('requisitions').not.toExist();
    await expectCollection('recruitmentSalaryRevisions').not.toExist();
    await expectCollection('recruitmentRequests').not.toExist();
  },
});
