export default {
  actionForm: {
    limit: 'This value is too long.',
    evaluation: 'Manager evaluation',
    conclusion: 'Conclusion',
    regular: 'Confirm employment',
    deferred: 'Extend probation',
    declined: 'Decline confirmation',
    deferredTo: 'Extended probation end date',
    dateRequired:
      'Choose a valid date later than the submitted probation end date.',
    grade: 'Grade',
    baseSalary: 'Base salary',
    salaryInvalid:
      'Enter a decimal amount with up to 14 integer digits and 2 decimal places.',
    privateDenied:
      'You cannot view compensation. HR approval cannot be confirmed.',
    approveConsequence:
      'The offered approval is recorded. Final approval applies the approved employment outcome.',

    uncertain:
      'The result is unconfirmed. Keep this input and retry the identical operation; do not issue a changed request.',
    replay: 'Retry identical operation',
    title: '{{action}} probation request "{{name}}"',
    unavailable:
      'This action is no longer available. Read the latest probation request.',
    unsupported:
      'This action needs an input contract that this page does not support.',
    comment: 'Opinion or reason',
    person: 'Recipient',
    mode: 'Signer position',
    place: 'Approval place',
    returnTarget: 'Return destination',
    confirm: 'Confirm {{action}}',
    confirmDescription: 'Confirm this operation on "{{name}}". {{consequence}}',
    releaseConsequence:
      'This releases pending approval tasks and cannot be undone here.',
    returnConsequence:
      'The request returns for correction and current pending work closes.',
    submitConsequence:
      'The request enters approval with its submitted facts frozen.',
    genericConsequence:
      'The server applies the offered operation to the selected approval target.',
    latest: 'Read latest version',
    conflict:
      'The probation request changed. Your input is retained. Read the latest version, review it, then confirm again.',
    completed: '{{action}} completed for "{{name}}"',
    committed:
      'The operation completed. Refresh the probation request before taking another action.',
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
      claim: 'Claim',
      release: 'Release',
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
