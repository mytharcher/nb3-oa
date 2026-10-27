import plugins from './plugins/ru-RU.js';
import invoiceRecognitionLocale from './modules/invoice-recognition.ru-RU.js';
import electronicSignaturesLocale from './modules/electronic-signatures.ru-RU.js';
import wecomAttendanceLocale from './modules/wecom-attendance.ru-RU.js';
import hrMasterDataLocale from './modules/hr-master-data.ru-RU.js';
import globalSearchLocale from './modules/global-search.ru-RU.js';
import enterpriseIdentityLocale from './modules/enterprise-identity.ru-RU.js';
import processOperationsLocale from './modules/process-operations.ru-RU.js';
import financeIntegrationLocale from './modules/finance-integration.ru-RU.js';
import attendanceResultsLocale from './modules/attendance-results.ru-RU.js';
import personalSchedulesLocale from './modules/personal-schedules.ru-RU.js';
import demoData from './modules/demo-data.ru-RU.js';
import processManagementLocale from './modules/process-management.ru-RU.js';
import attendanceImportEnUS from './modules/attendance-import.ru-RU.js';
import reportsExpenseEnUS from './modules/reports-expense.ru-RU.js';
import reportsEfficiencyEnUS from './modules/reports-efficiency.ru-RU.js';
import onboardingLocale from './modules/onboarding.ru-RU.js';
import sealsLocale from './modules/seals.ru-RU.js';
import recruitmentLocale from './modules/recruitment.ru-RU.js';
import announcementsLocale from './modules/announcements.ru-RU.js';
import workItemsLocale from './modules/work-items.ru-RU.js';
import taskCenterUiLocale from '../extensions/nocobase-task-center-ui/locales/ru-RU.js';
import taskCenterLocale from './modules/task-center.ru-RU.js';
import knowledgeLocale from './modules/knowledge.ru-RU.js';
import transferLocale from './modules/transfer.ru-RU.js';
import attendanceManagementLocale from './modules/attendance-management.ru-RU.js';
import certificatesLocale from './modules/certificates.ru-RU.js';
import accessLocale from './modules/access.ru-RU.js';
import meetingRoomsLocale from './modules/meeting-rooms.ru-RU.js';
import vehiclesLocale from './modules/vehicles.ru-RU.js';
import jobGradesLocale from './modules/job-grades.ru-RU.js';
import templatePrintLocale from './modules/template-print.ru-RU.js';
import headcountsLocale from './modules/headcounts.ru-RU.js';
import contractsLocale from './modules/contracts.ru-RU.js';
import assetRequestsLocale from './modules/asset-requests.ru-RU.js';
import vendorQualificationLocale from './modules/vendor-qualification.ru-RU.js';
import assetLocale from './modules/assets.ru-RU.js';
import departureLocale from './modules/departure.ru-RU.js';
import probationFormCopy from './modules/probation-form.ru-RU.js';
import probationActionsCopy from './modules/probation-actions.ru-RU.js';
import probationLocale from './modules/probation.ru-RU.js';
import paymentFormEnUS from './modules/payment-requests-form.ru-RU.js';
import paymentActionsEnUS from './modules/payment-actions.ru-RU.js';
import reimbursementLocale from './modules/reimbursement.ru-RU.js';
import purchasesLocale from './modules/purchases.ru-RU.js';
import travelEnUS from './modules/travel.ru-RU.js';
import travelCancellationEnUS from './modules/travel-cancellations.ru-RU.js';
import loanRequestsEnUS from './modules/loan-requests.ru-RU.js';
import paymentRequestsEnUS from './modules/payment-requests.ru-RU.js';
import vendorsEnUS from './modules/vendors.ru-RU.js';
import financeAssignmentsEnUS from './modules/finance-assignments.ru-RU.js';
import trainingEnUS from './modules/training.ru-RU.js';
import expensePlansEnUS from './modules/expense-plan.ru-RU.js';
import expenseAuthorizationsEnUS from './modules/expense-authorizations.ru-RU.js';
import suppliesLocale from './modules/supplies.ru-RU.js';
import budgetsEnUS from './modules/budgets.ru-RU.js';
import reportsEnUS from './modules/reports.ru-RU.js';
import budgetAdjustmentsEnUS from './modules/budget-adjustments.ru-RU.js';
import generalLocale from './modules/general.ru-RU.js';
import outingsEnUS from './modules/outings.ru-RU.js';
import attendanceChangeEnUS from './modules/attendance-change.ru-RU.js';
import cancellationsEnUS from './modules/leave-cancellations.ru-RU.js';
import workbenchEnUS from './modules/workbench.ru-RU.js';
import centerEnUS from './modules/approval-center.ru-RU.js';
import overtimeEnUS from './modules/overtime.ru-RU.js';
import leaveBalancesEnUS from './modules/leave-balances.ru-RU.js';
import admin0 from './administration/users/ru-RU.js';
import admin1 from './administration/api-keys/ru-RU.js';
import admin2 from './administration/authorization/ru-RU.js';
import admin3 from './administration/authz-default-access/ru-RU.js';
import admin4 from './administration/authz-sharing-rules/ru-RU.js';
import admin5 from './administration/authz-restriction-rules/ru-RU.js';
import admin7 from './administration/notification/ru-RU.js';
import admin8 from './administration/scheduler/ru-RU.js';
import type { AppResource } from './en-US.js';
import employeesEnUS from './modules/employees.ru-RU.js';
import importEnUS from './modules/import.ru-RU.js';
import orgEnUS from './modules/org.ru-RU.js';
import platformEnUS from './modules/platform.ru-RU.js';
import approvalsEnUS from './modules/approvals.ru-RU.js';

