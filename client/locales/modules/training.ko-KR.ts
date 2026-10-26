export default {
  // Existing permission titles use the collection name.
  trainingRequests: {
    authz: {
      resource: '교육 및 학습',
      submit: '교육 신청 제출',
      delegate: '직원을 대신하여 제출',
      view: '교육 신청 보기',
    },
  },
  training: {
    actionForm: {
      title: '"{{name}}" 교육 신청 {{action}}',
      completed: '"{{name}}" 교육 신청의 {{action}}을 완료했습니다',
      saved: '"{{name}}" 교육 신청을 저장했습니다',
    },
    businessErrors: {
      TRAINING_INVALID_INPUT:
        '교육명, 기관 및 사유와 올바른 음수가 아닌 비용을 입력하세요.',
      TRAINING_INVALID_DATE:
        '교육 종료는 시작 이후여야 합니다. 날짜와 시간을 확인하세요.',
      TRAINING_DEPARTMENT_REQUIRED:
        '신청자에게 활성 기본 부서가 필요합니다. 인사팀에 직원 레코드 업데이트를 요청하세요.',
    },

    cc: '참조 수신자 추가',
    authz: {
      resource: '교육 및 학습',
      submit: '교육 신청 제출',
      delegate: '직원을 대신하여 제출',
      view: '교육 신청 보기',
    },
    new: '새 교육 신청',
    edit: '교육 신청 편집',
    formDescription: '교육 또는 외부 학습을 신청합니다.',
    name: '교육명',
    institution: '기관',
    startAt: '시작 시간',
    endAt: '종료 시간',
    usesWorkingTime: '근무 시간 사용',
    amount: '비용(위안)',
    yuan: '위안',
    yes: '예',
    no: '아니요',
    timeZone: '회사 시간대: {{zone}}',
    amountHint:
      '위안 단위로 소수 둘째 자리까지 입력하세요. 비용 0도 가능합니다.',
    amountInvalid: '소수 둘째 자리까지의 음수가 아닌 금액을 입력하세요.',
    dateInvalid: '종료가 시작 이후인 올바른 구간을 선택하세요.',
    approvalHint:
      '근무 시간을 사용하면 승인 시 교육 근태를 기록합니다. 유료 교육은 승인된 정산 한도를 생성하며 아직 지급되지는 않습니다.',
    approvedFacts: '교육이 승인되었습니다. 인사팀에 참조 전달됩니다.',
    attendanceRecorded: '교육 근태 활동이 기록되었습니다.',
    authorizationIssued:
      '승인된 정산 한도: {{amount}}위안. 청구는 한도 정책을 따릅니다.',
    zeroNoAuthorization: '무료 교육은 비용 한도를 생성하지 않습니다.',
    uncertainCreate:
      '저장 결과를 알 수 없습니다. 새 신청 전에 내 신청을 확인하세요.',
    inactive: '활성 직원 인사 기록이 필요합니다.',
    configuration:
      '결재를 제출할 수 없습니다. 관리자에게 결재 기한 확인을 요청하세요.',
    invalid: '신청 필드를 확인하고 필요하면 최신 레코드를 다시 불러오세요.',
    stages: {
      manager: '직속 관리자',
      head: '부서장',
      finance: '재무팀',
      executive: '담당 임원',
      gm: '총괄 책임자',
    },
  },
};
