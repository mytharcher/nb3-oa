import { defineMigration } from '@nocobase/db';
/** Preserve historical records; creation requests are distinct from actual task outputs. */
export default defineMigration({
  name: '202610104605_onboarding_creation_requests',
  async up({ builder }) {
    await builder.addField('onboardings', {
      name: 'mentorName',
      type: 'string',
      nullable: true,
    });
    await builder.addField('onboardings', {
      name: 'mentorEmployeeId',
      type: 'string',
      nullable: true,
    });
    await builder.addField('onboardings', {
      name: 'workstationRequirement',
      type: 'text',
      nullable: true,
    });
  },
  async down({ builder }) {
    await builder.dropField('onboardings', 'workstationRequirement');
    await builder.dropField('onboardings', 'mentorEmployeeId');
    await builder.dropField('onboardings', 'mentorName');
  },
});
