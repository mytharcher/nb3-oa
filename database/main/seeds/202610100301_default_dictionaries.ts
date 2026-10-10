import { defineSeed } from '@nocobase/db';

/**
 * The initial dictionary entries flows read their enumerations from (01 §7). Labels hold every language the
 * application offers. An entry that already exists is left as it is, so a repeat run never overwrites what an
 * administrator changed. Administrators disable entries instead of deleting them.
 */

interface Entry {
  readonly code: string;
  readonly zh: string;
  readonly en: string;
  readonly extra?: Record<string, unknown>;
}

const leave = (
  code: string,
  zh: string,
  en: string,
  extra: {
    deductsBalance: boolean;
    requiresAttachment: boolean;
    attachmentAboveDays?: number | null;
    maxDays: number | null;
    requiresHr: boolean;
  },
): Entry => ({
  code,
  zh,
  en,
  extra: { attachmentAboveDays: null, ...extra },
});

const ENTRIES: Readonly<Record<string, readonly Entry[]>> = {
  leaveType: [
    leave('annual', '年假', 'Annual leave', {
      deductsBalance: true,
      requiresAttachment: false,
      maxDays: null,
      requiresHr: false,
    }),
    leave('compensatory', '调休', 'Compensatory leave', {
      deductsBalance: true,
      requiresAttachment: false,
      maxDays: null,
      requiresHr: false,
    }),
    leave('personal', '事假', 'Personal leave', {
      deductsBalance: false,
      requiresAttachment: false,
      maxDays: null,
      requiresHr: false,
    }),
    leave('sick', '病假', 'Sick leave', {
      deductsBalance: false,
      requiresAttachment: true,
      attachmentAboveDays: 1,
      maxDays: null,
      requiresHr: false,
    }),
    leave('marriage', '婚假', 'Marriage leave', {
      deductsBalance: false,
      requiresAttachment: true,
      maxDays: 10,
      requiresHr: true,
    }),
    leave('maternity', '产假', 'Maternity leave', {
      deductsBalance: false,
      requiresAttachment: true,
      maxDays: 158,
      requiresHr: true,
    }),
    leave('paternity', '陪产假', 'Paternity leave', {
      deductsBalance: false,
      requiresAttachment: true,
      maxDays: 15,
      requiresHr: true,
    }),
    leave('bereavement', '丧假', 'Bereavement leave', {
      deductsBalance: false,
      requiresAttachment: false,
      maxDays: 3,
      requiresHr: true,
    }),
  ],
  annualLeaveTier: [
    {
      code: 'y1',
      zh: '工龄满 1 年',
      en: '1 year of service',
      extra: { minYears: 1, days: 5 },
    },
    {
      code: 'y10',
      zh: '工龄满 10 年',
      en: '10 years of service',
      extra: { minYears: 10, days: 10 },
    },
    {
      code: 'y20',
      zh: '工龄满 20 年',
      en: '20 years of service',
      extra: { minYears: 20, days: 15 },
    },
  ],
  expenseCategory: [
    { code: 'travel', zh: '差旅费', en: 'Travel' },
    { code: 'transport', zh: '市内交通费', en: 'Local transport' },
    { code: 'meal', zh: '餐费', en: 'Meals' },
    { code: 'entertainment', zh: '业务招待费', en: 'Business entertainment' },
    { code: 'office', zh: '办公费', en: 'Office supplies' },
    { code: 'communication', zh: '通讯费', en: 'Communication' },
    { code: 'training', zh: '培训费', en: 'Training' },
    { code: 'other', zh: '其他', en: 'Other' },
  ],
  budgetSubject: [
    { code: 'travel', zh: '差旅费', en: 'Travel' },
    { code: 'entertainment', zh: '业务招待费', en: 'Business entertainment' },
    { code: 'office', zh: '办公费', en: 'Office expenses' },
    { code: 'training', zh: '培训费', en: 'Training' },
    { code: 'marketing', zh: '市场推广费', en: 'Marketing' },
    { code: 'equipment', zh: '设备购置', en: 'Equipment' },
    { code: 'service', zh: '外包服务费', en: 'Outsourced services' },
  ],
  sealType: [
    { code: 'official', zh: '公章', en: 'Company seal' },
    { code: 'contract', zh: '合同章', en: 'Contract seal' },
    {
      code: 'legalRepresentative',
      zh: '法人章',
      en: 'Legal representative seal',
    },
    { code: 'finance', zh: '财务章', en: 'Finance seal' },
  ],
  contractType: [
    { code: 'purchase', zh: '采购合同', en: 'Purchase contract' },
    { code: 'sales', zh: '销售合同', en: 'Sales contract' },
    { code: 'service', zh: '服务合同', en: 'Service contract' },
    { code: 'lease', zh: '租赁合同', en: 'Lease contract' },
    { code: 'labor', zh: '劳务合同', en: 'Labor contract' },
    {
      code: 'confidentiality',
      zh: '保密协议',
      en: 'Confidentiality agreement',
    },
    { code: 'other', zh: '其他', en: 'Other' },
  ],
  assetCategory: [
    { code: 'computer', zh: '电脑设备', en: 'Computers' },
    { code: 'office', zh: '办公设备', en: 'Office equipment' },
    { code: 'furniture', zh: '家具', en: 'Furniture' },
    { code: 'vehicle', zh: '车辆', en: 'Vehicles' },
    { code: 'other', zh: '其他', en: 'Other' },
  ],
  supplierCategory: [
    { code: 'goods', zh: '物资供应', en: 'Goods' },
    { code: 'service', zh: '服务', en: 'Services' },
    { code: 'engineering', zh: '工程', en: 'Engineering' },
    { code: 'it', zh: '信息技术', en: 'Information technology' },
    { code: 'logistics', zh: '物流', en: 'Logistics' },
  ],
  vehicleType: [
    { code: 'sedan', zh: '轿车', en: 'Sedan' },
    { code: 'suv', zh: 'SUV', en: 'SUV' },
    { code: 'van', zh: '商务车', en: 'Van' },
    { code: 'truck', zh: '货车', en: 'Truck' },
  ],
  resignationReason: [
    {
      code: 'career',
      zh: '个人发展',
      en: 'Career development',
      extra: { voluntary: true },
    },
    {
      code: 'compensation',
      zh: '薪酬待遇',
      en: 'Compensation',
      extra: { voluntary: true },
    },
    {
      code: 'family',
      zh: '家庭原因',
      en: 'Family reasons',
      extra: { voluntary: true },
    },
    {
      code: 'health',
      zh: '健康原因',
      en: 'Health reasons',
      extra: { voluntary: true },
    },
    {
      code: 'contractEnd',
      zh: '合同到期不续签',
      en: 'Contract not renewed',
      extra: { voluntary: false },
    },
    {
      code: 'dismissal',
      zh: '辞退',
      en: 'Dismissal',
      extra: { voluntary: false },
    },
    { code: 'other', zh: '其他', en: 'Other', extra: { voluntary: true } },
  ],
  recruitmentReason: [
    {
      code: 'newHeadcount',
      zh: '新增编制',
      en: 'New headcount',
      extra: { replacement: false },
    },
    {
      code: 'replacement',
      zh: '离职替补',
      en: 'Replacement',
      extra: { replacement: true },
    },
  ],
  certificateType: [
    {
      code: 'employment',
      zh: '在职证明',
      en: 'Employment certificate',
      extra: { involvesSalary: false },
    },
    {
      code: 'income',
      zh: '收入证明',
      en: 'Income certificate',
      extra: { involvesSalary: true },
    },
    {
      code: 'other',
      zh: '其他证明',
      en: 'Other certificate',
      extra: { involvesSalary: false },
    },
  ],
  // Per grade band: an employee's standard is the entry with the highest `minRank` not above their grade's rank.
  travelStandard: [
    {
      code: 'staff',
      zh: '员工',
      en: 'Staff',
      extra: { minRank: 0, lodgingPerNight: 400, allowancePerDay: 100 },
    },
    {
      code: 'manager',
      zh: '经理级',
      en: 'Manager',
      extra: { minRank: 5, lodgingPerNight: 550, allowancePerDay: 120 },
    },
    {
      code: 'director',
      zh: '总监级',
      en: 'Director',
      extra: { minRank: 7, lodgingPerNight: 700, allowancePerDay: 150 },
    },
    {
      code: 'executive',
      zh: '高管',
      en: 'Executive',
      extra: { minRank: 9, lodgingPerNight: 1000, allowancePerDay: 200 },
    },
  ],
};

export default defineSeed({
  name: '202610100301_default_dictionaries',

  async run(context) {
    const dictionaries = context.repository('dictionaries');
    const now = new Date();
    for (const [type, entries] of Object.entries(ENTRIES)) {
      for (const [index, entry] of entries.entries()) {
        const exists = await dictionaries.exists({
          filter: { type, code: entry.code },
        });
        if (exists) continue;
        await dictionaries.createOne({
          values: {
            type,
            code: entry.code,
            label: { 'zh-CN': entry.zh, 'en-US': entry.en },
            sortOrder: (index + 1) * 10,
            active: true,
            extra: entry.extra ?? null,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }
  },
});
