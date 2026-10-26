import reportExportsLocale from './modules/report-exports.en-US.js';
import reportsLocale from '../../client/locales/modules/reports.en-US.js';
import invoiceRecognitionLocale from '../../client/locales/modules/invoice-recognition.en-US.js';
import electronicSignaturesLocale from './modules/electronic-signatures.en-US.js';
import wecomAttendanceLocale from './modules/wecom-attendance.en-US.js';
import hrMasterDataLocale from '../../client/locales/modules/hr-master-data.en-US.js';
import attendanceResultsLocale from './modules/attendance-results.en-US.js';
import processOperationsLocale from './modules/process-operations.en-US.js';
import financeIntegrationLocale from '../../client/locales/modules/finance-integration.en-US.js';
import accessLocale from '../../client/locales/modules/access.en-US.js';
import demoData from '../../client/locales/modules/demo-data.en-US.js';
import processManagementLocale from '../../client/locales/modules/process-management.en-US.js';
import personalSchedulesLocale from './modules/personal-schedules.en-US.js';
import transferLocale from './modules/transfer.en-US.js';
import certificatesLocale from './modules/certificates.en-US.js';
import attendanceManagementLocale from './modules/attendance-management.en-US.js';
import sealsLocale from './modules/seals.en-US.js';
import workItemsLocale from './modules/work-items.en-US.js';
import knowledgeLocale from './modules/knowledge.en-US.js';
import recruitmentLocale from './modules/recruitment.en-US.js';
import onboardingLocale from './modules/onboarding.en-US.js';
import announcementsLocale from './modules/announcements.en-US.js';
import vehiclesLocale from './modules/vehicles.en-US.js';
import meetingRoomsLocale from './modules/meeting-rooms.en-US.js';
import jobGradesLocale from './modules/job-grades.en-US.js';
import headcountsLocale from './modules/headcounts.en-US.js';
import templatePrintLocale from './modules/template-print.en-US.js';
import contractsLocale from './modules/contracts.en-US.js';
import assetRequestsLocale from './modules/asset-requests.en-US.js';
import vendorQualificationLocale from './modules/vendor-qualification.en-US.js';
import personnelSchedules from './modules/personnel-schedules.en-US.js';
import assetLocale from './modules/assets.en-US.js';
import type { LocaleResource } from '@nocobase/i18n';
import approvals from './modules/approvals.en-US.js';
import annualLeave from './modules/annual-leave.en-US.js';

// The application's own server-side wording. It is empty because every string the server produces today belongs to a
// plugin's namespace; add keys here as the application starts producing its own, and use `overrides` to reword a
// plugin's.
const enUS = {
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
      gm: 'General manager',
      cfo: 'CFO',
      hr: 'HR specialist',
      hrbp: 'HRBP',
      hrDirector: 'HR director',
      admin: 'Administration',
      sealKeeper: 'Seal keeper',
      finance: 'Accountant',
      financeManager: 'Finance manager',
      cashier: 'Cashier',
      legal: 'Legal',
      purchasing: 'Purchasing',
      it: 'IT',
      committeeTech: 'Review committee (technical seat)',
    },
  },
};

export type AppServerResource = LocaleResource<typeof enUS>;

export default enUS;
