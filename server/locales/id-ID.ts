import itRepairLocale from '../../client/locales/modules/it-repairs.en-US.js';
import reportExportsLocale from './modules/report-exports.id-ID.js';
import reportsLocale from '../../client/locales/modules/reports.id-ID.js';
import invoiceRecognitionLocale from '../../client/locales/modules/invoice-recognition.id-ID.js';
import electronicSignaturesLocale from './modules/electronic-signatures.id-ID.js';
import wecomAttendanceLocale from './modules/wecom-attendance.id-ID.js';
import hrMasterDataLocale from '../../client/locales/modules/hr-master-data.id-ID.js';
import attendanceResultsLocale from './modules/attendance-results.id-ID.js';
import processOperationsLocale from './modules/process-operations.id-ID.js';
import financeIntegrationLocale from '../../client/locales/modules/finance-integration.id-ID.js';
import accessLocale from '../../client/locales/modules/access.id-ID.js';
import demoData from '../../client/locales/modules/demo-data.id-ID.js';
import processManagementLocale from '../../client/locales/modules/process-management.id-ID.js';
import personalSchedulesLocale from './modules/personal-schedules.id-ID.js';
import transferLocale from './modules/transfer.id-ID.js';
import certificatesLocale from './modules/certificates.id-ID.js';
import attendanceManagementLocale from './modules/attendance-management.id-ID.js';
import sealsLocale from './modules/seals.id-ID.js';
import workItemsLocale from './modules/work-items.id-ID.js';
import knowledgeLocale from './modules/knowledge.id-ID.js';
import recruitmentLocale from './modules/recruitment.id-ID.js';
import onboardingLocale from './modules/onboarding.id-ID.js';
import announcementsLocale from './modules/announcements.id-ID.js';
import vehiclesLocale from './modules/vehicles.id-ID.js';
import meetingRoomsLocale from './modules/meeting-rooms.id-ID.js';
import jobGradesLocale from './modules/job-grades.id-ID.js';
import headcountsLocale from './modules/headcounts.id-ID.js';
import templatePrintLocale from './modules/template-print.id-ID.js';
import contractsLocale from './modules/contracts.id-ID.js';
import assetRequestsLocale from './modules/asset-requests.id-ID.js';
import vendorQualificationLocale from './modules/vendor-qualification.id-ID.js';
import personnelSchedules from './modules/personnel-schedules.id-ID.js';
import assetLocale from './modules/assets.id-ID.js';
import type { AppServerResource } from './en-US.js';
import approvals from './modules/approvals.id-ID.js';
import annualLeave from './modules/annual-leave.id-ID.js';

// The application's own server-side wording. It is empty because every string the server produces today belongs to a
// plugin's namespace; add keys here as the application starts producing its own, and use `overrides` to reword a
// plugin's.
const idID: AppServerResource = {
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
      gm: 'Manajer umum',
      cfo: 'Direktur keuangan',
      hr: 'Spesialis SDM',
      hrbp: 'Mitra bisnis SDM',
      hrDirector: 'Direktur SDM',
      admin: 'Administrasi',
      sealKeeper: 'Penjaga stempel',
      finance: 'Akuntan',
      financeManager: 'Manajer keuangan',
      cashier: 'Kasir',
      legal: 'Hukum',
      purchasing: 'Pembelian',
      it: 'TI',
      committeeTech: 'Komite peninjau (posisi teknis)',
    },
  },
};

export default idID;
