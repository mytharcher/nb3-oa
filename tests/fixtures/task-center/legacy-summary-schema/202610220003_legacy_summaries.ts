import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610220003_legacy_summaries',
  async up({ builder, query }) {
    await builder.createCollection('oaTaskCenterSummaries', (c) => {
      c.increments('id');
      c.string('subject', { nullable: false, length: 128 });
      c.string('recordId', { nullable: false, length: 128 });
      c.string('applicantId', { nullable: true, length: 128 });
      c.string('status', { nullable: false, length: 64 });
      c.string('category', { nullable: false, length: 32 });
      c.datetimeTz('dueAt', { nullable: true });
      c.unique(['subject', 'recordId']);
      c.index(['applicantId', 'category']);
    });
    await query
      .insertInto('oaTaskCenterSummaries')
      .values({
        subject: 'oa.leave',
        recordId: 'existing',
        applicantId: 'applicant',
        status: 'draft',
        category: 'drafts',
      })
      .execute();
  },
  async down({ builder }) {
    await builder.dropCollection('oaTaskCenterSummaries');
  },
});
