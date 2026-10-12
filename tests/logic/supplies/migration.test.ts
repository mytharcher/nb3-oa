// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610101801_create_supplies', {
  sources: [
    {
      packageName: 'supply-migration-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('supplyRequests').toExist();
    await expectCollection('supplyRequests').toHaveField(
      'approvedFingerprint',
      { nullable: true },
    );
    await expectCollection('supplyIssueLedger').toExist();
    await expectCollection('supplyIssueLedger').toHaveField('actualQuantity', {
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('supplyRequests').not.toExist();
    await expectCollection('supplyIssueLedger').not.toExist();
  },
});
