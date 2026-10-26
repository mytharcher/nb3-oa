import reportExportsLocale from './modules/report-exports.ko-KR.js';
import plugins from './plugins/ko-KR.js';
import reportsLocale from '../../client/locales/modules/reports.ko-KR.js';
import invoiceRecognitionLocale from '../../client/locales/modules/invoice-recognition.ko-KR.js';
import electronicSignaturesLocale from './modules/electronic-signatures.ko-KR.js';
import wecomAttendanceLocale from './modules/wecom-attendance.ko-KR.js';
import hrMasterDataLocale from '../../client/locales/modules/hr-master-data.ko-KR.js';
import attendanceResultsLocale from './modules/attendance-results.ko-KR.js';
import processOperationsLocale from './modules/process-operations.ko-KR.js';
import financeIntegrationLocale from '../../client/locales/modules/finance-integration.ko-KR.js';
import accessLocale from '../../client/locales/modules/access.ko-KR.js';
import demoData from '../../client/locales/modules/demo-data.ko-KR.js';
import processManagementLocale from '../../client/locales/modules/process-management.ko-KR.js';
import personalSchedulesLocale from './modules/personal-schedules.ko-KR.js';
import transferLocale from './modules/transfer.ko-KR.js';
import certificatesLocale from './modules/certificates.ko-KR.js';
import attendanceManagementLocale from './modules/attendance-management.ko-KR.js';
import sealsLocale from './modules/seals.ko-KR.js';
import workItemsLocale from './modules/work-items.ko-KR.js';
import knowledgeLocale from './modules/knowledge.ko-KR.js';
import recruitmentLocale from './modules/recruitment.ko-KR.js';
import onboardingLocale from './modules/onboarding.ko-KR.js';
import announcementsLocale from './modules/announcements.ko-KR.js';
import vehiclesLocale from './modules/vehicles.ko-KR.js';
import meetingRoomsLocale from './modules/meeting-rooms.ko-KR.js';
import jobGradesLocale from './modules/job-grades.ko-KR.js';
import headcountsLocale from './modules/headcounts.ko-KR.js';
import templatePrintLocale from './modules/template-print.ko-KR.js';
import contractsLocale from './modules/contracts.ko-KR.js';
import assetRequestsLocale from './modules/asset-requests.ko-KR.js';
import vendorQualificationLocale from './modules/vendor-qualification.ko-KR.js';
import personnelSchedules from './modules/personnel-schedules.ko-KR.js';
import assetLocale from './modules/assets.ko-KR.js';
import type { AppServerResource } from './en-US.js';
import approvals from './modules/approvals.ko-KR.js';
import annualLeave from './modules/annual-leave.ko-KR.js';

// The application's own server-side wording. It is empty because every string the server produces today belongs to a
// plugin's namespace; add keys here as the application starts producing its own, and use `overrides` to reword a
// plugin's.
const koKR: AppServerResource = {
  overrides: plugins,
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
      gm: '총괄 책임자',
      cfo: '재무 책임자',
      hr: '인사 담당자',
      hrbp: '인사 비즈니스 파트너',
      hrDirector: '인사 책임자',
      admin: '관리',
      sealKeeper: '인감 보관자',
      finance: '회계 담당자',
      financeManager: '재무 관리자',
      cashier: '출납 담당자',
      legal: '법무',
      purchasing: '구매',
      it: 'IT',
      committeeTech: '심사 위원회(기술 자리)',
    },
  },
};

export default koKR;
