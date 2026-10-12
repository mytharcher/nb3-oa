import { defineSeed } from '@nocobase/db';

// Self-contained forward defaults; existing administrator versions are never replaced.
export default defineSeed({
  name: '202610101211_annual_leave_rules',
  async run(context) {
    const rules = context.repository('approvalRules');
    for (const [key, value] of [
      ['leave.annualAccrualEnabled', 0],
      ['leave.annualCarryExpiryMonth', 3],
      ['leave.annualCarryExpiryDay', 31],
    ] as const) {
      if (await rules.exists({ filter: { key } })) continue;
      await rules.createOne({
        values: {
          key,
          value,
          effectiveFrom: new Date(0),
          updatedBy: null,
          note: null,
          createdAt: new Date(),
        },
      });
    }
  },
});
