export default {
  onboarding: {
    notifications: {
      overdueTitle: '入社タスク期限超過',
      overdueBody:
        '入社タスクが期限超過です。現在割り当てられた作業を確認してください。',
    },
    authz: {
      resource: '入社',
      readable: '入社手続の参加者',
      view: '入社手続を閲覧',
      create: '入社手続を作成',
      cancel: '入社手続を取消',
      claim: 'タスクを引き受け',
      reassignMentor: '部署長を再割り当て',
      transfer: '転送',
      release: 'タスクを解放',
      complete: 'タスクを完了',
      forceComplete: '強制完了',
      viewSalary: '入社時給与を閲覧',
      viewBank: '入社時銀行情報を閲覧',
    },
    errors: {
      employeeSourceConflict:
        '入社ソースは既に異なる従業員情報に紐付いています。',
      employeeAccountEnabled:
        '従業員記録の作成中は入社アカウントを無効のままにしてください。',
      forbidden: 'この入社操作の権限がありません。',
      sourceInvalid: '採用割り当てまたは入社の業務情報が無効になりました。',
      idempotencyConflict: 'コマンド識別子は異なる詳細で使用済みです。',
    },
  },
};
