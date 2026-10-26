import type { AppResource } from './en-US.js';
import invoiceRecognitionLocale from './modules/invoice-recognition.fr-FR.js';
import electronicSignaturesLocale from './modules/electronic-signatures.fr-FR.js';
import wecomAttendanceLocale from './modules/wecom-attendance.fr-FR.js';
import hrMasterDataLocale from './modules/hr-master-data.fr-FR.js';
import globalSearchLocale from './modules/global-search.fr-FR.js';
import enterpriseIdentityLocale from './modules/enterprise-identity.fr-FR.js';
import processOperationsLocale from './modules/process-operations.fr-FR.js';
import financeIntegrationLocale from './modules/finance-integration.fr-FR.js';
import attendanceResultsLocale from './modules/attendance-results.fr-FR.js';
import personalSchedulesLocale from './modules/personal-schedules.fr-FR.js';
import demoData from './modules/demo-data.fr-FR.js';
import processManagementLocale from './modules/process-management.fr-FR.js';
import attendanceImportEnUS from './modules/attendance-import.fr-FR.js';
import reportsExpenseEnUS from './modules/reports-expense.fr-FR.js';
import reportsEfficiencyEnUS from './modules/reports-efficiency.fr-FR.js';
import onboardingLocale from './modules/onboarding.fr-FR.js';
import sealsLocale from './modules/seals.fr-FR.js';
import recruitmentLocale from './modules/recruitment.fr-FR.js';
import announcementsLocale from './modules/announcements.fr-FR.js';
import workItemsLocale from './modules/work-items.fr-FR.js';
import taskCenterUiLocale from '../extensions/nocobase-task-center-ui/locales/fr-FR.js';
import taskCenterLocale from './modules/task-center.fr-FR.js';
import knowledgeLocale from './modules/knowledge.fr-FR.js';
import transferLocale from './modules/transfer.fr-FR.js';
import attendanceManagementLocale from './modules/attendance-management.fr-FR.js';
import certificatesLocale from './modules/certificates.fr-FR.js';
import accessLocale from './modules/access.fr-FR.js';
import meetingRoomsLocale from './modules/meeting-rooms.fr-FR.js';
import vehiclesLocale from './modules/vehicles.fr-FR.js';
import jobGradesLocale from './modules/job-grades.fr-FR.js';
import templatePrintLocale from './modules/template-print.fr-FR.js';
import headcountsLocale from './modules/headcounts.fr-FR.js';
import contractsLocale from './modules/contracts.fr-FR.js';
import assetRequestsLocale from './modules/asset-requests.fr-FR.js';
import vendorQualificationLocale from './modules/vendor-qualification.fr-FR.js';
import assetLocale from './modules/assets.fr-FR.js';
import departureLocale from './modules/departure.fr-FR.js';
import probationFormCopy from './modules/probation-form.fr-FR.js';
import probationActionsCopy from './modules/probation-actions.fr-FR.js';
import probationLocale from './modules/probation.fr-FR.js';
import paymentFormEnUS from './modules/payment-requests-form.fr-FR.js';
import paymentActionsEnUS from './modules/payment-actions.fr-FR.js';
import reimbursementLocale from './modules/reimbursement.fr-FR.js';
import purchasesLocale from './modules/purchases.fr-FR.js';
import travelEnUS from './modules/travel.fr-FR.js';
import travelCancellationEnUS from './modules/travel-cancellations.fr-FR.js';
import loanRequestsEnUS from './modules/loan-requests.fr-FR.js';
import paymentRequestsEnUS from './modules/payment-requests.fr-FR.js';
import vendorsEnUS from './modules/vendors.fr-FR.js';
import financeAssignmentsEnUS from './modules/finance-assignments.fr-FR.js';
import trainingEnUS from './modules/training.fr-FR.js';
import expensePlansEnUS from './modules/expense-plan.fr-FR.js';
import expenseAuthorizationsEnUS from './modules/expense-authorizations.fr-FR.js';
import suppliesLocale from './modules/supplies.fr-FR.js';
import budgetsEnUS from './modules/budgets.fr-FR.js';
import reportsEnUS from './modules/reports.fr-FR.js';
import budgetAdjustmentsEnUS from './modules/budget-adjustments.fr-FR.js';
import generalLocale from './modules/general.fr-FR.js';
import outingsEnUS from './modules/outings.fr-FR.js';
import attendanceChangeEnUS from './modules/attendance-change.fr-FR.js';
import cancellationsEnUS from './modules/leave-cancellations.fr-FR.js';
import workbenchEnUS from './modules/workbench.fr-FR.js';
import centerEnUS from './modules/approval-center.fr-FR.js';
import overtimeEnUS from './modules/overtime.fr-FR.js';
import leaveBalancesEnUS from './modules/leave-balances.fr-FR.js';
import admin0 from './administration/users/fr-FR.js';
import admin1 from './administration/api-keys/fr-FR.js';
import admin2 from './administration/authorization/fr-FR.js';
import admin3 from './administration/authz-default-access/fr-FR.js';
import admin4 from './administration/authz-sharing-rules/fr-FR.js';
import admin5 from './administration/authz-restriction-rules/fr-FR.js';
import admin7 from './administration/notification/fr-FR.js';
import admin8 from './administration/scheduler/fr-FR.js';
import employeesEnUS from './modules/employees.fr-FR.js';
import importEnUS from './modules/import.fr-FR.js';
import orgEnUS from './modules/org.fr-FR.js';
import platformEnUS from './modules/platform.fr-FR.js';
import approvalsEnUS from './modules/approvals.fr-FR.js';

