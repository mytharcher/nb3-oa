import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610102302_create_loan_requests',
  async up({ builder }) {
    await builder.createCollection('loanRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['applicantId', 'createdById'])
        c.string(field, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.text('reason', { nullable: false });
      c.bigInt('amountCents', { nullable: false });
      c.string('dueDate', { length: 10, nullable: false });
      for (const field of [
        'travelId',
        'departmentId',
        'managerApproverId',
        'headApproverId',
        'executiveApproverId',
        'gmApproverId',
      ])
        c.string(field, { length: 64, nullable: true });
      c.json('ruleSnapshot', { nullable: true });
      c.json('quotaSnapshot', { nullable: true });
      c.json('gmMerged', { nullable: true });
      c.bigInt('heldCents', { nullable: false, defaultValue: 0 });
      c.json('paymentAccount', { nullable: true });
      c.string('paymentVoucher', { length: 255, nullable: true });
      for (const field of ['approvalGrantedAt', 'paidAt'])
        c.datetimeTz(field, { nullable: true });
      c.string('returnDueDate', { length: 10, nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'status']);
      c.index(['travelId', 'status']);
    });
    await builder.createCollection('loanCreationCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('actorId', { length: 64, nullable: false });
      c.string('requestKey', { length: 128, nullable: false });
      c.text('fingerprint', { nullable: false });
      c.string('recordId', { length: 64, nullable: false });
      c.unique(['actorId', 'requestKey']);
    });
    await builder.createCollection('loanApplicantLocks', (c) => {
      c.string('applicantId', { length: 64, nullable: false });
      c.primary('applicantId');
      c.integer('version', { nullable: false, defaultValue: 0 });
    });
    await builder.createCollection('loanReturnCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('travelId', { length: 64, nullable: false });
      c.string('requestKey', { length: 255, nullable: false });
      c.unique(['travelId', 'requestKey']);
      c.text('fingerprint', { nullable: false });
      c.json('result', { nullable: false });
    });
    await builder.createCollection('loanReminderEvents', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('loanId', { length: 64, nullable: false });
      c.string('requestId', { length: 64, nullable: false });
      c.string('eventDate', { length: 10, nullable: false });
      c.string('kind', { length: 16, nullable: false });
      c.unique(['loanId', 'eventDate', 'kind']);
      c.string('state', {
        length: 16,
        nullable: false,
        defaultValue: 'pending',
      });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('sentAt', { nullable: true });
    });
  },
  async down({ builder }) {
    for (const collection of [
      'loanReminderEvents',
      'loanReturnCommands',
      'loanApplicantLocks',
      'loanRequests',
    ])
      await builder.dropCollection(collection);
  },
});
