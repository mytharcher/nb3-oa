export default {
  attendanceChange: {
    authz: { resource: 'Punch corrections' },
    navigation: 'Punch corrections',
    new: 'New punch correction',
    edit: 'Edit punch correction',
    emptyMissing:
      'No eligible missing punches. Contact HR if the imported attendance evidence is incorrect.',
    uploadAfterDraft: 'Save the draft, then open Edit to upload evidence.',
    formDescription:
      'Check the evidence and submit for review, or save a draft.',
    description:
      'Provide the missing punch time and evidence for your manager to review.',
    date: 'Missing punch date',
    original: 'Original missing punch',
    correctionAt: 'Corrected punch time',
    proof: 'Evidence statement',
    attachments: 'Evidence attachments',
    punchKinds: { in: 'Clock in', out: 'Clock out' },
    missing: 'Select a missing punch',
    policyHint:
      'The missing punch must be within seven calendar days. Pending and approved requests count toward the monthly limit.',
    errors: {
      ATTENDANCE_CHANGE_BASELINE_CHANGED:
        'The missing-punch record changed. Refresh and select it again.',
      ATTENDANCE_CHANGE_TOO_OLD:
        'Only missing punches within seven calendar days may be submitted. Contact HR for older records.',
      ATTENDANCE_CHANGE_INVALID_TIME:
        'The correction must fall on the missing-punch date and cannot be in the future.',
      ATTENDANCE_CHANGE_MONTHLY_LIMIT:
        'Pending and approved corrections have reached the monthly limit.',
      ATTENDANCE_CHANGE_DUPLICATE:
        'A pending or approved correction already exists for this missing punch.',
      ATTENDANCE_CHANGE_PROOF_REQUIRED:
        'Provide an evidence statement or upload evidence.',
      ATTENDANCE_CHANGE_EMPLOYEE_INACTIVE:
        'The applicant must be an active employee. Contact HR to check the archive.',
      ATTENDANCE_CHANGE_REASON_REQUIRED: 'Provide a reason for the correction.',
      ATTENDANCE_CHANGE_SLA_CONFIGURATION_UNSUPPORTED:
        'The configured approval clocks are unsupported. Contact an administrator.',
      ATTENDANCE_CHANGE_FILE_SIZE:
        'Attachments must be nonempty and at most 5 MiB.',
      ATTENDANCE_CHANGE_FILE_TYPE:
        'Use PDF, JPEG, PNG or WebP files with matching contents and format.',
      ATTENDANCE_CHANGE_ATTACHMENT_DENIED:
        'You do not have permission to view or upload this evidence.',
      ATTENDANCE_CHANGE_ATTACHMENT_INVALID:
        'The attachment link is invalid. Select evidence uploaded to this draft.',
      ATTENDANCE_BASELINE_CHANGED:
        'The original attendance evidence changed. The approval was rolled back; refresh to review it.',
    },
  },
};
