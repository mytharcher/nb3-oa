export default {
  headcounts: {
    authz: {
      title: '人員定数',
      view: '定員を閲覧',
      manage: '年間定員を管理',
      viewJournal: 'ソース仕訳を閲覧',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        '従業員一覧全体を読み取れません。管理者に従業員読み取り権限の確認を依頼してください。',
      HEADCOUNT_ACCESS_DENIED: 'この人員定数操作の権限がありません。',
      HEADCOUNT_FIELD_ACCESS_DENIED: '定員集計の項目は権限範囲外です。',
      HEADCOUNT_NOT_FOUND: '人員定数口座を利用できません。',
      HEADCOUNT_ALREADY_EXISTS: 'この部署、役職、年度には既に口座があります。',
      HEADCOUNT_NOT_INITIALIZED:
        '定員予約前に従業員一覧全体を照合してください。',
      HEADCOUNT_INCOMPLETE_ROSTER:
        '実際の試用中、正社員、退職手続中の一覧全体を選択してください。',
      HEADCOUNT_ROSTER_DRIFT:
        '実際の従業員一覧が変更されました。続行前にソース情報を照合してください。',
      HEADCOUNT_VERSION_CONFLICT:
        '口座が変更されました。保存前に更新してください。',
      HEADCOUNT_IDEMPOTENCY_CONFLICT:
        'このリクエスト識別子は別の操作に属しています。',
      HEADCOUNT_INSUFFICIENT: '年間上限では実在籍数と予約数を満たせません。',
      HEADCOUNT_INVALID_NUMBER: '上限内の整数の人数を入力してください。',
      HEADCOUNT_INVALID_ACCOUNT: '実在する部署、役職、年度を選択してください。',
      HEADCOUNT_INVALID_IDENTITY: '有効な組織部署と役職を選択してください。',
      HEADCOUNT_INVALID_COMMAND: '操作者、リクエスト識別子、理由が必要です。',
      HEADCOUNT_INVALID_SOURCE: '実在するソース種類と識別子が必要です。',
      HEADCOUNT_INVALID_REPLACEMENTS: '各補充枠には異なる退職者が必要です。',
      HEADCOUNT_INVALID_REPLACEMENT:
        '補充ソースは実際の退職手続中または退職済みの在籍枠と一致する必要があります。',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'この補充在籍枠は存在しないか確保済みです。',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        '元従業員の復職によりこの補充は利用できません。',
      HEADCOUNT_EMPLOYEE_NOT_FOUND: '従業員記録を利用できません。',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        '実際の従業員が割り当て部署・役職と一致しません。',
      HEADCOUNT_ALREADY_OCCUPIED:
        'この従業員は既にこの年度口座に在籍しています。',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        '消費前に現在の会社年度へ明示的に紐付け直してください。',
      HEADCOUNT_SOURCE_NOT_FOUND: '定員ソースを利用できません。',
      HEADCOUNT_SOURCE_EXISTS: 'このソースには既に予約があります。',
      HEADCOUNT_SOURCE_STATE: 'ソースの状態ではこの操作を許可していません。',
      HEADCOUNT_SOURCE_CLOSED: '定員ソースは終了済みです。',
      HEADCOUNT_SEAT_STATE: '予約枠は保留状態ではありません。',
      HEADCOUNT_STATE_CONFLICT: '予約枠が変更されました。',
      HEADCOUNT_NO_ALLOCATION: '承認済みの利用可能枠が残っていません。',
      HEADCOUNT_NOT_LEFT: '在籍定員の解放には実際の退職が必要です。',
      HEADCOUNT_OCCUPANCY_NOT_FOUND: '実在する未解放の従業員在籍枠が必要です。',
      HEADCOUNT_NOT_RESTORED: '将来補充を停止するには実際の復職が必要です。',
      HEADCOUNT_INVALID_REBIND:
        '年度の再紐付けは部署と役職を維持し、先の年度へ移動する必要があります。',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        '補充枠には明示的な対象年度ソースが必要です。',
      HEADCOUNT_INVALID_TRANSFER: '異なる承認済みの対象予約が必要です。',
      HEADCOUNT_INVALID_PAGE: 'ページサイズは1～100を選択してください。',
      HEADCOUNT_GUARD_UNAVAILABLE:
        '定員トランザクションガードを利用できません。',
    },
  },
};
