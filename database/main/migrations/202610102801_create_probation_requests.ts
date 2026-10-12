import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610102801_create_probation_requests',
  async up({ builder }) {
    await builder.createCollection('probationRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['employeeId', 'applicantId', 'createdById'])
        c.string(field, { length: 64, nullable: false });
      c.string('probationEndDate', { length: 10, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.text('selfEvaluation', { nullable: false });
      c.text('evaluation', { nullable: true });
      c.string('conclusion', { length: 16, nullable: true });
      c.string('deferredTo', { length: 10, nullable: true });
      for (const field of [
        'gradeId',
        'compensationProposalId',
        'hrActorId',
        'departmentId',
        'managerApproverId',
        'headApproverId',
        'gmApproverId',
      ])
        c.string(field, { length: 64, nullable: true });
      c.json('headMerged', { nullable: true });
      c.json('ruleSnapshot', { nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['employeeId', 'probationEndDate']);
      c.index(['applicantId', 'status']);
      c.index(['departmentId', 'status']);
    });
    await builder.createCollection('probationDraftCycles', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('employeeId', { length: 64, nullable: false });
      c.string('probationEndDate', { length: 10, nullable: false });
      c.string('recordId', { length: 64, nullable: false });
      c.unique(['employeeId', 'probationEndDate']);
      c.unique('recordId');
      c.datetimeTz('createdAt', { nullable: false });
    });
    // Deliberately no generic collection permission is registered for compensation proposals.
    await builder.createCollection('probationCompensationProposals', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['recordId', 'gradeId', 'createdById'])
        c.string(field, { length: 64, nullable: false });
      c.string('baseSalary', { length: 32, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['recordId']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('probationDraftCycles');
    await builder.dropCollection('probationCompensationProposals');
    await builder.dropCollection('probationRequests');
  },
});
