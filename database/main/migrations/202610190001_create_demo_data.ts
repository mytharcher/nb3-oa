import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610190001_create_demo_data',
  async up({ builder, query }) {
    await builder.createCollection('demoSalaryGradeCurrent', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.integer('version', { nullable: false });
      c.string('revisionId', { length: 64, nullable: true });
    });
    await builder.createCollection('demoSalaryGradeRevisions', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.integer('version', { nullable: false });
      c.unique('version');
      c.json('bands', { nullable: false });
      c.string('createdById', { length: 64, nullable: false });
      c.text('reason', { nullable: false });
      c.datetime('createdAt', { nullable: false });
      c.string('publicationKey', { length: 128, nullable: true });
      c.string('publicationHash', { length: 64, nullable: true });
    });
    await builder.createCollection('demoDataSets', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('locale', { length: 16, nullable: false });
      c.string('baseDate', { length: 10, nullable: false });
      c.string('timeZone', { length: 64, nullable: false });
      c.string('state', { length: 32, nullable: false });
      c.integer('version', { nullable: false });
      c.string('actorId', { length: 64, nullable: false });
      c.json('accounts', { nullable: false });
      c.integer('totalSteps', { nullable: false });
      c.json('scenarios', { nullable: false });
      c.json('failures', { nullable: false });
      c.text('credentials', { nullable: true });
      c.string('progress', { length: 255, nullable: false });
      c.datetime('createdAt', { nullable: false });
      c.datetime('updatedAt', { nullable: false });
    });
    await builder.createCollection('demoDataControl', (c) => {
      c.string('id', { length: 16, nullable: false });
      c.primary('id');
      c.string('datasetId', { length: 64, nullable: true });
      c.integer('version', { nullable: false });
      c.string('operationId', { length: 128, nullable: true });
      c.string('operation', { length: 16, nullable: true });
      c.string('leaseToken', { length: 64, nullable: true });
      c.datetime('leaseUntil', { nullable: true });
    });
    await builder.createCollection('demoDataRecords', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('datasetId', { length: 64, nullable: false });
      c.index('datasetId');
      c.string('collection', { length: 128, nullable: false });
      c.json('key', { nullable: false });
      c.text('keyHash', { nullable: false });
      c.unique(['datasetId', 'collection', 'keyHash']);
      c.json('before', { nullable: true });
      c.json('after', { nullable: true });
      c.boolean('shared', { nullable: false });
    });
    await builder.createCollection('demoDataOperations', (c) => {
      c.string('id', { length: 128, nullable: false });
      c.primary('id');
      c.string('datasetId', { length: 64, nullable: false });
      c.string('kind', { length: 16, nullable: false });
      c.string('state', { length: 16, nullable: false });
      c.datetime('createdAt', { nullable: false });
    });
    await builder.createCollection('demoDataFileRemovals', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('datasetId', { length: 64, nullable: false });
      c.index('datasetId');
      c.string('disk', { length: 128, nullable: false });
      c.text('key', { nullable: false });
      c.boolean('complete', { nullable: false });
    });
    await builder.createCollection('demoDataRetiredReferences', (c) => {
      c.string('id', { length: 128, nullable: false });
      c.primary('id');
      c.string('datasetId', { length: 64, nullable: false });
    });
    await builder.createCollection('demoDataPreviews', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('datasetId', { length: 64, nullable: false });
      c.integer('version', { nullable: false });
      c.datetime('expiresAt', { nullable: false });
    });
    await query
      .insertInto('demoDataControl')
      .values({
        id: 'main',
        datasetId: null,
        version: 0,
        operationId: null,
        operation: null,
        leaseUntil: null,
      })
      .execute();
  },
  async down({ builder }) {
    for (const name of [
      'demoDataPreviews',
      'demoDataRetiredReferences',
      'demoDataFileRemovals',
      'demoDataOperations',
      'demoDataRecords',
      'demoDataControl',
      'demoDataSets',
      'demoSalaryGradeRevisions',
      'demoSalaryGradeCurrent',
    ])
      await builder.dropCollection(name);
  },
});
