import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610102104_reimbursement_creation_commands',
  async up({ builder }) {
    await builder.createCollection('reimbursementCreationCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('actorId', { length: 64, nullable: false });
      c.string('requestKey', { length: 128, nullable: false });
      c.text('fingerprint', { nullable: false });
      c.string('recordId', { length: 64, nullable: false });
      c.unique(['actorId', 'requestKey']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('reimbursementCreationCommands');
  },
});
