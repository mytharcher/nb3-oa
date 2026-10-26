export default {
  exported: 'Excelダウンロードを開始しました。',
  title: '休暇判断タスクの経過時間',
  description:
    '完了した休暇判断タスクの作成から終了までの実時間ミリ秒です。待機と過去の再提出を含み、元申請の開始月別に集計します。勤務時間、SLA、差し戻し率、全体所要時間ではありません。',
  year: '開始年',
  month: '開始月（任意）',
  clear: 'フィルターをクリア',
  export: 'Excelをエクスポート',
  exporting: 'エクスポート中…',
  refresh: '更新',
  selectYear: '元申請の開始年を選択してレポートを読み込んでください。',
  invalid: '1900～9998の年、任意で1～12の月を入力してください。',
  forbidden:
    '現在の休暇レコード・項目権限ではレポートを利用できません。管理者にお問い合わせください。',
  precondition:
    'ソース上限またはタスク時刻検証に失敗しました。年月範囲を絞るか、管理者に元タイムスタンプの確認を依頼してください。',
  failed: 'レポートを読み込めませんでした。再試行してください。',
  retry: '再試行',
  exportFailed: 'Excelエクスポートに失敗しました。再試行してください。',
  empty: '完了した判断タスクなし',
  noResults: 'この月に一致するタスクなし',
  emptyHint:
    '現在閲覧可能な休暇申請の完了判断タスクのみ集計します。別の開始年月を選択してください。',
  total: '{{count}}件の段階グループ',
  generatedAt: '生成日時{{value}}',
  previous: '前へ',
  next: '次へ',
  fields: {
    stage: '段階',
    completedTaskCount: '完了判断タスク',
    totalElapsedMs: '実経過時間合計（ms）',
    averageElapsedMs: '平均実経過時間（ms）',
  },
  stages: { manager: '上司', head: '部署長', hr: '人事' },
};
