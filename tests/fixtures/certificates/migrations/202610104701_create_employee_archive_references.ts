import { defineMigration } from '@nocobase/db';

/** Candidate until coordinated registration of the owning certificate provider. */
export default defineMigration({
  name: '202610104701_create_employee_archive_references',
  async up({ builder }) {
    await builder.createCollection('employeeArchiveReferences', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('employeeId', { length: 64, nullable: false });
      c.string('sourceKind', { length: 64, nullable: false });
      c.string('sourceId', { length: 64, nullable: false });
      c.unique(['sourceKind', 'sourceId']);
      c.string('fileId', { length: 64, nullable: false });
      c.string('contentHash', { length: 64, nullable: false });
      c.string('sensitivity', { length: 16, nullable: false });
      c.string('archivedById', { length: 64, nullable: false });
      c.datetime('archivedAt', { nullable: false });
      c.index('employeeId');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('employeeArchiveReferences');
  },
});
