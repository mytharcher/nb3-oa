import type { AppResource } from './en-US.js';
import invoiceRecognitionLocale from './modules/invoice-recognition.zh-TW.js';
import electronicSignaturesLocale from './modules/electronic-signatures.zh-TW.js';
import wecomAttendanceLocale from './modules/wecom-attendance.zh-TW.js';
import hrMasterDataLocale from './modules/hr-master-data.zh-TW.js';
import globalSearchLocale from './modules/global-search.zh-TW.js';
import enterpriseIdentityLocale from './modules/enterprise-identity.zh-TW.js';
import processOperationsLocale from './modules/process-operations.zh-TW.js';
import financeIntegrationLocale from './modules/finance-integration.zh-TW.js';
import attendanceResultsLocale from './modules/attendance-results.zh-TW.js';
import personalSchedulesLocale from './modules/personal-schedules.zh-TW.js';
import demoData from './modules/demo-data.zh-TW.js';
import processManagementLocale from './modules/process-management.zh-TW.js';
import attendanceImportZhTW from './modules/attendance-import.zh-TW.js';
import reportsExpenseZhTW from './modules/reports-expense.zh-TW.js';
import reportsEfficiencyZhTW from './modules/reports-efficiency.zh-TW.js';
import onboardingLocale from './modules/onboarding.zh-TW.js';
import sealsLocale from './modules/seals.zh-TW.js';
import recruitmentLocale from './modules/recruitment.zh-TW.js';
import announcementsLocale from './modules/announcements.zh-TW.js';
import workItemsLocale from './modules/work-items.zh-TW.js';
import taskCenterUiLocale from '../extensions/nocobase-task-center-ui/locales/zh-TW.js';
import taskCenterLocale from './modules/task-center.zh-TW.js';
import knowledgeLocale from './modules/knowledge.zh-TW.js';
import transferLocale from './modules/transfer.zh-TW.js';
import attendanceManagementLocale from './modules/attendance-management.zh-TW.js';
import certificatesLocale from './modules/certificates.zh-TW.js';
import accessLocale from './modules/access.zh-TW.js';
import meetingRoomsLocale from './modules/meeting-rooms.zh-TW.js';
import vehiclesLocale from './modules/vehicles.zh-TW.js';
import jobGradesLocale from './modules/job-grades.zh-TW.js';
import templatePrintLocale from './modules/template-print.zh-TW.js';
import headcountsLocale from './modules/headcounts.zh-TW.js';
import contractsLocale from './modules/contracts.zh-TW.js';
import assetRequestsLocale from './modules/asset-requests.zh-TW.js';
import vendorQualificationLocale from './modules/vendor-qualification.zh-TW.js';
import assetLocale from './modules/assets.zh-TW.js';
import departureLocale from './modules/departure.zh-TW.js';
import probationFormCopy from './modules/probation-form.zh-TW.js';
import probationActionsCopy from './modules/probation-actions.zh-TW.js';
import probationLocale from './modules/probation.zh-TW.js';
import paymentFormZhTW from './modules/payment-requests-form.zh-TW.js';
import paymentActionsZhTW from './modules/payment-actions.zh-TW.js';
import reimbursementLocale from './modules/reimbursement.zh-TW.js';
import purchasesLocale from './modules/purchases.zh-TW.js';
import travelZhTW from './modules/travel.zh-TW.js';
import travelCancellationZhTW from './modules/travel-cancellations.zh-TW.js';
import loanRequestsZhTW from './modules/loan-requests.zh-TW.js';
import paymentRequestsZhTW from './modules/payment-requests.zh-TW.js';
import vendorsZhTW from './modules/vendors.zh-TW.js';
import financeAssignmentsZhTW from './modules/finance-assignments.zh-TW.js';
import trainingZhTW from './modules/training.zh-TW.js';
import expensePlansZhTW from './modules/expense-plan.zh-TW.js';
import expenseAuthorizationsZhTW from './modules/expense-authorizations.zh-TW.js';
import suppliesLocale from './modules/supplies.zh-TW.js';
import budgetsZhTW from './modules/budgets.zh-TW.js';
import reportsZhTW from './modules/reports.zh-TW.js';
import budgetAdjustmentsZhTW from './modules/budget-adjustments.zh-TW.js';
import generalLocale from './modules/general.zh-TW.js';
import outingsZhTW from './modules/outings.zh-TW.js';
import attendanceChangeZhTW from './modules/attendance-change.zh-TW.js';
import cancellationsZhTW from './modules/leave-cancellations.zh-TW.js';
import workbenchZhTW from './modules/workbench.zh-TW.js';
import centerZhTW from './modules/approval-center.zh-TW.js';
import overtimeZhTW from './modules/overtime.zh-TW.js';
import leaveBalancesZhTW from './modules/leave-balances.zh-TW.js';
import admin0 from './administration/users/zh-TW.js';
import admin1 from './administration/api-keys/zh-TW.js';
import admin2 from './administration/authorization/zh-TW.js';
import admin3 from './administration/authz-default-access/zh-TW.js';
import admin4 from './administration/authz-sharing-rules/zh-TW.js';
import admin5 from './administration/authz-restriction-rules/zh-TW.js';
import admin7 from './administration/notification/zh-TW.js';
import admin8 from './administration/scheduler/zh-TW.js';
import employeesZhTW from './modules/employees.zh-TW.js';
import importZhTW from './modules/import.zh-TW.js';
import orgZhTW from './modules/org.zh-TW.js';
import platformZhTW from './modules/platform.zh-TW.js';
import approvalsZhTW from './modules/approvals.zh-TW.js';

