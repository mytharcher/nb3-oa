export default {
  leaveBalances: {
    navigationDiscardDescription:
      '変更を破棄して残高一覧に戻ります。元の画面移動は続行しません。',
    navigationDiscard: '破棄して残高に戻る',
    clearFilters: 'フィルターをクリア',
    clearSearch: '検索をクリア',
    title: '休暇残高',
    adminTitle: '休暇残高管理',
    description: '利用可能休暇、保留日数、残高履歴を確認します。',
    adminDescription: '従業員の休暇残高を確認し、理由付き調整を記録します。',
    employee: '従業員',
    employeePlaceholder: '名前またはコードで従業員を検索',
    type: '休暇種類',
    selectType: '休暇種類を選択',
    availableUnits: '利用可能日数',
    heldUnits: '保留日数',
    availableDelta: '利用可能日数の変更',
    heldDelta: '保留日数の変更',
    at: '時刻',
    kind: '種類',
    reference: 'ソース',
    actor: '操作者',
    reason: '理由',
    days: '調整日数',
    actions: '「{{name}}」の操作',
    adjust: '調整',
    adjustBalance: '残高を調整',
    refresh: '更新',
    retry: '再試行',
    loading: '読み込み中',
    noResults: '一致する従業員がいません。検索を変更してください。',
    searchCap: '従業員は先頭20件のみ表示しています。検索を絞り込んでください。',
    noTypes:
      '残高管理対象の休暇種類がありません。管理者に設定を依頼してください。',
    unopened:
      '「{{type}}」には口座がありません。利用可能{{available}}日、保留{{held}}日です。残高を追加して開設してください。',
    ledgerTitle: '{{type}}・残高履歴',
    adjustTitle: '休暇残高を調整',
    adjustDescription: '「{{name}}」の{{type}}残高を調整します。',
    currentBalance:
      '現在の利用可能日数は{{available}}日、保留日数は{{held}}日です。',
    afterBalance:
      '調整後の利用可能日数：{{amount}}日。サーバーでの検証に従います。',
    noExpiry:
      '追加残高には有効期限がありません。減算は既存の有効期限ルールを維持します。',
    daysInvalid: '半日単位でゼロ以外の日数を入力してください。',
    reasonRequired: '調整理由を入力してください。',
    reasonLong: '理由は2000文字以内にしてください。',
    adjusted: '「{{name}}」の残高を調整しました。',
    cancel: 'キャンセル',
    uncertain:
      '結果が不明です。同じ調整を再試行してください。重複記録防止のため値はロックされています。',
    retryAdjustment: '調整を再試行',
    discardTitle: '残高調整を破棄',
    discardDescription: '未保存の調整は失われます。',
    keepEditing: '編集を続ける',
    discard: '破棄',
    kinds: {
      grant: '付与',
      hold: '保留',
      deduct: '控除',
      release: '解放',
      expire: '期限切れ',
      refund: '返還',
    },
    error: {
      insufficient: '利用可能残高が不足しています。控除を減らしてください。',
      forbidden:
        '閲覧・調整権限がありません。管理者に依頼してください。従業員検索には記録へのアクセスも必要です。',
      notFound:
        '従業員記録が存在しないか未紐付けです。人事に依頼するか別の従業員を選択してください。',
      invalid: '調整が不正です。日数、休暇種類、理由を確認してください。',
      failed: 'リクエストを完了できませんでした。再試行してください。',
    },
    empty: {
      readonlyAccountsTitle: '休暇残高はまだありません',
      readonlyAccountsDescription:
        '権限のある人事管理者に休暇残高の付与を依頼してください。',
      employeeTitle: '従業員を選択',
      employeeDescription:
        '名前またはコードで検索して休暇残高を確認してください。',
      accountsTitle: '休暇残高はまだありません',
      accountsDescription: '休暇種類を選択し、調整で残高を追加してください。',
      mineTitle: '休暇残高はまだありません',
      mineDescription:
        '休暇残高は人事が付与します。確認が必要な場合は人事にお問い合わせください。',
      ledgerTitle: '残高履歴はまだありません',
      ledgerDescription: '付与、保留、控除がここに表示されます。',
    },
    authz: {
      section: '休暇管理',
      title: '休暇残高',
      read: '従業員の休暇残高を閲覧',
      update: '従業員の休暇残高を調整',
      permissionSet: '人事休暇残高管理',
    },
  },
};
