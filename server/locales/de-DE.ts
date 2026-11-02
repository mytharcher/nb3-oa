import itRepairLocale from '../../client/locales/modules/it-repairs.en-US.js';
import reportExportsLocale from './modules/report-exports.de-DE.js';
import reportsLocale from '../../client/locales/modules/reports.de-DE.js';
import invoiceRecognitionLocale from '../../client/locales/modules/invoice-recognition.de-DE.js';
import electronicSignaturesLocale from './modules/electronic-signatures.de-DE.js';
import wecomAttendanceLocale from './modules/wecom-attendance.de-DE.js';
import hrMasterDataLocale from '../../client/locales/modules/hr-master-data.de-DE.js';
import attendanceResultsLocale from './modules/attendance-results.de-DE.js';
import processOperationsLocale from './modules/process-operations.de-DE.js';
import financeIntegrationLocale from '../../client/locales/modules/finance-integration.de-DE.js';
import accessLocale from '../../client/locales/modules/access.de-DE.js';
import demoData from '../../client/locales/modules/demo-data.de-DE.js';
import processManagementLocale from '../../client/locales/modules/process-management.de-DE.js';
import personalSchedulesLocale from './modules/personal-schedules.de-DE.js';
import transferLocale from './modules/transfer.de-DE.js';
import certificatesLocale from './modules/certificates.de-DE.js';
import attendanceManagementLocale from './modules/attendance-management.de-DE.js';
import sealsLocale from './modules/seals.de-DE.js';
import workItemsLocale from './modules/work-items.de-DE.js';
import knowledgeLocale from './modules/knowledge.de-DE.js';
import recruitmentLocale from './modules/recruitment.de-DE.js';
import onboardingLocale from './modules/onboarding.de-DE.js';
import announcementsLocale from './modules/announcements.de-DE.js';
import vehiclesLocale from './modules/vehicles.de-DE.js';
import meetingRoomsLocale from './modules/meeting-rooms.de-DE.js';
import jobGradesLocale from './modules/job-grades.de-DE.js';
import headcountsLocale from './modules/headcounts.de-DE.js';
import templatePrintLocale from './modules/template-print.de-DE.js';
import contractsLocale from './modules/contracts.de-DE.js';
import assetRequestsLocale from './modules/asset-requests.de-DE.js';
import vendorQualificationLocale from './modules/vendor-qualification.de-DE.js';
import personnelSchedules from './modules/personnel-schedules.de-DE.js';
import assetLocale from './modules/assets.de-DE.js';
import type { AppServerResource } from './en-US.js';
import approvals from './modules/approvals.de-DE.js';
import annualLeave from './modules/annual-leave.de-DE.js';

// The application's own server-side wording. It is empty because every string the server produces today belongs to a
// plugin's namespace; add keys here as the application starts producing its own, and use `overrides` to reword a
// plugin's.
const deDE: AppServerResource = {
  ...itRepairLocale,
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
      gm: 'Geschäftsführung',
      cfo: 'Finanzvorstand',
      hr: 'Personalreferent',
      hrbp: 'HR-Business-Partner',
      hrDirector: 'Personalleitung',
      admin: 'Verwaltung',
      sealKeeper: 'Siegelverwalter',
      finance: 'Buchhalter',
      financeManager: 'Finanzleitung',
      cashier: 'Kassenverwalter',
      legal: 'Rechtsabteilung',
      purchasing: 'Einkauf',
      it: 'IT',
      committeeTech: 'Prüfungsausschuss (technischer Sitz)',
    },
  },
};

export default deDE;
