export default {
  paymentRequestsForm: {
    new: 'New payment request',
    edit: 'Edit payment request',
    description:
      'Submit the completed request, or save a draft. Required business facts are checked again at submission.',
    save: 'Save draft',
    saved: 'Payment draft saved',
    draft: 'Draft',
    maxFiles: 'Select at most 10 evidence files.',
    limit: 'This text exceeds the length limit.',
    required: 'This field is required.',
    amountInvalid:
      'Enter a nonnegative amount with at most two decimal places, within the supported exact cent range.',
    invalid: 'Check this field.',
    notEditable: 'This record is no longer available for editing.',
    inactive: 'Unavailable — choose an eligible option',
    select: 'Choose an option',
    unknown:
      'The result is unconfirmed. Keep your input and retry the exact same request.',
    replay: 'Reconcile the original request',
    latest:
      'Latest version loaded. Your input is retained; compare it with the latest source options before saving again.',
    leaveReady:
      'Click your original destination again to leave. Further editing cancels this confirmation.',
    applicantId: 'Applicant',
    reason: 'Payment reason',
    sourceMode: 'Prior approval source',
    contract: 'Contract',
    contractVersion: 'Contract version',
    contractId: 'Contract',
    counterparty: 'Contract counterparty',
    customerAccountHint:
      'Customer contracts have no supplier bank account. If required, the protected account can be corrected after the cashier reports an exception.',
    purchase: 'Approved purchase order',
    none: 'No prior approval',
    purchaseOrderId: 'Purchase order',
    noPriorApprovalReason: 'Explanation for payment without prior approval',
    vendorId: 'Payee',
    amount: 'Amount (yuan)',
    invoiceNumber: 'Invoice number',
    paymentMethod: 'Payment method',
    orderStatus: 'Order status',
    approved: 'Approved amount',
    paid: 'Already paid',
    pending: 'Pending payments',
    available: 'Available amount',
    cents: 'cents',
    overApproval:
      'Amounts above the approved cumulative limit, including pending payments, require full approval. Overpayment requests are allowed.',
    frozenHint: 'Source, payee, amount and invoice are frozen at submission.',
    voucherAttachments: 'Payment evidence',
    attachments: 'Invoice evidence',
    uploadHint:
      'PDF, JPEG, PNG or WebP; up to 5 MB. Removing a selection preserves the stored evidence.',
    fileSize: 'Choose a nonempty file up to 5 MB.',
    fileType:
      'Choose a PDF, JPEG, PNG or WebP file with the matching extension.',
    selectEvidence: 'Select stored evidence / reconcile upload',
    uploading: 'Uploading or reading evidence…',
    uploadUnknown:
      'The upload result is unconfirmed. Read the stored evidence and inspect it before uploading again. No automatic upload retry is performed.',
    emptyEvidence: 'No stored evidence.',
    evidenceMissing:
      'Some evidence is no longer accessible. Refresh or check your permissions.',
    removeEvidence: 'Remove {{name}} from this selection',
    bank: {
      title: 'Private payee account',
      denied: 'You do not have access to this payment account.',
      missing: 'No payment account has been captured.',
      correct: 'Correct payment account',
      unavailable:
        'Account correction is available only to the applicant or creator while handling an exception.',
      bankName: 'Bank',
      bankAccount: 'Account number',
      bankAccountName: 'Account holder',
      reason: 'Correction reason',
      saved: 'Payment account corrected',
      unknown:
        'The write result is unconfirmed. Read the latest account and compare it before explicitly submitting again.',
      conflict:
        'The account or payment version changed. Load the latest facts; your edits are retained.',
      reconciled:
        'Latest facts loaded. Compare your retained input and explicitly confirm any new write.',
    },
  },
};
