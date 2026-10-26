export default {
  jobGrades: {
    errors: {
      VERSION_CONFLICT:
        '現在の給与表が変更されました。公開前に再読み込みしてください。',
      IDEMPOTENCY_CONFLICT: '公開キーは異なる内容で使用済みです。',
      TABLE_UNAVAILABLE: '給与表は未初期化です。',
      GRADE_UNAVAILABLE: '必要な等級が利用不可または無効です。',
      INVALID_PUBLICATION: '公開入力が不正です。',
      STORED_DATA_INVALID: '保存された給与表データが不正です。',
      INVALID_RANGE: '給与範囲は有効な整数金額にしてください。',
      DUPLICATE_GRADE: '各等級は1回ずつ指定してください。',
      OUTSIDE_RANGE: '提示給与が公開範囲外です。',

      ACCESS_DENIED: 'この給与等級操作は付与範囲外です。',
      NOT_FOUND: '給与等級リビジョンを利用できません。',
    },
    authz: {
      resource: '給与等級表',
      view: '公開履歴を閲覧',
      viewSalary: '給与範囲を閲覧',
      manage: '給与等級表を公開',
    },
  },
};
