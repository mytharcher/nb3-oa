export default {
  seals: {
    authz: {
      requests: 'Seal requests',
      view: 'View',
      create: 'Create',
      edit: 'Edit',
      operate: 'Operate',
      actualReturn: 'Actual exceptional return',
      ledger: 'Seal ledger',
      instances: 'Seal instances',
      manage: 'Manage seal metadata',
      owned: 'Own records',
      readable: 'Own and participating records',
    },
    errors: {
      REVIEWER_REQUIRED:
        'The actual assigned reviewer must retain the required active duty role.',
      APPROVAL_REFUSED:
        'The current approval or handling rules refuse this operation.',
      ACCESS_DENIED: 'You cannot access these seal records or fields.',
      ACTIVE_EMPLOYEE_REQUIRED: 'An active employee account is required.',
      ADMIN_KEEPER_REQUIRED:
        'Actual exceptional returns require both administrator and seal keeper duty roles.',
      ADMIN_REQUIRED: 'An active administrative duty role is required.',
      BODY_TOO_LARGE: 'The attachment exceeds the upload size limit.',
      COMMAND_CONFLICT:
        'This request key was already used for different content.',
      CONTRACT_ACCESS_DENIED: 'You cannot view the linked contract.',
      CONTRACT_NOT_EFFECTIVE: 'The linked contract is not effective.',
      CONTRACT_VERSION_CONFLICT: 'The linked contract changed after approval.',
      DEPARTMENT_REQUIRED: 'The applicant must have a primary department.',
      INVALID_COMMAND: 'A valid request key is required.',
      INVALID_COPIES:
        'Actual stamped copies must be positive and no greater than the approved quantity.',
      INVALID_FILE:
        'The attachment is missing, unsafe or outside this request.',
      INVALID_INPUT: 'The seal request fields are invalid.',
      INVALID_OUTPUT: 'The physical handling result is invalid.',
      INVALID_RETURN:
        'Actual return requires an administratively closed external checkout and a reason.',
      INVALID_SEAL_TYPE:
        'The seal type is inactive or does not match the approved request.',
      INVALID_TIME: 'The physical times or return deadline are invalid.',
      KEEPER_REQUIRED: 'An active seal keeper duty role is required.',
      OUTSTANDING_CUSTODY: 'This seal has outstanding physical custody.',
      PHYSICAL_ALREADY_REGISTERED:
        'The physical use or return has already been registered.',
      REQUEST_NOT_FOUND: 'The request is unavailable.',
      SEAL_EVIDENCE_REQUIRED: 'Actual immutable sealing evidence is required.',
      SEAL_NOT_FOUND: 'The seal is unavailable.',
      SEAL_UNAVAILABLE: 'This seal is currently checked out.',
      SLA_UNSUPPORTED: 'The configured reminder schedule is unsupported.',
      TARGET_MISMATCH: 'The offered task does not belong to this request.',
      VERSION_CONFLICT: 'The record changed. Refresh before retrying.',
    },
    schedule: {
      title: 'Seal return reminders',
      description: 'Remind outstanding seal custody daily in company time.',
    },
    notifications: {
      overdue: 'A borrowed seal is overdue for return.',
    },
  },
};
