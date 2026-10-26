import reportExportsLocale from './modules/report-exports.ru-RU.js';
import plugins from './plugins/ru-RU.js';
import reportsLocale from '../../client/locales/modules/reports.ru-RU.js';
import invoiceRecognitionLocale from '../../client/locales/modules/invoice-recognition.ru-RU.js';
import electronicSignaturesLocale from './modules/electronic-signatures.ru-RU.js';
import wecomAttendanceLocale from './modules/wecom-attendance.ru-RU.js';
import hrMasterDataLocale from '../../client/locales/modules/hr-master-data.ru-RU.js';
import attendanceResultsLocale from './modules/attendance-results.ru-RU.js';
import processOperationsLocale from './modules/process-operations.ru-RU.js';
import financeIntegrationLocale from '../../client/locales/modules/finance-integration.ru-RU.js';
import accessLocale from '../../client/locales/modules/access.ru-RU.js';
import demoData from '../../client/locales/modules/demo-data.ru-RU.js';
import processManagementLocale from '../../client/locales/modules/process-management.ru-RU.js';
import personalSchedulesLocale from './modules/personal-schedules.ru-RU.js';
import transferLocale from './modules/transfer.ru-RU.js';
import certificatesLocale from './modules/certificates.ru-RU.js';
import attendanceManagementLocale from './modules/attendance-management.ru-RU.js';
import sealsLocale from './modules/seals.ru-RU.js';
import workItemsLocale from './modules/work-items.ru-RU.js';
import knowledgeLocale from './modules/knowledge.ru-RU.js';
import recruitmentLocale from './modules/recruitment.ru-RU.js';
import onboardingLocale from './modules/onboarding.ru-RU.js';
import announcementsLocale from './modules/announcements.ru-RU.js';
import vehiclesLocale from './modules/vehicles.ru-RU.js';
import meetingRoomsLocale from './modules/meeting-rooms.ru-RU.js';
import jobGradesLocale from './modules/job-grades.ru-RU.js';
import headcountsLocale from './modules/headcounts.ru-RU.js';
import templatePrintLocale from './modules/template-print.ru-RU.js';
import contractsLocale from './modules/contracts.ru-RU.js';
import assetRequestsLocale from './modules/asset-requests.ru-RU.js';
import vendorQualificationLocale from './modules/vendor-qualification.ru-RU.js';
import personnelSchedules from './modules/personnel-schedules.ru-RU.js';
import assetLocale from './modules/assets.ru-RU.js';
import type { AppServerResource } from './en-US.js';
import approvals from './modules/approvals.ru-RU.js';
import annualLeave from './modules/annual-leave.ru-RU.js';

// The application's own server-side wording. It is empty because every string the server produces today belongs to a
// plugin's namespace; add keys here as the application starts producing its own, and use `overrides` to reword a
// plugin's.
const ruRU: AppServerResource = {
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
      gm: 'Генеральный директор',
      cfo: 'Финансовый директор',
      hr: 'Кадровый специалист',
      hrbp: 'Кадровый бизнес-партнёр',
      hrDirector: 'Директор по персоналу',
      admin: 'Администрирование',
      sealKeeper: 'Хранитель печати',
      finance: 'Бухгалтер',
      financeManager: 'Финансовый менеджер',
      cashier: 'Кассир',
      legal: 'Юридический отдел',
      purchasing: 'Закупки',
      it: 'ИТ',
      committeeTech: 'Комиссия проверки (техническое место)',
    },
  },
};

export default ruRU;
