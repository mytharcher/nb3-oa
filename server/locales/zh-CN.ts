import accessLocale from '../../client/locales/modules/access.zh-CN.js';
import demoData from '../../client/locales/modules/demo-data.zh-CN.js';
import processManagementLocale from '../../client/locales/modules/process-management.zh-CN.js';
import personalSchedulesLocale from './modules/personal-schedules.zh-CN.js';
import transferLocale from './modules/transfer.zh-CN.js';
import certificatesLocale from './modules/certificates.zh-CN.js';
import attendanceManagementLocale from './modules/attendance-management.zh-CN.js';
import sealsLocale from './modules/seals.zh-CN.js';
import workItemsLocale from './modules/work-items.zh-CN.js';
import knowledgeLocale from './modules/knowledge.zh-CN.js';
import recruitmentLocale from './modules/recruitment.zh-CN.js';
import onboardingLocale from './modules/onboarding.zh-CN.js';
import announcementsLocale from './modules/announcements.zh-CN.js';
import vehiclesLocale from './modules/vehicles.zh-CN.js';
import meetingRoomsLocale from './modules/meeting-rooms.zh-CN.js';
import jobGradesLocale from './modules/job-grades.zh-CN.js';
import headcountsLocale from './modules/headcounts.zh-CN.js';
import templatePrintLocale from './modules/template-print.zh-CN.js';
import contractsLocale from './modules/contracts.zh-CN.js';
import assetRequestsLocale from './modules/asset-requests.zh-CN.js';
import vendorQualificationLocale from './modules/vendor-qualification.zh-CN.js';
import personnelSchedules from './modules/personnel-schedules.zh-CN.js';
import assetLocale from './modules/assets.zh-CN.js';
import type { AppServerResource } from './en-US.js';
import approvals from './modules/approvals.zh-CN.js';
import annualLeave from './modules/annual-leave.zh-CN.js';

const zhCN: AppServerResource = {
  demoData,
  ...accessLocale,
  ...processManagementLocale,
  ...personalSchedulesLocale,
  transfer: transferLocale,
  ...certificatesLocale,
  ...attendanceManagementLocale,
  ...knowledgeLocale,
  ...recruitmentLocale,
  ...onboardingLocale,
  ...announcementsLocale,
  ...workItemsLocale,
  ...meetingRoomsLocale,
  ...vehiclesLocale,
  ...jobGradesLocale,
  ...headcountsLocale,
  ...contractsLocale,
  ...sealsLocale,
  ...templatePrintLocale,
  assetRequests: assetRequestsLocale,
  ...personnelSchedules,
  ...vendorQualificationLocale,
  assets: assetLocale,
  approvals,
  annualLeave,
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
