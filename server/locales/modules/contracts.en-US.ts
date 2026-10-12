export default {
  contracts: {
    errors: {
      CONTRACT_SEAL_EVIDENCE_REQUIRED:
        'Actual completed sealing evidence is required.',
      CONTRACT_SEAL_EVIDENCE_CONFLICT:
        'This seal evidence belongs to different contract facts.',
      CONTRACT_ACCESS_DENIED: 'This contract is outside your granted access.',
      CONTRACT_ACTION_NOT_ALLOWED:
        'This action is unavailable for the contract.',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        'The contract amount cannot be less than paid plus reserved payments.',
      CONTRACT_ATTACHMENT_DENIED:
        'The contract attachment field or record is outside your granted access.',
      CONTRACT_ATTACHMENT_INVALID:
        'Choose valid attachments belonging to this contract request.',
      CONTRACT_CANDIDATE_REMOVED:
        'This unpublished contract candidate was removed. Create a new application.',
      CONTRACT_CATEGORY_INACTIVE: 'Choose an active contract type.',
      CONTRACT_CORRUPT_BALANCE:
        'The contract payment totals are inconsistent. Contact an administrator.',
      CONTRACT_EMPLOYEE_REQUIRED:
        'An active employee with a primary department is required.',
      CONTRACT_FIELDS_RESTRICTED:
        'The required contract fields are outside your granted access.',
      CONTRACT_FILE_SIZE: 'Choose a nonempty contract file up to 5 MiB.',
      CONTRACT_FILE_TYPE:
        'Contract text must be PDF; evidence may be PDF, JPEG, PNG or WebP with matching file content.',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        'This request key was already used with different details. Refresh before submitting again.',
      CONTRACT_INACTIVE_SOURCE: 'Choose an effective approved contract source.',
      CONTRACT_INCOMPLETE_PROPOSAL:
        'Complete the contract reason, payment terms and immutable text version.',
      CONTRACT_INPUT_INVALID: 'Check the declared contract input fields.',
      CONTRACT_INVALID_AMOUNT:
        'Enter a nonnegative amount in exact integer cents within the supported range.',
      CONTRACT_INVALID_ID: 'A valid bounded identity is required.',
      CONTRACT_INVALID_TIME: 'The contract timestamp is invalid.',
      CONTRACT_LIMIT_EXCEEDED:
        'The pending and paid amounts exceed the contract limit.',
      CONTRACT_NOT_CANDIDATE:
        'Only this application’s unpublished contract candidate may be removed.',
      CONTRACT_NOT_FOUND: 'The contract source was not found.',
      CONTRACT_OUTSTANDING_PAYMENTS:
        'Release pending payments before terminating the contract.',
      CONTRACT_REASON_REQUIRED: 'Enter a reason within the supported length.',
      CONTRACT_REBASE_NOT_ALLOWED:
        'Only the applicant may explicitly refresh the base version of a returned change.',
      CONTRACT_REQUEST_KEY_REQUIRED: 'A stable request key is required.',
      CONTRACT_RESERVATION_CLOSED:
        'The payment reservation has already been closed.',
      CONTRACT_RULE_INVALID:
        'The contract approval policy is missing or invalid. Contact an administrator.',
      CONTRACT_SLA_UNSUPPORTED:
        'The installed approval adapter supports only the configured 24/48 hour clock.',
      CONTRACT_SOURCE_CONFLICT:
        'This reference belongs to another contract source.',
      CONTRACT_STORED_ID_INVALID:
        'A stored contract identity is invalid. Contact an administrator.',
      CONTRACT_SUPPLIER_INVALID:
        'The supplier must be active and have approved qualification. Refresh its qualification before approval.',
      CONTRACT_TARGET_MISMATCH:
        'The approval target belongs to another contract request.',
      CONTRACT_TEXT_INVALID:
        'Choose an immutable PDF text version belonging to this application.',
      CONTRACT_TEXT_NOT_EDITABLE:
        'Contract text versions may be appended only to an owned draft or returned revision.',
      CONTRACT_TEXT_REQUIRED: 'Select a valid immutable contract text version.',
      CONTRACT_TRANSITION_NOT_ALLOWED:
        'Use the dedicated guarded contract operation.',
      CONTRACT_VERSION_CONFLICT:
        'The approved contract changed. Return the request, explicitly refresh its base version and submit for review again.',
    },
    authz: {
      resource: 'Contracts and changes',
      view: 'View contract requests',
      submit: 'Create and edit own contract requests',
      ledger: 'Read approved contract ledger and immutable versions',
      historicalEntry:
        'Register a historical contract with an audited legal record',
    },
  },
};
