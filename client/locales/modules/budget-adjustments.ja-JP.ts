export default {
  budgetAdjustments: {
    businessErrors: {
      BUDGET_ADJUSTMENT_INVALID_ACCOUNT:
        '有効な部署と予算年度を選択してください。',
      BUDGET_ADJUSTMENT_INVALID_AMOUNT:
        '正の調整金額と理由を入力してください。',
      BUDGET_ADJUSTMENT_INVALID_SUBJECT: '有効な予算科目を選択してください。',
      BUDGET_ADJUSTMENT_INVALID_TRANSFER:
        '振替では振替元と振替先を別の科目にしてください。増額では振替元をクリアしてください。',
      BUDGET_ADJUSTMENT_INACTIVE_HEAD:
        '部署長を利用できません。管理者に部署の割り当て更新を依頼してください。',
    },

    authz: {
      resource: '予算調整',
      submit: '予算調整を提出',
      delegate: '従業員の代理で予算調整を提出',
      view: '予算調整を閲覧',
    },
    new: '新しい予算調整',
    edit: '予算調整を編集',
    formDescription: '科目間の振替または予算追加を提案します。',
    department: '予算部署',
    yearInvalid: '1900～9999の整数の年度を入力してください。',
    year: '予算年度',
    type: '調整の種類',
    transfer: '科目間振替',
    increase: '予算追加',
    targetSubject: '振替先科目',
    sourceSubject: '振替元科目',
    amount: '金額（元）',
    yuan: '元',
    reason: '理由',
    amountInvalid:
      '安全な上限内の正の小数を、小数点以下2桁以内で入力してください。',
    sourceInvalid: '振替元と振替先は別の科目を選択してください。',
    amountHint:
      '元単位の小数で入力してください。金額は正確な分単位の整数で保存されます。',
    reserveHint:
      '振替は提出時に振替元の資金を予約します。予算は最終承認後にのみ反映されます。',
    revisionHold:
      '差し戻し中も元の予約は維持されます。提案の変更は再提出時にのみ元の予約を解除・置換します。',
    retainedHold:
      '現在の元予約：{{subject}}・{{amount}}元。修正後の提案とは別です。',
    actualHold: '現在の振替元予約',
    frozenThreshold:
      '提出時の増額に対する総経理基準額：{{amount}}元（厳密に超える場合のみ）。',
    applied: '最終承認により予算調整が反映されました。',
    reserved: '振替元資金は予約済みです。この調整は未反映です。',
    awaitingEffect:
      'この提案は未反映です。予算追加は最終承認後にのみ反映されます。',
    insufficient:
      '振替元予算の利用可能資金が不足しています。金額と振替元を確認してください。入力内容は保持されています。',
    subjectInactive:
      'この科目は無効です。提出前に有効な科目を選択してください。',
    disabled: '無効',
    inactive: '申請者は在籍中の従業員である必要があります。',
    configuration:
      '承認を提出できません。管理者に承認期限の確認を依頼してください。',
    invalid: '口座、調整種類、金額、理由を確認してください。',
    uncertainCreate:
      '保存結果が不明です。閉じて「自分の申請」を確認してから別の下書きを作成してください。',
    stages: {
      head: '部署長',
      finance: '財務マネージャー',
      cfo: '最高財務責任者',
      gm: '総経理',
    },
  },
};
