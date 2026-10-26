export default {
  electronicSignatures: {
    archivedHint:
      '署名サービスが完了を確認しました。検証済み署名PDFをこの申請に保管しました。',
    reference: '署名参照：{{value}}',
    completedAction: '電子署名保管済み',
    title: '電子署名',
    readPermission: '署名済み文書を閲覧',
    sendPermission: '署名を送信・復旧',
    channel: '実行チャネル',
    physical: '物理印章',
    electronic: '電子署名',
    channelHint:
      '承認前に選択してください。電子署名は承認済みPDF1件が必要で、紙の部数は指定しません。',
    hint: '承認済みPDFを設定済み署名サービスに送ります。署名済み文書の検証と保管後にのみ完了を確認します。',
    notConfigured:
      '電子署名が接続されていません。管理者にお問い合わせください。',
    notEligible:
      '署名には承認済みの最新PDF文書が必要です。電子印章申請にはPDFを1件だけ含めてください。',
    loadFailed: '署名状態を読み込めないか、閲覧権限がありません。',
    actionFailed:
      '操作を完了できませんでした。再試行前に状態を更新してください。',
    retry: '再試行',
    send: '署名に送信',
    refresh: '状態確認／復旧',
    open: '署名を続ける',
    download: '署名済みPDFをダウンロード',
    recovery:
      '外部結果または保管の確認が必要です。状態を確認して同じ署名申請を復旧してください。',
    signedAt: '署名日時{{at}}',
    confirmTitle: 'この承認済みPDFを署名に送信しますか？',
    confirmHint:
      '設定済み署名サービスに承認文書を送信します。再試行では同じ署名申請を使用します。',
    cancel: 'キャンセル',
    states: {
      not_sent: '未送信',
      pending: '提出待ち',
      sending: '送信中',
      accepted: '署名サービス受付済み',
      signing: '署名待ち',
      unknown: '結果確認待ち',
      archivePending: '署名済み・保管復旧が必要',
      archived: '署名済み文書保管済み',
      rejected: '署名サービスで拒否',
      cancelled: '署名サービスで取消',
    },
  },
};
