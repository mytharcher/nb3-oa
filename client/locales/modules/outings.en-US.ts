export default {
  outings: {
    authz: { resource: 'Outing requests' },
    navigation: 'Outing requests',
    new: 'New outing request',
    edit: 'Edit outing request',
    formDescription: 'Check the period and submit for review, or save a draft.',
    description:
      'Record the period, location and purpose of an outing for your manager to review.',
    startAt: 'Start time',
    endAt: 'End time',
    location: 'Location',
    reason: 'Purpose',
    timeZone: 'Times are recorded in {{zone}}',
    policyHint:
      'After the outing starts, only your supervisor may terminate it with a reason.',
    nonexistentTime:
      'This local time does not exist because the clock changes. Choose another time.',
    daylightSavingPolicy:
      'If a clock change repeats this local time, the earlier occurrence is used.',
    errors: {
      OUTING_EMPLOYEE_INACTIVE:
        'The applicant must be an active employee. Contact HR to check the archive.',
      OUTING_INVALID_PERIOD:
        'The end must follow the start. Check the outing period.',
      OUTING_REQUIRED_FIELDS: 'Provide a location and purpose.',
      OUTING_SLA_CONFIGURATION_UNSUPPORTED:
        'The configured approval clocks are unsupported. Contact an administrator.',
      ATTENDANCE_ACTIVITY_CHANGED:
        'The attendance facts changed. Refresh to review them.',
    },
  },
};
