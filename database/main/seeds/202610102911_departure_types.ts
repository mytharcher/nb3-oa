import { defineSeed } from '@nocobase/db';
export default defineSeed({
  name: '202610102911_departure_types',
  async run(context) {
    const entries = [
      ['resignation', '主动离职', 'Resignation'],
      ['dismissal', '辞退', 'Dismissal'],
      ['contractExpiry', '合同到期', 'Contract expiry'],
      ['declinedProbation', '不予转正', 'Declined probation'],
    ] as const;
    const repository = context.repository('dictionaries');
    for (const [index, [code, zh, en]] of entries.entries()) {
      if (await repository.exists({ filter: { type: 'departureType', code } }))
        continue;
      const now = new Date();
      await repository.createOne({
        values: {
          type: 'departureType',
          code,
          label: { 'zh-CN': zh, 'en-US': en },
          sortOrder: (index + 1) * 10,
          active: true,
          extra: null,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  },
});
