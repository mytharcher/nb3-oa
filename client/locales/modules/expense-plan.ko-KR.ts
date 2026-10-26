export default {
  expensePlans: {
    relatedUnavailable: '관련 레코드 확인 불가',
    businessErrors: {
      EXPENSE_PLAN_DEPARTMENT_REQUIRED:
        '신청자에게 활성 기본 부서가 필요합니다. 인사팀에 직원 레코드 업데이트를 요청하세요.',
      EXPENSE_PLAN_INVALID_DATE: '올바른 예상 지출일을 선택하세요.',
      EXPENSE_PLAN_INVALID_DICTIONARY:
        '활성 업무 유형과 예산 항목을 선택하세요.',
      EXPENSE_PLAN_INVALID_INPUT:
        '양수 금액, 참여 인원 및 지출 사유를 입력하세요.',
    },

    new: '새 경비 사전 승인',
    edit: '경비 사전 승인 편집',
    formDescription: '지출 전 접대, 팀 활동 또는 행사를 계획합니다.',
    matterType: '업무 유형',
    subject: '예산 항목',
    amount: '예상 경비(위안)',
    yuan: '위안',
    participants: '참여 인원',
    eventDate: '행사일',
    budgetYear: '제출된 예산 연도',
    department: '제출된 기본 부서',
    primaryDepartment:
      '현재 기본 부서: {{department}}. 제출 시 다시 확인합니다.',
    departmentMissing: '설정되지 않음',
    departmentPending: '제출 시 결정',
    departmentUnavailable: '현재 부서를 사용할 수 없음',
    year: '예산 연도: {{year}} · 회사 달력: {{timeZone}}',
    amountHint:
      '소수 위안으로 입력하세요. 금액은 정확한 정수 센트로 저장됩니다.',
    amountInvalid:
      '안전 한도 내에서 소수 둘째 자리까지의 양수 금액을 입력하세요.',
    participantsInvalid: '1~100000의 정수를 입력하세요.',
    dateInvalid: '올바른 날짜를 선택하세요.',
    disabled: '비활성',
    subjectInactive: '활성 업무 유형과 예산 항목을 선택하세요.',
    optionsEmpty: '저장 전에 활성 업무 유형과 예산 항목을 설정해야 합니다.',
    reserveHint:
      '제출 시 예산을 예약하며 최종 승인 후 경비 정산 한도가 부여됩니다.',
    revisionHold:
      '수정 중 원래 예산 예약을 유지하며 다시 제출할 때만 변경됩니다.',
    retainedHold:
      '원래 예약: {{subject}} · {{amount}}위안. 수정 제안과 별개입니다.',
    actualHold: '승인 당시 예약',
    holdFactHint: '원본 예약 사실이며 이후 정산 후 남은 잔액이 아닙니다.',
    frozenThreshold:
      '제출 기준: 담당 임원 > {{vp}}위안, 총괄 책임자 > {{gm}}위안.',
    applied:
      '승인 한도가 발급되었습니다. 경비 정산 또는 지급을 의미하지 않습니다.',
    reserved: '이 신청의 승인 대기 중 예산이 예약됩니다.',
    awaitingEffect: '이 신청에 승인 한도가 발급되지 않았습니다.',
    uncertainCreate:
      '저장 결과가 불확실합니다. 새 초안 생성 전에 닫고 내 신청을 확인하세요.',
    unknownEdit:
      '저장 결과가 불확실합니다. 최신 레코드를 불러올 때까지 입력이 잠깁니다.',
    authorization: '승인 한도',
    quotaId: '한도 참조',
    grantedAmount: '부여 금액',
    quotaState: '한도 상태',
    deadline: '만료일',
    quotaHint:
      '경비 정산은 이 한도를 정산합니다. 종료 또는 만료는 승인을 되돌리지 않습니다.',
    mergedTitle: '동일인 병합',
    quotaStates: { open: '열기', closed: '종료됨', expired: '만료됨' },
    createdBy: '생성자',
    authz: {
      resource: '경비 사전 승인',
      submit: '경비 사전 승인 제출',
      delegate: '직원을 대신하여 경비 사전 승인 제출',
      view: '경비 사전 승인 읽기',
    },
    stages: {
      head: '부서장',
      finance: '재무팀',
      executive: '담당 임원',
      gm: '총괄 책임자',
    },
    states: { approved: '승인 한도 발급됨' },
    merged:
      '담당 임원과 총괄 책임자가 동일인으로 병합되어 본인 자격으로 승인했습니다.',
    errors: {
      invalid: '날짜, 인원, 금액, 업무 유형 및 항목을 검토하세요.',
      department: '신청자에게 활성 기본 부서가 필요합니다.',
      insufficient: '이 예산 계정의 가용 자금이 부족합니다.',
      inactive: '신청자에게 활성 직원 인사 기록이 있어야 합니다.',
      configuration:
        '결재를 제출할 수 없습니다. 관리자에게 결재 기한 확인을 요청하세요.',
    },
  },
};
