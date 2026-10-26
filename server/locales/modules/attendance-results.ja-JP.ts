export default {
  attendanceResults: {
    failed:
      '勤怠結果を処理できませんでした。アクセス、勤務予定、日付を確認して再試行してください。',
    scheduleTitle: '日次勤怠計算',
    scheduleDescription:
      '会社現地日付の過去7日間の終了済みシフトを、修正と承認済み不在を含め照合します。要確認の結果がある実行は失敗とします。',
    authz: {
      resource: '勤怠結果',
      calculateSelf: '自分の勤怠を計算',
      self: '自分の勤怠',
      view: '結果を閲覧',
      recalculate: '再計算',
      export: '結果をエクスポート',
      attendanceEvaluations: '日次勤怠',
      attendanceEvaluationRevisions: '勤怠計算履歴',
    },
  },
};
