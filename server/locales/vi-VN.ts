import reportExportsLocale from './modules/report-exports.vi-VN.js';
import reportsLocale from '../../client/locales/modules/reports.vi-VN.js';
import invoiceRecognitionLocale from '../../client/locales/modules/invoice-recognition.vi-VN.js';
import electronicSignaturesLocale from './modules/electronic-signatures.vi-VN.js';
import wecomAttendanceLocale from './modules/wecom-attendance.vi-VN.js';
import hrMasterDataLocale from '../../client/locales/modules/hr-master-data.vi-VN.js';
import attendanceResultsLocale from './modules/attendance-results.vi-VN.js';
import processOperationsLocale from './modules/process-operations.vi-VN.js';
import financeIntegrationLocale from '../../client/locales/modules/finance-integration.vi-VN.js';
import accessLocale from '../../client/locales/modules/access.vi-VN.js';
import demoData from '../../client/locales/modules/demo-data.vi-VN.js';
import processManagementLocale from '../../client/locales/modules/process-management.vi-VN.js';
import personalSchedulesLocale from './modules/personal-schedules.vi-VN.js';
import transferLocale from './modules/transfer.vi-VN.js';
import certificatesLocale from './modules/certificates.vi-VN.js';
import attendanceManagementLocale from './modules/attendance-management.vi-VN.js';
import sealsLocale from './modules/seals.vi-VN.js';
import workItemsLocale from './modules/work-items.vi-VN.js';
import knowledgeLocale from './modules/knowledge.vi-VN.js';
import recruitmentLocale from './modules/recruitment.vi-VN.js';
import onboardingLocale from './modules/onboarding.vi-VN.js';
import announcementsLocale from './modules/announcements.vi-VN.js';
import vehiclesLocale from './modules/vehicles.vi-VN.js';
import meetingRoomsLocale from './modules/meeting-rooms.vi-VN.js';
import jobGradesLocale from './modules/job-grades.vi-VN.js';
import headcountsLocale from './modules/headcounts.vi-VN.js';
import templatePrintLocale from './modules/template-print.vi-VN.js';
import contractsLocale from './modules/contracts.vi-VN.js';
import assetRequestsLocale from './modules/asset-requests.vi-VN.js';
import vendorQualificationLocale from './modules/vendor-qualification.vi-VN.js';
import personnelSchedules from './modules/personnel-schedules.vi-VN.js';
import assetLocale from './modules/assets.vi-VN.js';
import type { AppServerResource } from './en-US.js';
import approvals from './modules/approvals.vi-VN.js';
import annualLeave from './modules/annual-leave.vi-VN.js';

// The application's own server-side wording. It is empty because every string the server produces today belongs to a
// plugin's namespace; add keys here as the application starts producing its own, and use `overrides` to reword a
// plugin's.
const viVN: AppServerResource = {
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
      gm: 'Tổng giám đốc',
      cfo: 'Giám đốc tài chính',
      hr: 'Chuyên viên nhân sự',
      hrbp: 'Đối tác nhân sự',
      hrDirector: 'Giám đốc nhân sự',
      admin: 'Quản trị',
      sealKeeper: 'Người giữ con dấu',
      finance: 'Kế toán',
      financeManager: 'Trưởng bộ phận tài chính',
      cashier: 'Thủ quỹ',
      legal: 'Pháp chế',
      purchasing: 'Mua hàng',
      it: 'CNTT',
      committeeTech: 'Hội đồng xem xét (vị trí kỹ thuật)',
    },
  },
};

export default viVN;
