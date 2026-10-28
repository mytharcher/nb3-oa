import invoiceRecognitionLocale from './modules/invoice-recognition.ja-JP.js';
import electronicSignaturesLocale from './modules/electronic-signatures.ja-JP.js';
import wecomAttendanceLocale from './modules/wecom-attendance.ja-JP.js';
import hrMasterDataLocale from './modules/hr-master-data.ja-JP.js';
import globalSearchLocale from './modules/global-search.ja-JP.js';
import enterpriseIdentityLocale from './modules/enterprise-identity.ja-JP.js';
import processOperationsLocale from './modules/process-operations.ja-JP.js';
import financeIntegrationLocale from './modules/finance-integration.ja-JP.js';
import attendanceResultsLocale from './modules/attendance-results.ja-JP.js';
import personalSchedulesLocale from './modules/personal-schedules.ja-JP.js';
import demoData from './modules/demo-data.ja-JP.js';
import processManagementLocale from './modules/process-management.ja-JP.js';
import attendanceImportEnUS from './modules/attendance-import.ja-JP.js';
import reportsExpenseEnUS from './modules/reports-expense.ja-JP.js';
import reportsEfficiencyEnUS from './modules/reports-efficiency.ja-JP.js';
import onboardingLocale from './modules/onboarding.ja-JP.js';
import sealsLocale from './modules/seals.ja-JP.js';
import recruitmentLocale from './modules/recruitment.ja-JP.js';
import announcementsLocale from './modules/announcements.ja-JP.js';
import workItemsLocale from './modules/work-items.ja-JP.js';
import taskCenterUiLocale from '../extensions/nocobase-task-center-ui/locales/ja-JP.js';
import taskCenterLocale from './modules/task-center.ja-JP.js';
import knowledgeLocale from './modules/knowledge.ja-JP.js';
import transferLocale from './modules/transfer.ja-JP.js';
import attendanceManagementLocale from './modules/attendance-management.ja-JP.js';
import certificatesLocale from './modules/certificates.ja-JP.js';
import accessLocale from './modules/access.ja-JP.js';
import meetingRoomsLocale from './modules/meeting-rooms.ja-JP.js';
import vehiclesLocale from './modules/vehicles.ja-JP.js';
import jobGradesLocale from './modules/job-grades.ja-JP.js';
import templatePrintLocale from './modules/template-print.ja-JP.js';
import headcountsLocale from './modules/headcounts.ja-JP.js';
import contractsLocale from './modules/contracts.ja-JP.js';
import assetRequestsLocale from './modules/asset-requests.ja-JP.js';
import vendorQualificationLocale from './modules/vendor-qualification.ja-JP.js';
import assetLocale from './modules/assets.ja-JP.js';
import departureLocale from './modules/departure.ja-JP.js';
import probationFormCopy from './modules/probation-form.ja-JP.js';
import probationActionsCopy from './modules/probation-actions.ja-JP.js';
import probationLocale from './modules/probation.ja-JP.js';
import paymentFormEnUS from './modules/payment-requests-form.ja-JP.js';
import paymentActionsEnUS from './modules/payment-actions.ja-JP.js';
import reimbursementLocale from './modules/reimbursement.ja-JP.js';
import purchasesLocale from './modules/purchases.ja-JP.js';
import travelEnUS from './modules/travel.ja-JP.js';
import travelCancellationEnUS from './modules/travel-cancellations.ja-JP.js';
import loanRequestsEnUS from './modules/loan-requests.ja-JP.js';
import paymentRequestsEnUS from './modules/payment-requests.ja-JP.js';
import vendorsEnUS from './modules/vendors.ja-JP.js';
import financeAssignmentsEnUS from './modules/finance-assignments.ja-JP.js';
import trainingEnUS from './modules/training.ja-JP.js';
import expensePlansEnUS from './modules/expense-plan.ja-JP.js';
import expenseAuthorizationsEnUS from './modules/expense-authorizations.ja-JP.js';
import suppliesLocale from './modules/supplies.ja-JP.js';
import budgetsEnUS from './modules/budgets.ja-JP.js';
import reportsEnUS from './modules/reports.ja-JP.js';
import budgetAdjustmentsEnUS from './modules/budget-adjustments.ja-JP.js';
import generalLocale from './modules/general.ja-JP.js';
import outingsEnUS from './modules/outings.ja-JP.js';
import attendanceChangeEnUS from './modules/attendance-change.ja-JP.js';
import cancellationsEnUS from './modules/leave-cancellations.ja-JP.js';
import workbenchEnUS from './modules/workbench.ja-JP.js';
import centerEnUS from './modules/approval-center.ja-JP.js';
import overtimeEnUS from './modules/overtime.ja-JP.js';
import leaveBalancesEnUS from './modules/leave-balances.ja-JP.js';
import admin0 from './administration/users/ja-JP.js';
import admin1 from './administration/api-keys/ja-JP.js';
import admin2 from './administration/authorization/ja-JP.js';
import admin3 from './administration/authz-default-access/ja-JP.js';
import admin4 from './administration/authz-sharing-rules/ja-JP.js';
import admin5 from './administration/authz-restriction-rules/ja-JP.js';
import admin7 from './administration/notification/ja-JP.js';
import admin8 from './administration/scheduler/ja-JP.js';
import type { AppResource } from './en-US.js';
import employeesEnUS from './modules/employees.ja-JP.js';
import importEnUS from './modules/import.ja-JP.js';
import orgEnUS from './modules/org.ja-JP.js';
import platformEnUS from './modules/platform.ja-JP.js';
import approvalsEnUS from './modules/approvals.ja-JP.js';

