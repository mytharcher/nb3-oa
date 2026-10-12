export default {
  jobGrades: {
    errors: {
      VERSION_CONFLICT:
        'The current salary table changed. Reload it before publishing.',
      IDEMPOTENCY_CONFLICT:
        'The publication key was already used with different content.',
      TABLE_UNAVAILABLE: 'The salary table is not initialized.',
      GRADE_UNAVAILABLE: 'A required grade is unavailable or inactive.',
      INVALID_PUBLICATION: 'The publication input is invalid.',
      STORED_DATA_INVALID: 'Stored salary table data is invalid.',
      INVALID_RANGE: 'Salary ranges must contain valid integer amounts.',
      DUPLICATE_GRADE: 'Each grade must appear once.',
      OUTSIDE_RANGE: 'The offered salary is outside the published interval.',

      ACCESS_DENIED:
        'This salary-grade operation is outside your granted scope.',
      NOT_FOUND: 'The salary-grade revision is unavailable.',
    },
    authz: {
      resource: 'Salary grade tables',
      view: 'View publication history',
      viewSalary: 'Read salary ranges',
      manage: 'Publish salary grade table',
    },
  },
};
