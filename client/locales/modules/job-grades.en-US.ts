export default {
  jobGrades: {
    authz: {
      resource: 'Salary grade tables',
      view: 'View publication history',
      viewSalary: 'Read salary ranges',
      manage: 'Publish salary grade table',
    },

    title: 'Salary grade tables',
    description:
      'Inspect immutable publication history and publish complete salary intervals.',
    publish: 'Publish new version',
    publishing: 'Publishing…',
    search: 'Search exact version number',
    empty: 'No salary table published',
    emptyDescription: 'Publish the first complete salary grade table.',
    emptyReadonly: 'Ask HR to publish the first salary grade table.',
    noMatches: 'No matching version',
    noMatchesDescription:
      'Clear the version search to see publication history.',
    replacement:
      'Publishing replaces the complete current table. Earlier submitted documents retain their version.',
    privateDenied:
      'You cannot read salary intervals. Ask an administrator for access.',
    publishDenied:
      'You cannot publish salary grade tables. Ask an administrator for access.',
    unknown:
      'Publication result is unconfirmed. Retry the original publication.',
    conflict: 'Current table changed. Load the latest table before publishing.',
    inactive: 'This grade is unavailable. Remove it or choose an active grade.',
    success: 'Published salary table “Version {{version}}”',
    version: 'Version {{version}}',
    versionColumn: 'Version',
    publisher: 'Published by',
    publishedAt: 'Published at',
    refresh: 'Refresh',
    retry: 'Retry',
    retryPublication: 'Retry original publication',
    clear: 'Clear filters',
    loading: 'Loading salary grade tables',
    view: 'View version',
    rowActions: 'Actions for version {{version}}',
    grade: 'Grade',
    gradeCode: 'Grade code',
    gradeTitle: 'Grade name',
    rank: 'Frozen rank',
    minimum: 'Minimum',
    maximum: 'Maximum',
    reason: 'Publication reason',
    addGrade: 'Add grade',
    remove: 'Remove grade {{index}}',
    selectGrade: 'Select an active grade',
    removeDescription:
      'Removing a row changes only the proposed new table. Historical versions remain unchanged.',
    cancel: 'Cancel',
    loadLatest: 'Load latest table',
    currentVersion: 'Source version: {{version}}',
    notFound:
      'This salary grade table is unavailable. Return to publication history.',
    failed: 'Could not load salary grade tables. Please retry.',
    writeFailed: 'Publication was refused. Check the fields and try again.',
    storageFailure:
      'The original publication cannot be saved safely in this tab. Publication is blocked; check browser storage and reload.',
    unsavedTitle: 'Discard salary table changes?',
    unsavedDescription: 'Your unpublished changes will be lost.',
    discard: 'Discard changes',
    stay: 'Keep editing',
    replaceTitle: 'Replace the proposed table?',
    replaceDescription:
      'Loading the latest table discards this proposal and starts from the complete current table.',
    confirmReplace: 'Replace and load latest',
    noGrades:
      'No active grades are available. Ask an organisation administrator to configure grades.',
    reasonHint:
      'Explain the complete table publication (up to 2,000 characters).',
    immutable:
      'This published version is immutable. Its grade identities and intervals are frozen.',
    validation: {
      required: 'This field is required.',
      amount:
        'Enter a nonnegative amount with at most two decimals within the supported range.',
      range: 'Maximum must be greater than or equal to minimum.',
      duplicate: 'Each grade may appear only once.',
      inactive:
        'This grade is unavailable. Remove it or choose an active grade.',
      nonempty: 'Include at least one active grade.',
      reasonLength: 'Use at most 2,000 characters.',
      server: 'Check this field and try again.',
    },
  },
};
