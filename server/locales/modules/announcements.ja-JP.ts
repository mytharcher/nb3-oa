export default {
  announcements: {
    authz: {
      title: 'お知らせ',
      owned: '自分が公開したもの',
      readable: '自分の公開情報と受信したお知らせ',
      view: 'お知らせを閲覧',
      create: 'お知らせの下書きを作成',
      edit: '自分の下書きを編集',
      publish: '自分のお知らせを公開',
      revoke: '自分のお知らせを取り下げ',
      remind: '未確認の受信者にリマインド',
      receipts: '自分の受信者一覧を閲覧',
      confirm: '自分の受領を確認',
    },
    notifications: {
      title: '社内のお知らせ',
      body: 'お知らせがあります。アプリを開いてお読みください。',
    },
    errors: {
      ACCESS_DENIED: 'このお知らせまたは操作にアクセスできません。',
      NOT_FOUND: 'お知らせが見つかりません。',
      INVALID_INPUT: 'お知らせの入力または有効期間が不正です。',
      INVALID_AUDIENCE:
        '対象に利用不可の部署または職責ロールが含まれています。',
      EMPTY_AUDIENCE: 'お知らせに有効な受信者がいません。',
      INVALID_ATTACHMENT: '添付が不正または利用不可です。',
      INVALID_STATE: '現在の状態ではこの操作を利用できません。',
      VERSION_CONFLICT:
        'お知らせが変更されました。再読み込みして再試行してください。',
      COMMAND_CONFLICT: 'このリクエスト識別子は異なる入力で使用済みです。',
      KNOWLEDGE_UNAVAILABLE: '関連文書が利用不可または読み取り不可です。',
    },
  },
};
