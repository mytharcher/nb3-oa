import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610102401_create_travel_requests',
  async up({ builder }) {
    await builder.createCollection('travelRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['applicantId', 'createdById'])
        c.string(field, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.string('destination', { length: 255, nullable: false });
      for (const k of ['international', 'needsLoan', 'needsBooking'])
        c.boolean(k, { nullable: false });
      for (const k of ['startAt', 'endAt'])
        c.datetimeTz(k, { nullable: false });
      for (const k of [
        'transportCents',
        'lodgingCents',
        'allowanceCents',
        'amountCents',
      ])
        c.bigInt(k, { nullable: false });
      c.text('reason', { nullable: false });
      c.string('departmentId', { length: 64, nullable: true });
      c.json('companionIds', { nullable: false });
      c.json('attachments', { nullable: false });
      c.json('standardSnapshot', { nullable: true });
      c.string('managerApproverId', { length: 64, nullable: true });
      c.json('headMerged', { nullable: true });
      c.string('authorizationSourceId', { length: 64, nullable: true });
      c.integer('approvalGeneration', { nullable: false, defaultValue: 0 });
      c.datetimeTz('approvalGrantedAt', { nullable: true });
      c.datetimeTz('cancelledAt', { nullable: true });
      c.string('originalHeadApproverId', { length: 64, nullable: true });
      c.string('cancellationId', { length: 64, nullable: true });
      c.text('bookingInformation', { nullable: true });
      c.text('exceptionReason', { nullable: true });
      c.json('ruleSnapshot', { nullable: true });
      for (const field of [
        'headApproverId',
        'executiveApproverId',
        'gmApproverId',
        'authorizationId',
      ])
        c.string(field, { length: 64, nullable: true });
      c.unique('authorizationId');
      c.json('gmMerged', { nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'status']);
      c.index(['departmentId', 'status']);
    });
    await builder.createCollection('travelCancellations', (c) => {
      c.boolean('needsUnbooking', { nullable: false, defaultValue: false });
      c.text('unbookingInformation', { nullable: true });
      c.text('exceptionReason', { nullable: true });
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const k of ['sourceId', 'applicantId', 'createdById'])
        c.string(k, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.text('reason', { nullable: false });
      c.string('baseline', { length: 64, nullable: true });
      c.json('ruleSnapshot', { nullable: true });
      c.string('managerApproverId', { length: 64, nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['sourceId', 'status']);
    });
    await builder.createCollection('travelAttachmentFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
      c.string('travelId', { length: 64 }).notNull();
      c.string('ownerId', { length: 64 }).notNull();
      c.integer('uploadVersion').notNull();
      c.index('travelId');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('travelAttachmentFiles');
    await builder.dropCollection('travelCancellations');
    await builder.dropCollection('travelRequests');
  },
});
