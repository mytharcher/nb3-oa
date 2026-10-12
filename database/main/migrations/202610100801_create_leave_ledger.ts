import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '202610100801_create_leave_ledger',
  async up({ builder }) {
    // A lock counter is coordination only; balances remain a sum of immutable ledger deltas.
    await builder.createCollection('leaveBalanceLocks', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('employeeId', { length: 64, nullable: false });
      c.string('leaveType', { length: 64, nullable: false });
      c.integer('version', { nullable: false, defaultValue: 0 });
      c.unique(['employeeId', 'leaveType']);
    });
    await builder.createCollection('leaveBalanceOperations', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('employeeId', { length: 64, nullable: false });
      c.string('leaveType', { length: 64, nullable: false });
      c.string('requestKey', { length: 255, nullable: false });
      c.text('fingerprint', { nullable: false });
      c.unique(['employeeId', 'leaveType', 'requestKey']);
    });
    await builder.createCollection('leaveLedger', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['employeeId', 'leaveType', 'lotId'])
        c.string(field, { length: 64, nullable: false });
      for (const field of ['requestKey', 'reference'])
        c.string(field, { length: 255, nullable: false });
      c.string('kind', { length: 16, nullable: false });
      c.integer('availableDelta', { nullable: false });
      c.integer('heldDelta', { nullable: false });
      c.datetimeTz('expiresAt', { nullable: true });
      c.datetimeTz('at', { nullable: false });
      c.string('actorId', { length: 64, nullable: true });
      c.text('reason', { nullable: true });
      c.index(['employeeId', 'leaveType', 'at']);
      c.index(['employeeId', 'leaveType', 'reference']);
    });
  },
  async down({ builder }) {
    for (const name of [
      'leaveLedger',
      'leaveBalanceOperations',
      'leaveBalanceLocks',
    ])
      await builder.dropCollection(name);
  },
});
export default migration;
