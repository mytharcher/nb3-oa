export default {
  leaveBalances: {
    navigationDiscardDescription:
      '변경 사항을 버리고 잔여일 목록으로 돌아갑니다. 원래 이동은 계속되지 않습니다.',
    navigationDiscard: '버리고 잔여일로 돌아가기',
    clearFilters: '필터 초기화',
    clearSearch: '검색 지우기',
    title: '휴가 잔여일',
    adminTitle: '휴가 잔여일 관리',
    description: '사용 가능 휴가, 보류 일수 및 잔여일 이력을 확인합니다.',
    adminDescription:
      '직원의 휴가 잔여일을 검토하고 사유와 함께 조정을 기록합니다.',
    employee: '직원',
    employeePlaceholder: '이름 또는 사번으로 직원 검색',
    type: '휴가 유형',
    selectType: '휴가 유형 선택',
    availableUnits: '사용 가능 일수',
    heldUnits: '보류 일수',
    availableDelta: '사용 가능 변경(일)',
    heldDelta: '보류 변경(일)',
    at: '시간',
    kind: '유형',
    reference: '출처',
    actor: '작업자',
    reason: '사유',
    days: '조정 일수',
    actions: '"{{name}}" 작업',
    adjust: '조정',
    adjustBalance: '잔여일 조정',
    refresh: '새로고침',
    retry: '다시 시도',
    loading: '로딩 중',
    noResults: '일치하는 직원이 없습니다. 검색어를 변경하세요.',
    searchCap: '직원은 첫 20명만 표시합니다. 검색을 좁히세요.',
    noTypes: '잔여일 기반 휴가 유형이 없습니다. 관리자에게 설정을 요청하세요.',
    unopened:
      '"{{type}}" 계정 없음: 사용 가능 {{available}}일, 보류 {{held}}일. 잔여일을 추가하여 개설하세요.',
    ledgerTitle: '{{type}} · 잔여일 이력',
    adjustTitle: '휴가 잔여일 조정',
    adjustDescription: '"{{name}}"의 {{type}} 잔여일을 조정합니다.',
    currentBalance: '현재 사용 가능 {{available}}일, 보류 {{held}}일.',
    afterBalance: '조정 후 사용 가능: {{amount}}일. 서버 검증이 적용됩니다.',
    noExpiry:
      '추가된 잔여일은 만료되지 않습니다. 차감은 기존 만료 규칙을 유지합니다.',
    daysInvalid: '반일 단위로 0이 아닌 일수를 입력하세요.',
    reasonRequired: '조정 사유를 입력하세요.',
    reasonLong: '사유는 2,000자 이내로 입력하세요.',
    adjusted: '"{{name}}"의 잔여일을 조정했습니다.',
    cancel: '취소',
    uncertain:
      '결과가 불확실합니다. 같은 조정을 재시도하세요. 중복 방지를 위해 값이 잠깁니다.',
    retryAdjustment: '조정 재시도',
    discardTitle: '잔여일 조정 버리기',
    discardDescription: '저장하지 않은 조정이 사라집니다.',
    keepEditing: '계속 편집',
    discard: '버리기',
    kinds: {
      grant: '부여',
      hold: '보류',
      deduct: '차감',
      release: '해제',
      expire: '만료',
      refund: '환급',
    },
    error: {
      insufficient: '가용 잔여일이 부족합니다. 차감을 줄이세요.',
      forbidden:
        '데이터 보기 또는 조정 권한이 없습니다. 관리자에게 문의하세요. 직원 검색에는 인사 기록 접근도 필요합니다.',
      notFound:
        '직원 인사 기록이 없거나 연결되지 않았습니다. 인사팀에 문의하거나 다른 직원을 선택하세요.',
      invalid:
        '유효하지 않은 조정입니다. 일수, 휴가 유형 및 사유를 확인하세요.',
      failed: '요청을 완료하지 못했습니다. 다시 시도하세요.',
    },
    empty: {
      readonlyAccountsTitle: '휴가 잔여일 없음',
      readonlyAccountsDescription:
        '권한이 있는 인사 관리자에게 휴가 잔여일 부여를 요청하세요.',
      employeeTitle: '직원 선택',
      employeeDescription:
        '이름 또는 사번을 검색하여 휴가 잔여일을 확인하세요.',
      accountsTitle: '휴가 잔여일 없음',
      accountsDescription:
        '휴가 유형을 선택하고 조정을 통해 잔여일을 추가하세요.',
      mineTitle: '휴가 잔여일 없음',
      mineDescription:
        '인사팀이 휴가 잔여일을 부여합니다. 확인이 필요하면 인사팀에 문의하세요.',
      ledgerTitle: '잔여일 이력 없음',
      ledgerDescription: '부여, 보류 및 차감이 여기에 표시됩니다.',
    },
    authz: {
      section: '휴가 관리',
      title: '휴가 잔여일',
      read: '직원 휴가 잔여일 읽기',
      update: '직원 휴가 잔여일 조정',
      permissionSet: '인사 휴가 잔여일 관리',
    },
  },
};
