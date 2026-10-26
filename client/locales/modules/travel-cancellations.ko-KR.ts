export default {
  // Existing permission titles use the collection name.
  travelCancellations: {
    authz: {
      resource: '출장 취소 신청',
      submit: '출장 취소 신청 제출',
      delegate: '직원을 대신하여 제출',
      view: '출장 취소 신청 보기',
    },
  },
  travelCancellation: {
    fieldInvalid: '{{field}}을 확인하세요.',

    sourceUnavailable: '원래 출장 사용 불가',
    exceptionReason: '예외 사유',
    exception: '예약 취소 예외',
    businessErrors: {
      TRAVEL_CANCELLATION_REASON_REQUIRED: '출장 취소 사유를 입력하세요.',
      TRAVEL_CANCELLATION_ALREADY_PENDING:
        '이미 취소 대기 중인 출장입니다. 기존 신청을 여세요.',
      TRAVEL_CANCELLATION_BASELINE_CHANGED:
        '승인 출장이 변경되었습니다. 새로고침하고 취소를 수정한 후 재제출하세요.',
      TRAVEL_CANCELLATION_INVALID_SOURCE:
        '더 이상 취소할 수 없는 원래 출장입니다. 유효한 승인 출장을 선택하세요.',
    },

    retryUnbooking: '행정 취소 재시도',
    bookingInformation: '취소 주문 및 환불 계획',
    unbookingHint:
      '부서장 승인 후 원래 출장을 철회합니다. 행정팀은 취소 및 환불 계획을 기록해야 하며 환불 지급을 확인하지는 않습니다.',
    complete: '행정 취소 완료',
    unable: '예약 취소 불가',
    forceComplete: '취소 강제 종료',
    source: '원래 출장',
    chooseSource: '승인 출장 선택',
    effectHint:
      '원래 부서장이 승인해야 근태 및 경비 승인이 철회됩니다. 연결 대출은 지급 상태에 따라 처리합니다.',
    cc: '참조 수신자 추가',
    authz: {
      resource: '출장 취소 신청',
      submit: '출장 취소 신청 제출',
      delegate: '직원을 대신하여 제출',
      view: '출장 취소 신청 보기',
    },
    new: '새 출장 취소 신청',
    edit: '출장 취소 신청 편집',
    formDescription: '승인 출장의 취소를 요청합니다.',
    name: '출장 취소 이름',
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
      '근무 시간을 사용하면 승인 시 출장 취소 근태를 기록합니다. 유료 출장 취소는 승인된 정산 한도를 생성하며 아직 지급되지는 않습니다.',
    approvedFacts: '출장 취소가 승인되었습니다. 인사팀이 참조를 받습니다.',
    attendanceRecorded: '출장 취소 근태 활동을 기록했습니다.',
    authorizationIssued:
      '승인된 정산 한도: {{amount}}위안. 청구는 한도 정책을 따릅니다.',
    zeroNoAuthorization: '무료 출장 취소는 비용 한도를 생성하지 않습니다.',
    uncertainCreate:
      '저장 결과를 알 수 없습니다. 새 신청 전에 내 신청을 확인하세요.',
    inactive: '활성 직원 인사 기록이 필요합니다.',
    configuration:
      '결재를 제출할 수 없습니다. 관리자에게 결재 기한 확인을 요청하세요.',
    invalid: '신청 필드를 확인하고 필요하면 최신 레코드를 다시 불러오세요.',
    stages: {
      unbooking: '행정 예약 취소',
      manager: '직속 관리자',
      head: '부서장',
      finance: '재무팀',
      executive: '담당 임원',
      gm: '총괄 책임자',
    },
  },
};
