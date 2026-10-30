import itRepairLocale from '../../client/locales/modules/it-repairs.en-US.js';
import reportExportsLocale from './modules/report-exports.fr-FR.js';
import type { AppServerResource } from './en-US.js';
import reportsLocale from '../../client/locales/modules/reports.fr-FR.js';
import invoiceRecognitionLocale from '../../client/locales/modules/invoice-recognition.fr-FR.js';
import electronicSignaturesLocale from './modules/electronic-signatures.fr-FR.js';
import wecomAttendanceLocale from './modules/wecom-attendance.fr-FR.js';
import hrMasterDataLocale from '../../client/locales/modules/hr-master-data.fr-FR.js';
import attendanceResultsLocale from './modules/attendance-results.fr-FR.js';
import processOperationsLocale from './modules/process-operations.fr-FR.js';
import financeIntegrationLocale from '../../client/locales/modules/finance-integration.fr-FR.js';
import accessLocale from '../../client/locales/modules/access.fr-FR.js';
import demoData from '../../client/locales/modules/demo-data.fr-FR.js';
import processManagementLocale from '../../client/locales/modules/process-management.fr-FR.js';
import personalSchedulesLocale from './modules/personal-schedules.fr-FR.js';
import transferLocale from './modules/transfer.fr-FR.js';
import certificatesLocale from './modules/certificates.fr-FR.js';
import attendanceManagementLocale from './modules/attendance-management.fr-FR.js';
import sealsLocale from './modules/seals.fr-FR.js';
import workItemsLocale from './modules/work-items.fr-FR.js';
import knowledgeLocale from './modules/knowledge.fr-FR.js';
import recruitmentLocale from './modules/recruitment.fr-FR.js';
import onboardingLocale from './modules/onboarding.fr-FR.js';
import announcementsLocale from './modules/announcements.fr-FR.js';
import vehiclesLocale from './modules/vehicles.fr-FR.js';
import meetingRoomsLocale from './modules/meeting-rooms.fr-FR.js';
import jobGradesLocale from './modules/job-grades.fr-FR.js';
import headcountsLocale from './modules/headcounts.fr-FR.js';
import templatePrintLocale from './modules/template-print.fr-FR.js';
import contractsLocale from './modules/contracts.fr-FR.js';
import assetRequestsLocale from './modules/asset-requests.fr-FR.js';
import vendorQualificationLocale from './modules/vendor-qualification.fr-FR.js';
import personnelSchedules from './modules/personnel-schedules.fr-FR.js';
import assetLocale from './modules/assets.fr-FR.js';
import approvals from './modules/approvals.fr-FR.js';
import annualLeave from './modules/annual-leave.fr-FR.js';

// The application's own server-side wording. It is empty because every string the server produces today belongs to a
// plugin's namespace; add keys here as the application starts producing its own, and use `overrides` to reword a
// plugin's.
const frFR: AppServerResource = {
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
      gm: 'Directeur général',
      cfo: 'Directeur financier',
      hr: 'Spécialiste RH',
      hrbp: 'Partenaire RH',
      hrDirector: 'Directeur des ressources humaines',
      admin: 'Administration',
      sealKeeper: 'Dépositaire des sceaux',
      finance: 'Comptable',
      financeManager: 'Responsable financier',
      cashier: 'Caissier',
      legal: 'Juridique',
      purchasing: 'Achats',
      it: 'Informatique',
      committeeTech: 'Comité d’examen (siège technique)',
    },
  },
};

export default frFR;
