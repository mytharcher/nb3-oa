export default {
  exported: 'Excel download started.',
  title: 'Leave decision task elapsed time',
  description:
    'Completed leave decision tasks: creation to closure in natural milliseconds, including waiting and historical resubmissions; grouped by the original request start month, not working time, SLA, return rate or whole-process duration.',
  year: 'Start year',
  month: 'Start month (optional)',
  clear: 'Clear filters',
  export: 'Export Excel',
  exporting: 'Exporting…',
  refresh: 'Refresh',
  selectYear: 'Choose the original request start year to load this report.',
  invalid: 'Enter a year from 1900 to 9998 and an optional month from 1 to 12.',
  forbidden:
    'The current leave record or field permissions do not allow this report. Contact an administrator.',
  precondition:
    'The source limit or task timestamp check failed. Narrow the year/month range, or ask an administrator to check the source timestamps.',
  failed: 'The report could not be loaded. Try again.',
  retry: 'Retry',
  exportFailed: 'The Excel export failed. Try again.',
  empty: 'No completed decision tasks',
  noResults: 'No tasks match this month',
  emptyHint:
    'Only completed decision tasks from currently readable leave requests are counted. Choose another start year or month.',
  total: '{{count}} stage groups',
  generatedAt: 'Generated {{value}}',
  previous: 'Previous',
  next: 'Next',
  fields: {
    stage: 'Stage',
    completedTaskCount: 'Completed decision tasks',
    totalElapsedMs: 'Total natural elapsed ms',
    averageElapsedMs: 'Mean natural elapsed ms',
  },
  stages: { manager: 'Manager', head: 'Department head', hr: 'HR' },
};
