import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Creates the platform module's tables:
 *
 * - `calendarDays`: explicit days of the work calendar (holidays, make-up working days); a date with no row follows
 *   the weekday rule. `date` is a `YYYY-MM-DD` string rather than a date column, so no driver or session time zone
 *   can shift it: it is a local date of the company's calendar time zone, not an instant.
 * - `dictionaries`: enumerations flows read (leave types, expense categories, …). Entries are disabled, never deleted.
 * - `sequences`: document number counters, one row per prefix and `yyyyMM` period; `next` is the number the next
 *   document of that period receives.
 * - `approvalRules`: versioned rule values; a key's rows are its history, the latest with `effectiveFrom` ≤ an
 *   instant is the value in effect at it.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610100301_create_platform_tables',

  async up({ builder }) {
    await builder.createCollection('calendarDays', (collection) => {
      collection.increments('id');
      collection.string('date', { length: 10, nullable: false });
      collection.string('kind', { length: 32, nullable: false });
      collection.string('note', { length: 255, nullable: true });
      collection.datetime('updatedAt', { nullable: false });
      collection.unique('date', { name: 'uq_calendar_days_date' });
    });

    await builder.createCollection('dictionaries', (collection) => {
      collection.increments('id');
      collection.string('type', { length: 64, nullable: false });
      collection.string('code', { length: 64, nullable: false });
      collection.json('label', { nullable: false });
      collection.integer('sortOrder', { nullable: false, defaultValue: 0 });
      collection.boolean('active', { nullable: false, defaultValue: true });
      collection.json('extra', { nullable: true });
      collection.datetime('createdAt', { nullable: false });
      collection.datetime('updatedAt', { nullable: false });
      collection.unique(['type', 'code'], {
        name: 'uq_dictionaries_type_code',
      });
      collection.index(['type', 'active', 'sortOrder'], {
        name: 'idx_dictionaries_type_active',
      });
    });

    await builder.createCollection('sequences', (collection) => {
      collection.increments('id');
      collection.string('prefix', { length: 16, nullable: false });
      collection.string('period', { length: 6, nullable: false });
      collection.integer('next', { nullable: false, defaultValue: 1 });
      collection.unique(['prefix', 'period'], {
        name: 'uq_sequences_prefix_period',
      });
    });

    await builder.createCollection('approvalRules', (collection) => {
      collection.increments('id');
      collection.string('key', { length: 64, nullable: false });
      collection.json('value', { nullable: false });
      collection.datetime('effectiveFrom', { nullable: false });
      collection.string('updatedBy', { length: 64, nullable: true });
      collection.text('note', { nullable: true });
      collection.datetime('createdAt', { nullable: false });
      collection.unique(['key', 'effectiveFrom'], {
        name: 'uq_approval_rules_key_effective',
      });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('approvalRules');
    await builder.dropCollection('sequences');
    await builder.dropCollection('dictionaries');
    await builder.dropCollection('calendarDays');
  },
});

export default migration;
