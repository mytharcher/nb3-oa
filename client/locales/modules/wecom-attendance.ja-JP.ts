export default {
  wecomAttendance: {
    title: 'WeCom勤怠ソース',
    description:
      '対応従業員の打刻をインポートし、最新30件の同期実行を確認します。',
    sync: '同期',
    refresh: '更新',
    runs: '同期実行',
    retry: '再試行',
    counts: '確定レコード：{{records}}件・バッチ：{{batches}}件',
    runFailed:
      '一部をインポートできませんでした。従業員対応、シフト割り当て、ソースアクセスを確認して再試行してください。完了バッチは保持します。',
    denied: '勤怠同期へのアクセス権がありません。',
    disabled:
      'ソースは無効です。管理者に専用勤怠アプリの設定を依頼してください。',
    unconfigured: '同期前にソースの認証情報と明示的な従業員対応が必要です。',
    ready_one: '対応済み従業員{{count}}人の同期準備ができました。',
    ready_other: '対応済み従業員{{count}}人の同期準備ができました。',
    startedAt: '開始日時{{time}}',
    empty: '同期実行はまだありません。',
    rangeHint:
      '会社現地日付の終了済み日を最大7日選択してください。重複ソースレコードは作成しません。',
    start: '開始日',
    end: '終了日',
    reason: '理由',
    cancel: 'キャンセル',
    syncing: '同期中…',
    states: {
      running: '進行中',
      completed: '完了',
      failed: '要対応',
    },
  },
};
