export default {
  authz: {
    returnHeld: '既存保有資産の現物返却を確認',
    resource: '資産台帳',
    view: '資産台帳と取得価額を閲覧',
    viewHeld: '自分の保有資産を閲覧',
    manage: '資産情報を記録・訂正',
    heldScope: '自分の保有資産',
  },
  errors: {
    ASSET_RETURN_FORBIDDEN:
      '有効な資産管理者が現物返却を確認する必要があります。',
    ASSET_REQUEST_REUSED: 'この返却リクエストキーは別の受領を識別しています。',
    ASSET_RETURN_INELIGIBLE:
      '実際の保有物品、従業員、製造番号を確認してください。',
    ASSET_RETURN_FLOW_REQUIRED:
      '返却確認前に、実際の申請を通じてこの資産を処理してください。',

    ASSET_ACCESS_DENIED: 'この資産操作の権限がありません。',
    ASSET_NOT_FOUND: '資産が見つかりません。',
    ASSET_INVALID_INPUT:
      '資産コード、名前、セント単位の非負の正確な価額を入力してください。',
    ASSET_CATEGORY_INACTIVE: '有効な資産区分を選択してください。',
    ASSET_INVALID_COMMAND: '操作者と訂正理由が必要です。',
    ASSET_INVALID_VERSION: '現在の資産バージョンを入力してください。',
    ASSET_VERSION_CONFLICT:
      'この資産は変更されました。最新バージョンを読み込んでください。',
    ASSET_CODE_EXISTS: 'この資産コードは既に存在します。',
    ASSET_INVALID_STORED_AMOUNT:
      '保存された資産価額が対応する正確な範囲外です。',
    ASSET_WRITE_UNCONFIRMED: '資産の書き込みを確認できませんでした。',
    ASSET_DEPARTURE_NOT_CLEARED:
      '退職清算前に、交付済み、貸出中、予約中の資産を返却する必要があります。',
  },
};
