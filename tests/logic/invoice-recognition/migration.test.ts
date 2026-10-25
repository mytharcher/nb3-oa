// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610250701_invoice_recognition', {
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
    await expectCollection('invoiceRecognitionOperations').toHaveField(
      'contentHash',
      { nullable: false },
    );
    await expectCollection('invoiceRecognitionOperations').toHaveField(
      'leaseUntil',
      { nullable: true },
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('invoiceRecognitionOperations').not.toExist();
  },
});
