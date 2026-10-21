export default {
  financeAssignments: {
    create: 'Create',

    saved: 'Saved accountant assignment for "{{name}}"',
    saveFailed:
      'The assignment could not be saved. Retry after checking the input.',
    disableTitle: 'Disable assignment for "{{name}}"?',

    loadLatest: 'Load latest assignment',
    latestSummary:
      'Latest: {{name}} / {{status}}. Your form values are unchanged.',
    adoptVersion: 'Use this version with my changes',
    uncertain:
      'The creation result is uncertain. Check this department before retrying.',
    checkExisting: 'Check department assignment',
    viewExisting: 'Open existing assignment',
    required: 'This field is required.',
    title: 'Department accountants',
    description:
      'Assign the finance reviewer for each department. Missing or inactive assignments use the nearest active ancestor, then the finance manager.',
    new: 'Assign accountant',
    edit: 'Edit assignment',
    view: 'Assignment details',
    department: 'Department',
    accountant: 'Accountant',
    status: 'Status',
    active: 'Active',
    inactive: 'Disabled',
    updatedAt: 'Updated',
    refresh: 'Refresh',
    clear: 'Clear filters',
    rowActions: 'Actions for {{name}}',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading assignments',
    retry: 'Retry',
    accountantPlaceholder: 'Search eligible accountants',
    noAccountants: 'No active finance duty-role members',
    reason: 'Reason',
    formDescription:
      'Only active finance duty-role members can be assigned. Changes are audited.',
    departmentPermission:
      'Department read permission is required to choose a department. Ask an administrator to grant it.',
    conflictAdvice:
      'Keep your changes for reference. Close and reopen this form to review the latest assignment before retrying.',
    disable: 'Disable assignment',
    disableDescription:
      'Future approvals will use the nearest active ancestor assignment, then the finance manager. Existing approval tasks remain assigned to their recorded reviewers.',
    authz: {
      title: 'Department accountants',
      read: 'Read assignments',
      update: 'Manage assignments',
      permissionSet: 'Finance manager accountant configuration',
    },
    empty: {
      accountsTitle: 'No accountants assigned',
      accountsDescription:
        'Assign an accountant to a department to route financial reviews.',
      readonlyTitle: 'No assignments',
      readonlyDescription:
        'A finance manager can configure department accountants.',
      filteredTitle: 'No matching assignments',
      filteredDescription:
        'Clear the department filter to see all assignments.',
    },
    error: {
      forbidden: 'You do not have permission to access these assignments.',
      missing: 'This assignment no longer exists.',
      invalid: 'Review the form values.',
      failed: 'Assignments could not be loaded. Try again.',
      FINANCE_ASSIGNMENT_NOT_FOUND: 'This assignment no longer exists.',
      FINANCE_ASSIGNMENT_VERSION_CONFLICT:
        'This assignment changed. Reopen the form to review the latest version.',
      FINANCE_ASSIGNMENT_ALREADY_EXISTS:
        'This department already has an assignment. Edit that assignment.',
      FINANCE_ASSIGNMENT_INVALID_DEPARTMENT: 'Choose an active department.',
      FINANCE_ASSIGNMENT_INVALID_ACCOUNTANT:
        'Choose an active finance duty-role member.',
      FINANCE_ASSIGNMENT_INVALID_COMMAND: 'An actor and a reason are required.',
    },
  },
};
