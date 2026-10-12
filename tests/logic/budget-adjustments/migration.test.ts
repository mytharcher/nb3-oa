// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610101901_create_budget_adjustments', {
  sources: [
    {
      packageName: 'budget-adjustments-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('budgetAdjustments').toHaveField('heldAccount', {
      nullable: true,
    });
    await expectCollection('budgetAdjustments').toHaveField('heldCents', {
      nullable: false,
    });
    await expectCollection('budgetAdjustments').toHaveField('amountCents', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('budgetAdjustments').not.toExist();
  },
});
