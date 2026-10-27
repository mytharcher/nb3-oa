import invoiceRecognitionLocale from './modules/invoice-recognition.de-DE.js';
import electronicSignaturesLocale from './modules/electronic-signatures.de-DE.js';
import wecomAttendanceLocale from './modules/wecom-attendance.de-DE.js';
import hrMasterDataLocale from './modules/hr-master-data.de-DE.js';
import globalSearchLocale from './modules/global-search.de-DE.js';
import enterpriseIdentityLocale from './modules/enterprise-identity.de-DE.js';
import processOperationsLocale from './modules/process-operations.de-DE.js';
import financeIntegrationLocale from './modules/finance-integration.de-DE.js';
import attendanceResultsLocale from './modules/attendance-results.de-DE.js';
import personalSchedulesLocale from './modules/personal-schedules.de-DE.js';
import demoData from './modules/demo-data.de-DE.js';
import processManagementLocale from './modules/process-management.de-DE.js';
import attendanceImportEnUS from './modules/attendance-import.de-DE.js';
import reportsExpenseEnUS from './modules/reports-expense.de-DE.js';
import reportsEfficiencyEnUS from './modules/reports-efficiency.de-DE.js';
import onboardingLocale from './modules/onboarding.de-DE.js';
import sealsLocale from './modules/seals.de-DE.js';
import recruitmentLocale from './modules/recruitment.de-DE.js';
import announcementsLocale from './modules/announcements.de-DE.js';
import workItemsLocale from './modules/work-items.de-DE.js';
import taskCenterUiLocale from '../extensions/nocobase-task-center-ui/locales/de-DE.js';
import taskCenterLocale from './modules/task-center.de-DE.js';
import knowledgeLocale from './modules/knowledge.de-DE.js';
import transferLocale from './modules/transfer.de-DE.js';
import attendanceManagementLocale from './modules/attendance-management.de-DE.js';
import certificatesLocale from './modules/certificates.de-DE.js';
import accessLocale from './modules/access.de-DE.js';
import meetingRoomsLocale from './modules/meeting-rooms.de-DE.js';
import vehiclesLocale from './modules/vehicles.de-DE.js';
import jobGradesLocale from './modules/job-grades.de-DE.js';
import templatePrintLocale from './modules/template-print.de-DE.js';
import headcountsLocale from './modules/headcounts.de-DE.js';
import contractsLocale from './modules/contracts.de-DE.js';
import assetRequestsLocale from './modules/asset-requests.de-DE.js';
import vendorQualificationLocale from './modules/vendor-qualification.de-DE.js';
import assetLocale from './modules/assets.de-DE.js';
import departureLocale from './modules/departure.de-DE.js';
import probationFormCopy from './modules/probation-form.de-DE.js';
import probationActionsCopy from './modules/probation-actions.de-DE.js';
import probationLocale from './modules/probation.de-DE.js';
import paymentFormEnUS from './modules/payment-requests-form.de-DE.js';
import paymentActionsEnUS from './modules/payment-actions.de-DE.js';
import reimbursementLocale from './modules/reimbursement.de-DE.js';
import purchasesLocale from './modules/purchases.de-DE.js';
import travelEnUS from './modules/travel.de-DE.js';
import travelCancellationEnUS from './modules/travel-cancellations.de-DE.js';
import loanRequestsEnUS from './modules/loan-requests.de-DE.js';
import paymentRequestsEnUS from './modules/payment-requests.de-DE.js';
import vendorsEnUS from './modules/vendors.de-DE.js';
import financeAssignmentsEnUS from './modules/finance-assignments.de-DE.js';
import trainingEnUS from './modules/training.de-DE.js';
import expensePlansEnUS from './modules/expense-plan.de-DE.js';
import expenseAuthorizationsEnUS from './modules/expense-authorizations.de-DE.js';
import suppliesLocale from './modules/supplies.de-DE.js';
import budgetsEnUS from './modules/budgets.de-DE.js';
import reportsEnUS from './modules/reports.de-DE.js';
import budgetAdjustmentsEnUS from './modules/budget-adjustments.de-DE.js';
import generalLocale from './modules/general.de-DE.js';
import outingsEnUS from './modules/outings.de-DE.js';
import attendanceChangeEnUS from './modules/attendance-change.de-DE.js';
import cancellationsEnUS from './modules/leave-cancellations.de-DE.js';
import workbenchEnUS from './modules/workbench.de-DE.js';
import centerEnUS from './modules/approval-center.de-DE.js';
import overtimeEnUS from './modules/overtime.de-DE.js';
import leaveBalancesEnUS from './modules/leave-balances.de-DE.js';
import admin0 from './administration/users/de-DE.js';
import admin1 from './administration/api-keys/de-DE.js';
import admin2 from './administration/authorization/de-DE.js';
import admin3 from './administration/authz-default-access/de-DE.js';
import admin4 from './administration/authz-sharing-rules/de-DE.js';
import admin5 from './administration/authz-restriction-rules/de-DE.js';
import admin7 from './administration/notification/de-DE.js';
import admin8 from './administration/scheduler/de-DE.js';
import type { AppResource } from './en-US.js';
import employeesEnUS from './modules/employees.de-DE.js';
import importEnUS from './modules/import.de-DE.js';
import orgEnUS from './modules/org.de-DE.js';
import platformEnUS from './modules/platform.de-DE.js';
import approvalsEnUS from './modules/approvals.de-DE.js';

