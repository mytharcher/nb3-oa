import reportExportsLocale from './modules/report-exports.zh-TW.js';
import reportsLocale from '../../client/locales/modules/reports.zh-TW.js';
import invoiceRecognitionLocale from '../../client/locales/modules/invoice-recognition.zh-TW.js';
import electronicSignaturesLocale from './modules/electronic-signatures.zh-TW.js';
import wecomAttendanceLocale from './modules/wecom-attendance.zh-TW.js';
import hrMasterDataLocale from '../../client/locales/modules/hr-master-data.zh-TW.js';
import attendanceResultsLocale from './modules/attendance-results.zh-TW.js';
import processOperationsLocale from './modules/process-operations.zh-TW.js';
import financeIntegrationLocale from '../../client/locales/modules/finance-integration.zh-TW.js';
import accessLocale from '../../client/locales/modules/access.zh-TW.js';
import demoData from '../../client/locales/modules/demo-data.zh-TW.js';
import processManagementLocale from '../../client/locales/modules/process-management.zh-TW.js';
import personalSchedulesLocale from './modules/personal-schedules.zh-TW.js';
import transferLocale from './modules/transfer.zh-TW.js';
import certificatesLocale from './modules/certificates.zh-TW.js';
import attendanceManagementLocale from './modules/attendance-management.zh-TW.js';
import sealsLocale from './modules/seals.zh-TW.js';
import workItemsLocale from './modules/work-items.zh-TW.js';
import knowledgeLocale from './modules/knowledge.zh-TW.js';
import recruitmentLocale from './modules/recruitment.zh-TW.js';
import onboardingLocale from './modules/onboarding.zh-TW.js';
import announcementsLocale from './modules/announcements.zh-TW.js';
import vehiclesLocale from './modules/vehicles.zh-TW.js';
import meetingRoomsLocale from './modules/meeting-rooms.zh-TW.js';
import jobGradesLocale from './modules/job-grades.zh-TW.js';
import headcountsLocale from './modules/headcounts.zh-TW.js';
import templatePrintLocale from './modules/template-print.zh-TW.js';
import contractsLocale from './modules/contracts.zh-TW.js';
import assetRequestsLocale from './modules/asset-requests.zh-TW.js';
import vendorQualificationLocale from './modules/vendor-qualification.zh-TW.js';
import personnelSchedules from './modules/personnel-schedules.zh-TW.js';
import assetLocale from './modules/assets.zh-TW.js';
import type { AppServerResource } from './en-US.js';
import approvals from './modules/approvals.zh-TW.js';
import annualLeave from './modules/annual-leave.zh-TW.js';

const zhTW: AppServerResource = {
  ...reportExportsLocale,
  demoData,
  ...accessLocale,
  ...processManagementLocale,
  ...personalSchedulesLocale,
  transfer: transferLocale,
  ...certificatesLocale,
  ...attendanceManagementLocale,
  ...attendanceResultsLocale,
  ...wecomAttendanceLocale,
  ...processOperationsLocale,
  ...financeIntegrationLocale,
  ...invoiceRecognitionLocale,
  ...reportsLocale,
  ...electronicSignaturesLocale,
  ...hrMasterDataLocale,
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
      gm: '總經理',
      cfo: 'CFO',
      hr: 'HR 專員',
      hrbp: 'HRBP',
      hrDirector: 'HR 總監',
      admin: '行政',
      sealKeeper: '印章管理員',
      finance: '財務（會計）',
      financeManager: '財務經理',
      cashier: '出納',
      legal: '法務',
      purchasing: '採購',
      it: 'IT',
      committeeTech: '評審委員會技術席',
    },
  },
};

export default zhTW;
