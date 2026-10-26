export default {
  vendors: {
    saved: '仕入先「{{name}}」を保存しました',

    title: '仕入先',
    description:
      '購買が手動登録仕入先を管理します。承認済み発注は記録時の仕入先情報を保持します。',
    new: '新しい仕入先',
    edit: '仕入先を編集',
    view: '仕入先詳細',
    refresh: '更新',
    search: '名前、コード、区分で検索',
    clear: 'フィルターをクリア',
    rowActions: '{{name}}の操作',
    save: '保存',
    cancel: 'キャンセル',
    loading: '仕入先を読み込み中',
    retry: '再試行',
    active: '有効',
    status: '状態',
    statuses: {
      manual: '手動登録仕入先',
      qualified: '資格認定済み',
      disabled: '無効',
    },
    updatedAt: '更新日時',
    reason: '変更理由',
    formDescription:
      '仕入先変更と銀行情報は監査されます。無効化すると新規購入・支払を防ぎます。',
    disableHint: '新規購入と支払口座情報が利用不可になります。',
    required: '必須項目です。',
    invalidCode: '英数字、ドット、ハイフン、アンダースコアを使用してください。',
    invalidEmail: '有効なメールアドレスを入力してください。',
    noChanges: '保存前に1項目以上変更してください。',
    unknownCreate:
      '作成結果が不明です。別の仕入先を作る前に一覧とコードを確認してください。',
    unknownEdit:
      '結果不明。再試行前に最新仕入先を読み込んでください。未確定の変更は保持します。',
    loadLatest: '最新仕入先を読み込む',
    fields: {
      code: 'コード',
      name: '名前',
      category: '区分',
      contactName: '連絡先',
      contactPhone: '電話',
      contactEmail: 'メールアドレス',
      bankName: '銀行',
      bankAccount: '銀行口座',
      bankAccountName: '口座名義',
    },
    authz: {
      resource: '仕入先',
      view: '仕入先詳細を閲覧',
      manage: '仕入先を管理',
      bankRead: '銀行情報を閲覧',
      createdScope: '現在のユーザーが作成した仕入先',
    },
    empty: {
      accountsTitle: '仕入先なし',
      accountsDescription: '調達用に手動登録仕入先を追加してください。',
      readonlyTitle: '閲覧可能な仕入先なし',
      readonlyDescription:
        '権限範囲内に仕入先がありません。購買に追加を依頼するか、管理者に仕入先管理権限を依頼してください。',
      filteredTitle: '一致する仕入先なし',
      filteredDescription: '検索を変更または解除してください。',
    },
    error: {
      forbidden: 'これらの仕入先へのアクセス権がありません。',
      missing: 'この仕入先を利用できません。親一覧を更新してください。',
      invalid: '仕入先項目を確認してください。',
      failed:
        '仕入先を読み込みまたは保存できませんでした。再試行してください。',
      VENDOR_INVALID_INPUT: '仕入先の連絡先と銀行項目を確認してください。',
      VENDOR_INVALID_COMMAND: '操作者と変更理由が必要です。',
      VENDOR_CODE_EXISTS: 'このコードは既存仕入先に属しています。',
      VENDOR_VERSION_CONFLICT:
        '仕入先が変更されました。再試行前に最新バージョンを読み込んでください。',
      VENDOR_NOT_FOUND: 'この仕入先を利用できません。',
      VENDOR_INACTIVE: '有効な仕入先を選択してください。',
      VENDOR_FIELDS_RESTRICTED: '仕入先項目が付与範囲外です。',
      VENDOR_ACCESS_DENIED: 'この仕入先操作の権限がありません。',
      VENDOR_PAYMENT_ACCOUNT_REQUIRED:
        '支払前に仕入先の銀行情報を完成させてください。',
    },
  },
};
