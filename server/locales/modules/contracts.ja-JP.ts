export default {
  contracts: {
    errors: {
      CONTRACT_SEAL_EVIDENCE_REQUIRED: '実際の押印完了証拠が必要です。',
      CONTRACT_SEAL_EVIDENCE_CONFLICT:
        'この印章証拠は異なる契約情報に属しています。',
      CONTRACT_ACCESS_DENIED: 'この契約は付与されたアクセス範囲外です。',
      CONTRACT_ACTION_NOT_ALLOWED: 'この契約ではこの操作を利用できません。',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        '契約金額は支払済み金額と予約額の合計未満にできません。',
      CONTRACT_ATTACHMENT_DENIED:
        '契約の添付フィールドまたはレコードは付与されたアクセス範囲外です。',
      CONTRACT_ATTACHMENT_INVALID:
        'この契約申請に属する有効な添付ファイルを選択してください。',
      CONTRACT_CANDIDATE_REMOVED:
        'この未公開の契約候補は削除されました。新しい申請を作成してください。',
      CONTRACT_CATEGORY_INACTIVE: '有効な契約種類を選択してください。',
      CONTRACT_CORRUPT_BALANCE:
        '契約支払合計に不整合があります。管理者にお問い合わせください。',
      CONTRACT_EMPLOYEE_REQUIRED: '主所属部署を持つ在籍中の従業員が必要です。',
      CONTRACT_FIELDS_RESTRICTED:
        '必要な契約項目は付与されたアクセス範囲外です。',
      CONTRACT_FILE_SIZE: '空でない5 MiB以下の契約ファイルを選択してください。',
      CONTRACT_FILE_TYPE:
        '契約本文はPDF、証拠は内容と形式が一致するPDF、JPEG、PNG、WebPにしてください。',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        'このリクエストキーは異なる内容で使用済みです。再提出前に更新してください。',
      CONTRACT_INACTIVE_SOURCE: '有効な承認済み契約ソースを選択してください。',
      CONTRACT_INCOMPLETE_PROPOSAL:
        '契約理由、支払条件、変更不可の本文バージョンを完成させてください。',
      CONTRACT_INPUT_INVALID: '宣言された契約入力項目を確認してください。',
      CONTRACT_INVALID_AMOUNT:
        '対応範囲内で正確な分単位の非負整数を入力してください。',
      CONTRACT_INVALID_ID: '制限内の有効な識別情報が必要です。',
      CONTRACT_INVALID_TIME: '契約のタイムスタンプが不正です。',
      CONTRACT_LIMIT_EXCEEDED:
        '支払保留額と支払済み金額が契約上限を超えています。',
      CONTRACT_NOT_CANDIDATE:
        '削除できるのはこの申請の未公開契約候補のみです。',
      CONTRACT_NOT_FOUND: '契約ソースが見つかりません。',
      CONTRACT_OUTSTANDING_PAYMENTS:
        '契約を終了する前に保留中の支払を解放してください。',
      CONTRACT_REASON_REQUIRED: '対応する長さ以内で理由を入力してください。',
      CONTRACT_REBASE_NOT_ALLOWED:
        '差し戻された変更の基準バージョンを明示的に更新できるのは申請者のみです。',
      CONTRACT_REQUEST_KEY_REQUIRED: '固定のリクエストキーが必要です。',
      CONTRACT_RESERVATION_CLOSED: '支払予約は終了済みです。',
      CONTRACT_RULE_INVALID:
        '契約承認ポリシーが存在しないか不正です。管理者にお問い合わせください。',
      CONTRACT_SLA_UNSUPPORTED:
        'インストール済みの承認アダプターは、設定された24／48時間の時計のみサポートします。',
      CONTRACT_SOURCE_CONFLICT: 'この参照は別の契約ソースに属しています。',
      CONTRACT_STORED_ID_INVALID:
        '保存された契約識別情報が不正です。管理者にお問い合わせください。',
      CONTRACT_SUPPLIER_INVALID:
        '仕入先は有効かつ資格承認済みである必要があります。承認前に資格を更新してください。',
      CONTRACT_TARGET_MISMATCH: '承認対象が別の契約申請に属しています。',
      CONTRACT_TEXT_INVALID:
        'この申請に属する変更不可のPDF本文バージョンを選択してください。',
      CONTRACT_TEXT_NOT_EDITABLE:
        '契約本文バージョンは、自分の下書きまたは差し戻し修正版にのみ追加できます。',
      CONTRACT_TEXT_REQUIRED:
        '有効な変更不可の契約本文バージョンを選択してください。',
      CONTRACT_TRANSITION_NOT_ALLOWED:
        '専用の保護された契約操作を使用してください。',
      CONTRACT_VERSION_CONFLICT:
        '承認済み契約が変更されました。申請を差し戻し、基準バージョンを明示的に更新して再審査に提出してください。',
    },
    authz: {
      resource: '契約と変更',
      view: '契約申請を閲覧',
      submit: '自分の契約申請を作成・編集',
      ledger: '承認済み契約台帳と変更不可のバージョンを閲覧',
      historicalEntry: '監査済み法務記録付きで過去契約を登録',
    },
  },
};
