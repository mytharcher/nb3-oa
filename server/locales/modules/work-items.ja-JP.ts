export default {
  workItems: {
    authz: {
      confirmationOwned: '自分が確認するタスク',
      handoverConfirmation: '確認責任を移管',

      title: '通常作業項目',
      owned: '自分が作成',
      readable: '自分が作成・所有・対応可能なタスク',
      view: '閲覧',
      create: '作成',
      edit: '編集',
      dispatch: '割り当て',
      claim: '引き受け',
      release: '解放',
      complete: '完了',
      confirm: '確認',
      return: '差し戻し',
      block: '停止',
      resume: '再開',
      reassign: '再割り当て',
      cancel: '取消',
      forceComplete: '強制完了',
    },
    notifications: {
      title: '作業項目の更新',
      body: '通常タスクが変更されました。アプリを開いて詳細を確認してください。',
    },
    errors: {
      ACCESS_DENIED: 'タスクまたは操作にアクセスできません。',
      NOT_FOUND: 'タスクが見つかりません。',
      REASON_REQUIRED: '理由が必要です。',
      RESULT_REQUIRED: '完了結果が必要です。',
      INVALID_INPUT: '入力または状態が不正です。更新して再試行してください。',
      INVALID_TARGET: '入力または状態が不正です。更新して再試行してください。',
      INVALID_ATTACHMENT:
        '入力または状態が不正です。更新して再試行してください。',
      VERSION_CONFLICT:
        '入力または状態が不正です。更新して再試行してください。',
      COMMAND_CONFLICT:
        '入力または状態が不正です。更新して再試行してください。',
    },
  },
};
