import {
  currentDemo,
  demoPrefix,
  demoEmail,
  demoUsername,
} from '../../../../server/providers/demo-data/context.js';
import {
  demoChineseNames,
  demoEnglishNames,
} from '../../../../server/providers/demo-data/content.js';
export const trialAccounts = [
  {
    key: 'system',
    name: '示例·系统管理员',
    department: 'management',
    duties: [],
  },
  { key: 'gm', name: '示例·总经理', department: 'management', duties: ['gm'] },
  {
    key: 'executive',
    name: '示例·分管领导',
    department: 'management',
    duties: [],
  },
  {
    key: 'head',
    name: '示例·研发负责人',
    department: 'engineering',
    duties: [],
  },
  {
    key: 'manager',
    name: '示例·直属主管',
    department: 'engineering',
    duties: [],
  },
  {
    key: 'employee',
    name: '示例·普通员工',
    department: 'engineering',
    duties: [],
  },
  {
    key: 'employee2',
    name: '示例·协作员工',
    department: 'engineering',
    duties: [],
  },
  {
    key: 'probation',
    name: '示例·试用员工',
    department: 'engineering',
    duties: [],
  },
  {
    key: 'departing',
    name: '示例·离职申请人',
    department: 'engineering',
    duties: [],
  },
  { key: 'sales', name: '示例·销售负责人', department: 'sales', duties: [] },
  { key: 'hr', name: '示例·人事专员', department: 'hr', duties: ['hr'] },
  { key: 'hrbp', name: '示例·人事伙伴', department: 'hr', duties: ['hrbp'] },
  {
    key: 'hrDirector',
    name: '示例·人事总监',
    department: 'hr',
    duties: ['hrDirector'],
  },
  {
    key: 'finance',
    name: '示例·对口会计',
    department: 'finance',
    duties: ['finance'],
  },
  {
    key: 'finance2',
    name: '示例·复核会计',
    department: 'finance',
    duties: ['finance'],
  },
  {
    key: 'financeManager',
    name: '示例·财务经理',
    department: 'finance',
    duties: ['financeManager'],
  },
  { key: 'cfo', name: '示例·财务总监', department: 'finance', duties: ['cfo'] },
  {
    key: 'cashier',
    name: '示例·出纳',
    department: 'finance',
    duties: ['cashier'],
  },
  {
    key: 'admin',
    name: '示例·行政专员',
    department: 'administration',
    duties: ['admin'],
  },
  {
    key: 'admin2',
    name: '示例·行政复核',
    department: 'administration',
    duties: ['admin'],
  },
  {
    key: 'sealKeeper',
    name: '示例·印章保管人',
    department: 'administration',
    duties: ['sealKeeper'],
  },
  {
    key: 'legal',
    name: '示例·法务',
    department: 'management',
    duties: ['legal'],
  },
  {
    key: 'purchasing',
    name: '示例·采购专员',
    department: 'administration',
    duties: ['purchasing'],
  },
  {
    key: 'purchasing2',
    name: '示例·采购评委',
    department: 'administration',
    duties: ['purchasing'],
  },
  { key: 'it', name: '示例·IT专员', department: 'engineering', duties: ['it'] },
  {
    key: 'committeeTech',
    name: '示例·技术评委',
    department: 'engineering',
    duties: ['committeeTech'],
  },
  {
    key: 'driver',
    name: '示例·驾驶员',
    department: 'administration',
    duties: [],
  },
] as const;

export type TrialRole = (typeof trialAccounts)[number]['key'];
export const trialPrefix = 'oa-trial-v1';
export const trialEmail = (key: string): string => demoEmail(key);
export const trialUsername = (key: string): string => demoUsername(key);

export const getTrialPrefix = demoPrefix;
export function getTrialAccounts(): readonly {
  key: TrialRole;
  name: string;
  department: (typeof trialAccounts)[number]['department'];
  duties: readonly string[];
}[] {
  const scope = currentDemo();
  return scope
    ? trialAccounts.map((p, index) => ({
        ...p,
        name: (scope.locale === 'en-US' ? demoEnglishNames : demoChineseNames)[
          index
        ],
      }))
    : trialAccounts;
}
