// Candidate default certificate permissions; preserves installed administrator customization.
import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export async function installCertificatePermissions(
  query: QueryAdapter,
): Promise<void> {
  for (const subject of ['employee', 'admin', 'hr'] as const) {
    const key = `oa-certificates-${subject}`;
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst()
    )
      continue;
    const scoped = (
      resource: string,
      collection: string,
      actions: string[],
      scope: string,
    ): PermissionGrant => ({
      resource: { type: 'composite', id: resource },
      actions: actions.map((action) => ({
        action,
        policy: { type: 'composite', scopes: { [collection]: scope } },
      })),
    });
    const grants: PermissionGrant[] =
      subject === 'employee'
        ? [
            scoped(
              'oa.certificateRequests',
              'certificateRequests',
              ['view', 'operate'],
              'oa.certificateRequestsReadable',
            ),
            scoped(
              'oa.certificateRequests',
              'certificateRequests',
              ['create', 'edit'],
              'oa.certificateRequestsOwned',
            ),
          ]
        : subject === 'admin'
          ? [
              scoped(
                'oa.certificateRequests',
                'certificateRequests',
                ['view', 'operate'],
                'allRecords',
              ),
            ]
          : [
              {
                resource: { type: 'composite', id: 'oa.templatePrint' },
                actions: ['use', 'printCertificates'].map((action) => ({
                  action,
                  policy: {
                    type: 'composite' as const,
                    scopes: {
                      printTemplates: 'allRecords',
                      printTemplateRevisions: 'allRecords',
                      ...(action === 'printCertificates'
                        ? {
                            certificateRequests:
                              'oa.certificateRequestsReadable',
                          }
                        : {}),
                    },
                  },
                })),
              },
              scoped(
                'oa.certificateRequests',
                'certificateRequests',
                ['view', 'operate', 'issue'],
                'oa.certificateRequestsReadable',
              ),
              scoped(
                'oa.certificateRequests',
                'certificatePreparationPrivate',
                ['viewIncome'],
                'allRecords',
              ),
            ];
    const set = definePermissionSet(key)
        .title({ key: 'certificates.authz.requests', ns: 'nb3-oa' })
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
    const subjectType =
        subject === 'employee' ? 'authenticated' : 'org.dutyRole',
      subjectId =
        subject === 'employee' ? '*' : subject === 'admin' ? 'admin' : 'hr';
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
  name: '202610104711_certificate_permissions',
  run: ({ query }) => installCertificatePermissions(query),
});
