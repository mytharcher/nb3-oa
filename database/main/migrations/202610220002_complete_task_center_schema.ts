import { defineMigration } from '@nocobase/db';

// Earlier installations recorded the integration migration before its ID
// constraint and receipt timer were present. Repair those installations without
// rewriting migration history or discarding their backfill progress.
export default defineMigration({
  name: '202610220002_complete_task_center_schema',
  irreversible: true,
  async up({ builder }) {
    const backfills = await builder.getCollection('oaTaskCenterBackfills');
    if (!backfills)
      throw new Error('Task center backfill collection is missing.');
    const hasUniqueId = backfills.constraints?.some(
      (constraint) =>
        (constraint.type === 'primary' || constraint.type === 'unique') &&
        constraint.fields.length === 1 &&
        constraint.fields[0] === 'id',
    );
    if (!hasUniqueId) {
      await builder.addConstraint('oaTaskCenterBackfills', {
        type: 'unique',
        fields: ['id'],
        mode: 'index',
        name: 'uq_oa_task_center_backfills_id',
      });
    }

    if (!(await builder.hasCollection('oaTaskCenterTimers'))) {
      await builder.createCollection('oaTaskCenterTimers', (c) => {
        c.string('id', { nullable: false, length: 128 });
        c.primary('id');
        c.datetime('dueAt', { nullable: false });
        c.index('dueAt');
      });
    }
  },
});
