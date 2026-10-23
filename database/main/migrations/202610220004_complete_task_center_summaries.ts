import { defineMigration } from '@nocobase/db';

// Early installations applied the summary migration before these fields existed.
// Keep their rows and migration history; fresh installations already have both.
export default defineMigration({
  name: '202610220004_complete_task_center_summaries',
  irreversible: true,
  async up({ builder }) {
    const summary = await builder.getCollection('oaTaskCenterSummaries');
    if (!summary) throw new Error('Task center summary collection is missing.');
    for (const field of [
      { name: 'number', type: 'string', nullable: true, length: 240 },
      { name: 'createdAt', type: 'datetimeTz', nullable: true },
    ] as const) {
      if (!summary.fields?.some((existing) => existing.name === field.name))
        await builder.addField('oaTaskCenterSummaries', field);
    }
  },
});
