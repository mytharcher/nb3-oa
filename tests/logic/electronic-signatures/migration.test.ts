// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610250701_electronic_signatures', {
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
    await expectCollection('sealRequests').toHaveField('executionMode', {
      nullable: false,
    });
    await expectCollection('signatureEnvelopes').toHaveField('signedAt', {
      nullable: true,
    });
    await expectCollection('electronicSealLedger').toHaveField('signedHash', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('sealRequests').not.toHaveField('executionMode');
  },
});
