// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createPlatformAppTest } from '../platform/helpers.js';
import { installSalaryGradePageAccess } from '../../../database/main/seeds/202610104013_salary_grade_page_access.js';
const test = createPlatformAppTest();
test('page-only seed repeats without restoring administrator edits or rewriting assignments', async ({
  testApp,
}) => {
  const c = testApp.application.container;
  const db = c.resolve(databaseManagerToken);
  const sets = c.resolve(authorizationToken).permissionSets;
  const key = 'oa-salary-grade-pages';
  const initial = (await sets.get(key))!;
  expect(initial.grants).toEqual([
    {
      resource: { type: 'page', id: 'oa-salary-grades' },
      actions: [{ action: 'access' }],
    },
  ]);
  const assignments = await sets.listAssignments(key);
  expect(assignments).toHaveLength(1);
  expect(assignments[0]).toMatchObject({
    subject: { type: 'org.dutyRole', id: 'hr' },
  });
  await db.transaction((tx) => installSalaryGradePageAccess(tx.query));
  expect(await sets.get(key)).toEqual(initial);
  try {
    await sets.update(key, { ...initial, grants: [] });
    await db.transaction((tx) => installSalaryGradePageAccess(tx.query));
    await db.transaction((tx) => installSalaryGradePageAccess(tx.query));
    expect((await sets.get(key))!.grants).toEqual([]);
    expect(await sets.listAssignments(key)).toEqual(assignments);
  } finally {
    await sets.update(key, initial);
  }
});
