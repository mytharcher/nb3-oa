import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610230000_legacy_instants',
  irreversible: true,
  async up({ builder }) {
    await builder.createCollection('vendorQualifications', (c) => {
      c.string('id').primary().notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt');
      c.datetime('statusChangedAt').notNull();
      c.date('expiryDate');
      c.time('openingTime');
      c.index('createdAt');
    });
    await builder.createCollection('meetingBookings', (c) => {
      c.string('id').primary().notNull();
      c.datetime('startAt').notNull();
      c.datetime('endAt').notNull();
      c.datetimeTz('confirmedAt');
      c.index(['startAt', 'endAt']);
    });
    await builder.createCollection('oaTaskCenterTimers', (c) => {
      c.string('id').primary().notNull();
      c.datetime('dueAt').notNull();
      c.index('dueAt');
    });
    // A plugin-owned datetime must not be changed by the application migration.
    await builder.createCollection('session', (c) => {
      c.string('id').primary().notNull();
      c.datetime('expiresAt').notNull();
    });
    await builder.createCollection('oaTaskCenterSummaries', (c) => {
      c.increments('id');
      c.string('subject').notNull();
      c.string('recordId').notNull();
      c.string('applicantId');
      c.string('status').notNull();
      c.string('category').notNull();
      c.string('number');
      c.datetimeTz('createdAt');
      c.datetimeTz('dueAt');
      c.unique(['subject', 'recordId']);
    });
  },
});
