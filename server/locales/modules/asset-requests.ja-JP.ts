export default {
  authz: {
    ownedScope: '自分の資産申請',
    resource: '資産申請',
    view: '資産申請を閲覧',
    viewValue: '資産の取得価額を閲覧',
    create: '自分の資産申請を作成',
    edit: '自分の資産申請を編集',
    operate: '権限のある資産承認と処理操作を実行',
    returnIssued: '使用交付した資産の現物返却を確認',
  },
  errors: {
    ASSET_RETURN_REASON_REQUIRED: '現物受領の理由を入力してください。',
    ASSET_ACCESS_DENIED: 'この資産申請にアクセスできません。',
    ASSET_ACTION_INVALID: 'この申請ではこの操作を利用できません。',
    ASSET_REQUEST_NOT_FOUND: '資産申請が見つかりません。',
    ASSET_INVALID_COMMAND:
      '固定のリクエスト識別子と必要な理由を入力してください。',
    ASSET_REQUEST_REUSED: 'このリクエスト識別子は別の操作に紐付いています。',
    ASSET_REQUIRED_FIELDS: '目的、数量、資産の選択を完成させてください。',
    ASSET_CATEGORY_INACTIVE: '有効な資産区分を選択してください。',
    ASSET_EMPLOYEE_INACTIVE: '申請者には有効な従業員レコードが必要です。',
    ASSET_DEPARTMENT_MISSING: '申請者には有効な主所属部署が必要です。',
    ASSET_HEAD_MISSING: '部署には有効な部署長の承認者が必要です。',
    ASSET_BORROW_DATE_INVALID:
      '会社の現地日付で有効な未来の返却日を選択してください。',
    ASSET_SCRAP_REQUIRED: '資産を1件選択し、廃棄理由と写真を添付してください。',
    ASSET_SCRAP_INELIGIBLE:
      '廃棄できるのは、対象条件を満たす保有資産か管理者管理の在庫品のみです。',
    ASSET_PHOTO_DENIED: '申請または写真フィールドにアクセスできません。',
    ASSET_PHOTO_INVALID:
      'この申請に紐付く有効な写真を10枚以内で選択してください。',
    ASSET_PHOTO_SIZE: '各写真は5 MiB以下にしてください。',
    ASSET_PHOTO_TYPE: '有効なJPEG、PNG、WebP画像をアップロードしてください。',
    ASSET_STOCK_SHORTAGE: '申請全体を満たす利用可能な数量が不足しています。',
    ASSET_INVALID_QUANTITY: '1～100の整数で数量を確認してください。',
    ASSET_INVALID_AMOUNT: '保存された資産価額が対応する正確な範囲外です。',
    ASSET_NOT_FOUND: '申請内の資産が見つかりません。',
    ASSET_INVALID_VERSION: '現在の資産バージョンを読み込んでください。',
    ASSET_VERSION_CONFLICT:
      '資産が変更されました。確認前に再読み込みしてください。',
    ASSET_ALREADY_RESERVED: '資産が別の申請によって予約されています。',
    ASSET_EXISTING_HOLD: '在庫を変更する前に既存の予約を解消してください。',
    ASSET_HOLD_MISMATCH: '実際の予約がこの申請と一致しません。',
    ASSET_BASELINE_CONFLICT:
      '承認後に資産情報が変更されました。実行前に審査へ差し戻してください。',
    ASSET_UNITS_INCOMPLETE:
      '割り当てたすべての個体と実際の製造番号を確認してください。',
    ASSET_SERIAL_MISMATCH: '製造番号が実際の資産と異なります。',
    ASSET_RETURN_MISMATCH: '返却品が実際の交付・保管記録と一致しません。',
    ASSET_ALREADY_RETURNED: 'この資産は返却済みです。',
    ASSET_RETURN_FORBIDDEN:
      '有効な資産管理者が現物返却を確認する必要があります。',
    ASSET_RETURN_INELIGIBLE:
      'この申請は条件を満たす交付済み使用申請ではありません。',
    ASSET_ALLOCATION_MISSING: '実際の割り当て全体がありません。',
    ASSET_SOURCE_UNAVAILABLE: '資産申請のソースを利用できません。',
    ASSET_SOURCE_MISSING: '所有元の資産申請が存在しません。',
    ASSET_SOURCE_FORBIDDEN: 'ソースがこの在庫操作を許可していません。',
    ASSET_SOURCE_MISMATCH: '在庫ソースが実際の申請と一致しません。',
    ASSET_TARGET_MISMATCH: '承認対象が別の申請に属しています。',
    ASSET_DIRECTORY_UNAVAILABLE: '最新の承認ディレクトリが必要です。',
    ASSET_SLA_UNSUPPORTED:
      'このリリースはデフォルトの24／48勤務時間承認時計のみ対応します。',
  },
  schedule: {
    title: '貸出資産の返却リマインダー',
    description:
      '会社の現地日付による毎日の期限リマインダーと毎週の期限超過リマインダーです。配信保留は実行失敗として記録されます。',
  },
  reminders: {
    before:
      '資産申請{{number}}：借用品{{quantity}}点の返却期限は{{date}}です。現物返却をご手配ください。',
    overdue:
      '資産申請{{number}}：借用品{{quantity}}点は{{date}}が返却期限でしたが、未返却です。',
  },
};
