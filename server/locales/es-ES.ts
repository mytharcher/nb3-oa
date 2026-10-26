import reportExportsLocale from './modules/report-exports.es-ES.js';
import reportsLocale from '../../client/locales/modules/reports.es-ES.js';
import invoiceRecognitionLocale from '../../client/locales/modules/invoice-recognition.es-ES.js';
import electronicSignaturesLocale from './modules/electronic-signatures.es-ES.js';
import wecomAttendanceLocale from './modules/wecom-attendance.es-ES.js';
import hrMasterDataLocale from '../../client/locales/modules/hr-master-data.es-ES.js';
import attendanceResultsLocale from './modules/attendance-results.es-ES.js';
import processOperationsLocale from './modules/process-operations.es-ES.js';
import financeIntegrationLocale from '../../client/locales/modules/finance-integration.es-ES.js';
import accessLocale from '../../client/locales/modules/access.es-ES.js';
import demoData from '../../client/locales/modules/demo-data.es-ES.js';
import processManagementLocale from '../../client/locales/modules/process-management.es-ES.js';
import personalSchedulesLocale from './modules/personal-schedules.es-ES.js';
import transferLocale from './modules/transfer.es-ES.js';
import certificatesLocale from './modules/certificates.es-ES.js';
import attendanceManagementLocale from './modules/attendance-management.es-ES.js';
import sealsLocale from './modules/seals.es-ES.js';
import workItemsLocale from './modules/work-items.es-ES.js';
import knowledgeLocale from './modules/knowledge.es-ES.js';
import recruitmentLocale from './modules/recruitment.es-ES.js';
import onboardingLocale from './modules/onboarding.es-ES.js';
import announcementsLocale from './modules/announcements.es-ES.js';
import vehiclesLocale from './modules/vehicles.es-ES.js';
import meetingRoomsLocale from './modules/meeting-rooms.es-ES.js';
import jobGradesLocale from './modules/job-grades.es-ES.js';
import headcountsLocale from './modules/headcounts.es-ES.js';
import templatePrintLocale from './modules/template-print.es-ES.js';
import contractsLocale from './modules/contracts.es-ES.js';
import assetRequestsLocale from './modules/asset-requests.es-ES.js';
import vendorQualificationLocale from './modules/vendor-qualification.es-ES.js';
import personnelSchedules from './modules/personnel-schedules.es-ES.js';
import assetLocale from './modules/assets.es-ES.js';
import type { AppServerResource } from './en-US.js';
import approvals from './modules/approvals.es-ES.js';
import annualLeave from './modules/annual-leave.es-ES.js';

// The application's own server-side wording. It is empty because every string the server produces today belongs to a
// plugin's namespace; add keys here as the application starts producing its own, and use `overrides` to reword a
// plugin's.
const esES: AppServerResource = {
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
      gm: 'Director general',
      cfo: 'CFO',
      hr: 'Especialista de RR. HH.',
      hrbp: 'HRBP',
      hrDirector: 'Director de RR. HH.',
      admin: 'Administración',
      sealKeeper: 'Responsable del sello',
      finance: 'Contable',
      financeManager: 'Responsable de finanzas',
      cashier: 'Cajero',
      legal: 'Asesoría jurídica',
      purchasing: 'Compras',
      it: 'TI',
      committeeTech: 'Comité de revisión (representante técnico)',
    },
  },
};

export default esES;
