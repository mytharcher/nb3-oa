export default {
  // Existing permission titles use the collection name.
  travelCancellations: {
    authz: {
      resource: '出張取消申請',
      submit: '出張取消申請を提出',
      delegate: '従業員の代理で提出',
      view: '出張取消申請を閲覧',
    },
  },
  travelCancellation: {
    fieldInvalid: '{{field}}を確認してください。',

    sourceUnavailable: '元の出張を利用できません',
    exceptionReason: '例外の理由',
    exception: '予約解除例外',
    businessErrors: {
      TRAVEL_CANCELLATION_REASON_REQUIRED: '出張取消理由を入力してください。',
      TRAVEL_CANCELLATION_ALREADY_PENDING:
        'この出張には取消保留があります。既存申請を開いてください。',
      TRAVEL_CANCELLATION_BASELINE_CHANGED:
        '承認済み出張が変更されました。再提出前に更新して取消を修正してください。',
      TRAVEL_CANCELLATION_INVALID_SOURCE:
        '元の出張は取消条件を満たしません。有効な承認済み出張を選択してください。',
    },

    retryUnbooking: '総務取消を再試行',
    bookingInformation: '取消注文・返金手配',
    unbookingHint:
      '部署長承認後に元の出張を取り消します。総務が取消と返金手配を記録しますが、返金支払の確認ではありません。',
    complete: '総務取消を完了',
    unable: '予約取消不可',
    forceComplete: '取消を強制終了',
    source: '元の出張',
    chooseSource: '承認済み出張を選択',
    effectHint:
      '元の部署長が承認後に勤怠と精算承認を取り消します。関連貸付は支払状態に応じて処理します。',
    cc: '共有先を追加',
    authz: {
      resource: '出張取消申請',
      submit: '出張取消申請を提出',
      delegate: '従業員の代理で提出',
      view: '出張取消申請を閲覧',
    },
    new: '新しい出張取消申請',
    edit: '出張取消申請を編集',
    formDescription: '承認済み出張の取消を申請します。',
    name: '出張取消名',
    institution: '機関',
    startAt: '開始日時',
    endAt: '終了日時',
    usesWorkingTime: '勤務時間を使用',
    amount: '費用（元）',
    yuan: '元',
    yes: 'はい',
    no: 'いいえ',
    timeZone: '会社のタイムゾーン：{{zone}}',
    amountHint:
      '元単位で小数点以下2桁以内を入力してください。無料も指定できます。',
    amountInvalid: '小数点以下2桁以内の非負金額を入力してください。',
    dateInvalid: '終了が開始より後の有効な期間を選択してください。',
    approvalHint:
      '勤務時間使用時は承認で出張取消勤怠を記録します。有料出張取消は承認精算枠を作成しますが、支払は行いません。',
    approvedFacts: '出張取消は承認済みです。人事に共有します。',
    attendanceRecorded: '出張取消勤怠活動を記録しました。',
    authorizationIssued:
      '承認済み精算枠：{{amount}}元。精算は枠ポリシーに従います。',
    zeroNoAuthorization: '無料の出張取消には費用枠を作成しません。',
    uncertainCreate:
      '保存結果が不明です。別の申請を作成する前に「自分の申請」を確認してください。',
    inactive: '有効な従業員記録が必要です。',
    configuration:
      '承認を提出できません。管理者に承認期限の確認を依頼してください。',
    invalid: '申請項目を確認し、必要なら最新レコードを再読み込みしてください。',
    stages: {
      unbooking: '総務による予約取消',
      manager: '直属上司',
      head: '部署長',
      finance: '財務',
      executive: '担当役員',
      gm: '総経理',
    },
  },
};
