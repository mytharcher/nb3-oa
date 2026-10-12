import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610101301_create_leave_cancellations',
  async up({ builder }) {
    await builder.createCollection('leaveCancellations', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('originalLeaveId', { length: 64, nullable: false });
      c.boolean('cancelAll', { nullable: false });
      c.json('baseline', { nullable: true });
      c.index(['originalLeaveId', 'status']);
      for (const field of ['applicantId', 'createdById'])
        c.string(field, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.string('leaveType', { length: 64, nullable: false });
      c.date('startDate', { nullable: false });
      c.date('endDate', { nullable: false });
      c.string('startHalf', { length: 2, nullable: false });
      c.string('endHalf', { length: 2, nullable: false });
      c.decimal('days', {
        precision: 8,
        scale: 2,
        nullable: false,
        defaultValue: 0,
      });
      c.text('reason', { nullable: false });
      c.json('attachments', { nullable: false });
      c.string('handoverUserId', { length: 64, nullable: true });
      c.boolean('enableDelegation', { nullable: false, defaultValue: false });
      c.json('ruleSnapshot', { nullable: true });
      c.json('hrRecipients', { nullable: false });
      c.string('managerApproverId', { length: 64, nullable: true });
      c.boolean('requiresHr', { nullable: false, defaultValue: false });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'status']);
    });
    await builder.addField('leaveAttendance', {
      name: 'active',
      type: 'boolean',
      nullable: false,
      defaultValue: true,
    });
  },
  async down({ builder }) {
    await builder.dropField('leaveAttendance', 'active');
    await builder.dropCollection('leaveCancellations');
  },
});
