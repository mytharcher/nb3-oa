export default {
  financeIntegration: {
    title: '财务系统',
    readPermission: '查看财务同步结果',
    sendPermission: '发送及核对财务凭证',
    send: '发送到财务系统',
    resend: '重试发送',
    lookup: '查询外部结果',
    reload: '刷新已保存状态',
    retry: '重试',
    cancel: '取消',
    confirmSend: '发送',
    confirmTitle: '将这张已支付单据发送到财务系统？',
    confirmDescription:
      '将向已连接的财务系统发送审核后的记账信息，不会再次付款。重试仍使用同一业务单据标识。',
    notConfigured: '尚未连接财务系统，请联系管理员完成连接配置。',
    loadFailed: '暂时无法读取财务同步状态，请检查权限或重试。',
    actionFailed: '本次操作结果尚未确认，请先刷新状态再重试。',
    conflict:
      '首次发送后，记账信息或目标系统发生变化。请先与财务核对已有凭证，再处理更正。',
    confirmBeforeRetry:
      '外部接收不代表已生成凭证。请先查询结果，必要时再重试原单。',
    voucher: '外部凭证：{{number}}',
    states: {
      not_sent: '尚未发送',
      sending: '正在发送或查询',
      accepted: '财务系统已接收，尚未确认生成凭证',
      posted: '已生成凭证',
      rejected: '财务系统拒绝接收',
      unknown: '结果待确认',
    },
    results: {
      transport: '连接结束前未能确认结果。',
      unconfirmed: '财务系统尚未返回可确认的结果。',
      invalid_receipt: '返回结果与当前单据不匹配。',
      not_found: '本次查询暂未找到外部记录，先前的接收确认仍保留。',
      invalid_mapping: '请检查财务科目或供应商对应关系。',
      invalid_document: '财务系统未接受当前单据信息。',
      duplicate_source: '外部已有使用该业务标识的凭证。',
      accounting_period_closed: '对应会计期间已经关闭。',
      other: '请联系财务核对外部处理结果。',
    },
  },
};
