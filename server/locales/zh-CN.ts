import type { AppServerResource } from './en-US.js';
import approvals from './modules/approvals.zh-CN.js';

const zhCN: AppServerResource = {
  approvals,
  org: {
    dutyRoleTitles: {
      gm: '总经理',
      cfo: 'CFO',
      hr: 'HR 专员',
      hrbp: 'HRBP',
      hrDirector: 'HR 总监',
      admin: '行政',
      sealKeeper: '印章管理员',
      finance: '财务（会计）',
      financeManager: '财务经理',
      cashier: '出纳',
      legal: '法务',
      purchasing: '采购',
      it: 'IT',
      committeeTech: '评审委员会技术席',
    },
  },
};

export default zhCN;
