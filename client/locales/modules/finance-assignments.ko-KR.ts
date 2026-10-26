export default {
  financeAssignments: {
    create: '생성',

    saved: '"{{name}}"의 회계 담당자 할당을 저장했습니다',
    saveFailed: '할당을 저장하지 못했습니다. 입력을 확인하고 재시도하세요.',
    disableTitle: '"{{name}}"의 할당을 비활성화하시겠습니까?',

    loadLatest: '최신 할당 불러오기',
    latestSummary: '최신: {{name}} / {{status}}. 양식 값은 유지됩니다.',
    adoptVersion: '내 변경 사항과 함께 이 버전 사용',
    uncertain: '생성 결과가 불확실합니다. 재시도 전에 부서를 확인하세요.',
    checkExisting: '부서 할당 확인',
    viewExisting: '기존 할당 열기',
    required: '필수 입력 항목입니다.',
    title: '부서 회계 담당자',
    description:
      '부서별 재무 검토자를 지정합니다. 할당이 없거나 비활성이면 가장 가까운 활성 상위 부서, 이후 재무 관리자를 사용합니다.',
    new: '회계 담당자 할당',
    edit: '할당 편집',
    view: '할당 세부 정보',
    department: '부서',
    accountant: '회계 담당자',
    status: '상태',
    active: '활성',
    inactive: '비활성',
    updatedAt: '업데이트됨',
    refresh: '새로고침',
    clear: '필터 초기화',
    rowActions: '{{name}} 작업',
    save: '저장',
    cancel: '취소',
    loading: '할당 불러오는 중',
    retry: '다시 시도',
    accountantPlaceholder: '적격 회계 담당자 검색',
    noAccountants: '활성 재무 업무 역할 구성원 없음',
    reason: '사유',
    formDescription:
      '활성 재무 업무 역할 구성원만 할당할 수 있습니다. 변경은 감사에 기록됩니다.',
    departmentPermission:
      '부서 선택에 부서 읽기 권한이 필요합니다. 관리자에게 요청하세요.',
    conflictAdvice:
      '변경 내용을 참고용으로 유지하세요. 양식을 닫았다 다시 열어 최신 할당을 검토하고 재시도하세요.',
    disable: '할당 비활성화',
    disableDescription:
      '이후 결재는 가장 가까운 활성 상위 부서 할당, 이후 재무 관리자를 사용합니다. 기존 할 일은 기록된 검토자에게 유지됩니다.',
    authz: {
      title: '부서 회계 담당자',
      read: '할당 읽기',
      update: '할당 관리',
      permissionSet: '재무 관리자 회계 담당자 설정',
    },
    empty: {
      accountsTitle: '할당된 회계 담당자 없음',
      accountsDescription:
        '부서에 회계 담당자를 할당하여 재무 검토를 연결하세요.',
      readonlyTitle: '할당 없음',
      readonlyDescription:
        '재무 관리자가 부서 회계 담당자를 설정할 수 있습니다.',
      filteredTitle: '일치하는 할당 없음',
      filteredDescription: '모든 할당을 보려면 부서 필터를 지우세요.',
    },
    error: {
      forbidden: '이 할당에 접근할 권한이 없습니다.',
      missing: '할당이 더 이상 존재하지 않습니다.',
      invalid: '양식 값을 검토하세요.',
      failed: '할당을 불러오지 못했습니다. 다시 시도하세요.',
      FINANCE_ASSIGNMENT_NOT_FOUND: '할당이 더 이상 존재하지 않습니다.',
      FINANCE_ASSIGNMENT_VERSION_CONFLICT:
        '할당이 변경되었습니다. 양식을 다시 열어 최신 버전을 검토하세요.',
      FINANCE_ASSIGNMENT_ALREADY_EXISTS:
        '부서에 이미 할당이 있습니다. 해당 할당을 편집하세요.',
      FINANCE_ASSIGNMENT_INVALID_DEPARTMENT: '활성 부서를 선택하세요.',
      FINANCE_ASSIGNMENT_INVALID_ACCOUNTANT:
        '활성 재무 업무 역할 구성원을 선택하세요.',
      FINANCE_ASSIGNMENT_INVALID_COMMAND: '작업자와 사유가 필요합니다.',
    },
  },
};
