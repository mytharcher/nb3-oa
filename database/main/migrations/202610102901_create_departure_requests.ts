import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610102901_create_departure_requests',
  async up({ builder }) {
    await builder.createCollection('departureRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of [
        'employeeId',
        'applicantId',
        'createdById',
        'departureType',
      ])
        c.string(field, { length: 64, nullable: false });
      c.text('reason', { nullable: false });
      c.string('expectedLastWorkingDay', { length: 10, nullable: true });
      for (const field of ['handoverUserId', 'sourceProbationId'])
        c.string(field, { length: 64, nullable: true });
      c.string('sourceKey', { length: 160, nullable: true });
      c.unique('sourceKey');
      c.unique('sourceProbationId');
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.string('lastWorkingDay', { length: 10, nullable: true });
      c.string('settlementDate', { length: 10, nullable: true });
      c.text('settlementNote', { nullable: true });
      for (const field of [
        'departmentId',
        'managerApproverId',
        'headApproverId',
        'gmApproverId',
      ])
        c.string(field, { length: 64, nullable: true });
      c.integer('gradeRank', { nullable: true });
      c.json('ruleSnapshot', { nullable: true });
      c.json('headMerged', { nullable: true });
      c.boolean('hrInterviewCompleted', {
        nullable: false,
        defaultValue: false,
      });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['employeeId', 'status']);
      c.index(['applicantId', 'status']);
    });
    await builder.createCollection('departureWorkItems', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['departureId', 'employeeId', 'applicantId', 'kind'])
        c.string(field, { length: 64, nullable: false });
      for (const field of [
        'managerId',
        'receiverId',
        'claimedById',
        'forcedById',
      ])
        c.string(field, { length: 64, nullable: true });
      c.text('forceReason', { nullable: true });
      c.boolean('checklistConfirmed', { nullable: false, defaultValue: false });
      c.boolean('receiverAcknowledged', {
        nullable: false,
        defaultValue: false,
      });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.unique(['departureId', 'kind']);
      c.index(['claimedById', 'status']);
    });
    await builder.createCollection('departureExecutions', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['departureId', 'employeeId', 'applicantId'])
        c.string(field, { length: 64, nullable: false });
      c.unique('departureId');
      c.string('managerId', { length: 64, nullable: true });
      c.string('lastWorkingDay', { length: 10, nullable: false });
      c.string('failureCode', { length: 64, nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['status', 'lastWorkingDay']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('departureExecutions');
    await builder.dropCollection('departureWorkItems');
    await builder.dropCollection('departureRequests');
  },
});
