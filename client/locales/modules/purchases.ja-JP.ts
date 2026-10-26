export default {
  purchases: {
    businessErrors: {
      PURCHASE_INVALID_ITEMS:
        '各購入品に名前、単位、正の数量が必要です。重複品を確認してください。',
      PURCHASE_INVALID_DATE: '有効な入荷予定日を選択してください。',
      PURCHASE_INVALID_PRICE:
        '正の実価格、仕入先、見積証拠を指定してください。',
      PURCHASE_INVALID_QUOTES:
        '見積ファイルを異なる仕入先で再使用できません。別の証拠を選択してください。',
      PURCHASE_QUOTES_REQUIRED:
        'この金額には異なる3社の添付付き見積が必要です。',
      PURCHASE_PRICE_CONFIRMATION_REQUIRED:
        '再提出前に予算見積を確定見積額に修正してください。',
      PURCHASE_INVALID_INPUT:
        '購入品と目的を追加し、正の見積金額を入力してください。',
      PURCHASE_DEPARTMENT_REQUIRED:
        '申請者には有効な主所属部署が必要です。人事に従業員記録の更新を依頼してください。',
      INVALID_RECEIPT: '実際の受領日と確認理由を入力してください。',
    },

    discardThenNavigate:
      '未保存の変更を破棄しますか？確認後に移動先を再選択してください。',
    localInputsRetained:
      '最新バージョンを読み込みました。入力は保持されています。再保存前に確認してください。',
    chooseForceMode: '処理方法を選択',
    confirmForceClose: '購入{{name}}を終了しますか？',
    confirmPricing: '{{name}}の見積を確認しますか？',
    confirmCancelOrder: '発注{{name}}を取り消しますか？',
    priceWillReturn:
      '価格が見積より20%を超えて高いため、財務審査前に申請者へ確認のため差し戻します。',
    pricingSubmitConsequence:
      '提出で次の承認段階用に見積を固定し、予算保留額を調整します。',

    new: '新しい購入',
    edit: '購入を編集',
    saved: '購入を保存しました',
    formDescription:
      '品目、目的、見積を入力してください。提出時に会社暦の当年度の主所属部署予算を予約します。',
    primaryDepartment: '主所属部署：{{department}}',
    yearHint: '提出年度は会社暦（{{timeZone}}）に従います。',
    departmentMissing: '主所属部署なし',
    department: '部署',
    departmentPending: '提出時に決定',
    departmentUnavailable: '部署を利用できません',
    budgetYear: '予算年度',
    purpose: '目的',
    subject: '予算科目',
    selectSubject: '予算科目を選択',
    estimated: '見積金額',
    actual: '実価格',
    actualAmount: '実価格（元）',
    yuan: '元',
    expectedDate: '納品予定日',
    suggestedVendor: '推奨仕入先',
    selectedVendor: '選択した仕入先',
    vendor: '仕入先',
    vendorUnavailable: '仕入先を利用できません',
    noSuggestedVendor: '推奨仕入先なし',
    vendorInactive: '有効な仕入先を選択',
    subjectInactive: '有効な予算科目を選択',
    disabled: '無効',
    inactive: '非アクティブ',
    fieldInvalid: 'この項目を確認してください',
    amountInvalid: '小数点以下2桁以内で正の金額を入力してください',
    amountHint: '小数点以下2桁以内にしてください。',
    dateInvalid: '有効な日付を選択',
    items: '購入品目',
    itemName: '品目名',
    itemNumber: '品目{{number}}',
    specification: '仕様',
    quantity: '数量',
    unit: '単位',
    quantityInvalid: '正の数量を入力してください。小数も指定できます',
    quantityHint: '1.5 kgなどの小数数量も指定できます。',
    addItem: '品目を追加',
    removeItem: '品目を削除',
    reserveHint: '下書きは予算を予約しません。提出時に保留します。',
    loadLatest: '最新申請を読み込む',
    unknownCreate:
      '保存結果が不明です。再作成を停止しています。タスクセンターで下書きを確認してください。',
    unknownEdit: '保存結果が不明です。続行前に最新申請を読み込んでください。',
    unknownPricing:
      '結果が不明なためフォームはロック中です。再試行では同じ内容とリクエストIDを送信します。',
    quotes: '見積証拠',
    quoteEvidence: '仕入先見積証拠',
    quoteEvidenceDescription:
      '仕入先ごとに証拠をアップロードしてください。要件が同じなら既存証拠を再使用できます。固定基準額を超える場合は異なる3社の証拠が必要です。',
    addQuote: '仕入先見積を追加',
    removeQuote: '見積の選択を解除',
    threeQuotesRequired:
      '見積基準額を超える場合は異なる3社の見積添付を用意してください。',
    selectExistingQuote: '既存見積を選択：{{filename}}',
    refreshQuotes: '既存見積を更新',
    completePricing: '価格決定を完了',
    forcePricing: '管理者の調達操作',
    forceMode: '操作方式',
    forcePriced: '財務承認に完全な結果を提出',
    forceClose: '発注せず強制終了',
    forceCloseDescription:
      '強制終了は予算保留を解除し管理者の理由を記録します。調達・受領完了を宣言せず、発注も作成しません。',
    priceConfirmationDescription:
      '見積の120%を超える価格は申請者確認に差し戻し、それ以外は財務承認に進みます。',
    confirmPriceHint:
      '価格が見積の120%を超えています。確認して再提出してください。',
    handler: '調達担当者',
    forcedClosedHint:
      '管理者が強制終了しました。保留は解除され、発注や受領は作成されませんでした。',
    actualHold: '現在の予算保留',
    holdHint: '承認後も予算保留は維持され、申請者の受領確認で精算します。',
    order: '発注書',
    orderHint:
      '発注は承認済み価格、仕入先、品目を固定します。受領と支払は別に追跡します。',
    openOrder: '発注を開く',
    mergedTitle: '隣接承認を統合',
    merged:
      '{{name}}が隣接段階を本人として完了したため、同一人物承認を統合しました。',
    authz: {
      orderScope: 'このユーザーが閲覧できる購入の発注',
      resource: '購入',
      submit: '購入を提出',
      view: '購入を閲覧',
      orders: '発注を閲覧',
      accept: '受領を確認',
    },
    errors: {
      insufficient:
        '利用可能予算が不足しています。予算責任者にお問い合わせください。',
      inactive: '申請者は無効です。',
      configuration: '承認設定は未対応です。管理者にお問い合わせください。',
      invalid: '強調された項目を確認してください。',
    },
    states: {
      draft: '下書き',
      revision: 'リビジョン',
      head: '部署承認',
      purchasing: '調達処理',
      exception: '調達例外',
      finance: '財務承認',
      executive: '担当役員承認',
      gm: '総経理承認',
      approved: '承認済み',
      rejected: '却下済み',
      withdrawn: '取り下げ済み',
      terminated: '終了済み',
      forcedClosed: '強制終了済み',
    },
    stages: {
      draft: '下書き',
      revision: 'リビジョン',
      head: '部署承認',
      purchasing: '調達処理',
      exception: '調達例外',
      finance: '財務承認',
      executive: '担当役員承認',
      gm: '総経理承認',
      approved: '承認済み',
      rejected: '却下済み',
      withdrawn: '取り下げ済み',
      terminated: '終了済み',
      forcedClosed: '強制終了済み',
    },
    actions: {
      claim: '引き受け',
      release: '引き受けを解除',
      complete: '価格決定を完了',
      unable: '調達不可',
      forceComplete: '管理者操作',
      cc: '共有',
    },
    ledgerTitle: '発注台帳',
    ledgerDescription:
      '承認済み発注、受領状態、支払記録を確認します。受領は予算を精算し、支払は独立して記録します。',
    orderNumber: '発注番号',
    emptyOrders: '範囲内に発注はありません',
    pendingPayments: '支払保留額（元）',
    paidPayments: '支払済み金額（元）',
    receiptDate: '受領日',
    acceptedBy: '受領確認者',
    receiptReason: '受領メモ',
    confirmReceipt: '受領を確認',
    cancelOrder: '発注を取消',
    orderSaved: '発注を更新しました',
    unknownOrderAction:
      '結果が不明です。フォームをロックし、再試行では同じ内容とリクエストIDを送信します。',
    receiptSettlementHint:
      '確認で発注の予算保留を精算します。仕入先への支払を意味しません。確認済み受領は変更不可です。',
    cancelOrderHint:
      '承認管理者のみ、未受領で支払保留・支払済み金額のない発注を取り消せます。予算保留を解除し理由を記録します。',
    orderStates: {
      awaitingReceipt: '受領待ち',
      accepted: '受信済み',
      cancelled: 'キャンセル済み',
    },
    actionTitle: '購入「{{name}}」を{{action}}',
    completed: '購入「{{name}}」の{{action}}が完了しました',
    quoteBasisChanged:
      '調達要件が変更されました。下書き入力は保持しますが、見積証拠は最新要件に一致する必要があります。',
    frozenRules: '提出時に適用したルール',
    frozenRulesHint:
      '基準を厳密に超える金額だけ、対応する見積証拠や承認段階が必要です。後のルール変更はこの提出に影響しません。',
    ruleLabels: {
      purchase_quotes: '3社見積基準額',
      spend_vp: '担当役員承認基準額',
      spend_gm: '総経理承認基準額',
    },
    staleQuoteUpload:
      '処理バージョンが変更されました。見積証拠のアップロード前に申請を更新してください。',
    ordersTitle: '発注書',
  },
};
