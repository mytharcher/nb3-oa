export default {
  financeAssignments: {
    create: '作成',

    saved: '「{{name}}」の会計担当者割り当てを保存しました',
    saveFailed:
      '割り当てを保存できませんでした。入力を確認して再試行してください。',
    disableTitle: '「{{name}}」の割り当てを無効にしますか？',

    loadLatest: '最新の割り当てを読み込む',
    latestSummary:
      '最新：{{name}}／{{status}}。フォームの値は変更されていません。',
    adoptVersion: 'このバージョンに自分の変更を適用',
    uncertain: '作成結果が不明です。再試行前にこの部署を確認してください。',
    checkExisting: '部署の割り当てを確認',
    viewExisting: '既存の割り当てを開く',
    required: '必須項目です。',
    title: '部署別会計担当者',
    description:
      '部署ごとの財務審査担当者を設定します。割り当てがないか無効な場合は最も近い有効な上位部署、それもなければ財務マネージャーを使用します。',
    new: '会計担当者を割り当て',
    edit: '割り当てを編集',
    view: '割り当て詳細',
    department: '部署',
    accountant: '会計担当者',
    status: '状態',
    active: '有効',
    inactive: '無効',
    updatedAt: '更新日時',
    refresh: '更新',
    clear: 'フィルターをクリア',
    rowActions: '{{name}}の操作',
    save: '保存',
    cancel: 'キャンセル',
    loading: '割り当てを読み込み中',
    retry: '再試行',
    accountantPlaceholder: '適格な会計担当者を検索',
    noAccountants: '有効な財務職責ロールメンバーがいません',
    reason: '理由',
    formDescription:
      '有効な財務職責ロールメンバーのみ割り当てられます。変更は監査されます。',
    departmentPermission:
      '部署選択には部署の読み取り権限が必要です。管理者に依頼してください。',
    conflictAdvice:
      '参照用に変更を保持してください。再試行前に閉じて開き直し、最新の割り当てを確認してください。',
    disable: '割り当てを無効化',
    disableDescription:
      '今後の承認では最も近い有効な上位部署の割り当て、それもなければ財務マネージャーを使用します。既存の承認タスクの担当者は変わりません。',
    authz: {
      title: '部署別会計担当者',
      read: '割り当てを閲覧',
      update: '割り当てを管理',
      permissionSet: '財務マネージャーの会計担当者設定',
    },
    empty: {
      accountsTitle: '会計担当者の割り当てなし',
      accountsDescription:
        '部署に会計担当者を割り当てて財務審査を振り分けます。',
      readonlyTitle: '割り当てなし',
      readonlyDescription: '財務マネージャーが部署別会計担当者を設定できます。',
      filteredTitle: '一致する割り当てがありません',
      filteredDescription:
        '部署フィルターを解除するとすべての割り当てを表示します。',
    },
    error: {
      forbidden: 'これらの割り当てへのアクセス権がありません。',
      missing: 'この割り当ては存在しません。',
      invalid: 'フォームの値を確認してください。',
      failed: '割り当てを読み込めませんでした。再試行してください。',
      FINANCE_ASSIGNMENT_NOT_FOUND: 'この割り当ては存在しません。',
      FINANCE_ASSIGNMENT_VERSION_CONFLICT:
        '割り当てが変更されました。フォームを開き直して最新を確認してください。',
      FINANCE_ASSIGNMENT_ALREADY_EXISTS:
        'この部署には既に割り当てがあります。その割り当てを編集してください。',
      FINANCE_ASSIGNMENT_INVALID_DEPARTMENT: '有効な部署を選択してください。',
      FINANCE_ASSIGNMENT_INVALID_ACCOUNTANT:
        '有効な財務職責ロールメンバーを選択してください。',
      FINANCE_ASSIGNMENT_INVALID_COMMAND: '操作者と理由が必要です。',
    },
  },
};
