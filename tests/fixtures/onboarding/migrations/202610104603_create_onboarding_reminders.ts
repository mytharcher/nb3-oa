import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610104603_create_onboarding_reminders',
  async up({ builder }) {
    await builder.createCollection('onboardingReminders', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('taskId', { nullable: false });
      c.string('onboardingId', { nullable: false });
      c.json('recipientIds', { nullable: false });
      c.string('status', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('sentAt');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('onboardingReminders');
  },
});
