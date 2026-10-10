import { defineSeed, type QueryAdapter } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
/** Repair the application's original employee default without rewriting administrator-selected scopes. */
export async function upgradeLeavePermissionSets(
  query: QueryAdapter,
): Promise<void> {
  const row = await query
    .selectFrom('authorizationPermissionSets')
    .select(['id', 'grants', 'title'])
    .where('key', '=', 'oa-leave-employee')
    .executeTakeFirst();
  if (!row) return;
  const grants =
    typeof row.grants === 'string'
      ? (JSON.parse(row.grants) as PermissionGrant[])
      : (row.grants as PermissionGrant[]);
  const leave = grants.find(
    (grant) =>
      grant.resource.type === 'composite' && grant.resource.id === 'oa.leave',
  );
  // Only the exact application-owned initial submit scope identifies the original installation default.
  // Missing/modified resources and already-configured view grants remain administrator-owned choices.
  const submit = leave?.actions.find((action) => action.action === 'submit');
  const scopes = submit?.policy?.scopes;
  if (
    !leave ||
    !submit ||
    submit.policy?.type !== 'composite' ||
    !scopes ||
    typeof scopes !== 'object' ||
    !('leaveRequests' in scopes) ||
    scopes.leaveRequests !== 'allRecords' ||
    leave.actions.some((action) => action.action === 'view')
  )
    return;
  const upgraded: PermissionGrant[] = grants.map((grant) =>
    grant === leave
      ? {
          ...grant,
          actions: [
            ...grant.actions,
            {
              action: 'view',
              policy: {
                type: 'composite',
                scopes: { leaveRequests: 'oa.leaveReadable' },
              },
            },
          ],
        }
      : grant,
  );
  await query
    .updateTable('authorizationPermissionSets')
    .set({
      grants: JSON.stringify(upgraded),
      title:
        row.title ===
        encodeAuthorizationTitle({ key: 'approval.authz.leave', ns: 'nb3-oa' })
          ? encodeAuthorizationTitle({
              key: 'approvals.authz.leave',
              ns: 'nb3-oa',
            })
          : row.title,
      updatedAt: new Date(),
    })
    .where('id', '=', row.id)
    .execute();
}
// Seeds have no runtime authorization service token. As with the initial application's permission seeds, use the
// public persisted grant representation through the seed's own transaction, preserving unrelated grants/assignments.
export default defineSeed({
  name: '202610100712_leave_read_scope_upgrade',
  run: ({ query }) => upgradeLeavePermissionSets(query),
});
