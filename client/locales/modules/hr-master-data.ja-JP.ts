export default {
  hrMasterData: {
    mappingSearch:
      '外部IDの完全一致で対応レコードを検索（未指定時は最新100件）',
    title: '人事同期',
    description:
      '承認済み連携ゲートウェイから組織と従業員のマスターデータを受信します。既存のアカウント紐付けが必要です。同期でログインは有効になりません。',
    read: '同期を閲覧',
    sync: '同期・再実行',
    manage: 'ソースと所有権を管理',
    addSource: 'ソースを追加',
    editSource: 'ソースを編集',
    sourceCode: 'ソースコード（小文字英字、数字、ハイフン）',
    sourceName: 'ソース名',
    principal: '認可済み連携アカウント',
    enabled: '有効',
    disabled: '無効',
    noSources: 'このアカウント用の人事ソースは未設定です。',
    recent: '最近の同期',
    latest: 'このソースの最新50件のバッチを表示します。',
    items_one: '{{count}}件のレコード',
    items_other: '{{count}}件のレコード',
    actions: '操作',
    replay: '元のバッチを再試行',
    refresh: '更新',
    noRuns: '受信したバッチはまだありません。',
    mappings: '対応レコード',
    revision: 'リビジョン{{revision}}',
    reclaim: '外部所有権を復元',
    reclaimHelp:
      'ローカル編集は保護されます。所有権を復元すると、次の有効な更新で外部ソースがこれらの項目を上書きできます。先にローカルレコードを確認して理由を説明してください。',
    confirmReclaim: '外部所有権を確認',
    reason: '理由',
    cancel: 'キャンセル',
    save: '保存',
    failed:
      '操作に失敗しました。権限とソース設定を確認して再試行してください。',
    localConflict:
      'このレコードはローカルで変更されました。再試行前に人事が確認し、外部所有権を明示的に復元する必要があります。',
    businessConflict:
      '適用できないレコードがあります。ソースデータの訂正か業務制限の解決後に元のバッチを再試行してください。',
    states: { pending: '待機中', completed: '完了', failed: '失敗' },
    entities: {
      department: '部署',
      grade: '等級',
      employee: '従業員',
    },
  },
};
