import { defineSeed } from '@nocobase/db';
export default defineSeed({
  name: '202610290002_it_repair_rules',
  async run(context) {
    for (const [code, en, zh] of [
      ['device', 'Device', '设备'],
      ['network', 'Network', '网络'],
      ['software', 'Software', '软件'],
      ['account', 'Account access', '账号访问'],
      ['other', 'Other', '其他'],
    ]) {
      if (
        await context.repository('dictionaries').exists({
          filter: { type: 'itRepairCategory', code },
        })
      )
        continue;
      await context.repository('dictionaries').createOne({
        values: {
          type: 'itRepairCategory',
          code,
          label: { 'en-US': en, 'zh-CN': zh },
          sortOrder: 0,
          active: true,
          extra: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    const values: Record<string, number | { start: string; end: string }> = {
      'itRepair.morning': { start: '09:00', end: '12:00' },
      'itRepair.afternoon': { start: '13:00', end: '18:00' },
    };
    for (const [i, p] of ['P1', 'P2', 'P3', 'P4'].entries()) {
      values[`itRepair.${p}.response`] = [1, 2, 4, 8][i];
      values[`itRepair.${p}.resolution`] = [4, 8, 16, 40][i];
    }
    for (const [key, value] of Object.entries(values)) {
      if (await context.repository('approvalRules').exists({ filter: { key } }))
        continue;
      await context.repository('approvalRules').createOne({
        values: {
          key,
          value,
          effectiveFrom: new Date(0),
          createdAt: new Date(),
          updatedBy: null,
          note: null,
        },
      });
    }
  },
});
