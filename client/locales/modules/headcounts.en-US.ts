export default {
  headcounts: {
    name: '{{department}} / {{position}} / {{year}}',
    createSubmit: 'Create',
    idCopied: 'Account ID copied',
    title: 'Headcount ledger',
    description:
      'Annual capacity and actual employee occupancy. Initialize an account before recruitment.',
    account: 'Annual headcount',
    state: 'Initialization status',
    create: 'Create annual headcount',
    adjust: 'Adjust limit',
    alreadyInitialized:
      'This account is already initialized. Its actual occupancy cannot be recounted here.',
    reconcile: 'Verify and initialize',
    confirmInitialize: 'Confirm initialization',
    initialized: 'Initialized',
    uninitialized: 'Not initialized',
    view: 'View headcount',
    refresh: 'Refresh',
    cancel: 'Cancel',
    save: 'Save',
    clearFilters: 'Clear filters',
    allPositions: 'All positions',
    rowActions: 'Actions for “{{name}}”',
    empty: 'No annual headcount',
    noResults: 'No matching annual headcount',
    filterHelp: 'Change the filters.',
    emptyManage: 'Create an account and verify its roster.',
    emptyRead: 'Ask HR to enter annual headcount.',
    journal: 'Source journal',
    noJournal: 'No source events yet',
    noJournalPermission:
      'You do not have permission to read the source journal.',
    uninitializedHelp:
      'This account is not initialized and cannot be used for recruitment. Verify the complete roster.',
    rosterHelp:
      'Verify the complete roster, including probation, regular and departing employees.',
    rosterEmpty:
      'No matching employees currently occupy this account. Confirm that the actual roster is empty.',
    rosterCount: '{{count}} employees',
    confirmRoster: 'I have verified the complete employee roster',
    created: 'Created "{{name}}". Verify and initialize it next.',
    adjusted: 'Updated limit for "{{name}}".',
    reconciled: 'Initialized "{{name}}" for recruitment.',
    invalidYear: 'Enter a whole year from 1900 to 9999.',
    invalidLimit: 'Enter a whole number from 0 to 1,000,000.',
    reasonRequired: 'Enter a reason from 1 to 5,000 characters.',
    selectRequired: 'Select a currently authorized department and position.',
    rosterConfirmationRequired:
      'Confirm that you have verified the complete roster.',
    noAccess: 'You do not have permission to read this headcount.',
    missing: 'This headcount account does not exist or is inaccessible.',
    failed: 'Could not complete the request. Try again.',
    loadLatest: 'Load latest data',
    unknownOutcome: 'The result is not confirmed. Keep this command and retry.',
    retryCommand: 'Retry this operation',
    reduceTitle: 'Reduce the headcount limit for “{{account}}”?',
    reduceDescription:
      'The limit will change from {{previous}} to {{next}}. Existing occupancy and reservations must remain covered.',
    reduceConfirm: 'Confirm reduction',
    minimumLimit:
      'Current occupancy and reservations total {{count}}. The new limit cannot be lower.',
    discard: 'Discard unsaved changes?',
    discardDescription: 'Closing will discard these unsaved changes.',
    discardConfirm: 'Discard changes',
    noTargets:
      'No authorized department and position targets. Ask an administrator to check headcount management permissions.',
    recruitmentSource: 'View recruitment request',
    transferSource: 'View transfer request',
    fields: {
      department: 'Department',
      position: 'Position',
      year: 'Headcount year',
      limit: 'Authorized limit',
      used: 'Employee occupancy',
      pending: 'Pending reservations',
      allocated: 'Approved, not onboarded',
      available: 'Available capacity',
      id: 'Internal ID',
      version: 'Version',
      updatedAt: 'Updated at',
      reason: 'Reason',
      replacementPending: 'Pending future replacements',
      replacementAllocated: 'Approved future replacements',
      replacementBlocked: 'Blocked replacement seats',
    },
    journalActions: {
      create: 'Create account',
      reconcile: 'Verify and initialize',
      adjustLimit: 'Adjust limit',
      hold: 'Reserve capacity',
      reviseHold: 'Revise reservation',
      allocate: 'Allocate approved capacity',
      close: 'Close source',
      consume: 'Consume for onboarding',
      releaseEmployee: 'Release employee occupancy',
      invalidateReplacement: 'Invalidate replacement',
      rebindOut: 'Rebind out',
      rebindIn: 'Rebind in',
      transferOut: 'Transfer out',
      transferIn: 'Transfer in',
      claimReplacement: 'Claim replacement',
      cancelReplacement: 'Cancel replacement',
      fulfillReplacement: 'Fulfill replacement',
      other: 'Headcount change',
    },
    journalColumns: {
      time: 'Time',
      actor: 'Actor',
      action: 'Action',
      source: 'Business source',
    },
    employeeStatus: {
      probation: 'Probation',
      regular: 'Regular',
      leaving: 'Departing',
    },
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
