export default {
  travel: {
    fieldInvalid: '{{field}}을 확인하세요.',

    confirmRetryBooking: '이 승인 출장의 예약을 재시도하시겠습니까?',
    confirmReviseTrip: '출장을 수정하고 결재를 다시 시작하시겠습니까?',
    states: {
      completed: '완료됨',
      cancelled: '취소됨',
      exception: '예약 예외',
    },
    businessErrors: {
      TRAVEL_ITINERARY_REQUIRED:
        '해외 출장에는 일정표 첨부가 필요합니다. 제출 전에 업로드하거나 선택하세요.',
      TRAVEL_OVERLAP: '승인 출장과 겹치는 기간입니다. 출장 날짜를 조정하세요.',
      TRAVEL_COMPANIONS_INVALID: '신청자가 아닌 서로 다른 동행자를 선택하세요.',
      TRAVEL_COMPANION_INACTIVE:
        '선택한 출장자가 비활성 상태입니다. 현재 직원을 다시 선택하세요.',
      TRAVEL_DEPARTMENT_REQUIRED:
        '신청자에게 활성 기본 부서가 필요합니다. 인사팀에 직원 레코드 업데이트를 요청하세요.',
      TRAVEL_INVALID_DATE:
        '출장 종료는 시작 이후여야 합니다. 날짜와 시간을 모두 확인하세요.',
      TRAVEL_INVALID_INPUT:
        '목적지와 사유 및 올바른 음수가 아닌 출장비를 입력하세요.',
    },

    requestLoan: '연결 대출 신청',
    reviseTrip: '출장 수정 및 결재 재시작',
    revisionWarning:
      '수정 시 새 결재 전에 기존 정산 한도와 근태 활동을 종료합니다. 기존 대출 원금과 원래 기한은 유지되며 대출은 별도 처리하세요.',
    cancelTrip: '출장 취소 요청',
    complete: '예약 완료',
    unable: '예약 불가',
    forceComplete: '예약 강제 종료',
    retryBooking: '예약 재시도',
    standard: '고정 출장 기준',
    lodgingPerNight: '1박당 숙박 기준(위안)',
    allowancePerDay: '1일당 수당 기준(위안)',
    companions: '동행자',
    addCompanion: '동행자 추가',
    removeCompanion: '제거',
    companionsInvalid: '동행자는 중복될 수 없음',
    peopleUnavailable: '직원 검색 권한이 없습니다. 관리자에게 문의하세요.',
    destination: '목적지',
    international: '해외 출장',
    needsBooking: '행정 예약',
    needsLoan: '대출 요청됨',
    transportCents: '교통',
    lodgingCents: '숙박',
    allowanceCents: '수당',
    bookingInformation: '예약 세부 정보',
    exceptionReason: '예외 사유',
    cc: '참조 수신자 추가',
    authz: {
      resource: '출장 신청',
      submit: '출장 신청 제출',
      delegate: '직원을 대신하여 제출',
      view: '출장 신청 보기',
    },
    new: '새 출장 신청',
    edit: '출장 신청 편집',
    formDescription: '출장을 신청합니다.',
    name: '출장 이름',
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
      '승인 시 출장 근태를 기록하고 양수 예상액의 정산 한도를 생성합니다. 예약 및 대출 지급은 별도입니다.',
    approvedFacts: '출장 승인이 완료되었습니다. 예약 진행은 별도로 표시합니다.',
    attendanceRecorded: '출장 근태 활동을 기록했습니다.',
    authorizationIssued:
      '승인된 정산 한도: {{amount}}위안. 청구는 한도 정책을 따릅니다.',
    zeroNoAuthorization:
      '예상 비용이 0이면 한도를 생성하지 않지만 재무 검토는 필요합니다.',
    uncertainCreate:
      '저장 결과를 알 수 없습니다. 새 신청 전에 내 신청을 확인하세요.',
    inactive: '활성 직원 인사 기록이 필요합니다.',
    configuration:
      '결재를 제출할 수 없습니다. 관리자에게 결재 기한 확인을 요청하세요.',
    invalid: '신청 필드를 확인하고 필요하면 최신 레코드를 다시 불러오세요.',
    stages: {
      completed: '완료됨',
      manager: '직속 관리자',
      head: '부서장',
      finance: '재무팀',
      executive: '담당 임원',
      gm: '총괄 책임자',
      booking: '행정 예약',
    },
  },
};
