import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103903_create_recruitment_commands',
  async up({ builder }) {
    await builder.createCollection('recruitmentCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('fingerprint', { length: 64, nullable: false });
      c.json('result', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('recruitmentCommands');
  },
});
