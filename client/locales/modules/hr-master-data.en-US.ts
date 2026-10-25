export default {
  hrMasterData: {
    mappingSearch:
      'Find a mapped record by exact external ID (latest 100 shown without a filter)',
    title: 'HR synchronization',
    description:
      'Receive organization and employee master data from an approved integration gateway. Existing account bindings are required; synchronization does not enable sign-in.',
    read: 'View synchronization',
    sync: 'Synchronize and replay',
    manage: 'Manage sources and ownership',
    addSource: 'Add source',
    editSource: 'Edit source',
    sourceCode: 'Source code (lowercase letters, numbers and hyphens)',
    sourceName: 'Source name',
    principal: 'Authorized integration account',
    enabled: 'Enabled',
    disabled: 'Disabled',
    noSources: 'No HR source is configured for your account.',
    recent: 'Recent synchronization',
    latest: 'Showing the latest 50 batches for this source.',
    items_one: '{{count}} record',
    items_other: '{{count}} records',
    actions: 'Actions',
    replay: 'Retry original batch',
    refresh: 'Refresh',
    noRuns: 'No batches received yet.',
    mappings: 'Mapped records',
    revision: 'Revision {{revision}}',
    reclaim: 'Restore external ownership',
    reclaimHelp:
      'Local edits are protected. Restoring ownership allows the external source to replace these fields on the next valid update. Review the local record and explain your decision first.',
    confirmReclaim: 'Confirm external ownership',
    reason: 'Reason',
    cancel: 'Cancel',
    save: 'Save',
    failed:
      'The operation failed. Check your permissions and source settings, then retry.',
    localConflict:
      'This record was changed locally. HR must review and explicitly restore external ownership before retrying.',
    businessConflict:
      'A record could not be applied. Correct the source data or resolve the business restriction, then retry the original batch.',
    states: { pending: 'Pending', completed: 'Completed', failed: 'Failed' },
    entities: {
      department: 'Department',
      grade: 'Grade',
      employee: 'Employee',
    },
  },
};
