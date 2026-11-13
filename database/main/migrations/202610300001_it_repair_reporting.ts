import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610300001_it_repair_reporting',
  async up({ builder }) {
    await builder.alterCollection('itRepairGroups', (c) =>
      c.boolean('security').notNull().defaultTo(false),
    );
    await builder.alterCollection('itRepairs', (c) => {
      c.integer('metricRevision');
      c.datetimeTz('firstRespondedAt');
      c.datetimeTz('metricEndedAt');
      c.string('closureMode', { length: 20 });
      for (const field of [
        'responseHours',
        'solutionHours',
        'waitingHours',
        'pausedHours',
        'acceptanceHours',
        'totalHours',
        'naturalHours',
      ])
        c.decimal(field, { precision: 16, scale: 6 });
      for (const field of [
        'responseOnTime',
        'solutionOnTime',
        'solutionExceeded',
        'everResponseOverdue',
        'everSolutionOverdue',
      ])
        c.boolean(field);
      c.integer('returnCount');
      c.integer('rating');
      c.index(['firstRespondedAt', 'id']);
      c.index(['metricEndedAt', 'id']);
      c.index(['submittedAt', 'id']);
    });
  },
  async down({ builder }) {
    await builder.alterCollection('itRepairGroups', (c) =>
      c.dropField('security'),
    );
    await builder.alterCollection('itRepairs', (c) => {
      for (const f of [
        'metricRevision',
        'firstRespondedAt',
        'metricEndedAt',
        'closureMode',
        'responseHours',
        'solutionHours',
        'waitingHours',
        'pausedHours',
        'acceptanceHours',
        'totalHours',
        'naturalHours',
        'responseOnTime',
        'solutionOnTime',
        'solutionExceeded',
        'everResponseOverdue',
        'everSolutionOverdue',
        'returnCount',
        'rating',
      ])
        c.dropField(f);
    });
  },
});
