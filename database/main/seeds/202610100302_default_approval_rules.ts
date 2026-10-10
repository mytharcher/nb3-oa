import { defineSeed } from '@nocobase/db';

/**
 * The default value of every approval rule key (02 §3 and the README's defaults awaiting review), effective from the
 * epoch so a snapshot at any instant finds a value. Administrators change a rule by adding a later version on the
 * settings page; a key that already has a version is left as it is.
 *
 * This list is a copy of `defaultValue` in `server/providers/platform/rule-definitions.ts` as of this seed: a seed is
 * history and must not import the evolving definitions. A key added later gets its own, later seed.
 */
const DEFAULTS: readonly (readonly [
  string,
  number | string | Readonly<Record<string, string>>,
])[] = [
  ['spend.vp', 50_000],
  ['spend.gm', 200_000],
  ['expense.head', 10_000],
  ['loan.head', 10_000],
  ['loan.personalMax', 50_000],
  ['purchase.quotes', 50_000],
  ['contract.gm', 100_000],
  ['asset.scrapGm', 10_000],
  ['budget.increaseGm', 50_000],
  ['leave.head', 3],
  ['leave.hr', 7],
  ['overtime.monthlyHead', 36],
  ['attendance.fixPerMonth', 3],
  ['grade.managerRank', 5],
  ['grade.directorRank', 7],
  ['raise.vp', 0.2],
  ['raise.gm', 0.3],
  ['sla.remindHours', 24],
  ['sla.escalateHours', 48],
  ['sla.urgeCooldownHours', 4],
  ['committee.min', 2],
  ['calendar.workHours', { start: '09:00', end: '18:00' }],
  ['calendar.timeZone', 'Asia/Shanghai'],
];

export default defineSeed({
  name: '202610100302_default_approval_rules',

  async run(context) {
    const rules = context.repository('approvalRules');
    const epoch = new Date(0);
    const now = new Date();
    for (const [key, value] of DEFAULTS) {
      // A key with any version already has its history; leave it as it is.
      if (await rules.exists({ filter: { key } })) continue;
      await rules.createOne({
        values: {
          key,
          value,
          effectiveFrom: epoch,
          updatedBy: null,
          note: null,
          createdAt: now,
        },
      });
    }
  },
});