import system from './system/zh-TW.js';

const zhTW: AppResource = {
  demoData,
  ...processManagementLocale,
  ...attendanceImportZhTW,
  ...reportsExpenseZhTW,
  reportsEfficiency: reportsEfficiencyZhTW,
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
  'shell.buildFreely': '協同辦公，井然有序。',
  'shell.reliability': '連接組織、事務與簽核。',
  // Application-owned OA copy overrides the template authentication branding.
  'auth.brandName': 'NocoOA',
  'navigation.brandHome': 'NocoOA 首頁',
  'auth.welcome': '歡迎回到 OA 工作台',
  'auth.loginDescription':
    '使用使用者名稱或電子郵件登入，處理待辦、查看進展，開啟一天的協作。',
  'auth.about': '關於 OA 協同辦公',
  'auth.platform': '連接團隊與日常工作',
  'auth.marketingTitleFirst': '讓協作更順暢，',
  'auth.marketingTitleSecond': '讓工作更從容。',
  'auth.marketingDescription':
    '從簽核待辦到員工服務，從知識共享到行政事務，在一個工作台掌握進展，讓每一次協作都有清晰的方向。',
  'auth.frontend': '待辦有序，進展清晰',
  'auth.frontendDescription':
    '集中處理簽核待辦，隨時查看申請進展，讓日常事務有條不紊。',
  'auth.foundation': '服務相伴，協作同行',
  'auth.foundationDescription':
    '連接員工服務、團隊知識與行政資源，讓辦事更便捷，讓資訊更易觸達。',
  'auth.marketingFooter': '從這裡，開啟井然有序的工作日。',
  departureRequests: departureLocale,
  probationRequests: {
    ...probationLocale.probationRequests,
    ...probationFormCopy,
    ...probationActionsCopy,
  },
  ...reimbursementLocale,
  ...purchasesLocale,
  ...financeAssignmentsZhTW,
  ...vendorsZhTW,
  ...loanRequestsZhTW,
  ...paymentRequestsZhTW,
  ...paymentFormZhTW,
  paymentRequests: {
    ...paymentRequestsZhTW.paymentRequests,
    ...paymentActionsZhTW,
  },
  ...trainingZhTW,
  ...travelZhTW,
  ...travelCancellationZhTW,
  ...expensePlansZhTW,
  ...expenseAuthorizationsZhTW,
  ...budgetsZhTW,
  ...reportsZhTW,
  ...budgetAdjustmentsZhTW,
  ...outingsZhTW,
  ...attendanceChangeZhTW,
  ...cancellationsZhTW,
  ...centerZhTW,
  ...workbenchZhTW,
  ...generalLocale,
  ...suppliesLocale,
  ...overtimeZhTW,
  navigation: { ...system.navigation, home: workbenchZhTW.workbench.title },
  ...leaveBalancesZhTW,
  attachmentList: {
    images: '圖片',
    files: '檔案',
    preview: '預覽 {name}',
    download: '下載 {name}',
  },
  actions: {
    ...system.actions,
    close: '關閉',
    save: '儲存',
    cancel: '取消',
    confirm: '確認',
    language: '語言',
    create: '建立',
    saving: '儲存中…',
    discard: '放棄更改',
    signInAgain: '重新登入',
  },
  'status.sessionExpired': '工作階段已結束，請重新登入後繼續。',
  formDrawer: {
    discardTitle: '放棄未儲存的更改？',
    discardDescription: '關閉後，尚未儲存的內容將丟失。',
    continueEditing: '繼續編輯',
  },

  ...employeesZhTW,
  ...importZhTW,
  ...orgZhTW,
  ...platformZhTW,
  ...approvalsZhTW,
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
      backToApplication: '返回應用程式',
      systemLabel: '系統管理導覽',
      systemPeople: '使用者與組織',
      systemAccess: '角色與權限',
      systemConnections: '通知與集成',
      systemOperations: '維運',
      office: '日常辦公',
      finance: '財務與費用',
      procurement: '採購與合約',
      administration: '行政與資產',

      personal: '個人事務',
      organization: '組織架構',
      hr: '人事管理',
      configuration: '業務設定',
      system: '系統管理',
      inbox: '訊息',
      automation: '自動化',
      agents: '智慧代理',
      runtimes: '智慧代理執行環境',
      skills: '智慧代理技能',
      models: '模型服務',
      agentUsage: '智慧代理用量',
      users: '使用者帳號',
      permissionSets: '權限集',
      defaultAccess: '預設訪問',
      sharingRules: '共享規則',
      restrictionRules: '限制規則',
      inspector: '權限檢查',
      apiKeys: 'API 金鑰',
      notificationLogs: '通知日誌',
      schedules: '計劃任務',
      access: '權限管理',
    },
  },
  userPicker: {
    placeholder: '按姓名、使用者名稱或電子郵件搜尋',
    multiplePlaceholder: '新增人員',
    empty: '沒有匹配的使用者',
    searching: '搜尋中…',
    forbidden: '你沒有查詢使用者的權限。',
    loadFailed: '無法載入使用者。',
    remove: '移除 {{name}}',
  },
  tableScroll: {
    region: '表格橫向滾動區域',
    hint: '左右滑動查看完整表格',
    left: '向左滾動表格',
    right: '向右滾動表格',
  },
  datePicker: {
    placeholder: '選擇日期',
    rangePlaceholder: '選擇日期範圍',
  },
};
export default zhTW;
