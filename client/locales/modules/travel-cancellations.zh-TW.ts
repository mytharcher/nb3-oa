export default {
  // Existing permission titles use the collection name.
  travelCancellations: {
    authz: {
      resource: '出差取消',
      submit: '發起出差取消申請',
      delegate: '代員工發起出差取消',
      view: '查看出差取消申請',
    },
  },
  travelCancellation: {
    fieldInvalid: '請檢查{{field}}。',

    sourceUnavailable: '來源差旅資訊不可用',
    exceptionReason: '異常原因',
    exception: '退訂異常',
    businessErrors: {
      TRAVEL_CANCELLATION_REASON_REQUIRED: '請填寫取消出差的原因。',
      TRAVEL_CANCELLATION_ALREADY_PENDING:
        '該出差已有待簽核的取消申請，請查看現有申請。',
      TRAVEL_CANCELLATION_BASELINE_CHANGED:
        '原出差單已變化，請重新整理並修訂取消申請後再提交。',
      TRAVEL_CANCELLATION_INVALID_SOURCE:
        '原出差單已不可取消，請重新選擇有效的已批准出差單。',
    },

    retryUnbooking: '重新安排退訂',
    bookingInformation: '退訂訂單與退款安排',
    unbookingHint:
      '部門負責人確認後原出差已撤銷。行政需記錄退訂與退款安排；此記錄不表示退款資金已實際到帳。',
    complete: '完成退訂',
    unable: '無法退訂',
    forceComplete: '強制關閉退訂',
    source: '原出差申請',
    chooseSource: '選擇已批准出差',
    effectHint:
      '取消申請由原部門負責人確認後才撤銷出勤和費用報銷額度；關聯借款按實際放款狀態終止申請或建立補充歸還期限。',
    cc: '追加抄送',
    authz: {
      resource: '出差取消',
      submit: '發起出差取消申請',
      delegate: '代員工發起出差取消',
      view: '查看出差取消申請',
    },
    new: '新增出差取消申請',
    edit: '編輯出差取消申請',
    formDescription: '申請取消已批准的出差。',
    name: '出差取消名稱',
    institution: '出差取消機構',
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
      '通過後，占用工作時間的出差取消會記錄出勤；收費出差取消生成已批費用報銷額度，尚未發生付款。',
    approvedFacts: '出差取消已批准，並抄送 HR。',
    attendanceRecorded: '已記錄出差取消出勤活動。',
    authorizationIssued:
      '已批費用報銷額度：{{amount}} 元。費用報銷遵循額度規則。',
    zeroNoAuthorization: '免費出差取消不生成費用額度。',
    uncertainCreate: '儲存結果未知，請先到「我的申請」查詢，再決定是否新增。',
    inactive: '申請人須有有效在職員工檔案。',
    configuration: '暫時無法提交簽核，請聯絡管理員檢查簽核期限設定。',
    invalid: '請檢查申請欄位，必要時重新載入最新記錄。',
    stages: {
      unbooking: '行政退訂處理',
      manager: '直屬上層',
      head: '部門負責人',
      finance: '財務',
      executive: '分管副總',
      gm: '總經理',
    },
  },
};
