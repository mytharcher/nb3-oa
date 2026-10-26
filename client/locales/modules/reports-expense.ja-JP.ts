export default {
  reportsExpense: {
    firstPage: '最初のページへ',

    pageEmpty: 'このページに経費グループはありません',
    pageEmptyHint:
      '現在のソースではグループ数が減りました。最初のページか前のページへ移動してください。',

    exportStarted: 'Excelダウンロードを開始しました',
    reloading:
      '更新中…現在のフィルターの読み込み完了まで以前の結果を表示します。',
    exportLock:
      'エクスポート中…ダウンロード完了までフィルターと移動はロックされます。',

    title: '月別精算済み経費',
    description:
      '元の経費日と区分別の精算総額です。実際の現金支払純額ではありません。',
    month: '経費月（1～12、任意）',
    effectiveYear: '会社暦の年度：{{year}}',
    sourceNotice:
      '権限のある精算済み申請を最大10000件確認します。年月を変えてもソース走査数は減りません。',
    precondition:
      '精算証拠を検証できないかレポート上限を超えました。管理者に元証拠と規模の確認を依頼してください。',
    forbidden:
      '現在の精算ソースへのアクセス権がありません。管理者にソース権限の確認を依頼してください。',
    empty: 'この年に精算済み経費はまだありません',
    emptyHint:
      '権限と精算証拠を確認できた申請だけ含みます。年月やソースアクセスを確認してください。',
    fields: {
      year: '年度',
      month: '経費月',
      category: '区分コード',
      settledRequestCount: '精算済み申請',
      settledExpenseCents: '精算総額（CNY、現金ではない）',
    },
  },
};
