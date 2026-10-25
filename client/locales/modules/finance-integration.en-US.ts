export default {
  financeIntegration: {
    title: 'Finance system',
    readPermission: 'View finance synchronization',
    sendPermission: 'Send and reconcile finance entries',
    send: 'Send to finance system',
    resend: 'Retry sending',
    lookup: 'Check external result',
    reload: 'Refresh saved status',
    retry: 'Retry',
    cancel: 'Cancel',
    confirmSend: 'Send',
    confirmTitle: 'Send this paid request to the finance system?',
    confirmDescription:
      'The approved accounting facts will be sent to the connected finance system. This does not make another payment. Retrying reuses the same business reference.',
    notConfigured:
      'A finance gateway has not been connected. Ask your administrator to complete the connection.',
    loadFailed:
      'Unable to load the finance status. Check your access or retry.',
    actionFailed:
      'The operation could not be confirmed. Refresh the status before trying again.',
    conflict:
      'The accounting facts or destination changed after the first send. Reconcile the existing entry with finance before proceeding.',
    confirmBeforeRetry:
      'Receipt is not proof of posting. Check the external result; if necessary, retry the same request.',
    voucher: 'External voucher: {{number}}',
    states: {
      not_sent: 'Not sent',
      sending: 'Sending or checking result',
      accepted: 'Received by the finance system; posting not confirmed',
      posted: 'Voucher created',
      rejected: 'Rejected by the finance system',
      unknown: 'Result needs confirmation',
    },
    results: {
      transport: 'The connection ended before a result could be confirmed.',
      unconfirmed: 'The finance system did not return a confirmed result.',
      invalid_receipt: 'The receipt could not be matched to this request.',
      not_found:
        'No external record was found on this check. A previous receipt remains valid.',
      invalid_mapping: 'Finance account or supplier mapping needs attention.',
      invalid_document: 'The finance system rejected the document facts.',
      duplicate_source:
        'An external entry already uses this business reference.',
      accounting_period_closed: 'The accounting period is closed.',
      other: 'Ask finance to review the external result.',
    },
  },
};
