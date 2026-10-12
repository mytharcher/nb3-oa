import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103701_create_meeting_rooms',
  async up({ builder }) {
    await builder.createCollection('meetingRooms', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('name', { length: 200, nullable: false });
      c.text('location');
      c.text('facilities');
      c.integer('capacity', { nullable: false });
      c.boolean('active', { nullable: false });
      c.boolean('requiresAdminConfirmation', { nullable: false });
      c.integer('version', { nullable: false });
    });
    await builder.createCollection('meetingBookings', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of [
        'seriesId',
        'roomId',
        'organizerEmployeeId',
        'organizerUserId',
        'confirmedBy',
        'checkedInBy',
      ])
        c.string(field, { length: 64 });
      c.string('title', { length: 200, nullable: false });
      c.string('companyTimeZone', { length: 100, nullable: false });
      c.string('status', { length: 32, nullable: false });
      c.json('attendeeUserIds', { nullable: false });
      for (const field of ['startAt', 'endAt'])
        c.datetime(field, { nullable: false });
      c.datetime('statusChangedAt', { nullable: false });
      c.datetime('confirmedAt');
      c.datetime('checkedInAt');
      c.text('reason');
      c.integer('version', { nullable: false });
      c.index(['roomId', 'startAt']);
      c.index('seriesId');
      c.index('organizerUserId');
    });
    await builder.createCollection('meetingBookingCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('actorId', { length: 64, nullable: false });
      c.string('payloadHash', { length: 64, nullable: false });
      c.json('result', { nullable: false });
    });
    await builder.createCollection('meetingBookingHistory', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('bookingId', { length: 64, nullable: false });
      c.string('actorId', { length: 64, nullable: false });
      c.string('action', { length: 32, nullable: false });
      c.boolean('administrative', { nullable: false });
      c.json('before');
      c.json('after', { nullable: false });
      c.datetime('at', { nullable: false });
      c.index('bookingId');
    });
  },
  async down({ builder }) {
    for (const name of [
      'meetingBookingHistory',
      'meetingBookingCommands',
      'meetingBookings',
      'meetingRooms',
    ])
      await builder.dropCollection(name);
  },
});