import system from './system/de-DE.js';

const deDE: AppResource = {
  demoData,
  ...processManagementLocale,
  ...attendanceImportEnUS,
  ...reportsExpenseEnUS,
  reportsEfficiency: reportsEfficiencyEnUS,
  ...sealsLocale,
  ...recruitmentLocale,
  ...onboardingLocale,
  ...announcementsLocale,
  transfer: transferLocale,
  ...attendanceManagementLocale,
  ...attendanceResultsLocale,
  ...wecomAttendanceLocale,
  ...certificatesLocale,
  ...knowledgeLocale,
  ...workItemsLocale,
  ...taskCenterUiLocale,
  ...taskCenterLocale,
  ...globalSearchLocale,
  ...enterpriseIdentityLocale,
  ...processOperationsLocale,
  ...financeIntegrationLocale,
  ...invoiceRecognitionLocale,
  ...electronicSignaturesLocale,
  ...hrMasterDataLocale,
  ...personalSchedulesLocale,
  ...accessLocale,
  ...meetingRoomsLocale,
  ...vehiclesLocale,
  ...templatePrintLocale,
  ...jobGradesLocale,
  ...headcountsLocale,
  ...contractsLocale,
  assetRequests: assetRequestsLocale,
  ...vendorQualificationLocale,
  assets: assetLocale,
  ...system,
  'shell.buildFreely': 'Ihr vernetzter Arbeitsplatz.',
  'shell.reliability': 'Menschen, Arbeit und Genehmigungen an einem Ort.',
  // Application-owned OA copy overrides the template authentication branding.
  'auth.brandName': 'NocoOA',
  'navigation.brandHome': 'NocoOA-Startseite',
  'auth.welcome': 'Willkommen zurück in Ihrem OA-Arbeitsbereich',
  'auth.loginDescription':
    'Melden Sie sich mit Ihrem Benutzernamen oder Ihrer E-Mail-Adresse an, um Aufgaben zu verwalten und mit Ihrem Team verbunden zu bleiben.',
  'auth.about': 'Über den OA-Arbeitsbereich',
  'auth.platform': 'Ihr täglicher Arbeitsbereich',
  'auth.marketingTitleFirst': 'Gemeinsam arbeiten.',
  'auth.marketingTitleSecond': 'Entspannt arbeiten.',
  'auth.marketingDescription':
    'Vereinen Sie Genehmigungen, Mitarbeiterservices und Teaminformationen, damit Sie Anträge im Blick behalten und sich auf wichtige Arbeit konzentrieren können.',
  'auth.frontend': 'Aufgaben in Reichweite',
  'auth.frontendDescription':
    'Bearbeiten Sie ausstehende Genehmigungen und verfolgen Sie Ihre Anträge in einem Arbeitsbereich.',
  'auth.foundation': 'Vernetzte Teams',
  'auth.foundationDescription':
    'Finden Sie Mitarbeiterservices, gemeinsames Wissen und Verwaltungsressourcen an einem Ort.',
  'auth.marketingFooter': 'Ein klarer Start in jeden Arbeitstag.',
  departureRequests: departureLocale,
  probationRequests: {
    ...probationLocale.probationRequests,
    ...probationFormCopy,
    ...probationActionsCopy,
  },
  ...reimbursementLocale,
  ...purchasesLocale,
  ...financeAssignmentsEnUS,
  ...vendorsEnUS,
  ...loanRequestsEnUS,
  ...paymentRequestsEnUS,
  ...paymentFormEnUS,
  paymentRequests: {
    ...paymentRequestsEnUS.paymentRequests,
    ...paymentActionsEnUS,
  },
  ...trainingEnUS,
  ...travelEnUS,
  ...travelCancellationEnUS,
  ...expensePlansEnUS,
  ...expenseAuthorizationsEnUS,
  ...budgetsEnUS,
  ...reportsEnUS,
  ...budgetAdjustmentsEnUS,
  ...outingsEnUS,
  ...attendanceChangeEnUS,
  ...cancellationsEnUS,
  ...centerEnUS,
  ...workbenchEnUS,
  ...generalLocale,
  ...suppliesLocale,
  ...overtimeEnUS,
  navigation: { ...system.navigation, home: workbenchEnUS.workbench.title },
  ...leaveBalancesEnUS,
  attachmentList: {
    images: 'Bilder',
    files: 'Dateien',
    preview: 'Vorschau von {name}',
    download: '{name} herunterladen',
  },
  actions: {
    ...system.actions,
    close: 'Schließen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    language: 'Sprache',
    create: 'Erstellen',
    saving: 'Wird gespeichert…',
    discard: 'Änderungen verwerfen',
    signInAgain: 'Erneut anmelden',
  },
  'status.sessionExpired':
    'Ihre Sitzung ist abgelaufen. Melden Sie sich erneut an, um fortzufahren.',
  formDrawer: {
    discardTitle: 'Nicht gespeicherte Änderungen verwerfen?',
    discardDescription:
      'Beim Schließen werden Ihre nicht gespeicherten Änderungen verworfen.',
    continueEditing: 'Weiter bearbeiten',
  },
  ...employeesEnUS,
  ...importEnUS,
  ...orgEnUS,
  ...platformEnUS,
  ...approvalsEnUS,
  overrides: {
    ...approvalsEnUS.overrides,
    '@nocobase/app-plugin-users': admin0,
    '@nocobase/app-plugin-api-keys': admin1,
    '@nocobase/app-plugin-authorization': admin2,
    '@nocobase/app-plugin-authz-default-access': admin3,
    '@nocobase/app-plugin-authz-sharing-rules': admin4,
    '@nocobase/app-plugin-authz-restriction-rules': admin5,
    '@nocobase/app-plugin-notification': admin7,
    '@nocobase/app-plugin-scheduler': admin8,
  },
  oa: {
    navigation: {
      backToApplication: 'Zurück zur Anwendung',
      systemLabel: 'Navigation der Systemverwaltung',
      systemPeople: 'Benutzer und Organisation',
      systemAccess: 'Rollen und Berechtigungen',
      systemConnections: 'Benachrichtigungen und Integrationen',
      systemOperations: 'Betrieb',
      office: 'Büroalltag',
      finance: 'Finanzen und Ausgaben',
      procurement: 'Beschaffung und Verträge',
      administration: 'Verwaltung und Anlagen',

      personal: 'Persönlich',
      organization: 'Organisation',
      hr: 'Personalwesen',
      configuration: 'Geschäftskonfiguration',
      system: 'Systemverwaltung',
      inbox: 'Nachrichten',
      automation: 'Automatisierung',
      agents: 'Agenten',
      runtimes: 'Agentenlaufzeiten',
      skills: 'Agentenfähigkeiten',
      models: 'Modelldienste',
      agentUsage: 'Agentennutzung',
      users: 'Benutzerkonten',
      permissionSets: 'Berechtigungssätze',
      defaultAccess: 'Standardzugriff',
      sharingRules: 'Freigaberegeln',
      restrictionRules: 'Einschränkungsregeln',
      inspector: 'Berechtigungsprüfung',
      apiKeys: 'API-Schlüssel',
      notificationLogs: 'Benachrichtigungsprotokolle',
      schedules: 'Geplante Aufgaben',
      access: 'Zugriffskontrolle',
    },
  },
  userPicker: {
    placeholder: 'Nach Name, Benutzername oder E-Mail suchen',
    multiplePlaceholder: 'Personen hinzufügen',
    empty: 'Keine passenden Benutzer',
    searching: 'Wird gesucht…',
    forbidden: 'Sie sind nicht berechtigt, Benutzer zu suchen.',
    loadFailed: 'Benutzer konnten nicht geladen werden.',
    remove: '{{name}} entfernen',
  },
  tableScroll: {
    region: 'Horizontaler Tabellen-Scrollbereich',
    hint: 'Scrollen Sie, um alle Spalten zu sehen',
    left: 'Tabelle nach links scrollen',
    right: 'Tabelle nach rechts scrollen',
  },
  datePicker: {
    placeholder: 'Datum auswählen',
    rangePlaceholder: 'Zeitraum auswählen',
  },
};

export default deDE;