import system from './system/ru-RU.js';

const ruRU: AppResource = {
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
  'shell.buildFreely': 'Ваше единое рабочее пространство.',
  'shell.reliability': 'Люди, работа и согласования в одном месте.',
  // Application-owned OA copy overrides the template authentication branding.
  'auth.brandName': 'NocoOA',
  'navigation.brandHome': 'Главная NocoOA',
  'auth.welcome': 'С возвращением в рабочее пространство OA',
  'auth.loginDescription':
    'Войдите по имени пользователя или эл. почте, чтобы управлять задачами и оставаться на связи с командой.',
  'auth.about': 'О рабочем пространстве OA',
  'auth.platform': 'Ваше ежедневное рабочее пространство',
  'auth.marketingTitleFirst': 'Работайте вместе.',
  'auth.marketingTitleSecond': 'Работайте с лёгкостью.',
  'auth.marketingDescription':
    'Объедините согласования, сервисы для сотрудников и информацию о команде, чтобы отслеживать заявки и сосредоточиться на важных задачах.',
  'auth.frontend': 'Задачи под рукой',
  'auth.frontendDescription':
    'Обрабатывайте ожидающие согласования и отслеживайте свои заявки в одном рабочем пространстве.',
  'auth.foundation': 'Команды на связи',
  'auth.foundationDescription':
    'Сервисы для сотрудников, общие знания и административные ресурсы в одном месте.',
  'auth.marketingFooter': 'Понятное начало каждого рабочего дня.',
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
    chooseFile: 'Выбрать файл',
    singleFile: 'Выбирайте по одному файлу за раз.',
    images: 'Изображения',
    files: 'Файлы',
    preview: 'Просмотр {name}',
    download: 'Скачать {name}',
  },
  actions: {
    ...system.actions,
    close: 'Закрыть',
    save: 'Сохранить',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    language: 'Язык',
    create: 'Создать',
    saving: 'Сохранение…',
    discard: 'Отменить изменения',
    signInAgain: 'Войти снова',
  },
  'status.sessionExpired':
    'Ваш сеанс завершён. Войдите снова, чтобы продолжить.',
  formDrawer: {
    discardTitle: 'Отменить несохранённые изменения?',
    discardDescription: 'При закрытии несохранённые изменения будут потеряны.',
    continueEditing: 'Продолжить редактирование',
  },
  ...employeesEnUS,
  ...importEnUS,
  ...orgEnUS,
  ...platformEnUS,
  ...approvalsEnUS,
  overrides: {
    ...plugins,
    '@nocobase/app-plugin-users': {
      ...plugins['@nocobase/app-plugin-users'],
      ...admin0,
      page: {
        ...plugins['@nocobase/app-plugin-users']['page'],
        ...admin0['page'],
      },
      accept: {
        ...plugins['@nocobase/app-plugin-users']['accept'],
        ...admin0['accept'],
        errors: {
          ...plugins['@nocobase/app-plugin-users']['accept']['errors'],
          ...admin0['accept']['errors'],
        },
      },
    },
    '@nocobase/app-plugin-api-keys': admin1,
    '@nocobase/app-plugin-authorization': {
      ...plugins['@nocobase/app-plugin-authorization'],
      ...admin2,
      permissionSets: {
        ...plugins['@nocobase/app-plugin-authorization']['permissionSets'],
        ...admin2['permissionSets'],
        builtIn: {
          ...plugins['@nocobase/app-plugin-authorization']['permissionSets'][
            'builtIn'
          ],
          ...admin2['permissionSets']['builtIn'],
        },
      },
      sections: {
        ...plugins['@nocobase/app-plugin-authorization']['sections'],
        ...admin2['sections'],
      },
      options: {
        ...plugins['@nocobase/app-plugin-authorization']['options'],
        ...admin2['options'],
        actions: {
          ...plugins['@nocobase/app-plugin-authorization']['options'][
            'actions'
          ],
          ...admin2['options']['actions'],
        },
        settingsModules: {
          ...plugins['@nocobase/app-plugin-authorization']['options'][
            'settingsModules'
          ],
          ...admin2['options']['settingsModules'],
        },
        pages: {
          ...plugins['@nocobase/app-plugin-authorization']['options']['pages'],
          ...admin2['options']['pages'],
        },
        settings: {
          ...plugins['@nocobase/app-plugin-authorization']['options'][
            'settings'
          ],
          ...admin2['options']['settings'],
        },
        subjectTypes: {
          ...plugins['@nocobase/app-plugin-authorization']['options'][
            'subjectTypes'
          ],
          ...admin2['options']['subjectTypes'],
        },
        recordAccessPolicies: {
          ...plugins['@nocobase/app-plugin-authorization']['options'][
            'recordAccessPolicies'
          ],
          ...admin2['options']['recordAccessPolicies'],
        },
      },
    },
    '@nocobase/app-plugin-authz-default-access': {
      ...plugins['@nocobase/app-plugin-authz-default-access'],
      ...admin3,
    },
    '@nocobase/app-plugin-authz-sharing-rules': {
      ...plugins['@nocobase/app-plugin-authz-sharing-rules'],
      ...admin4,
    },
    '@nocobase/app-plugin-authz-restriction-rules': {
      ...plugins['@nocobase/app-plugin-authz-restriction-rules'],
      ...admin5,
    },
    '@nocobase/app-plugin-notification': {
      ...plugins['@nocobase/app-plugin-notification'],
      ...admin7,
      logs: {
        ...plugins['@nocobase/app-plugin-notification']['logs'],
        ...admin7['logs'],
        columns: {
          ...plugins['@nocobase/app-plugin-notification']['logs']['columns'],
          ...admin7['logs']['columns'],
        },
      },
      status: {
        ...plugins['@nocobase/app-plugin-notification']['status'],
        ...admin7['status'],
      },
      errors: {
        ...plugins['@nocobase/app-plugin-notification']['errors'],
        ...admin7['errors'],
      },
    },
    '@nocobase/app-plugin-scheduler': {
      ...plugins['@nocobase/app-plugin-scheduler'],
      ...admin8,
      authorization: {
        ...plugins['@nocobase/app-plugin-scheduler']['authorization'],
        ...admin8['authorization'],
      },
      nav: {
        ...plugins['@nocobase/app-plugin-scheduler']['nav'],
        ...admin8['nav'],
      },
    },
  },
  oa: {
    navigation: {
      backToApplication: 'Вернуться в приложение',
      systemLabel: 'Навигация по администрированию системы',
      systemPeople: 'Пользователи и организация',
      systemAccess: 'Роли и права',
      systemConnections: 'Уведомления и интеграции',
      systemOperations: 'Операции',
      office: 'Ежедневная работа',
      finance: 'Финансы и расходы',
      procurement: 'Закупки и договоры',
      administration: 'Администрирование и активы',

      personal: 'Личное',
      organization: 'Организация',
      hr: 'Кадры',
      configuration: 'Бизнес-настройки',
      system: 'Системное администрирование',
      inbox: 'Сообщения',
      automation: 'Автоматизация',
      agents: 'Агенты',
      runtimes: 'Среды агентов',
      skills: 'Навыки агентов',
      models: 'Модельные сервисы',
      agentUsage: 'Использование агентов',
      users: 'Учётные записи пользователей',
      permissionSets: 'Наборы прав',
      defaultAccess: 'Доступ по умолчанию',
      sharingRules: 'Правила совместного доступа',
      restrictionRules: 'Правила ограничений',
      inspector: 'Проверка прав',
      apiKeys: 'Ключи API',
      notificationLogs: 'Журнал уведомлений',
      schedules: 'Задачи по расписанию',
      access: 'Управление доступом',
    },
  },
  userPicker: {
    placeholder: 'Поиск по имени, имени пользователя или эл. почте',
    multiplePlaceholder: 'Добавить людей',
    empty: 'Подходящих пользователей нет',
    searching: 'Поиск…',
    forbidden: 'У вас нет права искать пользователей.',
    loadFailed: 'Не удалось загрузить пользователей.',
    remove: 'Удалить {{name}}',
  },
  tableScroll: {
    region: 'Область горизонтальной прокрутки таблицы',
    hint: 'Прокрутите для просмотра всех столбцов',
    left: 'Прокрутить таблицу влево',
    right: 'Прокрутить таблицу вправо',
  },
  datePicker: {
    placeholder: 'Выберите дату',
    rangePlaceholder: 'Выберите диапазон дат',
  },
};
export default ruRU;
