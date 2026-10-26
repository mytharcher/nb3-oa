export default {
  resourceTitle: 'デフォルトデータ範囲',
  navigation: { title: 'デフォルトデータ範囲' },
  defaultAccess: {
    supportedScope:
      'データ範囲をサポートするリソースの種類だけが表示されます。各操作のデフォルトレコード範囲をここで設定してください。',
    groupFilter: 'リソースグループ',
    allGroups: 'すべてのグループ',
    inlineHint:
      '単純な変更は直ちに保存されます。詳細な範囲はドロワーで設定して保存してください。',
    saved: '保存済み',
    editScope: '範囲を編集',
    back: 'デフォルトアクセスに戻る',

    configureResource: 'リソースを設定',
    configure: '設定',
    chooseResource:
      'デフォルトレコード範囲を設定するリソースを選択してください。',
    configured: '設定済み',
    noDefault: 'デフォルト範囲なし',
    customScope: '特定の範囲',

    page: {
      title: 'デフォルトデータ範囲',
      description:
        'デフォルトデータ範囲は、該当する操作権限を持つユーザーの基本レコード範囲を拡張します。操作権限やフィールド権限は付与しません。共有ルールと制限ルールも適用されます。',
    },
    search: 'リソース名またはキーで検索',
    create: 'デフォルトアクセスを設定',
    recordAccessHeader: 'デフォルトレコードアクセス',
    allowedActions: '許可する操作',
    emptyNone:
      'デフォルトアクセスは設定されていません。権限セットと他のルールがアクセスを決定します。',
    emptySearch: '検索条件に一致するデフォルトアクセスルールはありません。',
    pagerLabel: 'デフォルトデータ範囲ルール',
    editTitle: 'デフォルトアクセスを編集',
    newTitle: 'デフォルトアクセスを設定',
    editorDescription:
      '共有と制限が適用される前の基本的なレコード表示範囲を定義します。',
    resourceHeading: 'リソース',
    resourceDescription:
      '基本アクセスを設定するコレクションを選択してください。',
    accessHeading: '操作別アクセス',
    accessDescription: '操作ごとに独立したレコード範囲を設定します。',
    deleteRule: 'ルールを削除',
    save: 'デフォルトアクセスを保存',
    confirmDeleteTitle: '「{{resource}}」のデフォルト設定を削除しますか？',
    confirmDeleteBody:
      '「{{resource}}」のデフォルトアクセスルールを削除します。残りの権限セットとルールがアクセスを決定します。',
  },
};
