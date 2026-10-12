export default {
  attendanceManagement: {
    errors: {
      ATTENDANCE_INVALID_INPUT: 'Invalid raw attendance evidence.',
      ATTENDANCE_INVALID_TIME:
        'The punch must belong to the company attendance date.',
      ATTENDANCE_INVALID_BATCH:
        'Provide 1–1000 rows within the evidence size limit.',
      ATTENDANCE_SOURCE_CONFLICT:
        'The source key identifies different immutable evidence.',
      ATTENDANCE_IDENTITY_UNAVAILABLE:
        'Each row requires a real person with an employee archive.',

      NOT_FOUND: 'This shift no longer exists.',
      ACCESS_DENIED: 'You do not have access to this attendance configuration.',
      ATTENDANCE_ACCESS_DENIED:
        'The current record or field permission does not allow this change.',
      ATTENDANCE_VERSION_CONFLICT:
        'The configuration changed. Reload before saving.',
      ATTENDANCE_SHIFT_INVALID: 'Enter a valid explicit shift definition.',
      ATTENDANCE_SHIFT_NOT_FOUND: 'The shift is missing or disabled.',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE: 'A shift code cannot be changed.',
      ATTENDANCE_SHIFT_CODE_CONFLICT: 'This shift code already exists.',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED:
        'Use a revision in the current company time zone.',
      ATTENDANCE_SCHEDULE_INVALID:
        'Choose a real date and an explicit shift or rest day.',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE: 'This department is unavailable.',
      ATTENDANCE_SCHEDULE_NOT_READABLE:
        'The current schedule revision is not readable.',
      ATTENDANCE_LIST_INVALID: 'The page parameters are invalid.',
      ATTENDANCE_LOCAL_TIME_INVALID:
        'The local time is skipped or repeated by daylight saving. Choose unambiguous boundaries.',
    },
    authz: {
      importResource: 'Raw attendance import',
      ingest: 'Import immutable evidence',
      attendanceRecords: 'Raw attendance records',

      resource: 'Attendance configuration',
      view: 'View attendance configuration',
      manage: 'Manage attendance configuration',
      attendanceShifts: 'Attendance shifts',
      attendanceShiftRevisions: 'Shift revisions',
      attendanceSchedules: 'Department schedules',
      attendanceScheduleRevisions: 'Schedule revisions',
    },
  },
};
