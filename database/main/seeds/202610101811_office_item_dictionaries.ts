import { defineSeed } from '@nocobase/db';

// Required enumerations, preserved once administrators have configured them.
export default defineSeed({
  name: '202610101811_office_item_dictionaries',
  async run(context) {
    const entries = context.repository('dictionaries');
    const now = new Date();
    for (const [index, item] of [
      {
        code: 'stationery',
        zh: '办公用品',
        en: 'Office supplies',
        requiresPrintInfo: false,
      },
      {
        code: 'businessCards',
        zh: '名片',
        en: 'Business cards',
        requiresPrintInfo: true,
      },
    ].entries()) {
      if (
        await entries.exists({
          filter: { type: 'officeItem', code: item.code },
        })
      )
        continue;
      await entries.createOne({
        values: {
          type: 'officeItem',
          code: item.code,
          label: { 'zh-CN': item.zh, 'en-US': item.en },
          sortOrder: (index + 1) * 10,
          active: true,
          extra: { requiresPrintInfo: item.requiresPrintInfo },
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  },
});
