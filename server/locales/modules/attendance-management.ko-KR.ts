export default {
  attendanceManagement: {
    errors: {
      ATTENDANCE_INVALID_INPUT: '원시 근태 증빙이 유효하지 않습니다.',
      ATTENDANCE_INVALID_TIME: '기록은 회사 근태 날짜에 속해야 합니다.',
      ATTENDANCE_INVALID_BATCH: '증빙 크기 한도 내에서 1~1000행을 제공하세요.',
      ATTENDANCE_SOURCE_CONFLICT:
        '원본 키가 다른 변경 불가능한 증빙을 식별합니다.',
      ATTENDANCE_IDENTITY_UNAVAILABLE:
        '각 행에 직원 인사 기록이 있는 실제 사용자가 필요합니다.',

      NOT_FOUND: '더 이상 존재하지 않는 근무조입니다.',
      ACCESS_DENIED: '이 근태 설정에 접근할 수 없습니다.',
      ATTENDANCE_ACCESS_DENIED:
        '현재 레코드 또는 필드 권한으로 변경할 수 없습니다.',
      ATTENDANCE_VERSION_CONFLICT:
        '설정이 변경되었습니다. 저장 전에 다시 불러오세요.',
      ATTENDANCE_SHIFT_INVALID: '올바른 명시적 근무조 정의를 입력하세요.',
      ATTENDANCE_SHIFT_NOT_FOUND: '근무조가 없거나 비활성화되었습니다.',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE: '근무조 코드는 변경할 수 없습니다.',
      ATTENDANCE_SHIFT_CODE_CONFLICT: '이미 존재하는 근무조 코드입니다.',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED:
        '현재 회사 시간대의 개정본을 사용하세요.',
      ATTENDANCE_SCHEDULE_INVALID:
        '실제 날짜와 명시적인 근무조 또는 휴무일을 선택하세요.',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE: '사용할 수 없는 부서입니다.',
      ATTENDANCE_SCHEDULE_NOT_READABLE: '현재 일정 개정본을 읽을 수 없습니다.',
      ATTENDANCE_LIST_INVALID: '페이지 매개변수가 유효하지 않습니다.',
      ATTENDANCE_LOCAL_TIME_INVALID:
        '일광 절약 시간으로 현지 시간이 누락되거나 반복됩니다. 명확한 경계를 선택하세요.',
    },
    authz: {
      importResource: '원시 근태 가져오기',
      ingest: '변경 불가능한 증빙 가져오기',
      attendanceRecords: '원시 근태 레코드',

      resource: '근태 설정',
      view: '근태 설정 보기',
      manage: '근태 설정 관리',
      attendanceShifts: '근무조',
      attendanceShiftRevisions: '근무조 개정본',
      attendanceSchedules: '부서 일정',
      attendanceScheduleRevisions: '일정 개정본',
    },
  },
};
