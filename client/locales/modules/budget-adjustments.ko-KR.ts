export default {
  budgetAdjustments: {
    businessErrors: {
      BUDGET_ADJUSTMENT_INVALID_ACCOUNT:
        '활성 부서와 유효한 예산 연도를 선택하세요.',
      BUDGET_ADJUSTMENT_INVALID_AMOUNT: '양수 조정 금액과 사유를 입력하세요.',
      BUDGET_ADJUSTMENT_INVALID_SUBJECT: '활성 예산 항목을 선택하세요.',
      BUDGET_ADJUSTMENT_INVALID_TRANSFER:
        '이체 시 출발 및 대상 항목이 달라야 합니다. 증액 시 출발 항목을 지우세요.',
      BUDGET_ADJUSTMENT_INACTIVE_HEAD:
        '부서장을 사용할 수 없습니다. 관리자에게 부서 할당 업데이트를 요청하세요.',
    },

    authz: {
      resource: '예산 조정',
      submit: '예산 조정 제출',
      delegate: '직원을 대신하여 예산 조정 제출',
      view: '예산 조정 읽기',
    },
    new: '새 예산 조정',
    edit: '예산 조정 편집',
    formDescription: '항목 간 이체 또는 추가 예산을 제안합니다.',
    department: '예산 부서',
    yearInvalid: '1900~9999의 정수 연도를 입력하세요.',
    year: '예산 연도',
    type: '조정 유형',
    transfer: '항목 간 이체',
    increase: '추가 예산',
    targetSubject: '대상 항목',
    sourceSubject: '출발 항목',
    amount: '금액(위안)',
    yuan: '위안',
    reason: '사유',
    amountInvalid:
      '안전한 한도 내에서 소수 둘째 자리까지의 양수 금액을 입력하세요.',
    sourceInvalid: '서로 다른 출발 및 대상 항목을 선택하세요.',
    amountHint:
      '소수 위안 단위를 사용하세요. 금액은 정확한 정수 센트로 저장됩니다.',
    reserveHint:
      '제출하면 이체 출발 자금이 예약됩니다. 예산은 최종 승인 후 적용됩니다.',
    revisionHold:
      '반려 중에는 원래 예약을 유지합니다. 제안 변경 시 다시 제출할 때만 기존 예약을 해제하고 교체합니다.',
    retainedHold:
      '현재 원래 예약: {{subject}} · {{amount}}위안. 수정한 제안과 별개입니다.',
    actualHold: '현재 출발 자금 예약',
    frozenThreshold:
      '제출된 증액 총괄 책임자 기준: {{amount}}위안(엄격히 초과하는 경우만).',
    applied: '최종 승인으로 예산 조정이 적용되었습니다.',
    reserved: '출발 자금이 예약되었으며 아직 조정이 적용되지 않았습니다.',
    awaitingEffect:
      '아직 적용되지 않은 제안입니다. 추가 예산은 최종 승인 후 적용됩니다.',
    insufficient:
      '출발 예산의 가용 자금이 부족합니다. 금액과 출발 항목을 검토하세요. 입력은 유지됩니다.',
    subjectInactive: '비활성 항목입니다. 제출 전에 활성 항목을 선택하세요.',
    disabled: '비활성',
    inactive: '신청자는 활성 직원이어야 합니다.',
    configuration:
      '결재를 제출할 수 없습니다. 관리자에게 결재 기한 확인을 요청하세요.',
    invalid: '계정, 조정 유형, 금액 및 사유를 검토하세요.',
    uncertainCreate:
      '저장 결과가 불확실합니다. 새 초안 생성 전에 닫고 내 신청을 확인하세요.',
    stages: {
      head: '부서장',
      finance: '재무 관리자',
      cfo: '재무 책임자',
      gm: '총괄 책임자',
    },
  },
};
