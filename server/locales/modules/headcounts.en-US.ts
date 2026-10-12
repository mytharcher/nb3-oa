export default {
  headcounts: {
    authz: {
      title: 'Headcount capacity',
      view: 'View capacity',
      manage: 'Manage annual capacity',
      viewJournal: 'View source journal',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        'The complete employee roster is not readable. Ask an administrator to check employee read permissions.',
      HEADCOUNT_ACCESS_DENIED:
        'You do not have permission to perform this headcount operation.',
      HEADCOUNT_FIELD_ACCESS_DENIED:
        'The capacity summary fields are outside your permission.',
      HEADCOUNT_NOT_FOUND: 'The headcount account is unavailable.',
      HEADCOUNT_ALREADY_EXISTS:
        'This department, position and year already has an account.',
      HEADCOUNT_NOT_INITIALIZED:
        'Reconcile the complete employee roster before reserving capacity.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        'Select the complete actual probation, regular and leaving roster.',
      HEADCOUNT_ROSTER_DRIFT:
        'The actual employee roster changed. Reconcile its source facts before proceeding.',
      HEADCOUNT_VERSION_CONFLICT:
        'The account changed. Refresh it before saving.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT:
        'This request identifier already belongs to another operation.',
      HEADCOUNT_INSUFFICIENT:
        'The annual limit cannot cover the actual occupied and reserved headcount.',
      HEADCOUNT_INVALID_NUMBER: 'Enter a bounded whole number of people.',
      HEADCOUNT_INVALID_ACCOUNT: 'Select a real department, position and year.',
      HEADCOUNT_INVALID_IDENTITY:
        'Select an active organization department and position.',
      HEADCOUNT_INVALID_COMMAND:
        'An actor, request identifier and reason are required.',
      HEADCOUNT_INVALID_SOURCE:
        'A real source type and identifier are required.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        'Each replacement seat needs a distinct departing employee.',
      HEADCOUNT_INVALID_REPLACEMENT:
        'The replacement source must match a real leaving or left occupancy.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'This replacement occupancy is missing or already claimed.',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        'The restored source employee blocks this replacement.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND: 'The employee archive is unavailable.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        'The actual employee does not match the allocated department and position.',
      HEADCOUNT_ALREADY_OCCUPIED:
        'This employee already occupies this annual account.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        'Explicitly rebind to the current company year before consumption.',
      HEADCOUNT_SOURCE_NOT_FOUND: 'The capacity source is unavailable.',
      HEADCOUNT_SOURCE_EXISTS: 'This source already has a reservation.',
      HEADCOUNT_SOURCE_STATE: 'The source state does not allow this operation.',
      HEADCOUNT_SOURCE_CLOSED: 'The capacity source is already closed.',
      HEADCOUNT_SEAT_STATE: 'The reservation seat is not pending.',
      HEADCOUNT_STATE_CONFLICT: 'The reservation seat changed.',
      HEADCOUNT_NO_ALLOCATION: 'No approved available seat remains.',
      HEADCOUNT_NOT_LEFT:
        'Actual departure is required before releasing occupied capacity.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        'A real unreleased employee occupancy is required.',
      HEADCOUNT_NOT_RESTORED:
        'Actual restoration is required before blocking future replacements.',
      HEADCOUNT_INVALID_REBIND:
        'Yearly rebind must preserve department and position and move forward.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        'Replacement credits require explicit target-year sources.',
      HEADCOUNT_INVALID_TRANSFER:
        'A distinct approved target reservation is required.',
      HEADCOUNT_INVALID_PAGE: 'Select a page size between 1 and 100.',
      HEADCOUNT_GUARD_UNAVAILABLE:
        'The capacity transaction guard is unavailable.',
    },
  },
};
