import { isDeepStrictEqual } from 'node:util';
import { defineSeed, type SeedContext } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
/** Only upgrade the exact untouched default actions; preserve administrators' custom policy and grants. */
export async function installConfirmationHandoverPermissions(
  repository: SeedContext['repository'],
) {
  const sets = repository<{
    id: string;
    key: string;
    grants: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>('authorizationPermissionSets');
  const old = await sets.findOne({ filter: { key: 'oa-work-items-employee' } });
  if (old) {
    let changed = false;
    const grants = (JSON.parse(old.grants) as PermissionGrant[]).map((grant) =>
      grant.resource.type === 'composite' &&
      grant.resource.id === 'oa.workItems'
        ? {
            ...grant,
            actions: grant.actions.map((a) => {
              if (
                !['confirm', 'return'].includes(a.action) ||
                !isDeepStrictEqual(a, {
                  action: a.action,
                  policy: {
                    type: 'composite',
                    scopes: { workItems: 'oa.workItemsOwned' },
                  },
                })
              )
                return a;
              changed = true;
              return {
                ...a,
                policy: {
                  type: 'composite' as const,
                  scopes: { workItems: 'oa.workItemsConfirmationOwned' },
                },
              };
            }),
          }
        : grant,
    );
    if (changed)
      await sets.updateOne({
        filter: { id: old.id },
        values: { grants: JSON.stringify(grants), updatedAt: new Date() },
      });
  }
  const key = 'oa-work-items-confirmation-maintenance';
  if (await sets.exists({ filter: { key } })) return;
  await sets.createOne({
    values: {
      id: key,
      key,
      title: encodeAuthorizationTitle({
        ns: 'nb3-oa',
        key: 'workItems.authz.handoverConfirmation',
      }),
      grants: JSON.stringify([
        {
          resource: { type: 'composite', id: 'oa.workItems' },
          actions: ['view', 'handoverConfirmation'].map((action) => ({
            action,
            policy: { type: 'composite', scopes: { workItems: 'allRecords' } },
          })),
        },
      ]),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  for (const role of ['hr', 'admin'])
    await repository('authorizationPermissionSetAssignments').createOne({
      values: {
        id: `org.dutyRole:${role}:${key}`,
        permissionSetKey: key,
        subjectType: 'org.dutyRole',
        subjectId: role,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
}
export default defineSeed({
  name: '202610104512_work_item_confirmation_handover_permissions',
  transaction: true,
  run: (context) =>
    installConfirmationHandoverPermissions(context.repository.bind(context)),
});
