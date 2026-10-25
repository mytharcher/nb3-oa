import { defineMigration } from '@nocobase/db';
/** Add explicit scope fields without rewriting historical evidence or results. */
export default defineMigration({
  name: '202610250301_attendance_result_scopes',
  irreversible: true,
  async up({ builder, query }) {
    await builder.alterCollection('attendanceEvaluations', (c) => {
      c.string('departmentId', { length: 64, nullable: true });
    });
    await builder.alterCollection('attendanceEvaluationRevisions', (c) => {
      c.string('userId', { length: 64, nullable: true });
      c.string('departmentId', { length: 64, nullable: true });
      c.date('date', { nullable: true });
    });
    const revisions = await query
      .selectFrom('attendanceEvaluationRevisions')
      .select(['id', 'evaluationId', 'snapshot'])
      .execute();
    for (const revision of revisions) {
      const snapshot =
        typeof revision.snapshot === 'string'
          ? JSON.parse(revision.snapshot)
          : revision.snapshot;
      if (!snapshot || typeof snapshot !== 'object') continue;
      const value = snapshot as Record<string, unknown>;
      await query
        .updateTable('attendanceEvaluationRevisions')
        .set({
          userId: typeof value.userId === 'string' ? value.userId : null,
          departmentId:
            typeof value.departmentId === 'string' ? value.departmentId : null,
          date: typeof value.date === 'string' ? value.date : null,
        })
        .where('id', '=', revision.id)
        .execute();
      await query
        .updateTable('attendanceEvaluations')
        .set({
          departmentId:
            typeof value.departmentId === 'string' ? value.departmentId : null,
        })
        .where('currentRevisionId', '=', revision.id)
        .execute();
    }
  },
});
