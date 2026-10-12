import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103401_create_asset_requests',
  async down({ builder }) {
    for (const table of [
      'assetBorrowReminderReceipts',
      'assetRequestCommands',
      'assetDisposalFacts',
      'assetReturnFacts',
      'assetIssueFacts',
      'assetStockCommands',
      'assetReservationFacts',
      'assetActiveHolds',
      'assetRequests',
    ])
      await builder.dropCollection(table);
  },
  async up({ builder }) {
    await builder.createCollection('assetRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of [
        'applicantId',
        'createdById',
        'employeeId',
        'departmentId',
        'headApproverId',
        'issuedById',
      ])
        c.string(field, {
          length: 64,
          nullable: field !== 'applicantId' && field !== 'createdById',
        });
      c.string('number', { length: 64, nullable: true });
      c.string('operation', { length: 16, nullable: false });
      c.string('category', { length: 64, nullable: true });
      c.json('assetIds', { nullable: false });
      c.integer('quantity', { nullable: false });
      c.text('purpose', { nullable: false });
      c.string('borrowDueDate', { length: 10, nullable: true });
      c.text('scrapReason', { nullable: false });
      c.json('photos', { nullable: false });
      c.json('allocation', { nullable: true });
      c.bigInt('originalValueCents', { nullable: true });
      c.json('ruleSnapshot', { nullable: true });
      c.boolean('needsGm', { nullable: false, defaultValue: false });
      c.text('appraisalOpinion', { nullable: true });
      c.json('handlingUnits', { nullable: true });
      c.text('handlingReason', { nullable: true });
      c.string('approvedFingerprint', { length: 128, nullable: true });
      c.text('exceptionReason', { nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.index(['applicantId', 'status']);
    });
    await builder.createCollection('assetActiveHolds', (c) => {
      c.string('assetId', { length: 64, nullable: false });
      c.primary('assetId');
      c.string('sourceKind', { length: 64, nullable: false });
      c.string('sourceId', { length: 64, nullable: false });
      c.index(['sourceKind', 'sourceId']);
    });
    await builder.createCollection('assetReservationFacts', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('sourceId', { length: 64, nullable: false });
      c.string('assetId', { length: 64, nullable: false });
      c.string('state', { length: 16, nullable: false });
      c.json('snapshot', { nullable: false });
      c.unique(['sourceId', 'assetId']);
    });
    await builder.createCollection('assetStockCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('sourceId', { length: 64, nullable: false });
      c.string('requestKey', { length: 128, nullable: false });
      c.text('fingerprint', { nullable: false });
      c.json('result', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.unique(['sourceId', 'requestKey']);
    });
    for (const table of [
      'assetIssueFacts',
      'assetReturnFacts',
      'assetDisposalFacts',
    ])
      await builder.createCollection(table, (c) => {
        c.string('id', { length: 64, nullable: false });
        c.primary('id');
        c.string('sourceId', { length: 64, nullable: false });
        c.string('assetId', { length: 64, nullable: false });
        c.string('employeeId', { length: 64, nullable: false });
        c.string('actorId', { length: 64, nullable: false });
        c.json('snapshot', { nullable: false });
        c.datetimeTz('createdAt', { nullable: false });
        c.unique(['sourceId', 'assetId']);
      });
    await builder.createCollection('assetRequestCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('actorId', { length: 64, nullable: false });
      c.string('requestKey', { length: 128, nullable: false });
      c.string('recordId', { length: 64, nullable: false });
      c.text('fingerprint', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.unique(['actorId', 'requestKey']);
    });
    await builder.createCollection('assetBorrowReminderReceipts', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('sourceId', { length: 64, nullable: false });
      c.string('bucket', { length: 64, nullable: false });
      c.datetimeTz('sentAt', { nullable: false });
      c.unique(['sourceId', 'bucket']);
    });
  },
});
