// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610102301_create_loan_ledger', {
  sources: [
    {
      packageName: 'loan-ledger-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('loans').toHaveField('principalCents', {
      nullable: false,
    });
    await expectCollection('loanReservations').toHaveField('reference', {
      nullable: false,
    });
    await expectCollection('loanLedger').toHaveField('repaidDelta', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    for (const name of [
      'loans',
      'loanReservations',
      'loanOperations',
      'loanLedger',
    ])
      await expectCollection(name).not.toExist();
  },
});
