export default {
  wecomAttendance: {
    title: 'WeCom attendance source',
    description:
      'Import mapped employees’ check-ins and review the latest 30 synchronization runs.',
    sync: 'Synchronize',
    refresh: 'Refresh',
    runs: 'Synchronization runs',
    retry: 'Retry',
    counts: 'Records committed: {{records}} · Batches: {{batches}}',
    runFailed:
      'Some records could not be imported. Check employee mappings, shift assignments and source access before retrying. Completed batches are retained.',
    denied: 'You do not have access to attendance synchronization.',
    disabled:
      'The source is disabled. Ask an administrator to configure the dedicated attendance application.',
    unconfigured:
      'The source needs credentials and explicit employee mappings before synchronization.',
    ready_one: 'Ready to synchronize {{count}} mapped employee.',
    ready_other: 'Ready to synchronize {{count}} mapped employees.',
    startedAt: 'Started {{time}}',
    empty: 'No synchronization runs yet.',
    rangeHint:
      'Select up to seven completed company-local calendar days. Repeated source records are not duplicated.',
    start: 'Start date',
    end: 'End date',
    reason: 'Reason',
    cancel: 'Cancel',
    syncing: 'Synchronizing…',
    states: {
      running: 'In progress',
      completed: 'Completed',
      failed: 'Needs attention',
    },
  },
};
