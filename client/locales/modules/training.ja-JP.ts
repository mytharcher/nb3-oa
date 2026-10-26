export default {
  // Existing permission titles use the collection name.
  trainingRequests: {
    authz: {
      resource: '研修・学習',
      submit: '研修申請を提出',
      delegate: '従業員の代理で提出',
      view: '研修申請を閲覧',
    },
  },
  training: {
    actionForm: {
      title: '研修申請「{{name}}」を{{action}}',
      completed: '研修申請「{{name}}」の{{action}}が完了しました',
      saved: '研修申請「{{name}}」を保存しました',
    },
    businessErrors: {
      TRAINING_INVALID_INPUT:
        '研修名、機関、理由と有効な非負の費用を入力してください。',
      TRAINING_INVALID_DATE:
        '研修終了は開始より後にしてください。日時を確認してください。',
      TRAINING_DEPARTMENT_REQUIRED:
        '申請者には有効な主所属部署が必要です。人事に従業員記録の更新を依頼してください。',
    },

    cc: '共有先を追加',
    authz: {
      resource: '研修・学習',
      submit: '研修申請を提出',
      delegate: '従業員の代理で提出',
      view: '研修申請を閲覧',
    },
    new: '新しい研修申請',
    edit: '研修申請を編集',
    formDescription: '研修や社外学習を申請します。',
    name: '研修名',
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
      '勤務時間を使う場合は承認で研修勤怠を記録します。有料研修は承認精算枠を作成しますが、支払は行いません。',
    approvedFacts: '研修は承認済みです。人事に共有します。',
    attendanceRecorded: '研修勤怠活動を記録しました。',
    authorizationIssued:
      '承認済み精算枠：{{amount}}元。精算は枠ポリシーに従います。',
    zeroNoAuthorization: '無料研修では費用枠を作成しません。',
    uncertainCreate:
      '保存結果が不明です。別の申請を作成する前に「自分の申請」を確認してください。',
    inactive: '有効な従業員記録が必要です。',
    configuration:
      '承認を提出できません。管理者に承認期限の確認を依頼してください。',
    invalid: '申請項目を確認し、必要なら最新レコードを再読み込みしてください。',
    stages: {
      manager: '直属上司',
      head: '部署長',
      finance: '財務',
      executive: '担当役員',
      gm: '総経理',
    },
  },
};
