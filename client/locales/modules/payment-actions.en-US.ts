export default {
  actionForm: {
    uncertain:
      'The result is unconfirmed. Keep this input and retry the identical operation; do not issue a changed request.',
    replay: 'Retry identical operation',
    title: '{{action}} payment request “{{name}}”',
    unavailable:
      'This action is no longer available. Read the latest payment request.',
    unsupported:
      'This action needs an input contract that this page does not support.',
    comment: 'Opinion or reason',
    person: 'Recipient',
    mode: 'Signer position',
    place: 'Approval place',
    returnTarget: 'Return destination',
    voucher: 'Payment voucher number',
    voucherHint:
      'Leave empty only when administratively recording settlement without a voucher.',
    amount: 'Payment amount',
    amountConfirm: 'Confirm exact payment amount',
    voucherAttachments: 'Payment voucher attachments',
    exactAmount: 'Enter the exact amount shown above.',
    confirm: 'Confirm {{action}}',
    confirmDescription:
      'Confirm this operation on “{{name}}”. Payment {{amount}}. {{consequence}}',
    releaseConsequence:
      'This releases unsettled reservations and cannot be undone here.',
    returnConsequence:
      'The request returns for correction and current pending work closes.',
    paymentConsequence: 'Record an actual completed payment using its voucher.',
    forcedConsequence:
      'Record administrative settlement; this does not initiate a bank transfer.',
    unableConsequence: 'The request enters a handling exception.',
    submitConsequence:
      'The request enters approval with its submitted facts frozen.',
    genericConsequence:
      'The server applies the offered operation to the selected approval target.',
    latest: 'Read latest version',
    conflict:
      'The payment request changed. Your input is retained. Read the latest version, review it, then confirm again.',
    completed: '{{action}} completed for “{{name}}”',
    committed:
      'The operation completed. Refresh the payment request before taking another action.',
    before: 'Before',
    after: 'After',
    alongside: 'Alongside',
    revision: 'Applicant correction',
    required: 'Complete this field.',
    labels: {
      approve: 'Approve',
      reject: 'Reject',
      return: 'Return for correction',
      returnTo: 'Return for correction',
      submit: 'Submit for approval',
      withdraw: 'Withdraw',
      terminate: 'Terminate',
      retryCash: 'Retry cashier',
      retryCashAsAdmin: 'Administrative cashier retry',
      forcePayException: 'Record exceptional settlement',
      forceComplete: 'Administrative settlement',
      reviseBusiness: 'Revise for approval',
      claim: 'Claim',
      release: 'Release',
      assign: 'Assign',
      complete: 'Confirm payment',
      unable: 'Unable to pay',
      transfer: 'Transfer',
      addSigner: 'Add signer',
      cc: 'Copy',
      appoint: 'Appoint',
      reassign: 'Reassign',
      comment: 'Comment',
      read: 'Mark read',
      urge: 'Remind',
    },
  },
};
