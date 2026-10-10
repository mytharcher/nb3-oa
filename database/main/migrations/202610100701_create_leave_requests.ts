import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '202610100701_create_leave_requests',
  async up({ builder }) {
    await builder.createCollection('leaveRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
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
    await builder.createCollection('leaveAttendance', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('applicationId', { length: 64, nullable: false });
      c.unique('applicationId');
      c.string('userId', { length: 64, nullable: false });
      c.date('startDate', { nullable: false });
      c.date('endDate', { nullable: false });
      c.string('startHalf', { length: 2, nullable: false });
      c.string('endHalf', { length: 2, nullable: false });
      c.decimal('days', { precision: 8, scale: 2, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
    });
    await builder.createCollection('oaLifecycleTransitions', (c) => {
      c.increments('id');
      for (const field of [
        'lifecycle',
        'recordId',
        'transition',
        'to',
        'actorId',
        'requestKey',
      ])
        c.string(field, { length: 255, nullable: false });
      for (const field of ['from', 'requestId'])
        c.string(field, { length: 255, nullable: true });
      c.json('input', { nullable: false });
      c.datetimeTz('at', { nullable: false });
      c.integer('version', { nullable: false });
      c.unique(['lifecycle', 'recordId', 'version']);
      c.unique(['lifecycle', 'recordId', 'requestKey']);
    });
    await builder.createCollection('oaLifecycleEffectRuns', (c) => {
      c.increments('id');
      for (const field of [
        'transitionId',
        'lifecycle',
        'recordId',
        'effect',
        'status',
      ])
        c.string(field, { length: 255, nullable: false });
      c.boolean('stayBound', { nullable: false });
      c.integer('attempts', { nullable: false });
      c.integer('maxAttempts', { nullable: false });
      c.json('result', { nullable: true });
      c.text('error', { nullable: true });
      c.json('continuation', { nullable: true });
      for (const field of ['createdAt', 'updatedAt'])
        c.datetimeTz(field, { nullable: false });
      for (const field of [
        'claimedAt',
        'runAfter',
        'continuationDueAt',
        'continuationAbandonedAt',
      ])
        c.datetimeTz(field, { nullable: true });
    });
  },
  async down({ builder }) {
    for (const name of [
      'oaLifecycleEffectRuns',
      'oaLifecycleTransitions',
      'leaveAttendance',
      'leaveRequests',
    ])
      await builder.dropCollection(name);
  },
});
export default migration;
