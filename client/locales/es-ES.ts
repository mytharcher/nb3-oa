import invoiceRecognitionLocale from './modules/invoice-recognition.es-ES.js';
import electronicSignaturesLocale from './modules/electronic-signatures.es-ES.js';
import wecomAttendanceLocale from './modules/wecom-attendance.es-ES.js';
import hrMasterDataLocale from './modules/hr-master-data.es-ES.js';
import globalSearchLocale from './modules/global-search.es-ES.js';
import enterpriseIdentityLocale from './modules/enterprise-identity.es-ES.js';
import processOperationsLocale from './modules/process-operations.es-ES.js';
import financeIntegrationLocale from './modules/finance-integration.es-ES.js';
import attendanceResultsLocale from './modules/attendance-results.es-ES.js';
import personalSchedulesLocale from './modules/personal-schedules.es-ES.js';
import demoData from './modules/demo-data.es-ES.js';
import processManagementLocale from './modules/process-management.es-ES.js';
import attendanceImportEnUS from './modules/attendance-import.es-ES.js';
import reportsExpenseEnUS from './modules/reports-expense.es-ES.js';
import reportsEfficiencyEnUS from './modules/reports-efficiency.es-ES.js';
import onboardingLocale from './modules/onboarding.es-ES.js';
import sealsLocale from './modules/seals.es-ES.js';
import recruitmentLocale from './modules/recruitment.es-ES.js';
import announcementsLocale from './modules/announcements.es-ES.js';
import workItemsLocale from './modules/work-items.es-ES.js';
import taskCenterUiLocale from '../extensions/nocobase-task-center-ui/locales/es-ES.js';
import taskCenterLocale from './modules/task-center.es-ES.js';
import knowledgeLocale from './modules/knowledge.es-ES.js';
import transferLocale from './modules/transfer.es-ES.js';
import attendanceManagementLocale from './modules/attendance-management.es-ES.js';
import certificatesLocale from './modules/certificates.es-ES.js';
import accessLocale from './modules/access.es-ES.js';
import meetingRoomsLocale from './modules/meeting-rooms.es-ES.js';
import vehiclesLocale from './modules/vehicles.es-ES.js';
import jobGradesLocale from './modules/job-grades.es-ES.js';
import templatePrintLocale from './modules/template-print.es-ES.js';
import headcountsLocale from './modules/headcounts.es-ES.js';
import contractsLocale from './modules/contracts.es-ES.js';
import assetRequestsLocale from './modules/asset-requests.es-ES.js';
import vendorQualificationLocale from './modules/vendor-qualification.es-ES.js';
import assetLocale from './modules/assets.es-ES.js';
import departureLocale from './modules/departure.es-ES.js';
import probationFormCopy from './modules/probation-form.es-ES.js';
import probationActionsCopy from './modules/probation-actions.es-ES.js';
import probationLocale from './modules/probation.es-ES.js';
import paymentFormEnUS from './modules/payment-requests-form.es-ES.js';
import paymentActionsEnUS from './modules/payment-actions.es-ES.js';
import reimbursementLocale from './modules/reimbursement.es-ES.js';
import purchasesLocale from './modules/purchases.es-ES.js';
import travelEnUS from './modules/travel.es-ES.js';
import travelCancellationEnUS from './modules/travel-cancellations.es-ES.js';
import loanRequestsEnUS from './modules/loan-requests.es-ES.js';
import paymentRequestsEnUS from './modules/payment-requests.es-ES.js';
import vendorsEnUS from './modules/vendors.es-ES.js';
import financeAssignmentsEnUS from './modules/finance-assignments.es-ES.js';
import trainingEnUS from './modules/training.es-ES.js';
import expensePlansEnUS from './modules/expense-plan.es-ES.js';
import expenseAuthorizationsEnUS from './modules/expense-authorizations.es-ES.js';
import suppliesLocale from './modules/supplies.es-ES.js';
import budgetsEnUS from './modules/budgets.es-ES.js';
import reportsEnUS from './modules/reports.es-ES.js';
import budgetAdjustmentsEnUS from './modules/budget-adjustments.es-ES.js';
import generalLocale from './modules/general.es-ES.js';
import outingsEnUS from './modules/outings.es-ES.js';
import attendanceChangeEnUS from './modules/attendance-change.es-ES.js';
import cancellationsEnUS from './modules/leave-cancellations.es-ES.js';
import workbenchEnUS from './modules/workbench.es-ES.js';
import centerEnUS from './modules/approval-center.es-ES.js';
import overtimeEnUS from './modules/overtime.es-ES.js';
import leaveBalancesEnUS from './modules/leave-balances.es-ES.js';
import admin0 from './administration/users/es-ES.js';
import admin1 from './administration/api-keys/es-ES.js';
import admin2 from './administration/authorization/es-ES.js';
import admin3 from './administration/authz-default-access/es-ES.js';
import admin4 from './administration/authz-sharing-rules/es-ES.js';
import admin5 from './administration/authz-restriction-rules/es-ES.js';
import admin7 from './administration/notification/es-ES.js';
import admin8 from './administration/scheduler/es-ES.js';
import type { AppResource } from './en-US.js';
import employeesEnUS from './modules/employees.es-ES.js';
import importEnUS from './modules/import.es-ES.js';
import orgEnUS from './modules/org.es-ES.js';
import platformEnUS from './modules/platform.es-ES.js';
import approvalsEnUS from './modules/approvals.es-ES.js';

