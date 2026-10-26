import reportExportsLocale from './modules/report-exports.pt-BR.js';
import reportsLocale from '../../client/locales/modules/reports.pt-BR.js';
import invoiceRecognitionLocale from '../../client/locales/modules/invoice-recognition.pt-BR.js';
import electronicSignaturesLocale from './modules/electronic-signatures.pt-BR.js';
import wecomAttendanceLocale from './modules/wecom-attendance.pt-BR.js';
import hrMasterDataLocale from '../../client/locales/modules/hr-master-data.pt-BR.js';
import attendanceResultsLocale from './modules/attendance-results.pt-BR.js';
import processOperationsLocale from './modules/process-operations.pt-BR.js';
import financeIntegrationLocale from '../../client/locales/modules/finance-integration.pt-BR.js';
import accessLocale from '../../client/locales/modules/access.pt-BR.js';
import demoData from '../../client/locales/modules/demo-data.pt-BR.js';
import processManagementLocale from '../../client/locales/modules/process-management.pt-BR.js';
import personalSchedulesLocale from './modules/personal-schedules.pt-BR.js';
import transferLocale from './modules/transfer.pt-BR.js';
import certificatesLocale from './modules/certificates.pt-BR.js';
import attendanceManagementLocale from './modules/attendance-management.pt-BR.js';
import sealsLocale from './modules/seals.pt-BR.js';
import workItemsLocale from './modules/work-items.pt-BR.js';
import knowledgeLocale from './modules/knowledge.pt-BR.js';
import recruitmentLocale from './modules/recruitment.pt-BR.js';
import onboardingLocale from './modules/onboarding.pt-BR.js';
import announcementsLocale from './modules/announcements.pt-BR.js';
import vehiclesLocale from './modules/vehicles.pt-BR.js';
import meetingRoomsLocale from './modules/meeting-rooms.pt-BR.js';
import jobGradesLocale from './modules/job-grades.pt-BR.js';
import headcountsLocale from './modules/headcounts.pt-BR.js';
import templatePrintLocale from './modules/template-print.pt-BR.js';
import contractsLocale from './modules/contracts.pt-BR.js';
import assetRequestsLocale from './modules/asset-requests.pt-BR.js';
import vendorQualificationLocale from './modules/vendor-qualification.pt-BR.js';
import personnelSchedules from './modules/personnel-schedules.pt-BR.js';
import assetLocale from './modules/assets.pt-BR.js';
import type { AppServerResource } from './en-US.js';
import approvals from './modules/approvals.pt-BR.js';
import annualLeave from './modules/annual-leave.pt-BR.js';

// The application's own server-side wording. It is empty because every string the server produces today belongs to a
// plugin's namespace; add keys here as the application starts producing its own, and use `overrides` to reword a
// plugin's.
const ptBR: AppServerResource = {
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
      gm: 'Diretor geral',
      cfo: 'Diretor financeiro',
      hr: 'Especialista de RH',
      hrbp: 'Parceiro de negócios de RH',
      hrDirector: 'Diretor de RH',
      admin: 'Administração',
      sealKeeper: 'Responsável pelos carimbos',
      finance: 'Contador',
      financeManager: 'Gerente financeiro',
      cashier: 'Caixa',
      legal: 'Jurídico',
      purchasing: 'Compras',
      it: 'TI',
      committeeTech: 'Comitê de revisão (assento técnico)',
    },
  },
};

export default ptBR;
