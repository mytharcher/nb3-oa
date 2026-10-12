import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103314_create_contract_seal_links',
  async up({ builder }) {
    await builder.createCollection('contractSealLinks', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('contractId', { length: 64, nullable: false });
      c.integer('contractVersion', { nullable: false });
      c.string('textVersionId', { length: 64, nullable: false });
      c.string('sealRecordId', { length: 64, nullable: false });
      c.unique('sealRecordId');
      c.datetime('sealedAt', { nullable: false });
      c.string('confirmedById', { length: 64, nullable: false });
      c.datetime('confirmedAt', { nullable: false });
      c.index(['contractId', 'contractVersion']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('contractSealLinks');
  },
});
