// @vitest-environment node
import path from 'node:path';
import { expect } from 'vitest';
import { describeMigration } from '@nocobase/app-testing/server';

const sources = [
  {
    packageName: 'travel-schema-upgrade',
    directory: path.resolve(
      import.meta.dirname,
      '../../../database/main/migrations',
    ),
  },
];
for (const legacy of [false, true]) {
  describeMigration('202610102402_complete_travel_cancellation_schema', {
    sources,
    reversible: false,
    before: async ({ connection }) => {
      if (legacy) {
        await connection.builder.dropCollection('travelCancellations');
        await connection.builder.dropField(
          'travelRequests',
          'authorizationSourceId',
        );
        await connection.builder.dropField(
          'travelRequests',
          'approvalGeneration',
        );
      }
      await connection.query
        .insertInto('travelRequests')
        .values({
          id: 'preserved-travel',
          applicantId: 'owner',
          createdById: 'owner',
          destination: 'Shanghai',
          international: false,
          needsLoan: false,
          needsBooking: false,
          startAt: new Date('2026-10-12T01:00:00Z'),
          endAt: new Date('2026-10-12T09:00:00Z'),
          transportCents: 0,
          lodgingCents: 0,
          allowanceCents: 0,
          amountCents: 0,
          reason: 'Existing request',
          companionIds: '[]',
          attachments: '[]',
          status: 'draft',
          statusChangedAt: new Date(),
          createdAt: new Date(),
        })
        .execute();
    },
    up: async ({ connection, expectCollection }) => {
      await expectCollection('travelCancellations').toHaveField('sourceId', {
        nullable: false,
      });
      await expectCollection('travelCancellations').toHaveIndex(['number'], {
        unique: true,
      });
      await expectCollection('travelRequests').toHaveField(
        'authorizationSourceId',
        { nullable: true },
      );
      await expectCollection('travelRequests').toHaveField(
        'approvalGeneration',
        { nullable: false },
      );
      const row = await connection
        .repository('travelRequests')
        .findOne({ filter: { id: 'preserved-travel' } });
      expect(row).toMatchObject({
        id: 'preserved-travel',
        destination: 'Shanghai',
        approvalGeneration: 0,
      });
    },
  });
}
