import { defineSeed } from '@nocobase/db';
/** Required CAS pointer only. Salary bands are entered by authorized HR, never seeded. */
export default defineSeed({
  name: '202610104011_salary_grade_current',
  async run({ query }) {
    const current = await query
      .selectFrom('salaryGradeCurrent')
      .select('id')
      .where('id', '=', 'current')
      .executeTakeFirst();
    if (!current)
      await query
        .insertInto('salaryGradeCurrent')
        .values({ id: 'current', version: 0, revisionId: null })
        .execute();
  },
});
