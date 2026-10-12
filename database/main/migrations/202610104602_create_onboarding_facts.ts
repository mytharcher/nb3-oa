import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610104602_create_onboarding_facts',
  async up({ builder }) {
    await builder.createCollection('onboardings', (c) => {
      c.string('id', { nullable: false });
      c.primary('id');
      for (const field of [
        'creatorId',
        'employeeId',
        'userId',
        'requisitionId',
        'departmentId',
        'positionId',
        'gradeId',
        'hireDate',
        'status',
      ])
        c.string(field, { nullable: false });
      c.unique('employeeId');
      c.integer('version', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
    });
    await builder.createCollection('onboardingTasks', (c) => {
      c.string('id', { nullable: false });
      c.primary('id');
      for (const field of ['onboardingId', 'kind', 'status', 'dueDate'])
        c.string(field, { nullable: false });
      c.string('assigneeId');
      c.string('targetUserId');
      c.string('dutyRoleCode');
      c.json('facts');
      c.boolean('forced', { nullable: false });
      c.integer('version', { nullable: false });
      c.unique(['onboardingId', 'kind']);
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
    });
    await builder.createCollection('onboardingPrivateFacts', (c) => {
      c.string('id', { nullable: false });
      c.primary('id');
      c.string('onboardingId', { nullable: false });
      c.json('facts', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
    });
    await builder.createCollection('onboardingCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('fingerprint', { length: 64, nullable: false });
      c.json('result', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
    });
  },
  async down({ builder }) {
    for (const name of [
      'onboardingCommands',
      'onboardingPrivateFacts',
      'onboardingTasks',
      'onboardings',
    ])
      await builder.dropCollection(name);
  },
});
