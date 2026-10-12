// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
const names = ['budgets', 'budgetOperations', 'budgetLedger'];
describeMigration('202610101701_create_budget_ledger', {
  sources: [
    {
      packageName: 'budget-migration-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    for (const name of names) await expectCollection(name).toExist();
    for (const field of [
      'allocatedDelta',
      'heldDelta',
      'usedDelta',
      'actorId',
      'reason',
    ])
      await expectCollection('budgetLedger').toHaveField(field, {
        nullable: false,
      });
  },
  down: async ({ expectCollection }) => {
    for (const name of names) await expectCollection(name).not.toExist();
  },
});
