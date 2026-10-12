import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103602_create_vehicle_requests',
  async up({ builder }) {
    await builder.createCollection('vehicleRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const f of ['applicantId', 'createdById'])
        c.string(f, { length: 64, nullable: false });
      c.text('purpose', { nullable: false });
      c.text('destination', { nullable: false });
      c.datetimeTz('startAt', { nullable: false });
      c.datetimeTz('endAt', { nullable: false });
      c.integer('passengers', { nullable: false });
      c.boolean('needsDriver', { nullable: false });
      c.string('number', { length: 64 });
      c.unique('number');
      c.string('approvedFingerprint', { length: 128 });
      c.datetimeTz('approvedAt');
      c.json('ruleSnapshot');
      c.string('managerApproverId', { length: 64 });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'status']);
    });
    await builder.createCollection('vehicleRequestCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('fingerprint', { length: 64, nullable: false });
    });
    await builder.createCollection('vehicleUsageReminders', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('sourceId', { length: 64, nullable: false });
      c.string('bucket', { length: 32, nullable: false });
      c.string('status', { length: 32, nullable: false });
      c.unique(['sourceId', 'bucket']);
    });
  },
  async down({ builder }) {
    for (const n of [
      'vehicleUsageReminders',
      'vehicleRequestCommands',
      'vehicleRequests',
    ])
      await builder.dropCollection(n);
  },
});
