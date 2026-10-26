export default {
  financeIntegration: {
    title: '財務システム',
    readPermission: '財務同期を閲覧',
    sendPermission: '財務仕訳を送信・照合',
    send: '財務システムに送信',
    resend: '送信を再試行',
    lookup: '外部結果を確認',
    reload: '保存済み状態を更新',
    retry: '再試行',
    cancel: 'キャンセル',
    confirmSend: '送信',
    confirmTitle: 'この支払済み申請を財務システムに送信しますか？',
    confirmDescription:
      '承認済み会計情報を接続先財務システムに送信します。再度支払うことはありません。再試行は同じ業務参照を使用します。',
    notConfigured:
      '財務ゲートウェイが接続されていません。管理者に接続の完了を依頼してください。',
    loadFailed:
      '財務状態を読み込めません。アクセスを確認するか再試行してください。',
    actionFailed:
      '操作を確認できませんでした。再試行前に状態を更新してください。',
    conflict:
      '初回送信後に会計情報または送信先が変更されました。続行前に財務担当と既存仕訳を照合してください。',
    confirmBeforeRetry:
      '受信は記帳の証明ではありません。外部結果を確認し、必要に応じて同じ申請を再試行してください。',
    voucher: '外部伝票：{{number}}',
    states: {
      not_sent: '未送信',
      sending: '送信または結果確認中',
      accepted: '財務システムで受信済み・記帳未確認',
      posted: '伝票作成済み',
      rejected: '財務システムで拒否',
      unknown: '結果の確認が必要',
    },
    results: {
      transport: '結果を確認する前に接続が終了しました。',
      unconfirmed: '財務システムから確定結果が返されませんでした。',
      invalid_receipt: '受信記録をこの申請と照合できませんでした。',
      not_found:
        '今回の確認では外部レコードが見つかりません。以前の受信記録は有効です。',
      invalid_mapping: '財務口座または仕入先の対応付けを確認してください。',
      invalid_document: '財務システムが伝票内容を拒否しました。',
      duplicate_source: 'この業務参照は外部仕訳で使用済みです。',
      accounting_period_closed: '会計期間は締め済みです。',
      other: '財務担当に外部結果の確認を依頼してください。',
    },
  },
};
