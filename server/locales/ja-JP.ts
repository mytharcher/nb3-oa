import reportExportsLocale from './modules/report-exports.ja-JP.js';
import reportsLocale from '../../client/locales/modules/reports.ja-JP.js';
import invoiceRecognitionLocale from '../../client/locales/modules/invoice-recognition.ja-JP.js';
import electronicSignaturesLocale from './modules/electronic-signatures.ja-JP.js';
import wecomAttendanceLocale from './modules/wecom-attendance.ja-JP.js';
import hrMasterDataLocale from '../../client/locales/modules/hr-master-data.ja-JP.js';
import attendanceResultsLocale from './modules/attendance-results.ja-JP.js';
import processOperationsLocale from './modules/process-operations.ja-JP.js';
import financeIntegrationLocale from '../../client/locales/modules/finance-integration.ja-JP.js';
import accessLocale from '../../client/locales/modules/access.ja-JP.js';
import demoData from '../../client/locales/modules/demo-data.ja-JP.js';
import processManagementLocale from '../../client/locales/modules/process-management.ja-JP.js';
import personalSchedulesLocale from './modules/personal-schedules.ja-JP.js';
import transferLocale from './modules/transfer.ja-JP.js';
import certificatesLocale from './modules/certificates.ja-JP.js';
import attendanceManagementLocale from './modules/attendance-management.ja-JP.js';
import sealsLocale from './modules/seals.ja-JP.js';
import workItemsLocale from './modules/work-items.ja-JP.js';
import knowledgeLocale from './modules/knowledge.ja-JP.js';
import recruitmentLocale from './modules/recruitment.ja-JP.js';
import onboardingLocale from './modules/onboarding.ja-JP.js';
import announcementsLocale from './modules/announcements.ja-JP.js';
import vehiclesLocale from './modules/vehicles.ja-JP.js';
import meetingRoomsLocale from './modules/meeting-rooms.ja-JP.js';
import jobGradesLocale from './modules/job-grades.ja-JP.js';
import headcountsLocale from './modules/headcounts.ja-JP.js';
import templatePrintLocale from './modules/template-print.ja-JP.js';
import contractsLocale from './modules/contracts.ja-JP.js';
import assetRequestsLocale from './modules/asset-requests.ja-JP.js';
import vendorQualificationLocale from './modules/vendor-qualification.ja-JP.js';
import personnelSchedules from './modules/personnel-schedules.ja-JP.js';
import assetLocale from './modules/assets.ja-JP.js';
import type { AppServerResource } from './en-US.js';
import approvals from './modules/approvals.ja-JP.js';
import annualLeave from './modules/annual-leave.ja-JP.js';

// The application's own server-side wording. It is empty because every string the server produces today belongs to a
// plugin's namespace; add keys here as the application starts producing its own, and use `overrides` to reword a
// plugin's.
const jaJP: AppServerResource = {
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
  // Titles of the seeded duty roles (`org.dutyRoleTitles.<code>`); the organisation searches them in every language.
  org: {
    dutyRoleTitles: {
      gm: '総経理',
      cfo: 'CFO',
      hr: '人事担当者',
      hrbp: 'HRBP',
      hrDirector: '人事部長',
      admin: '管理',
      sealKeeper: '印章管理者',
      finance: '会計担当者',
      financeManager: '財務マネージャー',
      cashier: '出納担当者',
      legal: '法務',
      purchasing: '購買',
      it: 'IT',
      committeeTech: '審査委員会（技術枠）',
    },
  },
};

export default jaJP;
