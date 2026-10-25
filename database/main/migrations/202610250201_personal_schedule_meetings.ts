import { randomUUID } from 'node:crypto';
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610250201_personal_schedule_meetings',
  async up({ builder, query }) {
    await builder.alterCollection('personalSchedules', (c) => {
      c.string('sourceBookingId', { length: 64, nullable: true });
      c.unique(['sourceBookingId', 'ownerUserId'], {
        name: 'personal_schedule_meeting_owner',
      });
    });
    const bookings = await query
      .selectFrom('meetingBookings')
      .select([
        'id',
        'organizerUserId',
        'attendeeUserIds',
        'title',
        'startAt',
        'endAt',
      ])
      .where('status', '=', 'confirmed')
      .execute();
    for (const booking of bookings) {
      for (const ownerUserId of new Set([
        String(booking.organizerUserId),
        ...(booking.attendeeUserIds as string[]),
      ])) {
        await query
          .insertInto('personalSchedules')
          .values({
            id: randomUUID(),
            ownerUserId,
            title: booking.title,
            description: '',
            startAt: booking.startAt,
            endAt: booking.endAt,
            version: 1,
            sourceBookingId: booking.id,
          })
          .execute();
      }
    }
  },
  async down({ builder, query }) {
    await query
      .deleteFrom('personalSchedules')
      .where('sourceBookingId', 'is not', null)
      .execute();
    await builder.alterCollection('personalSchedules', (c) => {
      c.dropConstraint('personal_schedule_meeting_owner');
    });
    await builder.alterCollection('personalSchedules', (c) => {
      c.dropField('sourceBookingId');
    });
  },
});
