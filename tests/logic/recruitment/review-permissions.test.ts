// @vitest-environment node
import { databaseManagerToken } from '@nocobase/db';
import { expect } from 'vitest';
import { test } from './helpers.js';
import { installRecruitmentReviewPermissions } from '../../../database/main/seeds/202610103912_recruitment_review_permissions.js';
test('main reviewer defaults are idempotent and retain revoked/custom administrator configuration', async ({
  app,
}) => {
  const db = app.container.resolve(databaseManagerToken);
  const rows = () =>
    db
      .query()
      .selectFrom('authorizationPermissionSets')
      .selectAll()
      .where('key', 'like', 'oa-recruitment-review-%')
      .execute();
  const fresh = await rows();
  expect(fresh).toHaveLength(4);
  expect(
    fresh.every(
      (row) =>
        JSON.parse(String(row.grants))[0].actions[0].action === 'reviewEdit',
    ),
  ).toBe(true);
  await db.transaction((tx) => installRecruitmentReviewPermissions(tx.query));
  expect(await rows()).toEqual(fresh);
  const key = 'oa-recruitment-review-hrdirector';
  await db
    .query()
    .updateTable('authorizationPermissionSets')
    .set({ title: 'Administrator customization', grants: '[]' })
    .where('key', '=', key)
    .execute();
  await db
    .query()
    .deleteFrom('authorizationPermissionSetAssignments')
    .where('permissionSetKey', '=', key)
    .execute();
  await db.transaction((tx) => installRecruitmentReviewPermissions(tx.query));
  expect(
    await db
      .query()
      .selectFrom('authorizationPermissionSets')
      .select(['title', 'grants'])
      .where('key', '=', key)
      .executeTakeFirst(),
  ).toEqual({ title: 'Administrator customization', grants: '[]' });
  expect(
    await db
      .query()
      .selectFrom('authorizationPermissionSetAssignments')
      .select('id')
      .where('permissionSetKey', '=', key)
      .execute(),
  ).toHaveLength(0);
  for (const role of ['hrbp', 'gm']) {
    await db
      .query()
      .deleteFrom('authorizationPermissionSetAssignments')
      .where('permissionSetKey', '=', `oa-recruitment-review-${role}`)
      .execute();
    await db
      .query()
      .deleteFrom('authorizationPermissionSets')
      .where('key', '=', `oa-recruitment-review-${role}`)
      .execute();
  }
  await db
    .query()
    .updateTable('authorizationPermissionSets')
    .set({ grants: '[]' })
    .where('key', '=', 'oa-recruitment-hrbp')
    .execute();
  await db
    .query()
    .deleteFrom('authorizationPermissionSetAssignments')
    .where('permissionSetKey', '=', 'oa-recruitment-gm')
    .execute();
  await db.transaction((tx) => installRecruitmentReviewPermissions(tx.query));
  expect((await rows()).map((row) => row.key).sort()).toEqual([
    'oa-recruitment-review-employee',
    'oa-recruitment-review-hrdirector',
  ]);
});
test('main public request search uses the text-field group without leaking unscoped rows', async ({
  testApp,
}) => {
  const { createEmployee } = await import('../employees/helpers.js');
  const person = await createEmployee(testApp, 'Recruitment Search Reader');
  const session = await person.session();
  const response = await session.fetch(
    '/recruitmentRequests?q=synthetic%20engineer',
  );
  expect(response.status).toBe(200);
  expect((await response.json()).data).toEqual([]);
});
