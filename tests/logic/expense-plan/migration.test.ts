// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610102001_create_expense_plans', {
  sources: [
    {
      packageName: 'expense-plan-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('expensePlans').toHaveField('heldAccount', {
      nullable: true,
    });
    await expectCollection('expensePlans').toHaveField('heldCents', {
      nullable: false,
    });
    await expectCollection('expensePlans').toHaveField('amountCents', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('expensePlans').not.toExist();
  },
});
