export default {
  personalSchedules: {
    authz: {
      title: '個人スケジュール',
      owned: '自分の予定',
      view: '表示',
      create: '作成',
      edit: '編集',
      delete: '削除',
    },
    errors: {
      SOURCE_MANAGED: 'この会議は個人予定ではなく予約から管理してください。',
      ACCESS_DENIED: 'この予定へのアクセス権がありません。',
      NOT_FOUND: '予定が見つかりません。',
      INVALID_INPUT: 'タイトルと有効な開始・終了時刻を入力してください。',
      VERSION_CONFLICT: '予定が変更されました。更新して再試行してください。',
    },
  },
};
