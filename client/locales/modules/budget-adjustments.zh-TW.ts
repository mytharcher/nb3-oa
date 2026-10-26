export default {
  budgetAdjustments: {
    businessErrors: {
      BUDGET_ADJUSTMENT_INVALID_ACCOUNT: '請選擇有效部門和預算年度。',
      BUDGET_ADJUSTMENT_INVALID_AMOUNT:
        '請填寫調整原因並輸入大於零的調整金額。',
      BUDGET_ADJUSTMENT_INVALID_SUBJECT: '請選擇已啟用的預算科目。',
      BUDGET_ADJUSTMENT_INVALID_TRANSFER:
        '調撥須選擇不同的來源和目標科目；追加預算須清空來源科目。',
      BUDGET_ADJUSTMENT_INACTIVE_HEAD:
        '部門負責人已失效，請聯絡管理員維護部門負責人。',
    },

    authz: {
      resource: '預算調整',
      submit: '提交預算調整',
      delegate: '代員工提交預算調整',
      view: '查看預算調整',
    },
    new: '新增預算調整',
    edit: '編輯預算調整',
    formDescription: '提出科目間調撥或追加預算申請。',
    department: '預算部門',
    yearInvalid: '請輸入1900至9999之間的整數年度。',
    year: '預算年度',
    type: '調整類型',
    transfer: '科目間調撥',
    increase: '追加預算',
    targetSubject: '目標科目',
    sourceSubject: '來源科目',
    amount: '金額（元）',
    yuan: '元',
    reason: '原因',
    amountInvalid: '請輸入大於零、最多兩位小數且不超安全範圍的金額。',
    sourceInvalid: '來源科目和目標科目必須不同。',
    amountHint: '以元輸入十進制金額，系統按整數分精確儲存。',
    reserveHint: '調撥提交時預佔來源資金，最終簽核通過才生效。',
    revisionHold:
      '退回期間原預佔仍保留，修訂提議僅在重新提交時釋放舊預佔並建立新預佔。',
    retainedHold:
      '目前原預佔：{{subject}} · {{amount}} 元，與本次修訂提議分別展示。',
    actualHold: '目前來源實際預佔',
    frozenThreshold:
      '提交時追加預算總經理閾值：{{amount}} 元（僅嚴格超過時追加簽核）。',
    applied: '最終簽核已通過，本預算調整已生效。',
    reserved: '來源資金已預佔，預算調整尚未生效。',
    awaitingEffect: '本提議尚未生效，追加預算僅在最終簽核通過後生效。',
    insufficient: '來源預算可用資金不足，請核對金額與來源科目，已保留輸入。',
    subjectInactive: '此科目已停用，請在提交前改選啟用科目。',
    disabled: '已停用',
    inactive: '申請人必須為在職員工。',
    configuration: '暫時無法提交簽核，請聯絡管理員檢查簽核期限設定。',
    invalid: '請核對預算帳戶、調整類型、金額和原因。',
    uncertainCreate:
      '儲存結果不確定，請關閉並先查看我的申請，避免重複建立草稿。',
    stages: {
      head: '部門負責人',
      finance: '財務經理',
      cfo: '財務總監',
      gm: '總經理',
    },
  },
};
