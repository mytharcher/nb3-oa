export default {
  supplies: {
    namedRowActions: '{{name}}の操作',

    businessErrors: {
      SUPPLY_REQUIRED_FIELDS: '品目を1件以上追加し目的を入力してください。',
      SUPPLY_ITEM_UNAVAILABLE:
        '利用不可の品目があります。有効な品目を選び直してください。',
      SUPPLY_CONTENT_CHANGED:
        '承認品目が変更されました。交付記録前に申請を更新してください。',
    },

    rowActions: 'レコード操作',
    number: '払出番号',
    unknownEdit: '保存結果が不明です。再編集前に最新申請を読み込んでください。',
    emptyCatalog: '有効な事務用品が未設定です。総務にお問い合わせください。',
    ledgerDetail: '交付記録',
    ledgerDescription:
      '記録した数量と管理終了です。未確認数量は交付の証明ではありません。',
    entryMissing: 'この交付記録を利用できません。',
    authz: {
      resource: '消耗品払出申請',
      ledger: '消耗品交付台帳を閲覧',
    },
    navigation: '消耗品台帳',
    new: '新しい消耗品払出申請',
    edit: '消耗品払出申請を編集',
    formDescription: '品目と数量を選択します。上司承認後に総務が交付します。',
    purpose: '目的',
    item: '品目',
    items: '申請品目',
    quantity: '数量',
    quantityValue: '数量：{{quantity}}',
    chooseItem: '品目を選択',
    line: '品目{{number}}',
    remove: '品目{{number}}を削除',
    addItem: '品目を追加',
    quantityInvalid: '1～100000の整数の数量を入力してください。',
    duplicate: '各品目は1回のみ選択してください。',
    emailInvalid: '有効なメールアドレスを入力してください。',
    printRequired: '名刺印刷の必須情報を入力してください。',
    print: {
      name: '名前',
      title: '役職名',
      phone: '電話',
      email: 'メールアドレス',
      address: '住所',
      department: '部署（任意）',
    },
    approvedAt: '上司承認日時',
    issuingStage: '総務交付',
    resubmitHint:
      '品目と目的を変えない再提出は総務へ戻ります。変更時は上司の再承認が必要です。前の承認は履歴に残ります。',
    forcedHint:
      '承認管理者が現物交付を確認せず終了しました。実数量は未確認です。',
    uncertainCreate:
      '保存結果が不明です。閉じて「自分の申請」を確認してから別の下書きを作成してください。',
    invalid: '目的、品目、整数の数量を確認してください。',
    itemUnavailable:
      '無効または存在しない品目があります。変更内容を提出する前に更新してください。',
    inactive: '有効な従業員記録が必要です。',
    configuration:
      '承認を提出できません。管理者に承認期限の確認を依頼してください。',
    contentChanged:
      '内容が承認申請と一致しません。最新バージョンを読み込んでください。',
    reasonRequired: '理由を入力してください。',
    actions: {
      claim: '交付を引き受け',
      release: '引き受けを解除',
      assign: '担当者を割り当て',
      complete: '発行を確認',
      unable: '発行不可',
      forceComplete: '強制終了',
    },
    actionHints: {
      complete:
        '全申請品目を申請数量どおり現物交付したことを確認します。交付台帳へ記録します。',
      unable:
        '在庫不足など交付できない理由を説明してください。上司承認は維持されます。',
      release: '引き受けを解放し、別の総務担当者が対応できるようにします。',
      forceComplete:
        '交付を確認せず管理判断で終了します。実数量は未確認として記録します。理由が必須です。',
    },
    states: {
      issuing: '交付待ち',
      exception: '発行例外',
      issued: '交付済み',
      forcedClosed: '管理者による終了済み',
    },
    ledgerTitle: '消耗品交付台帳',
    requestedQuantity: '申請数量',
    actualQuantity: '実数量',
    outcome: '結果',
    recipient: '受信者',
    issuer: '担当者',
    unconfirmed: '未確認',
    reason: '理由',
    emptyLedger: '交付記録なし',
    viewRequest: '払出申請を表示',
  },
};
