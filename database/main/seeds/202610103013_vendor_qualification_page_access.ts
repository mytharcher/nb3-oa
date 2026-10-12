import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';

/** A forward page-only grant: existing business sets and administrator edits stay intact. */
export async function installVendorQualificationPageAccess(
  query: QueryAdapter,
) {
  const key = 'oa-vendor-qualification-page';
  if (
    await query
      .selectFrom('authorizationPermissionSets')
      .select('id')
      .where('key', '=', key)
      .executeTakeFirst()
  )
    return;
  const set = definePermissionSet(key)
    .title({ key: 'vendorQualifications.title', ns: 'nb3-oa' })
    .grant({
      resource: { type: 'page', id: 'oa-vendor-qualifications' },
      actions: [{ action: 'access' }],
    })
    .build();
  const now = new Date();
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
  await query
    .insertInto('authorizationPermissionSetAssignments')
    .values({
      id: `authenticated:*:${key}`,
      permissionSetKey: key,
      subjectType: 'authenticated',
      subjectId: '*',
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}
export default defineSeed({
  name: '202610103013_vendor_qualification_page_access',
  run: ({ query }) => installVendorQualificationPageAccess(query),
});
