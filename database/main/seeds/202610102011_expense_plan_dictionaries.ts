import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202610102011_expense_plan_dictionaries',
  async run(context) {
    const entries = context.repository('dictionaries');
    const at = new Date('2026-10-11T00:00:00.000Z');
    for (const [index, [code, zh, en]] of [
      ['entertainment', '业务招待', 'Business entertainment'],
      ['teamBuilding', '团队建设', 'Team building'],
      ['event', '活动', 'Events'],
    ].entries()) {
      if (await entries.exists({ filter: { type: 'expensePlanType', code } }))
        continue;
      await entries.createOne({
        values: {
          type: 'expensePlanType',
          code,
          label: { 'zh-CN': zh, 'en-US': en },
          sortOrder: (index + 1) * 10,
          active: true,
          extra: null,
          createdAt: at,
          updatedAt: at,
        },
      });
    }
  },
});
