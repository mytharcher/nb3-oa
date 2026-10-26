export default {
  headcounts: {
    authz: {
      title: '정원 용량',
      view: '정원 보기',
      manage: '연간 정원 관리',
      viewJournal: '원본 분개장 보기',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        '전체 직원 명단을 읽을 수 없습니다. 관리자에게 직원 읽기 권한 확인을 요청하세요.',
      HEADCOUNT_ACCESS_DENIED: '이 정원 작업을 수행할 권한이 없습니다.',
      HEADCOUNT_FIELD_ACCESS_DENIED: '정원 요약 필드가 권한 범위 밖입니다.',
      HEADCOUNT_NOT_FOUND: '정원 계정을 사용할 수 없습니다.',
      HEADCOUNT_ALREADY_EXISTS: '이 부서, 직위 및 연도의 계정이 이미 있습니다.',
      HEADCOUNT_NOT_INITIALIZED: '정원 예약 전에 전체 직원 명단을 대사하세요.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        '실제 수습, 정규 및 퇴직 예정 직원 전체 명단을 선택하세요.',
      HEADCOUNT_ROSTER_DRIFT:
        '실제 직원 명단이 변경되었습니다. 계속하기 전에 원본 사실을 대사하세요.',
      HEADCOUNT_VERSION_CONFLICT:
        '계정이 변경되었습니다. 저장 전에 새로고침하세요.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT:
        '이 요청 식별자가 이미 다른 작업에 속합니다.',
      HEADCOUNT_INSUFFICIENT:
        '연간 한도가 실제 점유 및 예약 정원을 충당하지 못합니다.',
      HEADCOUNT_INVALID_NUMBER: '범위 내의 정수 인원수를 입력하세요.',
      HEADCOUNT_INVALID_ACCOUNT: '실제 부서, 직위 및 연도를 선택하세요.',
      HEADCOUNT_INVALID_IDENTITY: '활성 조직 부서와 직위를 선택하세요.',
      HEADCOUNT_INVALID_COMMAND: '작업자, 요청 식별자 및 사유가 필요합니다.',
      HEADCOUNT_INVALID_SOURCE: '실제 원본 유형과 식별자가 필요합니다.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        '각 대체 자리에는 서로 다른 퇴직 직원이 필요합니다.',
      HEADCOUNT_INVALID_REPLACEMENT:
        '대체 원본은 실제 퇴직 예정 또는 퇴직 점유와 일치해야 합니다.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        '대체 점유가 없거나 이미 맡겨졌습니다.',
      HEADCOUNT_REPLACEMENT_BLOCKED: '복원된 원본 직원이 이 대체를 차단합니다.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND: '직원 인사 기록을 사용할 수 없습니다.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        '실제 직원이 배정된 부서 및 직위와 일치하지 않습니다.',
      HEADCOUNT_ALREADY_OCCUPIED:
        '직원이 이미 이 연간 계정을 점유하고 있습니다.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        '사용 전에 현재 회사 연도로 명시적으로 재연결하세요.',
      HEADCOUNT_SOURCE_NOT_FOUND: '정원 원본을 사용할 수 없습니다.',
      HEADCOUNT_SOURCE_EXISTS: '원본에 이미 예약이 있습니다.',
      HEADCOUNT_SOURCE_STATE: '원본 상태에서 이 작업을 허용하지 않습니다.',
      HEADCOUNT_SOURCE_CLOSED: '정원 원본이 이미 종료되었습니다.',
      HEADCOUNT_SEAT_STATE: '예약 자리가 대기 상태가 아닙니다.',
      HEADCOUNT_STATE_CONFLICT: '예약 자리가 변경되었습니다.',
      HEADCOUNT_NO_ALLOCATION: '승인된 가용 자리가 없습니다.',
      HEADCOUNT_NOT_LEFT: '점유 정원을 해제하려면 실제 퇴직이 필요합니다.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        '실제 해제되지 않은 직원 점유가 필요합니다.',
      HEADCOUNT_NOT_RESTORED: '미래 대체를 차단하려면 실제 복원이 필요합니다.',
      HEADCOUNT_INVALID_REBIND:
        '연간 재연결은 부서 및 직위를 유지하며 미래로 이동해야 합니다.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        '대체 크레딧에는 명시적인 대상 연도 원본이 필요합니다.',
      HEADCOUNT_INVALID_TRANSFER: '서로 다른 승인된 대상 예약이 필요합니다.',
      HEADCOUNT_INVALID_PAGE: '1~100의 페이지 크기를 선택하세요.',
      HEADCOUNT_GUARD_UNAVAILABLE: '정원 트랜잭션 보호를 사용할 수 없습니다.',
    },
  },
};
