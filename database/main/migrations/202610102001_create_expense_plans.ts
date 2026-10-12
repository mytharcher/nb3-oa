import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610102001_create_expense_plans',
  async up({ builder }) {
    await builder.createCollection('expensePlans', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['applicantId', 'createdById'])
        c.string(field, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.string('matterType', { length: 128, nullable: false });
      c.text('reason', { nullable: false });
      c.bigInt('amountCents', { nullable: false });
      c.string('subject', { length: 128, nullable: false });
      c.integer('participants', { nullable: false });
      c.string('eventDate', { length: 10, nullable: false });
      c.string('departmentId', { length: 64, nullable: true });
      c.integer('year', { nullable: true });
      c.json('heldAccount', { nullable: true });
      c.bigInt('heldCents', { nullable: false, defaultValue: 0 });
      c.json('ruleSnapshot', { nullable: true });
      for (const field of [
        'headApproverId',
        'executiveApproverId',
        'gmApproverId',
        'authorizationId',
      ])
        c.string(field, { length: 64, nullable: true });
      c.unique('authorizationId');
      c.json('gmMerged', { nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'status']);
      c.index(['departmentId', 'year']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('expensePlans');
  },
});
