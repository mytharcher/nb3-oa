export default {
  vehicles: {
    authz: {
      requests: '車両利用申請',
      garage: '車庫',
      manage: '車両一覧を管理',
      viewCost: '非公開の燃料費を閲覧',
    },
    errors: {
      VEHICLE_SORT_LIMIT:
        'これだけのレコードを並べ替える前に検索を絞り込んでください。',
      VEHICLE_ACCESS_DENIED: '運転手更新は付与ポリシー範囲外です。',
      VEHICLE_ALREADY_DISPATCHED:
        'このソースには変更不可の配車事実があります。',
      VEHICLE_APPROVAL_REFUSED:
        '車両操作を利用できません。申請を更新して権限を確認してください。',
      VEHICLE_CONTENT_CHANGED:
        '配車には未変更の承認内容と非公開操作データが必要です。',
      VEHICLE_COST_NOT_FOUND: '使用費用を読み取れません。',
      VEHICLE_DISPATCH_NOT_OFFERED: '実際に許可された配車タスクが必要です。',
      VEHICLE_DRIVER_INACTIVE: '運転手は現在の条件を満たしていません。',
      VEHICLE_DRIVER_REQUIRED: '運転手選択は承認申請に一致する必要があります。',
      VEHICLE_EMPLOYEE_INACTIVE: '有効な従業員記録が必要です。',
      VEHICLE_FIELDS_RESTRICTED:
        '承認ファサードには財務以外の申請項目全体が必要です。',
      VEHICLE_GARAGE_DENIED: '有効な総務職責メンバーが必要です。',
      VEHICLE_INTERVAL_CONFLICT: 'この期間に車両または運転手は配車済みです。',
      VEHICLE_INVALID_COMMAND: 'ソースと固定リクエストキーが必要です。',
      VEHICLE_INVALID_INPUT:
        '車両識別情報、正の定員、有効な状態を指定してください。',
      VEHICLE_INVALID_INTERVAL:
        '開始・終了が正しい期間と正の乗車人数を指定してください。',
      VEHICLE_INVALID_USAGE: '走行距離と燃料は正確な非負整数にしてください。',
      VEHICLE_INVALID_VERSION: '保存バージョンを進められません。',
      VEHICLE_NOT_DISPATCHED: 'この申請に実際の配車がありません。',
      VEHICLE_NOT_FOUND: '車両または運転手が見つかりません。',
      VEHICLE_NO_AVAILABLE_CAPACITY:
        'この期間に十分な定員の車両はありません。提出しても予約されません。',
      VEHICLE_OUTSTANDING_USE:
        '運転手を無効にする前に実使用を完了してください。',
      VEHICLE_PRIVATE_INPUT_REQUIRED:
        '業務実行データは非公開ファサードを使用してください。',
      VEHICLE_REQUEST_KEY_REQUIRED: '固定のリクエストキーが必要です。',
      VEHICLE_REQUEST_REUSED:
        'リクエストキーは別の操作者またはデータに紐付いています。',
      VEHICLE_SLA_UNSUPPORTED:
        'このリリースにはデフォルトの勤務時間承認時計が必要です。',
      VEHICLE_SOURCE_DENIED:
        'トランザクション内の実際に許可された承認操作が必要です。',
      VEHICLE_SOURCE_MISMATCH: 'コマンドが承認ソースと一致しません。',
      VEHICLE_SOURCE_UNAVAILABLE:
        '実際の承認ソースアダプターを利用できません。',
      VEHICLE_TARGET_MISMATCH: '操作対象が別の申請に属しています。',
      VEHICLE_TYPE_INACTIVE: '有効な車両種類を選択してください。',
      VEHICLE_UNAVAILABLE: '十分な定員の有効な車両を選択してください。',
      VEHICLE_USAGE_OWNER: '実際の申請者のみ使用を登録できます。',
      VEHICLE_VERSION_CONFLICT: '現在の車両バージョンを読み込んでください。',
    },
  },
};
