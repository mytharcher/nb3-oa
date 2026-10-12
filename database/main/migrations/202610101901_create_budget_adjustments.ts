import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610101901_create_budget_adjustments',
  async up({ builder }) {
    await builder.createCollection('budgetAdjustments', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['applicantId', 'createdById', 'departmentId'])
        c.string(field, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.integer('year', { nullable: false });
      c.string('subject', { length: 128, nullable: false });
      c.string('adjustmentType', { length: 16, nullable: false });
      c.string('sourceSubject', { length: 128, nullable: true });
      c.bigInt('amountCents', { nullable: false });
      c.bigInt('heldCents', { nullable: false, defaultValue: 0 });
      c.text('reason', { nullable: false });
      c.json('heldAccount', { nullable: true });
      c.json('ruleSnapshot', { nullable: true });
      c.string('headApproverId', { length: 64, nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'status']);
      c.index(['departmentId', 'year']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('budgetAdjustments');
  },
});
