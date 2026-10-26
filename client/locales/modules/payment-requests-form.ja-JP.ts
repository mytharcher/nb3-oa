export default {
  paymentRequestsForm: {
    new: '新しい支払申請',
    edit: '支払申請を編集',
    description:
      '申請を完成して提出するか、下書きを保存してください。提出時に必須業務情報を再確認します。',
    save: '下書きを保存',
    saved: '支払下書きを保存しました',
    draft: '下書き',
    maxFiles: '証拠ファイルは10件以内で選択してください。',
    limit: '文字数上限を超えています。',
    required: '必須項目です。',
    amountInvalid:
      '対応する正確な分単位の範囲内で、小数点以下2桁以内の非負の金額を入力してください。',
    invalid: 'この項目を確認してください。',
    notEditable: 'このレコードは編集できなくなりました。',
    inactive: '利用不可・適格な選択肢を選択してください',
    select: '選択肢を選ぶ',
    unknown:
      '結果は未確認です。入力を保持し、まったく同じリクエストを再試行してください。',
    replay: '元のリクエストを照合',
    latest:
      '最新バージョンを読み込みました。入力は保持されています。再保存前に最新のソース選択肢と比較してください。',
    leaveReady:
      '移動するには元の移動先を再クリックしてください。追加編集するとこの確認は無効になります。',
    applicantId: '申請者',
    reason: '支払理由',
    sourceMode: '事前承認ソース',
    contract: '契約',
    contractVersion: '契約バージョン',
    contractId: '契約',
    counterparty: '契約取引先',
    customerAccountHint:
      '顧客契約には仕入先銀行口座がありません。必要な場合、出納担当者が例外を報告した後に保護口座を訂正できます。',
    purchase: '承認済み発注書',
    none: '事前承認なし',
    purchaseOrderId: '発注書',
    noPriorApprovalReason: '事前承認なしの支払理由',
    vendorId: '受取人',
    amount: '金額（元）',
    invoiceNumber: '請求書番号',
    paymentMethod: '支払方法',
    orderStatus: '発注状態',
    approved: '承認額',
    paid: '支払済み',
    pending: '支払保留',
    available: '利用可能額',
    cents: '分',
    overApproval:
      '支払保留を含む累計が承認上限を超える場合は全承認が必要です。超過支払申請も可能です。',
    frozenHint: '提出時にソース、受取人、金額、請求書を固定します。',
    voucherAttachments: '支払証拠',
    attachments: '請求書証拠',
    uploadHint:
      'PDF、JPEG、PNG、WebP、5 MB以下。選択を解除しても保存済み証拠は保持されます。',
    fileSize: '空でない5 MB以下のファイルを選択してください。',
    fileType:
      '拡張子が一致するPDF、JPEG、PNG、WebPファイルを選択してください。',
    selectEvidence: '保存済み証拠を選択／アップロードを照合',
    uploading: '証拠をアップロードまたは読み込み中…',
    uploadUnknown:
      'アップロード結果が未確認です。再アップロード前に保存済み証拠を読み込んで確認してください。自動再試行は行いません。',
    emptyEvidence: '保存済み証拠はありません。',
    evidenceMissing:
      '一部の証拠にアクセスできなくなりました。更新するか権限を確認してください。',
    removeEvidence: '{{name}}をこの選択から削除',
    bank: {
      title: '非公開の受取人口座',
      denied: 'この支払口座へのアクセス権がありません。',
      missing: '支払口座は取得されていません。',
      correct: '支払口座を訂正',
      unavailable: '口座訂正は例外処理中の申請者または作成者のみ利用できます。',
      bankName: '銀行',
      bankAccount: '口座番号',
      bankAccountName: '口座名義人',
      reason: '訂正理由',
      saved: '支払口座を訂正しました',
      unknown:
        '書き込み結果が未確認です。明示的な再提出前に最新口座を読み込んで比較してください。',
      conflict:
        '口座または支払バージョンが変更されました。最新情報を読み込んでください。編集内容は保持されています。',
      reconciled:
        '最新情報を読み込みました。保持した入力と比較し、新しい書き込みを明示的に確認してください。',
    },
  },
};
