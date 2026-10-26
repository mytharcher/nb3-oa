export default {
  attendanceImport: {
    title: '勤怠証拠をインポート',
    description:
      '変更不可の元証拠をプレビューしてインポートします。勤怠評価や給与計算は行いません。',
    template: 'Excelテンプレートをダウンロード',
    downloadStarted: 'Excelテンプレートのダウンロードを開始しました。',
    downloadFailed:
      'Excelテンプレートをダウンロードできませんでした。再試行してください。',
    file: 'Excel証拠ファイル',
    empty: '.xlsxファイルを選択するとプレビューを開始します。',
    help: '1シート構成でテキストセルのテンプレートを使用してください。必須列：userId、date、punchKind、source、sourceKey、sourceData（JSONオブジェクト）。punchedAtは空欄または2035-01-02T01:00:00ZのようなUTC ISO文字列を指定できます。dateは会社の現地日付、userIdは実在する従業員の固定ユーザーIDで、名前は使用できません。最大4 MiB、1000行です。数式と数値形式の日付は拒否されます。JSONオブジェクトのキーは重複不可です。数値はシリアライズ時に十進数の値を保持し、整数は安全な範囲に収めてください。大きなIDや正確な小数は文字列で表してください。',
    parsing: 'Excelを解析中',
    preview: 'プレビュー：{{count}}行',
    confirm: '証拠を確認し、一括全体のインポートに同意します',
    submit: '一括インポートを確認',
    submitting: 'インポート中',
    success: '証拠を{{count}}行インポートしました。',
    evidence: '元証拠を展開',
    denied: '勤怠証拠をインポートする権限がありません。',
    failed:
      '一括インポートできませんでした。ファイルを確認して再試行してください。',
    invalid:
      'サーバーが証拠を拒否しました。従業員ID、会社日付、ソースデータを確認してください。',
    conflict:
      '既存のソースキーに異なる証拠があります。この一括処理の行は一切インポートされませんでした。',
    retry: 'インポートを再試行',
    discard: '未提出の証拠プレビューを破棄しますか？',
    continue: '確認を続ける',
    discardConfirm: 'プレビューを破棄',
    discardHelp: 'プレビューを破棄した後、移動先を再度クリックしてください。',
    columns: {
      userId: 'ユーザーID',
      date: '会社日付',
      punchKind: '打刻の種類',
      punchedAt: 'UTC日時',
      source: 'ソース',
      sourceKey: 'ソースキー',
      sourceData: '元証拠',
    },
    errors: {
      file: '4 MiB以下の.xlsxファイルを選択してください。',
      archive: 'Excelアーカイブが不正か、安全な展開上限を超えています。',
      template:
        'ダウンロードしたテンプレートと同じ見出しで、1シートを使用してください。',
      cell: '{{row}}行目：数式を含まないテキストセルと、テンプレートの7列だけを使用してください。',
      rows: '見出しの後に1～1000行の連続した証拠行を指定してください。',
      identity:
        '{{row}}行目：固定ユーザーIDと有効なソース、ソースキーを指定してください。',
      date: '{{row}}行目：実在する会社日付、in/outの種類、明示的なUTC ISO日時または空欄を指定してください。',
      evidence:
        '{{row}}行目：重複しないキー、安全に往復変換できる数値、一意のソースキーを持つサイズ制限内のJSONオブジェクトを指定してください。',
    },
  },
};
