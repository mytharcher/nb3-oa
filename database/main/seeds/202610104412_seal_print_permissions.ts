import { defineSeed, type QueryAdapter } from '@nocobase/db';
function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
function exactScopes(policy: unknown, expected: Record<string, string>) {
  const p = object(policy),
    scopes = object(p?.scopes);
  return (
    p?.type === 'composite' &&
    Object.keys(p).length === 2 &&
    !!scopes &&
    Object.keys(scopes).length === Object.keys(expected).length &&
    Object.entries(expected).every(([key, value]) => scopes[key] === value)
  );
}
/** Upgrade exact shipped grants only; never restore removed actions or replace administrator choices. */
export async function installSealPrintPermissions(query: QueryAdapter) {
  for (const key of [
    'oa-document-print',
    'oa-seals-employee',
    'oa-seals-admin',
    'oa-seals-keeper',
  ]) {
    const row = await query
      .selectFrom('authorizationPermissionSets')
      .select(['id', 'grants'])
      .where('key', '=', key)
      .executeTakeFirst();
    if (!row) continue;
    const grants: unknown =
      typeof row.grants === 'string' ? JSON.parse(row.grants) : row.grants;
    if (!Array.isArray(grants)) continue;
    let changed = false;
    for (const raw of grants) {
      const grant = object(raw),
        resource = object(grant?.resource);
      if (
        !grant ||
        resource?.type !== 'composite' ||
        !Array.isArray(grant.actions)
      )
        continue;
      for (const input of grant.actions) {
        const action = object(input);
        if (!action) continue;
        if (
          key === 'oa-document-print' &&
          resource.id === 'oa.templatePrint' &&
          action.action === 'printSealRegistration' &&
          (exactScopes(action.policy, { printTemplates: 'allRecords' }) ||
            exactScopes(action.policy, {
              printTemplates: 'allRecords',
              printTemplateRevisions: 'allRecords',
            }))
        ) {
          action.policy = {
            type: 'composite',
            scopes: {
              printTemplates: 'allRecords',
              printTemplateRevisions: 'allRecords',
              sealLedger: 'allRecords',
              sealReceipts: 'allRecords',
              sealRequests: 'allRecords',
            },
          };
          changed = true;
        }
        const scope =
          key === 'oa-seals-employee' ? 'oa.sealLedgerOwned' : 'allRecords';
        if (
          key !== 'oa-document-print' &&
          resource.id === 'oa.sealLedger' &&
          action.action === 'view' &&
          exactScopes(action.policy, { sealLedger: scope })
        ) {
          action.policy = {
            type: 'composite',
            scopes: {
              sealLedger: scope,
              sealReceipts:
                key === 'oa-seals-employee'
                  ? 'oa.sealReceiptsOwned'
                  : 'allRecords',
            },
          };
          changed = true;
        }
      }
    }
    if (changed)
      await query
        .updateTable('authorizationPermissionSets')
        .set({ grants: JSON.stringify(grants), updatedAt: new Date() })
        .where('id', '=', row.id)
        .execute();
  }
}
export default defineSeed({
  name: '202610104412_seal_print_permissions',
  run: ({ query }) => installSealPrintPermissions(query),
});
