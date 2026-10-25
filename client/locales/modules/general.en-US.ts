export default {
  general: {
    authz: {
      resource: 'General requests',
      submit: 'Submit own general request',
      delegate: 'Submit a general request for an employee',
      view: 'Read general requests',
    },
    navigation: 'General requests',
    new: 'New general request',
    edit: 'Edit general request',
    title: 'Title',
    body: 'Request details',
    extraApprovers: 'Additional approvers',
    extraStage: 'Additional review',
    extraHint:
      'Choose one to three people. They review in this order after your manager.',
    addApprover: 'Add approver',
    removeApprover: 'Remove approver {{number}}',
    approver: 'Additional approver {{number}}',
    formDescription:
      'Describe a matter not covered by another application type.',
    approversInvalid:
      'Choose one to three distinct active people other than the applicant.',
    invalid: 'Enter a title and request details within the allowed length.',
    inactive: 'The applicant must be an active employee.',
    configuration:
      'Approval cannot be submitted. Contact an administrator to check the approval deadlines.',
    uncertainCreate:
      'The save result is uncertain. Close and check My requests before creating another draft.',
    attachmentInvalid: 'Some attachments do not belong to this request.',
    attachmentDenied: 'You cannot access these attachments.',
    attachmentType: 'Use a matching PDF, JPEG, PNG or WebP file.',
    attachmentSize: 'Attachments must be nonempty and at most 5 MB.',
  },
};
