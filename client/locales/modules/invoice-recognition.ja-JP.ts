export default {
  invoiceRecognition: {
    currentValues: '現在の未保存の値',
    reload: '保存結果を更新',
    receivedAt: '結果受信日時：{{time}}',
    notConfigured:
      '請求書ゲートウェイが未接続です。請求書情報を手動入力できます。',
    title: '請求書の認識・照合',
    readPermission: '請求書結果を閲覧',
    recognizePermission: '編集可能な請求書添付を認識',
    verifyPermission: '権限のある請求書明細を照合',
    recognizeAttachment: '添付ファイル{{index}}を認識',
    verifyAttachment: '請求書を照合・添付{{index}}',
    processing: '請求書を処理中…',
    failed:
      '操作を完了できません。アクセスとゲートウェイ設定を確認して再試行してください。入力値は維持されています。',
    changed:
      '明細が変更されました。結果の適用や利用前に操作を再実行してください。',
    unconfirmed: '結果は未確認です。',
    recover: '外部結果を確認',
    reference: '照合参照：{{reference}}',
    confirmTitle: '認識した請求書を確認',
    confirmDescription:
      '候補値を元の添付と比較してください。適用は未保存のこの明細だけを変更します。保存、提出、照合は行いません。',
    number: '請求書番号',
    date: '請求書日付',
    amount: '税込合計',
    cancel: 'キャンセル',
    apply: 'この明細に適用',
    states: {
      not_checked: '未確認',
      pending: '処理待ち',
      running: '処理中',
      recognized: '認識済み・適用前に確認',
      multiple:
        '複数の請求書が見つかりました。添付を分割するか、この明細を手動入力してください。',
      unreadable: '請求書を認識できません。手動入力してください。',
      rejected: '外部サービスがこの請求書を処理できませんでした。',
      valid: '外部照合は現在の請求書情報と一致しました。',
      mismatch: '請求書情報が外部照合と一致しません。',
      not_found:
        '一致する請求書が見つかりません。財務担当に確認を依頼してください。',
      unknown: '結果は未確認です。再試行前に外部結果を照会してください。',
    },
  },
};
