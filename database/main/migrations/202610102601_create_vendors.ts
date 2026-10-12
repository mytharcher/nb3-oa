import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610102601_create_vendors',
  async up({ builder }) {
    await builder.createCollection('vendors', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('code', { length: 64, nullable: false });
      c.unique('code');
      c.string('name', { length: 255, nullable: false });
      for (const f of [
        'category',
        'contactName',
        'bankName',
        'bankAccountName',
      ])
        c.string(f, { length: 255, nullable: false, defaultValue: '' });
      c.string('contactPhone', {
        length: 64,
        nullable: false,
        defaultValue: '',
      });
      c.string('contactEmail', {
        length: 255,
        nullable: false,
        defaultValue: '',
      });
      c.string('bankAccount', {
        length: 128,
        nullable: false,
        defaultValue: '',
      });
      c.string('status', {
        length: 32,
        nullable: false,
        defaultValue: 'manual',
      });
      c.boolean('active', { nullable: false, defaultValue: true });
      c.integer('version', { nullable: false, defaultValue: 1 });
      c.string('createdById', { length: 64, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.index(['active', 'name']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('vendors');
  },
});
