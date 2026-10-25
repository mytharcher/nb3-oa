// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610250501_finance_integration', {
  sources: [
    {
      packageName: 'oa-main',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('financeIntegrationDispatches').toHaveField(
      'payloadHash',
      { nullable: false },
    );
    await expectCollection('financeIntegrationDispatches').toHaveField(
      'leaseUntil',
      { nullable: true },
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('financeIntegrationDispatches').not.toExist();
  },
});
