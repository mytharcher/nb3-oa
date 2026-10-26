import actionCopy from './reimbursement-actions.zh-TW.js';
import formCopy from './reimbursement-forms.zh-TW.js';
export default {
  reimbursementRequests: {
    relatedUnavailable: '關聯記錄不可用',
    categoryUnavailable: '分類不可用',

    businessErrors: {
      REIMBURSEMENT_INVALID_LINE_AMOUNT:
        '每條費用報銷明細金額須大於零且在支援範圍內。',
      REIMBURSEMENT_INVALID_LINE_DATE:
        '請為每條費用報銷明細選擇有效的費用日期。',
      REIMBURSEMENT_VOUCHER_REQUIRED: '請填寫付款憑證號後再確認付款。',
      REIMBURSEMENT_PAYMENT_CONFIRMATION_REQUIRED:
        '請填寫強制付款原因，並準確確認費用報銷總額、借款衝抵額及實付金額。',
      REIMBURSEMENT_HANDLING_REASON_REQUIRED: '請填寫無法完成付款的原因。',
      REIMBURSEMENT_PAYMENT_ACCOUNT_STALE:
        '收款帳戶已變化，請讀取最新帳戶後再更正。',
      REIMBURSEMENT_AUTHORIZATION_CHANGED:
        '前置簽核額度已變化，請重新整理來源單據並核對費用報銷總額。',
      REIMBURSEMENT_INVOICES_CHANGED:
        '發票認證資訊已變化，請重新整理申請並重新選擇可用發票。',
      REIMBURSEMENT_LOAN_CHANGED:
        '借款衝抵資訊已變化，請重新整理借款並確認衝抵金額。',
      REIMBURSEMENT_TOTAL_TOO_LARGE:
        '費用報銷合計超過支援範圍，請減少金額或拆分申請。',
      REIMBURSEMENT_FILE_SIZE: '請選擇非空且不超過 5 MB 的附件。',
      REIMBURSEMENT_FILE_TYPE:
        '請上傳格式與擴展名一致的 PDF、JPEG、PNG 或 WebP 檔案。',
    },

    ...formCopy,
    ...actionCopy,
    title: '費用費用報銷',
    description: '核對費用證據，跟蹤逐行簽核與付款辦理。',
    new: '新增費用報銷',
    edit: '編輯費用報銷',
    details: '查看詳情',
    number: '編號',
    reason: '事由',
    gross: '費用報銷總額',
    offset: '借款衝抵',
    net: '實付現金',
    search: '搜尋編號、事由或申請人',
    view: '單據檢視',
    allStatuses: '全部狀態',
    refresh: '重新整理費用報銷',
    clearFilters: '清除篩選',
    emptyTitle: '暫無費用報銷',
    emptyDescription: '建立草稿後新增費用明細與證據。',
    noResults: '沒有匹配的費用報銷，請調整篩選。',
    rowActions: '{{name}}的操作',
    views: {
      mine: '我的',
      pending: '待辦',
      done: '已辦',
      copied: '抄送',
    },
    statuses: {
      draft: '草稿',
      revision: '待修訂',
      manager: '經理簽核',
      head: '負責人簽核',
      finance: '財務核對',
      executive: '副總簽核',
      gm: '總經理簽核',
      cashier: '出納辦理',
      exception: '辦理異常',
      paid: '已付款',
      forcedPaid: '管理員記錄已結算',
      rejected: '已駁回',
      withdrawn: '已撤回',
      terminated: '已終止',
    },
    errors: {
      invoiceDuplicate: '同一費用報銷內發票號碼不能重複，請核對各條明細。',
      overrunReasonRequired:
        '關聯授權的累計費用報銷超過已批額度 20%，請填寫超支說明。',
      invoiceUnavailable:
        '發票已被其他費用報銷占用或使用，請核對發票號碼及所屬單據。',
      paymentAccountRequired:
        '員工檔案中的收款帳戶不完整，請聯絡 HR 補齊開戶行、銀行帳號和帳戶戶名後再提交。',
      employeeInactive: '申請人需要有效的在職員工檔案，請聯絡 HR 核對。',
      departmentRequired:
        '申請人尚未設定有效主部門，請聯絡 HR 或組織管理員補齊。',
      categoryInvalid: '明細中的費用類別已停用或不可用，請重新選擇費用類別。',
      sourceInvalid:
        '關聯費用授權已失效、尚未批准或不屬於申請人，請重新核對關聯單據。',
      sourceRebind:
        '提交過的費用報銷不能更換關聯費用授權或借款，請保留原關聯。',
      loanRequired:
        '填寫了借款抵扣額，請選擇對應借款；不抵扣借款時請將抵扣額填為 0。',
      loanInvalid: '所選借款不可用或不屬於申請人，請重新選擇。',
      loanInsufficient: '借款可抵扣餘額不足，請降低抵扣額並重新核對餘額。',
      invalidOffset: '借款抵扣額不能超過費用報銷合計，請核對金額。',
      attachmentInvalid:
        '部分證據不屬於目前費用報銷或已不可用，請重新選擇或上傳證據。',
      slaConfiguration: '目前簽核時限設定不受支援，請聯絡流程管理員核對。',
      inputInvalid:
        '請填寫費用報銷事由，並新增完整、互不重複的費用明細和證據。',
      configuration: '費用報銷資料結構不完整，請聯絡系統管理員修復後重試。',
      forbidden: '無權訪問這筆費用報銷。',
      notFound: '這筆費用報銷已不存在。',
      conflict: '這筆費用報銷有更新，請重新讀取並復核後操作。',
      standardReason: '請逐行說明當日超出已批准標準的費用。',
      standardCategoryChanged:
        '此分類不在原申請適用標準中，請新增申請採用目前政策。',
      standardConfiguration: '已批准差旅標準不完整，請聯絡管理員核對設定。',
      invalid: '請核對費用報銷內容及所需證據。',
      failed: '請求未完成，請重試。',
    },
    standard: {
      title: '凍結費用政策',
      unsubmitted: '首次提交時凍結費用政策。',
      frozenHint:
        '修訂沿用此處已儲存的分類和已批准出差標準；每日費用按標準種類彙總。',
      gradeCode: '出差職級',
      gradeRank: '職級級別',
      lodging: '每晚住宿標準（元）',
      allowance: '每日補貼標準（元）',
      notApplicable: '本單不適用已批准出差標準。',
      kinds: {
        none: '不按差旅每日標準核對',
        lodging: '住宿每日標準',
        allowance: '補貼每日標準',
      },
    },
    detail: {
      lines: '費用明細',
      failure: '辦理失敗原因',
      voucher: '付款憑證號',
      forcedReason: '管理員結算原因',
      noLines: '尚未新增費用明細。',
      line: '費用明細 {{number}}',
      financeResult: '財務核對結果',
      lineStates: {
        approved: '已通過',
        returned: '退回修正',
        pending: '待核對',
      },
    },
    bank: {
      title: '私有收款帳戶',
      bankName: '開戶行',
      bankAccount: '銀行帳號',
      bankAccountName: '帳戶姓名',
      missing: '未存收款帳戶。',
      correct: '修正收款帳戶',
      saved: '已修正收款帳戶',
      denied: '無權讀取收款帳戶。',
      unavailable: '暫不能修正帳戶，請重新讀取費用報銷並檢查已儲存的帳戶。',
    },
    authz: {
      resource: '費用費用報銷',
      submit: '建立和提交本人費用報銷',
      delegate: '代理員工建立費用報銷',
      view: '查看費用報銷',
      paymentAccount: '讀取和修正獲授權的收款帳戶',
    },
  },
};
