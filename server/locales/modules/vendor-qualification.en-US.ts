export default {
  vendorQualifications: {
    authz: {
      resource: 'Supplier qualification',
      view: 'View supplier qualifications',
      submit: 'Create and edit supplier qualification requests',
      paymentAccount: 'Read protected supplier bank accounts',
      updatePaymentAccount: 'Update own draft supplier bank account',
      manage: 'Configure supplier qualification committee',
    },
    schedule: {
      expiryReminder:
        'Supplier {{supplierName}} qualification expires on {{expiry}}. Please arrange renewal.',
      title: 'Supplier qualification expiry reminders',
      description:
        'Remind purchasing 30 company calendar days before qualification expiry.',
    },
  },
};
