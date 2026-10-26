export default {
  // Existing permission titles use the collection name.
  trainingRequests: {
    authz: {
      resource: '培訓與外出學習',
      submit: '發起培訓申請',
      delegate: '代員工發起培訓',
      view: '查看培訓申請',
    },
  },
  training: {
    actionForm: {
      title: '{{action}}培訓申請「{{name}}」',
      completed: '已{{action}}培訓申請「{{name}}」',
      saved: '已儲存培訓申請「{{name}}」',
    },
    businessErrors: {
      TRAINING_INVALID_INPUT:
        '請補齊培訓名稱、培訓機構和申請原因，並輸入有效的非負費用。',
      TRAINING_INVALID_DATE:
        '培訓結束時間須晚於開始時間，請檢查起止日期和時間。',
      TRAINING_DEPARTMENT_REQUIRED:
        '申請人沒有有效主部門，請聯絡人力資源完善員工檔案。',
    },

    cc: '追加抄送',
    authz: {
      resource: '培訓與外出學習',
      submit: '發起培訓申請',
      delegate: '代員工發起培訓',
      view: '查看培訓申請',
    },
    new: '新增培訓申請',
    edit: '編輯培訓申請',
    formDescription: '申請培訓或外出學習。',
    name: '培訓名稱',
    institution: '培訓機構',
    startAt: '開始時間',
    endAt: '結束時間',
    usesWorkingTime: '占用工作時間',
    amount: '費用（元）',
    yuan: '元',
    yes: '是',
    no: '否',
    timeZone: '公司時區：{{zone}}',
    amountHint: '以元填寫，最多兩位小數，費用可為零。',
    amountInvalid: '請輸入非負金額，最多兩位小數。',
    dateInvalid: '請選擇有效時段，結束時間須晚於開始時間。',
    approvalHint:
      '通過後，占用工作時間的培訓會記錄出勤；收費培訓生成已批費用報銷額度，尚未發生付款。',
    approvedFacts: '培訓已批准，並抄送 HR。',
    attendanceRecorded: '已記錄培訓出勤活動。',
    authorizationIssued:
      '已批費用報銷額度：{{amount}} 元。費用報銷遵循額度規則。',
    zeroNoAuthorization: '免費培訓不生成費用額度。',
    uncertainCreate: '儲存結果未知，請先到「我的申請」查詢，再決定是否新增。',
    inactive: '申請人須有有效在職員工檔案。',
    configuration: '暫時無法提交簽核，請聯絡管理員檢查簽核期限設定。',
    invalid: '請檢查申請欄位，必要時重新載入最新記錄。',
    stages: {
      manager: '直屬上層',
      head: '部門負責人',
      finance: '財務',
      executive: '分管副總',
      gm: '總經理',
    },
  },
};
