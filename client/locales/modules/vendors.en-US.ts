export default {
  vendors: {
    title: 'Vendors',
    description:
      'Procurement maintains manual vendors. Approved orders retain their recorded vendor facts.',
    new: 'Add vendor',
    edit: 'Edit vendor',
    view: 'Vendor details',
    refresh: 'Refresh',
    search: 'Search name, code or category',
    clear: 'Clear filters',
    rowActions: 'Actions for {{name}}',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading vendors',
    retry: 'Retry',
    active: 'Active',
    status: 'Status',
    statuses: {
      manual: 'Manual vendor',
      qualified: 'Qualified',
      disabled: 'Disabled',
    },
    updatedAt: 'Updated',
    reason: 'Reason for this change',
    formDescription:
      'Vendor changes and bank details are audited. Disabling prevents new purchases and payments.',
    disableHint: 'New purchases and payment snapshots will be blocked.',
    required: 'This field is required.',
    invalidCode: 'Use letters, digits, dots, hyphens or underscores.',
    invalidEmail: 'Enter a valid email address.',
    noChanges: 'Change at least one field before saving.',
    unknownCreate:
      'The creation result is unknown. Check the vendor list and its code before creating another vendor.',
    unknownEdit:
      'The result is unknown. Load the latest vendor before retrying; your uncommitted changes will be kept.',
    loadLatest: 'Load latest vendor',
    fields: {
      code: 'Code',
      name: 'Name',
      category: 'Category',
      contactName: 'Contact',
      contactPhone: 'Phone',
      contactEmail: 'Email',
      bankName: 'Bank',
      bankAccount: 'Bank account',
      bankAccountName: 'Account name',
    },
    authz: {
      resource: 'Vendors',
      view: 'Read vendor details',
      manage: 'Maintain vendors',
      bankRead: 'Read bank information',
      createdScope: 'Vendors created by the current user',
    },
    empty: {
      accountsTitle: 'No vendors',
      accountsDescription: 'Add a manual vendor for procurement.',
      readonlyTitle: 'No readable vendors',
      readonlyDescription:
        'There are no vendors in your granted scope. Ask purchasing to add a vendor, or ask an administrator for Maintain vendors permission.',
      filteredTitle: 'No matching vendors',
      filteredDescription: 'Change or clear the search.',
    },
    error: {
      forbidden: 'You do not have permission to access these vendors.',
      missing: 'This vendor is unavailable. Refresh its parent list.',
      invalid: 'Check the vendor fields.',
      failed: 'Vendors could not be loaded or saved. Try again.',
      VENDOR_INVALID_INPUT: 'Check the vendor contact and bank fields.',
      VENDOR_INVALID_COMMAND: 'An actor and change reason are required.',
      VENDOR_CODE_EXISTS: 'This code already belongs to a vendor.',
      VENDOR_VERSION_CONFLICT:
        'This vendor changed. Load the latest version before retrying.',
      VENDOR_NOT_FOUND: 'This vendor is unavailable.',
      VENDOR_INACTIVE: 'Choose an active vendor.',
      VENDOR_FIELDS_RESTRICTED: 'The vendor fields are outside your grant.',
      VENDOR_ACCESS_DENIED:
        'You do not have permission for this vendor action.',
      VENDOR_PAYMENT_ACCOUNT_REQUIRED:
        'Complete the vendor bank details before payment.',
    },
  },
};