import system from './system/es-ES.js';

const esES: AppResource = {
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
  'shell.buildFreely': 'Tu espacio de trabajo conectado.',
  'shell.reliability': 'Personas, trabajo y aprobaciones en un solo lugar.',
  // Application-owned OA copy overrides the template authentication branding.
  'auth.brandName': 'NocoOA',
  'navigation.brandHome': 'Inicio de NocoOA',
  'auth.welcome': 'Te damos la bienvenida a tu espacio de trabajo',
  'auth.loginDescription':
    'Inicia sesión con tu nombre de usuario o correo para gestionar tareas y mantenerte en contacto con tu equipo.',
  'auth.about': 'Acerca del espacio de trabajo',
  'auth.platform': 'Tu espacio de trabajo diario',
  'auth.marketingTitleFirst': 'Trabajemos juntos.',
  'auth.marketingTitleSecond': 'Trabaja con facilidad.',
  'auth.marketingDescription':
    'Reúne aprobaciones, servicios para empleados e información del equipo para seguir tus solicitudes y centrarte en lo que importa.',
  'auth.frontend': 'Tareas a tu alcance',
  'auth.frontendDescription':
    'Resuelve aprobaciones pendientes y sigue tus solicitudes desde un mismo espacio.',
  'auth.foundation': 'Equipos conectados',
  'auth.foundationDescription':
    'Encuentra servicios para empleados, conocimientos compartidos y recursos administrativos en un solo lugar.',
  'auth.marketingFooter': 'Empieza cada jornada con claridad.',
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
    chooseFile: 'Seleccionar archivo',
    singleFile: 'Selecciona un archivo cada vez.',
    images: 'Imágenes',
    files: 'Archivos',
    preview: 'Vista previa de {name}',
    download: 'Descargar {name}',
  },
  actions: {
    ...system.actions,
    close: 'Cerrar',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    language: 'Idioma',
    create: 'Crear',
    saving: 'Guardando…',
    discard: 'Descartar cambios',
    signInAgain: 'Volver a iniciar sesión',
  },
  'status.sessionExpired':
    'Tu sesión ha finalizado. Vuelve a iniciar sesión para continuar.',
  formDrawer: {
    discardTitle: '¿Descartar los cambios sin guardar?',
    discardDescription: 'Al cerrar se descartarán los cambios sin guardar.',
    continueEditing: 'Seguir editando',
  },
  ...employeesEnUS,
  ...importEnUS,
  ...orgEnUS,
  ...platformEnUS,
  ...approvalsEnUS,
  overrides: {
    '@nocobase/app-plugin-demo-mode': {
      accounts: {
        administrator: 'Administrador del sistema',
        noRole: 'Sin etiqueta de rol',
        rolesLoading: 'Cargando roles…',
        rolesUnavailable: 'Roles no disponibles',
      },
      menu: {
        description:
          'Los cambios se guardan. Cambia de cuenta para probar los permisos de cada rol.',
      },
    },
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
      backToApplication: 'Volver a la aplicación',
      systemLabel: 'Navegación de administración del sistema',
      systemPeople: 'Usuarios y organización',
      systemAccess: 'Roles y permisos',
      systemConnections: 'Notificaciones e integraciones',
      systemOperations: 'Operaciones',
      office: 'Trabajo diario',
      finance: 'Finanzas y gastos',
      procurement: 'Compras y contratos',
      administration: 'Administración y activos',

      personal: 'Personal',
      organization: 'Organización',
      hr: 'Recursos humanos',
      configuration: 'Configuración empresarial',
      system: 'Administración del sistema',
      inbox: 'Mensajes',
      automation: 'Automatización',
      agents: 'Agentes',
      runtimes: 'Entornos de ejecución de agentes',
      skills: 'Habilidades de agentes',
      models: 'Servicios de modelos',
      agentUsage: 'Uso de agentes',
      users: 'Cuentas de usuario',
      permissionSets: 'Conjuntos de permisos',
      defaultAccess: 'Acceso predeterminado',
      sharingRules: 'Reglas de uso compartido',
      restrictionRules: 'Reglas de restricción',
      inspector: 'Inspector de permisos',
      apiKeys: 'Claves de API',
      notificationLogs: 'Registros de notificaciones',
      schedules: 'Tareas programadas',
      access: 'Control de acceso',
    },
  },
  userPicker: {
    placeholder: 'Buscar por nombre, usuario o correo',
    multiplePlaceholder: 'Añadir personas',
    empty: 'No hay usuarios coincidentes',
    searching: 'Buscando…',
    forbidden: 'No tienes permiso para buscar usuarios.',
    loadFailed: 'No se han podido cargar los usuarios.',
    remove: 'Quitar a {{name}}',
  },
  tableScroll: {
    region: 'Área de desplazamiento horizontal de la tabla',
    hint: 'Desplázate para ver todas las columnas',
    left: 'Desplazar la tabla a la izquierda',
    right: 'Desplazar la tabla a la derecha',
  },
  datePicker: {
    placeholder: 'Seleccionar una fecha',
    rangePlaceholder: 'Seleccionar un intervalo de fechas',
  },
};
export default esES;
