export default {
  onboarding: {
    notifications: {
      overdueTitle: 'Onboarding task overdue',
      overdueBody:
        'An onboarding task is overdue. Review your current assigned work.',
    },
    authz: {
      resource: 'Onboarding',
      readable: 'Onboarding participants',
      view: 'View onboarding',
      create: 'Create onboarding',
      cancel: 'Cancel onboarding',
      claim: 'Claim task',
      reassignMentor: 'Reassign department head',
      transfer: 'Transfer',
      release: 'Release task',
      complete: 'Complete task',
      forceComplete: 'Force completion',
      viewSalary: 'View onboarding salary',
      viewBank: 'View onboarding banking details',
    },
    errors: {
      employeeSourceConflict:
        'The onboarding source has already been bound to different employee details.',
      employeeAccountEnabled:
        'The onboarding account must remain disabled while its employee archive is created.',
      forbidden:
        'You do not have permission to perform this onboarding operation.',
      sourceInvalid:
        'The recruitment allocation or onboarding business facts are no longer valid.',
      idempotencyConflict:
        'This command identifier has already been used with different details.',
    },
  },
};
