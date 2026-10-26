export default {
  resourceTitle: '制限ルール',
  navigation: { title: '制限ルール' },
  restrictionRules: {
    noResources:
      'レコード範囲をサポートする業務リソースが定義されていません。ここでルールを設定する前に、AIに業務権限とレコード範囲の定義を依頼してください。',
    page: {
      title: '制限ルール',
      description:
        '制限ルールは、選択したユーザーがアクセスできるレコードを絞り込みます。単独では何も付与しません。',
    },
    notice:
      '制限ルールは既存のアクセスを絞り込むだけで、単独では権限を付与しません。',
    search: 'ルール名、キー、リソースで検索',
    create: '新しい制限ルール',
    ruleHeader: 'ルール',
    appliesToHeader: '適用対象',
    restrictedActionsHeader: '制限する操作',
    allowedScopeHeader: '許可する範囲',
    emptyNone:
      '制限ルールはまだありません。選択したユーザーのアクセス範囲を絞るルールを作成してください。',
    emptySearch: '検索条件に一致する制限ルールはありません。',
    pagerLabel: '制限ルール',
    editTitle: '制限ルールを編集',
    newTitle: '新しい制限ルール',
    editorDescription: '対象グループの有効なレコード範囲を制限します。',
    ruleHeading: '基本情報',
    ruleDescription: 'ルール名を入力し、制限するリソースを選択してください。',
    ruleName: 'ルール名',
    assignmentsHeading: '適用対象',
    assignmentsDescription: 'この制限の対象者を選択してください。',
    reason: '説明',
    accessHeading: '操作とレコード範囲',
    accessDescription: '操作ごとに最大のレコード範囲を設定します。',
    deleteRule: 'ルールを削除',
    save: '制限ルールを保存',
    confirmDeleteTitle: 'ルール「{{title}}」を削除しますか？',
    confirmDeleteBody:
      '制限ルール「{{title}}」を削除します。残りの権限セットとルールがアクセスを決定します。',
  },
};
