import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
export async function installTemplatePrintPermissions(query: QueryAdapter) {
  const definitions = [
    {
      key: 'oa-print-template-admin',
      actions: ['manage'],
      subjectType: 'org.dutyRole',
      subjectId: 'admin',
    },
    {
      key: 'oa-document-print',
      actions: [
        'use',
        'printLeave',
        'printReimbursement',
        'printPayment',
        'printContracts',
        'printSealRegistration',
      ],
      subjectType: 'authenticated',
      subjectId: '*',
    },
  ];
  for (const definition of definitions) {
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', definition.key)
        .executeTakeFirst()
    )
      continue;
    const set = definePermissionSet(definition.key)
      .title({ key: 'templatePrint.authz.resource', ns: 'nb3-oa' })
      .grant({
        resource: { type: 'composite', id: 'oa.templatePrint' },
        actions: definition.actions.map((action) => ({
          action,
          policy: {
            type: 'composite' as const,
            scopes: {
              printTemplates: 'allRecords',
              ...(action === 'printLeave'
                ? { leaveRequests: 'allRecords' }
                : action === 'printReimbursement'
                  ? { reimbursementRequests: 'allRecords' }
                  : action === 'printPayment'
                    ? { paymentRequests: 'allRecords' }
                    : {}),
            },
          },
        })),
      })
      .build();
    const now = new Date();
    await query
      .insertInto('authorizationPermissionSets')
      .values({
        id: definition.key,
        key: definition.key,
        title: encodeAuthorizationTitle(set.title ?? definition.key),
        grants: JSON.stringify(set.grants),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await query
      .insertInto('authorizationPermissionSetAssignments')
      .values({
        id: `${definition.subjectType}:${definition.subjectId}:${definition.key}`,
        permissionSetKey: definition.key,
        subjectType: definition.subjectType,
        subjectId: definition.subjectId,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  }
}
export default defineSeed({
  name: '202610103811_template_print_permissions',
  run: ({ query }) => installTemplatePrintPermissions(query),
});
