import { defineSeed, type QueryAdapter } from '@nocobase/db';

function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/** Repair only the exact former default; retain removed actions and administrator-customized scopes. */
export async function installContractPrintScope(query: QueryAdapter) {
  const row = await query
    .selectFrom('authorizationPermissionSets')
    .select(['id', 'grants'])
    .where('key', '=', 'oa-document-print')
    .executeTakeFirst();
  if (!row) return;
  const grants: unknown =
    typeof row.grants === 'string' ? JSON.parse(row.grants) : row.grants;
  if (!Array.isArray(grants)) return;
  let changed = false;
  for (const rawGrant of grants) {
    const grant = object(rawGrant),
      resource = object(grant?.resource);
    if (!grant) continue;
    if (
      resource?.type !== 'composite' ||
      resource.id !== 'oa.templatePrint' ||
      !Array.isArray(grant.actions)
    )
      continue;
    for (const rawAction of grant.actions) {
      const action = object(rawAction),
        policy = object(action?.policy),
        scopes = object(policy?.scopes);
      if (
        action?.action !== 'printContracts' ||
        !policy ||
        policy.type !== 'composite' ||
        Object.keys(policy).length !== 2 ||
        !scopes ||
        Object.keys(scopes).length !== 1 ||
        scopes.printTemplates !== 'allRecords'
      )
        continue;
      scopes.contractRequests = 'allRecords';
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
  name: '202610103815_contract_print_scope',
  run: ({ query }) => installContractPrintScope(query),
});
