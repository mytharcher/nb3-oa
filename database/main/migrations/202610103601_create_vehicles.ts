import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103601_create_vehicles',
  async up({ builder }) {
    await builder.createCollection('vehicles', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('plateNumber', { length: 64, nullable: false });
      c.unique('plateNumber');
      c.string('name', { length: 200, nullable: false });
      c.string('vehicleType', { length: 64, nullable: false });
      c.integer('capacity', { nullable: false });
      c.string('status', { length: 32, nullable: false });
      c.integer('version', { nullable: false });
    });
    await builder.createCollection('vehicleDrivers', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('employeeId', { length: 64, nullable: false });
      c.unique('employeeId');
      c.boolean('active', { nullable: false });
      c.integer('version', { nullable: false });
    });
    await builder.createCollection('vehicleUses', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('sourceId', { length: 64, nullable: false });
      c.unique('sourceId');
      c.string('applicantId', { length: 64, nullable: false });
      c.string('vehicleId', { length: 64, nullable: false });
      c.string('driverId', { length: 64 });
      c.datetime('startAt', { nullable: false });
      c.datetime('endAt', { nullable: false });
      c.integer('passengers', { nullable: false });
      c.boolean('needsDriver', { nullable: false });
      c.string('dispatchedById', { length: 64, nullable: false });
      c.datetime('createdAt', { nullable: false });
      c.index(['vehicleId', 'startAt', 'endAt']);
      c.index(['driverId', 'startAt', 'endAt']);
    });
    await builder.createCollection('vehicleUsageReceipts', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('sourceId', { length: 64, nullable: false });
      c.unique('sourceId');
      c.integer('mileage', { nullable: false });
      c.text('exception', { nullable: false });
      c.string('registeredById', { length: 64, nullable: false });
      c.datetime('createdAt', { nullable: false });
    });
    // Amounts are private facades, never approval output/history or general use read models.
    await builder.createCollection('vehicleUsageCosts', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.bigInt('fuelCents', { nullable: false });
    });
    await builder.createCollection('vehicleCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('fingerprint', { length: 64, nullable: false });
      c.json('receipt', { nullable: false });
      c.datetime('createdAt', { nullable: false });
    });
  },
  async down({ builder }) {
    for (const name of [
      'vehicleCommands',
      'vehicleUsageCosts',
      'vehicleUsageReceipts',
      'vehicleUses',
      'vehicleDrivers',
      'vehicles',
    ])
      await builder.dropCollection(name);
  },
});
