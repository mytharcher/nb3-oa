import { defineSeed } from '@nocobase/db';
export default defineSeed({
  name: '202610102712_payment_methods',
  async run(context) {
    const repo = context.repository('dictionaries');
    for (const [index, [code, zh, en]] of [
      ['bankTransfer', '银行转账', 'Bank transfer'],
      ['cash', '现金', 'Cash'],
      ['cheque', '支票', 'Cheque'],
    ].entries()) {
      if (await repo.exists({ filter: { type: 'paymentMethod', code } }))
        continue;
      await repo.createOne({
        values: {
          type: 'paymentMethod',
          code,
          label: { 'zh-CN': zh, 'en-US': en },
          active: true,
          sortOrder: index * 10,
          extra: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  },
});
