import type { LocaleResource } from '@nocobase/i18n';
import type en from './payment-requests.en-US.js';
const zh: LocaleResource<typeof en> = {
  paymentRequests: {
    relatedUnavailable: '關聯記錄不可用',
    businessErrors: {
      PAYMENT_REQUEST_INVALID_INPUT:
        '請補齊付款原因、收款方、正數金額、發票號及發票附件。',
      PAYMENT_REQUEST_ACCOUNT_REQUIRED:
        '請先補齊收款方的銀行帳戶資訊，再提交簽核。',
      PAYMENT_REQUEST_ACCOUNT_STALE: '收款帳戶已變化，請讀取最新帳戶後再更正。',
      PAYMENT_REQUEST_DEPARTMENT_REQUIRED:
        '申請人沒有有效主部門，請聯絡人力資源完善員工檔案。',
      PAYMENT_REQUEST_METHOD_INVALID: '請選擇已啟用的付款方式。',
      PAYMENT_REQUEST_SOURCE_REQUIRED:
        '無前置簽核付款須填寫說明，並取消關聯採購訂單。',
      PAYMENT_REQUEST_SOURCE_INVALID:
        '請選擇有效的採購訂單或合約，並使用原單據的收款方。',
      PAYMENT_REQUEST_SOURCE_STALE:
        '來源單據已變化，請重新整理付款單及來源單據後再操作。',
      PAYMENT_REQUEST_CONTRACT_STALE:
        '合約已變化，請重新整理合約版本並修訂付款申請後重新提交。',
      PAYMENT_REQUEST_VOUCHER_REQUIRED:
        '請填寫付款憑證號，並上傳或選擇付款憑證附件。',
      PAYMENT_REQUEST_FORCE_CONFIRMATION_REQUIRED:
        '強制完成付款前，請準確確認已批准的付款金額。',
      PAYMENT_REQUEST_HANDLING_REASON_REQUIRED: '請填寫無法完成付款的原因。',
      PAYMENT_REQUEST_ALREADY_PAID:
        '該付款已結算，請重新整理查看已登記的結果。',
      PAYMENT_REQUEST_CONTRACT_ACTUAL_PAYMENT_REQUIRED:
        '請先登記合約的實際付款事實，再完成此操作。',
      PAYMENT_FILE_SIZE: '請選擇非空且不超過 5 MB 的附件。',
      PAYMENT_FILE_TYPE:
        '請上傳格式與擴展名一致的 PDF、JPEG、PNG 或 WebP 檔案。',
      PAYMENT_ATTACHMENT_INVALID: '請選擇上傳到本付款申請的有效附件。',
    },

    title: '付款申請',
    description: '查看付款申請、凍結的來源事實與出納辦理進度。',
    new: '新增付款申請',
    edit: '編輯',
    details: '查看詳情',
    number: '單號',
    reason: '付款事由',
    vendor: '收款方',
    amount: '付款金額（元）',
    search: '搜尋單號、事由、申請人或收款方',
    view: '記錄範圍',
    allStatuses: '全部狀態',
    refresh: '重新整理',
    clearFilters: '清除篩選',
    emptyTitle: '尚無付款申請',
    emptyDescription: '新增草稿，申請付款並補充發票認證資訊。',
    noResults: '無匹配記錄，請清除或調整篩選。',
    rowActions: '「{{name}}」的操作',
    yes: '是',
    no: '否',
    frozenHint: '來源、收款方、金額和發票在提交時凍結。',
    sourceModes: { contract: '合約', purchase: '採購訂單', none: '無前置簽核' },
    views: {
      mine: '我的申請',
      pending: '待我處理',
      done: '我已處理',
      copied: '抄送給我',
    },
    statuses: {
      draft: '草稿',
      revision: '待修改',
      head: '部門負責人簽核',
      finance: '財務核對',
      executive: '分管副總簽核',
      gm: '總經理簽核',
      cashier: '出納辦理',
      exception: '辦理異常',
      paid: '已付款',
      forcedPaid: '已記錄強制付款',
      rejected: '已拒絕',
      withdrawn: '已撤回',
      terminated: '已終止',
    },
    errors: {
      forbidden: '無權限查看，請聯絡管理員檢查權限。',
      notFound: '記錄不存在或已無法查看，請返回來源頁面。',
      conflict: '付款申請已變化，請讀取最新記錄後再操作。',
      invalid: '請檢查付款內容與必需認證資訊。',
      failed: '請求未能完成，請重試。',
    },
    detail: {
      creator: '經辦人',
      sourceMode: '付款來源',
      order: '採購訂單',
      noPriorReason: '無前置簽核說明',
      invoice: '發票號碼',
      method: '付款方式',
      failure: '辦理失敗原因',
      voucher: '付款憑證號',
      forcedReason: '強制付款原因',
      paidAt: '付款時間',
      sourceFacts: '凍結的來源事實',
      cumulativeHint:
        '提交時累計付款含在途付款；本單目前占用單獨展示，不可再次相加。付款不代表已到貨或已驗收。',
      sourceApproved: '訂單批准金額（元）',
      sourceCumulative: '提交時累計付款（元）',
      sourceHeld: '本單目前來源占用（元）',
      fullApproval: '需完整簽核',
      attachments: '發票認證資訊',
      voucherAttachments: '付款認證資訊',
      notSubmitted: '提交時凍結規則。',
    },
    rules: {
      spend_vp: '分管副總金額閾值（元）',
      spend_gm: '總經理金額閾值（元）',
      sla_remindHours: '提醒工作小時',
      sla_escalateHours: '升級工作小時',
      sla_urgeCooldownHours: '催辦冷卻小時',
    },
    authz: {
      voucherEvidence: '上傳付款認證資訊',
      ownScope: '本人申請或經辦的付款',
      resource: '付款申請',
      view: '查看付款申請',
      submit: '建立並提交本人付款申請',
      delegate: '代理員工建立付款申請',
      paymentAccount: '查看與更正授權的收款帳戶',
    },
  },
};
export default zh;
