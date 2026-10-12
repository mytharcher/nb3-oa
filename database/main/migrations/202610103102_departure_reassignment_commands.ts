import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103102_departure_reassignment_commands',
  async up({ builder }) {
    await builder.createCollection('departureReassignmentCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('requestKey', { length: 256, nullable: false });
      c.unique('requestKey');
      c.string('fromId', { length: 64, nullable: false });
      c.string('toId', { length: 64, nullable: false });
      c.text('reason', { nullable: false });
      c.string('actorId', { length: 64, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('departureReassignmentCommands');
  },
});