import system from './system/fr-FR.js';

const frFR: AppResource = {
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
  'shell.buildFreely': 'Votre espace de travail connecté.',
  'shell.reliability': 'Équipes, travail et approbations réunis.',
  // Application-owned OA copy overrides the template authentication branding.
  'auth.brandName': 'NocoOA',
  'navigation.brandHome': 'Accueil NocoOA',
  'auth.welcome': 'Bienvenue dans votre espace de travail',
  'auth.loginDescription':
    'Connectez-vous avec votre nom d’utilisateur ou votre adresse e-mail pour gérer vos tâches et rester en contact avec votre équipe.',
  'auth.about': 'À propos de votre espace de travail',
  'auth.platform': 'Votre espace de travail au quotidien',
  'auth.marketingTitleFirst': 'Travaillons ensemble.',
  'auth.marketingTitleSecond': 'Travaillons sereinement.',
  'auth.marketingDescription':
    'Réunissez les approbations, les services aux employés et les informations d’équipe pour suivre vos demandes et vous concentrer sur l’essentiel.',
  'auth.frontend': 'Vos tâches à portée de main',
  'auth.frontendDescription':
    'Traitez les approbations en attente et suivez vos demandes depuis un seul espace.',
  'auth.foundation': 'Des équipes connectées',
  'auth.foundationDescription':
    'Retrouvez les services aux employés, les connaissances partagées et les ressources administratives au même endroit.',
  'auth.marketingFooter': 'Commencez chaque journée de travail avec clarté.',
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
  actions: {
    ...system.actions,
    close: 'Fermer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    language: 'Langue',
    create: 'Créer',
    saving: 'Enregistrement…',
    discard: 'Abandonner les modifications',
    signInAgain: 'Se reconnecter',
  },
  'status.sessionExpired':
    'Votre session a pris fin. Reconnectez-vous pour continuer.',
  formDrawer: {
    discardTitle: 'Abandonner les modifications non enregistrées ?',
    discardDescription:
      'La fermeture abandonnera vos modifications non enregistrées.',
    continueEditing: 'Continuer la modification',
  },

  ...employeesEnUS,
  ...importEnUS,
  ...orgEnUS,
  ...platformEnUS,
  ...approvalsEnUS,
  overrides: {
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
      backToApplication: 'Retour à l’application',
      systemLabel: 'Navigation de l’administration système',
      systemPeople: 'Utilisateurs et organisation',
      systemAccess: 'Rôles et autorisations',
      systemConnections: 'Notifications et intégrations',
      systemOperations: 'Exploitation',
      office: 'Vie de bureau',
      finance: 'Finances et frais',
      procurement: 'Achats et contrats',
      administration: 'Administration et biens',

      personal: 'Personnel',
      organization: 'Organisation',
      hr: 'Ressources humaines',
      configuration: 'Configuration métier',
      system: 'Administration système',
      inbox: 'Messages',
      automation: 'Automatisation',
      agents: 'Agents',
      runtimes: 'Environnements d’exécution des agents',
      skills: 'Compétences des agents',
      models: 'Services de modèles',
      agentUsage: 'Utilisation des agents',
      users: 'Comptes utilisateurs',
      permissionSets: 'Ensembles d’autorisations',
      defaultAccess: 'Accès par défaut',
      sharingRules: 'Règles de partage',
      restrictionRules: 'Règles de restriction',
      inspector: 'Inspecteur des autorisations',
      apiKeys: 'Clés API',
      notificationLogs: 'Journaux de notifications',
      schedules: 'Tâches planifiées',
      access: 'Contrôle d’accès',
    },
  },
  userPicker: {
    placeholder: 'Rechercher par nom, identifiant ou adresse e-mail',
    multiplePlaceholder: 'Ajouter des personnes',
    empty: 'Aucun utilisateur correspondant',
    searching: 'Recherche…',
    forbidden: 'Vous n’avez pas l’autorisation de rechercher des utilisateurs.',
    loadFailed: 'Impossible de charger les utilisateurs.',
    remove: 'Retirer {{name}}',
  },
  tableScroll: {
    region: 'Zone de défilement horizontal du tableau',
    hint: 'Faites défiler pour voir toutes les colonnes',
    left: 'Faire défiler le tableau vers la gauche',
    right: 'Faire défiler le tableau vers la droite',
  },
  datePicker: {
    placeholder: 'Choisir une date',
    rangePlaceholder: 'Choisir une période',
  },
};
export default frFR;
