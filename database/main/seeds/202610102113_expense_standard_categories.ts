import { defineSeed } from '@nocobase/db';
export default defineSeed({
  name: '202610102113_expense_standard_categories',
  async run(context) {
    const repo = context.repository('dictionaries');
    // Legacy categories retain non-standard meaning. In particular aggregate travel is not lodging/allowance.
    for (const entry of await repo.findMany({
      filter: { type: 'expenseCategory' },
    })) {
      const extra = entry.extra as Record<string, unknown> | null;
      if (extra?.travelStandardKind !== undefined) continue;
      await repo.updateMany({
        filter: { type: 'expenseCategory', code: String(entry.code) },
        values: { extra: { travelStandardKind: 'none' } },
      });
    }
    for (const [code, zh, en, kind] of [
      ['lodging', '住宿', 'Lodging', 'lodging'],
      ['allowance', '差旅补助', 'Travel allowance', 'allowance'],
    ]) {
      if (await repo.exists({ filter: { type: 'expenseCategory', code } }))
        continue;
      await repo.createOne({
        values: {
          type: 'expenseCategory',
          code,
          label: { 'zh-CN': zh, 'en-US': en },
          sortOrder: 100,
          active: true,
          extra: { travelStandardKind: kind },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  },
});
