export default {
  financeIntegration: {
    title: '財務系統',
    readPermission: '查看財務同步結果',
    sendPermission: '傳送及核對財務憑證',
    send: '傳送到財務系統',
    resend: '重試傳送',
    lookup: '查詢外部結果',
    reload: '重新整理已儲存狀態',
    retry: '重試',
    cancel: '取消',
    confirmSend: '傳送',
    confirmTitle: '將這張已支付單據傳送到財務系統？',
    confirmDescription:
      '將向已連接的財務系統傳送審核後的記帳資訊，不會再次付款。重試仍使用同一業務單據標識。',
    notConfigured: '尚未連接財務系統，請聯絡管理員完成連接設定。',
    loadFailed: '暫時無法讀取財務同步狀態，請檢查權限或重試。',
    actionFailed: '本次操作結果尚未確認，請先重新整理狀態再重試。',
    conflict:
      '首次傳送後，記帳資訊或目標系統發生變化。請先與財務核對已有憑證，再處理更正。',
    confirmBeforeRetry:
      '外部接收不代表已生成憑證。請先查詢結果，必要時再重試原單。',
    voucher: '外部憑證：{{number}}',
    states: {
      not_sent: '尚未傳送',
      sending: '正在傳送或查詢',
      accepted: '財務系統已接收，尚未確認生成憑證',
      posted: '已生成憑證',
      rejected: '財務系統拒絕接收',
      unknown: '結果待確認',
    },
    results: {
      transport: '連接結束前未能確認結果。',
      unconfirmed: '財務系統尚未返回可確認的結果。',
      invalid_receipt: '返回結果與目前單據不匹配。',
      not_found: '本次查詢暫未找到外部記錄，先前的接收確認仍保留。',
      invalid_mapping: '請檢查財務科目或供應商對應關係。',
      invalid_document: '財務系統未接受目前單據資訊。',
      duplicate_source: '外部已有使用該業務標識的憑證。',
      accounting_period_closed: '對應會計期間已經關閉。',
      other: '請聯絡財務核對外部處理結果。',
    },
  },
};
