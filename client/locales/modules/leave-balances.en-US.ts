export default {
  leaveBalances: {
    navigationDiscardDescription:
      'Discard these changes and return to the balance list. The original navigation will not continue.',
    navigationDiscard: 'Discard and return to balances',
    clearFilters: 'Clear filters',
    clearSearch: 'Clear search',
    title: 'Leave balances',
    adminTitle: 'Leave balance administration',
    description: 'View available leave, held days and balance history.',
    adminDescription:
      'Review employee leave balances and record reasoned adjustments.',
    employee: 'Employee',
    employeePlaceholder: 'Search employees by name or code',
    type: 'Leave type',
    selectType: 'Select a leave type',
    availableUnits: 'Available days',
    heldUnits: 'Held days',
    availableDelta: 'Available change (days)',
    heldDelta: 'Held change (days)',
    at: 'Time',
    kind: 'Type',
    reference: 'Source',
    actor: 'Actor',
    reason: 'Reason',
    days: 'Adjustment days',
    actions: 'Actions for "{{name}}"',
    adjust: 'Adjust',
    adjustBalance: 'Adjust balance',
    refresh: 'Refresh',
    retry: 'Retry',
    loading: 'Loading',
    noResults: 'No matching employees. Change your search.',
    searchCap: 'Only the first 20 employees are shown. Narrow your search.',
    noTypes:
      'No balance-backed leave types are available. Ask an administrator to configure them.',
    unopened:
      '"{{type}}" has no account yet: {{available}} available days and {{held}} held days. Add a balance to open it.',
    ledgerTitle: '{{type}} · Balance history',
    adjustTitle: 'Adjust leave balance',
    adjustDescription: 'Adjust the {{type}} balance for "{{name}}".',
    currentBalance:
      'Currently {{available}} available days and {{held}} held days.',
    afterBalance:
      'Available after adjustment: {{amount}} days, subject to server validation.',
    noExpiry:
      'Added balances have no expiry. Reductions preserve existing expiry rules.',
    daysInvalid: 'Enter a nonzero number of days in half-day increments.',
    reasonRequired: 'Enter a reason for the adjustment.',
    reasonLong: 'Keep the reason within 2,000 characters.',
    adjusted: 'Adjusted the balance for "{{name}}".',
    cancel: 'Cancel',
    uncertain:
      'The result is uncertain. Retry the same adjustment; its values are locked to prevent duplicate records.',
    retryAdjustment: 'Retry adjustment',
    discardTitle: 'Discard balance adjustment',
    discardDescription: 'Your unsaved adjustment will be lost.',
    keepEditing: 'Keep editing',
    discard: 'Discard',
    kinds: {
      grant: 'Grant',
      hold: 'Hold',
      deduct: 'Deduct',
      release: 'Release',
      expire: 'Expire',
      refund: 'Refund',
    },
    error: {
      insufficient:
        'The available balance is insufficient. Reduce the deduction.',
      forbidden:
        'You do not have permission to view or adjust this data. Ask an administrator; employee searches also require archive access.',
      notFound:
        'The employee archive is missing or unbound. Ask HR or select another employee.',
      invalid:
        'The adjustment is invalid. Check the days, leave type and reason.',
      failed: 'The request could not be completed. Try again.',
    },
    empty: {
      readonlyAccountsTitle: 'No leave balances yet',
      readonlyAccountsDescription:
        'Ask an authorized HR administrator to grant leave balances.',
      employeeTitle: 'Select an employee',
      employeeDescription: 'Search by name or code to view leave balances.',
      accountsTitle: 'No leave balances yet',
      accountsDescription:
        'Select a leave type and add a balance through an adjustment.',
      mineTitle: 'No leave balances yet',
      mineDescription:
        'HR grants your leave balances. Contact HR if you need to check them.',
      ledgerTitle: 'No balance history yet',
      ledgerDescription: 'Grants, holds and deductions will appear here.',
    },
    authz: {
      section: 'Leave management',
      title: 'Leave balances',
      read: 'Read employee leave balances',
      update: 'Adjust employee leave balances',
      permissionSet: 'HR leave balance administration',
    },
  },
};
