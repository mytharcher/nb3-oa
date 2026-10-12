import { defineSeed, type QueryAdapter } from '@nocobase/db';
function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
/** Only extend exact shipped scopes; customized/removed grants remain untouched. Metadata never grants bytes. */
export async function installPrintRevisionMetadataScope(query: QueryAdapter) {
  const row = await query
    .selectFrom('authorizationPermissionSets')
    .select(['id', 'grants'])
    .where('key', '=', 'oa-document-print')
    .executeTakeFirst();
  if (!row) return;
  const grants: unknown =
    typeof row.grants === 'string' ? JSON.parse(row.grants) : row.grants;
  if (!Array.isArray(grants)) return;
  const expected: Record<string, string[]> = {
    use: ['printTemplates'],
    printLeave: ['printTemplates', 'leaveRequests'],
    printReimbursement: ['printTemplates', 'reimbursementRequests'],
    printPayment: ['printTemplates', 'paymentRequests'],
    printContracts: ['printTemplates', 'contractRequests'],
    printSealRegistration: ['printTemplates'],
  };
  let changed = false;
  for (const rawGrant of grants) {
    const grant = object(rawGrant),
      resource = object(grant?.resource);
    if (
      !grant ||
      resource?.type !== 'composite' ||
      resource.id !== 'oa.templatePrint' ||
      !Array.isArray(grant.actions)
    )
      continue;
    for (const rawAction of grant.actions) {
      const action = object(rawAction),
        policy = object(action?.policy),
        scopes = object(policy?.scopes);
      const keys =
        typeof action?.action === 'string'
          ? expected[action.action]
          : undefined;
      if (
        !keys ||
        !policy ||
        policy.type !== 'composite' ||
        Object.keys(policy).length !== 2 ||
        !scopes ||
        Object.keys(scopes).length !== keys.length ||
        !keys.every((key) => scopes[key] === 'allRecords')
      )
        continue;
      scopes.printTemplateRevisions = 'allRecords';
      changed = true;
    }
  }
  if (changed)
    await query
      .updateTable('authorizationPermissionSets')
      .set({ grants: JSON.stringify(grants), updatedAt: new Date() })
      .where('id', '=', row.id)
      .execute();
}
export default defineSeed({
  name: '202610103816_print_revision_metadata_scope',
  run: ({ query }) => installPrintRevisionMetadataScope(query),
});
