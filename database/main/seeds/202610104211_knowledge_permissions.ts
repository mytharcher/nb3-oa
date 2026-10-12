// Required default knowledge permissions; preserves installed administrator customization.
import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export async function installKnowledgePermissions(
  query: QueryAdapter,
): Promise<void> {
  for (const administrative of [false, true]) {
    const key = administrative ? 'oa-knowledge-admin' : 'oa-knowledge-employee';
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst()
    )
      continue;
    const actions = administrative ? ['view', 'manage'] : ['view'];
    const grants: PermissionGrant[] = [
      {
        resource: { type: 'composite', id: 'oa.knowledgeDocuments' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              knowledgeDocuments: 'allRecords',
              knowledgeVersions: 'allRecords',
            },
          },
        })),
      },
      {
        resource: { type: 'composite', id: 'oa.knowledgeFolders' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: { knowledgeFolders: 'allRecords' },
          },
        })),
      },
    ];
    const set = definePermissionSet(key)
        .title({ key: 'knowledge.authz.knowledgeDocuments', ns: 'nb3-oa' })
        .grant(...grants)
        .build(),
      now = new Date();
    await query
      .insertInto('authorizationPermissionSets')
      .values({
        id: key,
        key,
        title: encodeAuthorizationTitle(set.title ?? key),
        grants: JSON.stringify(set.grants),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    const subjectType = administrative ? 'org.dutyRole' : 'authenticated',
      subjectId = administrative ? 'admin' : '*';
    await query
      .insertInto('authorizationPermissionSetAssignments')
      .values({
        id: `${subjectType}:${subjectId}:${key}`,
        permissionSetKey: key,
        subjectType,
        subjectId,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  }
}
export default defineSeed({
  name: '202610104211_knowledge_permissions',
  run: ({ query }) => installKnowledgePermissions(query),
});
