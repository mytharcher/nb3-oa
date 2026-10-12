import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103101_create_assets',
  async up({ builder }) {
    await builder.createCollection('assets', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('code', { length: 64, nullable: false });
      c.unique('code');
      c.string('category', { length: 64, nullable: false });
      c.string('name', { length: 200, nullable: false });
      c.string('serialNumber', { length: 200, nullable: true });
      c.bigInt('originalValueCents', { nullable: false });
      c.string('status', { length: 32, nullable: false });
      c.string('holderEmployeeId', { length: 64, nullable: true });
      c.string('borrowDueDate', { length: 10, nullable: true });
      c.integer('version', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.index(['holderEmployeeId', 'status']);
    });
    await builder.createCollection('assetReservations', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('assetId', { length: 64, nullable: false });
      c.string('employeeId', { length: 64, nullable: false });
      c.string('sourceId', { length: 64, nullable: false });
      c.string('state', { length: 16, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.unique(['assetId', 'sourceId']);
      c.index(['employeeId', 'state']);
      c.index(['assetId', 'state']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('assetReservations');
    await builder.dropCollection('assets');
  },
});
