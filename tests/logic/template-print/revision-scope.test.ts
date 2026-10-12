// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { createPlatformAppTest } from '../platform/helpers.js';
import { installPrintRevisionMetadataScope } from '../../../database/main/seeds/202610103816_print_revision_metadata_scope.js';
const test = createPlatformAppTest();
test('repairs only exact shipped print scopes and preserves revoked/customized actions', async ({
  testApp,
}) => {
  const db = testApp.application.container.resolve(databaseManagerToken);
  const read = async () => {
    const row = await db
      .query()
      .selectFrom('authorizationPermissionSets')
      .select('grants')
      .where('key', '=', 'oa-document-print')
      .executeTakeFirstOrThrow();
    return typeof row.grants === 'string' ? JSON.parse(row.grants) : row.grants;
  };
  const initial = await read();
  const grant = initial.find(
    (g: { resource: { id: string } }) => g.resource.id === 'oa.templatePrint',
  );
  expect(
    grant.actions.find((a: { action: string }) => a.action === 'use').policy
      .scopes.printTemplateRevisions,
  ).toBe('allRecords');
  const use = grant.actions.find((a: { action: string }) => a.action === 'use');
  const leave = grant.actions.find(
    (a: { action: string }) => a.action === 'printLeave',
  );
  delete use.policy.scopes.printTemplateRevisions;
  delete leave.policy.scopes.printTemplateRevisions;
  leave.policy.scopes.leaveRequests = '';
  grant.actions = grant.actions.filter(
    (a: { action: string }) => a.action !== 'printPayment',
  );
  await db
    .query()
    .updateTable('authorizationPermissionSets')
    .set({ grants: JSON.stringify(initial) })
    .where('key', '=', 'oa-document-print')
    .execute();
  await db.transaction((tx) => installPrintRevisionMetadataScope(tx.query));
  const repaired = await read();
  const result = repaired.find(
    (g: { resource: { id: string } }) => g.resource.id === 'oa.templatePrint',
  );
  expect(
    result.actions.find((a: { action: string }) => a.action === 'use').policy
      .scopes.printTemplateRevisions,
  ).toBe('allRecords');
  expect(
    result.actions.find((a: { action: string }) => a.action === 'printLeave')
      .policy.scopes,
  ).toEqual({ printTemplates: 'allRecords', leaveRequests: '' });
  expect(
    result.actions.some((a: { action: string }) => a.action === 'printPayment'),
  ).toBe(false);
  await db.transaction((tx) => installPrintRevisionMetadataScope(tx.query));
  expect(await read()).toEqual(repaired);
});
