export default {
  expensePlans: {
    relatedUnavailable: '関連レコードを利用できません',
    businessErrors: {
      EXPENSE_PLAN_DEPARTMENT_REQUIRED:
        '申請者には有効な主所属部署が必要です。人事に従業員記録の更新を依頼してください。',
      EXPENSE_PLAN_INVALID_DATE: '有効な経費予定日を選択してください。',
      EXPENSE_PLAN_INVALID_DICTIONARY:
        '有効な案件種類と予算科目を選択してください。',
      EXPENSE_PLAN_INVALID_INPUT:
        '正の金額、参加者数、経費理由を入力してください。',
    },

    new: '新しい経費事前申請',
    edit: '経費事前申請を編集',
    formDescription: '交際、チーム活動、イベントの支出を事前計画します。',
    matterType: '案件種類',
    subject: '予算科目',
    amount: '予定経費（元）',
    yuan: '元',
    participants: '参加者数',
    eventDate: '開催日',
    budgetYear: '提出時の予算年度',
    department: '提出時の主所属部署',
    primaryDepartment:
      '現在の主所属部署：{{department}}。提出時に再確認されます。',
    departmentMissing: '未設定',
    departmentPending: '提出時に決定',
    departmentUnavailable: '現在部署を利用できません',
    year: '予算年度：{{year}}・会社暦：{{timeZone}}',
    amountHint:
      '元単位の小数で入力してください。金額は正確な分単位整数で保存されます。',
    amountInvalid:
      '安全な上限内で、小数点以下2桁以内の正の金額を入力してください。',
    participantsInvalid: '1～100000の整数を入力してください。',
    dateInvalid: '有効な日付を選択してください。',
    disabled: '無効',
    subjectInactive: '有効な案件種類と予算科目を選択してください。',
    optionsEmpty: '保存前に有効な案件種類と予算科目の設定が必要です。',
    reserveHint:
      '提出時に予算を予約します。最終承認により経費精算枠を付与します。',
    revisionHold:
      '修正中も元の予算予約は維持されます。再提出時にのみ変更されます。',
    retainedHold:
      '元の予約：{{subject}}・{{amount}}元。修正後の提案とは別です。',
    actualHold: '承認時の予約',
    holdFactHint:
      '元の予約事実です。その後の経費精算を差し引いた残高ではありません。',
    frozenThreshold: '提出時の基準額：担当役員 > {{vp}}元、総経理 > {{gm}}元。',
    applied: '承認済み枠が発行されました。経費精算や支払の完了を意味しません。',
    reserved: '承認待ちの間、予算が予約されています。',
    awaitingEffect: 'この申請に承認済み枠は発行されていません。',
    uncertainCreate:
      '保存結果が不明です。閉じて「自分の申請」を確認してから別の下書きを作成してください。',
    unknownEdit:
      '保存結果が不明です。最新レコードを読み込むまで入力をロックしています。',
    authorization: '承認済み枠',
    quotaId: '枠の参照番号',
    grantedAmount: '付与額',
    quotaState: '枠の状態',
    deadline: '有効期限',
    quotaHint:
      '経費精算によりこの枠を精算します。終了や期限切れでも承認は取り消されません。',
    mergedTitle: '同一人物の統合',
    quotaStates: { open: '未終了', closed: '終了', expired: '期限切れ' },
    createdBy: '作成者',
    authz: {
      resource: '経費事前申請',
      submit: '経費事前申請を提出',
      delegate: '従業員の代理で経費事前申請を提出',
      view: '経費事前申請を閲覧',
    },
    stages: {
      head: '部署長',
      finance: '財務',
      executive: '担当役員',
      gm: '総経理',
    },
    states: { approved: '承認済み枠発行済み' },
    merged: '担当役員と総経理を統合：同じ人が自身の権限で承認しました。',
    errors: {
      invalid: '日付、参加者数、金額、案件種類、科目を確認してください。',
      department: '申請者には有効な主所属部署が必要です。',
      insufficient: 'この予算口座の利用可能資金が不足しています。',
      inactive: '申請者には有効な従業員記録が必要です。',
      configuration:
        '承認を提出できません。管理者に承認期限の確認を依頼してください。',
    },
  },
};
