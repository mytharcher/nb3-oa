import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
import { defineSeed, type SeedDefinition } from '@nocobase/db';

/** The application's translation namespace (its package name); the client locales ship these keys. */
const NS = 'nb3-oa';

/**
 * The duty-role codes approval resolution looks up (OA plan 01 §3). The codes are stable identifiers; the titles are
 * translation descriptors rendered in the reader's language (`org.dutyRoleTitles.<code>` in the client and server
 * locales).
 */
const DUTY_ROLES: readonly string[] = [
  'gm',
  'cfo',
  'hr',
  'hrbp',
  'hrDirector',
  'admin',
  'sealKeeper',
  'finance',
  'financeManager',
  'cashier',
  'legal',
  'purchasing',
  'it',
  'committeeTech',
];

/**
 * Seeds the duty-role pool. A role is written only when its code is missing, so an administrator who disabled one
 * keeps that choice on a replay. Members are never seeded: who holds a duty is production data.
 */
const seed: SeedDefinition = defineSeed({
  name: '202610100211_seed_duty_roles',

  async run({ query }) {
    for (const [index, code] of DUTY_ROLES.entries()) {
      const existing = await query
        .selectFrom('dutyRoles')
        .select('code')
        .where('code', '=', code)
        .executeTakeFirst();
      if (existing) continue;
      await query
        .insertInto('dutyRoles')
        .values({
          code,
          title: encodeAuthorizationTitle({
            key: `org.dutyRoleTitles.${code}`,
            ns: NS,
          }),
          description: null,
          active: true,
          sortOrder: (index + 1) * 10,
        })
        .execute();
    }
  },
});

export default seed;
