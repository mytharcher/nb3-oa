import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Creates the Excel import's tables (OA plan 01 §9):
 *
 * - `importFiles`, the file collection of `@nocobase/app-plugin-file` holding every uploaded workbook as it was
 *   received. Its columns are the plugin's fixed file columns.
 * - `importRuns`, one row per committed import attempt, succeeded or failed: who, when, which kind, the counts, the
 *   retained file and the first row errors of a failed attempt. Previews (dry runs) leave no row.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610100501_create_import_tables',

  async up({ builder }) {
    await builder.createCollection('importFiles', (collection) => {
      collection.uuid('id', { nullable: false });
      collection.primary('id');
      collection.string('disk', { length: 255, nullable: false });
      collection.text('key', { nullable: false });
      collection.text('filename', { nullable: false });
      collection.string('ext', { length: 32, nullable: false });
      collection.string('mimeType', { length: 255, nullable: false });
      collection.bigInt('size', { nullable: false });
      collection.datetime('createdAt', { nullable: false });
      collection.datetime('updatedAt', { nullable: false });
    });

    await builder.createCollection('importRuns', (collection) => {
      collection.string('id', { length: 64, nullable: false });
      collection.primary('id');
      // departments | positions | grades | employees | dutyRoleMembers
      collection.string('kind', { length: 32, nullable: false });
      // succeeded | failed
      collection.string('status', { length: 16, nullable: false });
      collection.uuid('fileId', { nullable: true });
      collection.text('filename', { nullable: false });
      collection.string('actorId', { length: 64, nullable: true });
      collection.integer('rowCount', { nullable: false, defaultValue: 0 });
      collection.integer('createdCount', { nullable: false, defaultValue: 0 });
      collection.integer('updatedCount', { nullable: false, defaultValue: 0 });
      collection.integer('unchangedCount', {
        nullable: false,
        defaultValue: 0,
      });
      collection.integer('errorCount', { nullable: false, defaultValue: 0 });
      collection.json('errors', { nullable: true });
      collection.datetime('createdAt', { nullable: false });
      collection.datetime('finishedAt', { nullable: false });
      collection.index('createdAt', { name: 'idx_import_runs_created_at' });
      collection.index('kind', { name: 'idx_import_runs_kind' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('importRuns');
    await builder.dropCollection('importFiles');
  },
});

export default migration;
