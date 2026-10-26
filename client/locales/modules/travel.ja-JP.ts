export default {
  travel: {
    fieldInvalid: '{{field}}を確認してください。',

    confirmRetryBooking: 'この承認済み出張の予約を再試行しますか？',
    confirmReviseTrip: '出張を修正して承認を再開しますか？',
    states: {
      completed: '完了',
      cancelled: 'キャンセル済み',
      exception: '予約例外',
    },
    businessErrors: {
      TRAVEL_ITINERARY_REQUIRED:
        '海外出張には旅程添付が必要です。提出前にアップロードまたは選択してください。',
      TRAVEL_OVERLAP:
        '承認済み出張と期間が重複しています。日付を調整してください。',
      TRAVEL_COMPANIONS_INVALID:
        '申請者以外の重複しない同行者を選択してください。',
      TRAVEL_COMPANION_INACTIVE:
        '選択した旅行者が在籍中ではありません。現在の従業員を選び直してください。',
      TRAVEL_DEPARTMENT_REQUIRED:
        '申請者には有効な主所属部署が必要です。人事に従業員記録の更新を依頼してください。',
      TRAVEL_INVALID_DATE:
        '出張終了は開始より後にしてください。両方の日時を確認してください。',
      TRAVEL_INVALID_INPUT:
        '目的地、理由、有効な非負の旅費を入力してください。',
    },

    requestLoan: '関連貸付を申請',
    reviseTrip: '出張を修正して承認を再開',
    revisionWarning:
      '修正は再承認前に旧精算枠と旧勤怠活動を終了します。既存貸付元本と元返済期限は変わりません。貸付は別途処理してください。',
    cancelTrip: '出張取消を申請',
    complete: '予約を完了',
    unable: '予約不可',
    forceComplete: '予約を強制終了',
    retryBooking: '予約を再試行',
    standard: '固定出張基準',
    lodgingPerNight: '1泊あたり宿泊基準（元）',
    allowancePerDay: '1日あたり日当基準（元）',
    companions: '同行者',
    addCompanion: '同行者を追加',
    removeCompanion: '削除',
    companionsInvalid: '同行者は重複不可',
    peopleUnavailable:
      '従業員検索の権限がありません。管理者にお問い合わせください。',
    destination: '目的地',
    international: '海外出張',
    needsBooking: '総務による予約',
    needsLoan: '貸付申請あり',
    transportCents: '交通費',
    lodgingCents: '宿泊費',
    allowanceCents: '日当',
    bookingInformation: '予約詳細',
    exceptionReason: '例外の理由',
    cc: '共有先を追加',
    authz: {
      resource: '出張申請',
      submit: '出張申請を提出',
      delegate: '従業員の代理で提出',
      view: '出張申請を閲覧',
    },
    new: '新しい出張申請',
    edit: '出張申請を編集',
    formDescription: '出張を申請します。',
    name: '出張名',
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
      '承認で出張勤怠を記録し、正の見積に精算枠を作成します。予約と貸付支払は別です。',
    approvedFacts: '出張承認が完了しました。予約進捗は別表示です。',
    attendanceRecorded: '出張勤怠活動を記録しました。',
    authorizationIssued:
      '承認済み精算枠：{{amount}}元。精算は枠ポリシーに従います。',
    zeroNoAuthorization:
      '見積がゼロの場合は枠を作成しませんが、財務審査は必要です。',
    uncertainCreate:
      '保存結果が不明です。別の申請を作成する前に「自分の申請」を確認してください。',
    inactive: '有効な従業員記録が必要です。',
    configuration:
      '承認を提出できません。管理者に承認期限の確認を依頼してください。',
    invalid: '申請項目を確認し、必要なら最新レコードを再読み込みしてください。',
    stages: {
      completed: '完了',
      manager: '直属上司',
      head: '部署長',
      finance: '財務',
      executive: '担当役員',
      gm: '総経理',
      booking: '総務による予約',
    },
  },
};
