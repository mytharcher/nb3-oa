// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610260001_approval_ai', {
  sources: [
    {
      packageName: 'approval-ai-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('oaApprovalAiSettings').toHaveField('definitionId', {
      nullable: false,
    });
    await expectCollection('oaApprovalAiTaskReviews').toHaveField('userId', {
      nullable: false,
    });
    await expectCollection('oaApprovalAiTaskReviews').toHaveField(
      'leaseExpiresAt',
      { type: 'datetimeTz' },
    );
    await expectCollection('oaApprovalAiResults').toHaveField('fingerprint', {
      nullable: false,
    });
    await expectCollection('oaApprovalAiResults').toHaveField('finishedAt', {
      type: 'datetimeTz',
    });
  },
  down: async ({ expectCollection }) => {
    for (const name of [
      'oaApprovalAiSettings',
      'oaApprovalAiTaskReviews',
      'oaApprovalAiResults',
    ])
      await expectCollection(name).not.toExist();
  },
});
