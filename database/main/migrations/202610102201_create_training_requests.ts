import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610102201_create_training_requests',
  async up({ builder }) {
    await builder.createCollection('trainingRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['applicantId', 'createdById'])
        c.string(field, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.string('name', { length: 255, nullable: false });
      c.string('institution', { length: 255, nullable: false });
      c.datetimeTz('startAt', { nullable: false });
      c.datetimeTz('endAt', { nullable: false });
      c.boolean('usesWorkingTime', { nullable: false });
      c.boolean('attendanceRecorded', { nullable: false, defaultValue: false });
      c.text('reason', { nullable: false });
      c.bigInt('amountCents', { nullable: false });
      c.string('departmentId', { length: 64, nullable: true });
      c.string('managerApproverId', { length: 64, nullable: true });
      c.json('headMerged', { nullable: true });
      c.json('hrRecipients', { nullable: false });
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
      c.index(['departmentId', 'status']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('trainingRequests');
  },
});
