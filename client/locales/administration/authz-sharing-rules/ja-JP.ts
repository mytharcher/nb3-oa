export default {
  resourceTitle: '共有ルール',
  navigation: { title: '共有ルール' },
  sharingRules: {
    noResources:
      'レコード範囲をサポートする業務リソースが定義されていません。ここでルールを設定する前に、AIに業務権限とレコード範囲の定義を依頼してください。',
    page: {
      title: '共有ルール',
      description:
        '共有ルールは、特定のレコードや再利用可能なレコード範囲を選択した相手に公開し、アクセスを拡張します。',
    },
    search: 'ルール名、キー、リソースで検索',
    create: '新しい共有ルール',
    ruleHeader: 'ルール',
    recordsSharedHeader: '共有レコード',
    sharedWithHeader: '共有先',
    accessHeader: 'アクセス',
    emptyNone:
      '共有ルールはまだありません。必要な人にレコードを公開するルールを作成してください。',
    emptySearch: '検索条件に一致する共有ルールはありません。',
    pagerLabel: '共有ルール',
    editTitle: '共有ルールを編集',
    newTitle: '新しい共有ルール',
    editorDescription:
      '選択したレコードへのアクセスを対象グループに公開します。',
    ruleHeading: '基本情報',
    ruleDescription: 'ルール名を入力し、共有するリソースを選択してください。',
    ruleName: 'ルール名',
    accessHeading: '操作とレコード範囲',
    accessDescription: '操作ごとにレコードを選択してください。',
    assignmentsHeading: '適用対象',
    assignmentsDescription: '追加のアクセスを付与する相手を選択してください。',
    description: '説明',
    recordsToShare: '共有するレコード',
    selectedRecords: '選択したレコード',
    policyRecords: 'ポリシーに一致するレコード',
    matchingPolicy: 'ポリシーに一致するレコード',
    noRecords: 'レコードが見つかりません。',
    deleteRule: 'ルールを削除',
    save: '共有ルールを保存',
    confirmDeleteTitle: 'ルール「{{title}}」を削除しますか？',
    confirmDeleteBody:
      '共有ルール「{{title}}」を削除します。他の権限セットと共有ルールによるアクセスは引き続き利用できます。',
  },
};
