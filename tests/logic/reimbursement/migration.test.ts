// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610102102_create_reimbursements', {
  sources: [
    {
      packageName: 'reimbursement-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('reimbursementRequests').not.toHaveField(
      'bankAccount',
    );
    await expectCollection('reimbursementPayees').toHaveField('bankAccount', {
      nullable: true,
    });
    await expectCollection('reimbursementPayments').toHaveField('grossCents', {
      nullable: false,
    });
    await expectCollection('reimbursementPayments').toHaveField('offsetCents', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    for (const name of [
      'reimbursementRequests',
      'reimbursementPayees',
      'reimbursementPayments',
    ])
      await expectCollection(name).not.toExist();
  },
});
