export default {
  invoiceRecognition: {
    currentValues: 'Current unsaved values',
    reload: 'Refresh saved result',
    receivedAt: 'Result received: {{time}}',
    notConfigured:
      'The invoice gateway is not connected. You can continue entering invoice details manually.',
    title: 'Invoice recognition and verification',
    readPermission: 'Read invoice results',
    recognizePermission: 'Recognize editable invoice attachments',
    verifyPermission: 'Verify authorized invoice lines',
    recognizeAttachment: 'Recognize attachment {{index}}',
    verifyAttachment: 'Verify invoice · attachment {{index}}',
    processing: 'Processing the invoice…',
    failed:
      'Unable to complete this operation. Check your access and gateway configuration, then retry. Your entered values are unchanged.',
    changed:
      'This line changed. Run the operation again before applying or relying on this result.',
    unconfirmed: 'The result has not been confirmed.',
    recover: 'Check external result',
    reference: 'Verification reference: {{reference}}',
    confirmTitle: 'Review recognized invoice',
    confirmDescription:
      'Compare these suggestions with the original attachment. Applying them changes this unsaved line only; it does not save, submit or verify the invoice.',
    number: 'Invoice number',
    date: 'Invoice date',
    amount: 'Total including tax',
    cancel: 'Cancel',
    apply: 'Apply to this line',
    states: {
      not_checked: 'Not checked',
      pending: 'Waiting to process',
      running: 'Processing',
      recognized: 'Recognized; review before applying',
      multiple:
        'Multiple invoices found. Split the attachment or enter this line manually.',
      unreadable:
        'Unable to recognize this invoice. Enter its details manually.',
      rejected: 'The external service could not process this invoice.',
      valid: 'External verification matched the current invoice facts.',
      mismatch: 'The invoice facts do not match the external verification.',
      not_found: 'No matching invoice was found. Ask finance to review.',
      unknown:
        'Result not confirmed. Query the external result before retrying.',
    },
  },
};
