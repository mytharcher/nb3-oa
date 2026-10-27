import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610270901_allow_incomplete_leave_drafts',
  // Existing incomplete drafts cannot be made NOT NULL without inventing dates.
  irreversible: true,
  async up({ builder }) {
    await builder.alterCollection('leaveRequests', {
      alterFields: ['startDate', 'endDate'].map((name) => ({
        name,
        changes: { type: 'date', nullable: true },
      })),
    });
  },
});
export default migration;