import system from './system/ja-JP.js';

const jaJP: AppResource = {
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
  'shell.buildFreely': 'つながる職場。',
  'shell.reliability': '人、仕事、承認をひとつに。',
  // Application-owned OA copy overrides the template authentication branding.
  'auth.brandName': 'NocoOA',
  'navigation.brandHome': 'NocoOAホーム',
  'auth.welcome': 'OAワークスペースへようこそ',
  'auth.loginDescription':
    'ユーザー名またはメールアドレスでログインして、タスクを管理しチームと連携しましょう。',
  'auth.about': 'OAワークスペースについて',
  'auth.platform': '毎日のワークスペース',
  'auth.marketingTitleFirst': 'ともに働く。',
  'auth.marketingTitleSecond': '仕事をスムーズに。',
  'auth.marketingDescription':
    '承認、従業員向けサービス、チーム情報をひとつにまとめ、申請状況を把握し、大切な仕事に集中できます。',
  'auth.frontend': '身近なタスク',
  'auth.frontendDescription':
    'ひとつのワークスペースで未処理の承認に対応し、自分の申請を確認できます。',
  'auth.foundation': 'つながるチーム',
  'auth.foundationDescription':
    '従業員向けサービス、共有ナレッジ、管理リソースをひとつの場所で探せます。',
  'auth.marketingFooter': '毎日の仕事を、すっきりと始める。',
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
    chooseFile: 'ファイルを選択',
    singleFile: '一度に1つのファイルを選択してください。',
    images: '画像',
    files: 'ファイル',
    preview: '{name} をプレビュー',
    download: '{name} をダウンロード',
  },
  actions: {
    ...system.actions,
    close: '閉じる',
    save: '保存',
    cancel: 'キャンセル',
    confirm: '確認',
    language: '言語',
    create: '作成',
    saving: '保存中…',
    discard: '変更を破棄',
    signInAgain: '再ログイン',
  },
  'status.sessionExpired':
    'セッションが終了しました。再ログインして続けてください。',
  formDrawer: {
    discardTitle: '未保存の変更を破棄しますか？',
    discardDescription: '閉じると未保存の変更は破棄されます。',
    continueEditing: '編集を続ける',
  },
  ...employeesEnUS,
  ...importEnUS,
  ...orgEnUS,
  ...platformEnUS,
  ...approvalsEnUS,
  overrides: {
    '@nocobase/app-plugin-demo-mode': {
      accounts: {
        administrator: 'システム管理者',
        noRole: 'ロール未設定',
        rolesLoading: 'ロールを読み込み中…',
        rolesUnavailable: 'ロールを取得できません',
      },
      menu: {
        description:
          '変更は保存されます。アカウントを切り替えて各ロールの権限を確認できます。',
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
      backToApplication: 'アプリケーションに戻る',
      systemLabel: 'システム管理ナビゲーション',
      systemPeople: 'ユーザーと組織',
      systemAccess: 'ロールと権限',
      systemConnections: '通知と連携',
      systemOperations: '運用',
      foundation: 'アプリ基盤',
      office: '日常業務',
      finance: '財務・経費',
      procurement: '調達・契約',
      administration: '総務・資産',

      personal: '個人',
      organization: '組織',
      hr: '人事',
      configuration: '業務設定',
      system: 'システム管理',
      inbox: 'メッセージ',
      automation: '自動化',
      agents: 'エージェント',
      runtimes: 'エージェント実行環境',
      skills: 'エージェントスキル',
      models: 'モデルサービス',
      agentUsage: 'エージェント利用状況',
      users: 'ユーザーアカウント',
      permissionSets: '権限セット',
      defaultAccess: 'デフォルトアクセス',
      sharingRules: '共有ルール',
      restrictionRules: '制限ルール',
      inspector: '権限検査',
      apiKeys: 'APIキー',
      notificationLogs: '通知ログ',
      schedules: '定期タスク',
      access: 'アクセス制御',
    },
  },
  userPicker: {
    placeholder: '名前、ユーザー名、メールアドレスで検索',
    multiplePlaceholder: 'メンバーを追加',
    empty: '一致するユーザーがいません',
    searching: '検索中…',
    forbidden: 'ユーザーを検索する権限がありません。',
    loadFailed: 'ユーザーを読み込めません。',
    remove: '{{name}}を削除',
  },
  tableScroll: {
    region: 'テーブルの横スクロール領域',
    hint: 'スクロールしてすべての列を表示',
    left: 'テーブルを左にスクロール',
    right: 'テーブルを右にスクロール',
  },
  datePicker: {
    placeholder: '日付を選択',
    rangePlaceholder: '日付範囲を選択',
  },
};
export default jaJP;
