// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
const names = ['leaveBalanceLocks', 'leaveBalanceOperations', 'leaveLedger'];
describeMigration('202610100801_create_leave_ledger', {
  sources: [
    {
      packageName: 'leave-balance-migration-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    for (const name of names) await expectCollection(name).toExist();
    await expectCollection('leaveLedger').toHaveField('availableDelta', {
      nullable: false,
    });
    await expectCollection('leaveLedger').toHaveField('heldDelta', {
      nullable: false,
    });
    await expectCollection('leaveLedger').toHaveField('expiresAt', {
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    for (const name of names) await expectCollection(name).not.toExist();
  },
});
