export default {
  jobGrades: {
    authz: {
      resource: '給与等級表',
      view: '公開履歴を閲覧',
      viewSalary: '給与範囲を閲覧',
      manage: '給与等級表を公開',
    },

    title: '給与等級表',
    description: '変更不可の公開履歴を確認し、完全な給与範囲を公開します。',
    publish: '新しいバージョンを公開',
    publishing: '公開中…',
    search: '完全一致のバージョン番号で検索',
    empty: '給与表は未公開です',
    emptyDescription: '最初の完全な給与等級表を公開してください。',
    emptyReadonly: '人事に最初の給与等級表の公開を依頼してください。',
    noMatches: '一致するバージョンがありません',
    noMatchesDescription:
      'バージョン検索を解除して公開履歴を表示してください。',
    replacement:
      '公開すると現在の表全体が置き換わります。以前に提出された文書は元のバージョンを保持します。',
    privateDenied:
      '給与範囲の読み取り権限がありません。管理者に依頼してください。',
    publishDenied:
      '給与等級表の公開権限がありません。管理者に依頼してください。',
    unknown: '公開結果は未確認です。元の公開を再試行してください。',
    conflict:
      '現在の表が変更されました。公開前に最新の表を読み込んでください。',
    inactive:
      'この等級を利用できません。削除するか有効な等級を選択してください。',
    success: '給与表「バージョン{{version}}」を公開しました',
    version: 'バージョン{{version}}',
    versionColumn: 'バージョン',
    publisher: '公開者',
    publishedAt: '公開日時',
    refresh: '更新',
    retry: '再試行',
    retryPublication: '元の公開を再試行',
    clear: 'フィルターをクリア',
    loading: '給与等級表を読み込み中',
    view: 'バージョンを表示',
    rowActions: 'バージョン{{version}}の操作',
    grade: '等級',
    gradeCode: '等級コード',
    gradeTitle: '等級名',
    rank: '確定順位',
    minimum: '最小値',
    maximum: '最大値',
    reason: '公開理由',
    addGrade: '等級を追加',
    remove: '等級{{index}}を削除',
    selectGrade: '有効な等級を選択',
    removeDescription:
      '行の削除は新しい表の提案のみを変更します。過去バージョンは維持されます。',
    cancel: 'キャンセル',
    loadLatest: '最新の表を読み込む',
    currentVersion: '元バージョン：{{version}}',
    notFound: 'この給与等級表は利用できません。公開履歴に戻ってください。',
    failed: '給与等級表を読み込めませんでした。再試行してください。',
    writeFailed: '公開が拒否されました。項目を確認して再試行してください。',
    storageFailure:
      'このタブに元の公開を安全に保存できません。公開を停止しています。ブラウザーストレージを確認して再読み込みしてください。',
    unsavedTitle: '給与表の変更を破棄しますか？',
    unsavedDescription: '未公開の変更は失われます。',
    discard: '変更を破棄',
    stay: '編集を続ける',
    replaceTitle: '提案中の表を置き換えますか？',
    replaceDescription:
      '最新の表を読み込むとこの提案を破棄し、現在の表全体から開始します。',
    confirmReplace: '置き換えて最新を読み込む',
    noGrades:
      '有効な等級がありません。組織管理者に等級設定を依頼してください。',
    reasonHint: '表全体を公開する理由を2000文字以内で説明してください。',
    immutable:
      '公開済みバージョンは変更不可です。等級の識別情報と範囲は固定されています。',
    validation: {
      required: '必須項目です。',
      amount: '対応範囲内で、小数点以下2桁以内の非負の金額を入力してください。',
      range: '最大値は最小値以上にしてください。',
      duplicate: '各等級は1回のみ指定できます。',
      inactive:
        'この等級を利用できません。削除するか有効な等級を選択してください。',
      nonempty: '有効な等級を1件以上含めてください。',
      reasonLength: '2000文字以内で入力してください。',
      server: 'この項目を確認して再試行してください。',
    },
  },
};
