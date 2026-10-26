export default {
  businessErrors: {
    DEPARTURE_CHECKLIST_REQUIRED: '계속하기 전에 퇴직 체크리스트를 완료하세요.',
    DEPARTURE_LAST_WORKING_DAY_REQUIRED: '직원의 마지막 근무일을 확인하세요.',
    DEPARTURE_DATE_PAST:
      '마지막 근무일은 회사 시간대 기준 오늘보다 빠를 수 없습니다.',
    DEPARTURE_HANDOVER_INVALID:
      '퇴직 직원이 아닌 적격 인수인계자를 선택하세요.',
    DEPARTURE_HANDOVER_INCOMPLETE: '계속하기 전에 인수인계 항목을 완료하세요.',
    DEPARTURE_ORDINARY_WORK_INCOMPLETE:
      '퇴직 정산 전에 일반 인수인계 업무를 완료하세요.',
    DEPARTURE_LOAN_UNCLEARED: '퇴직 정산 전에 직원의 미상환 대출을 정리하세요.',
    DEPARTURE_RECEIPT_REQUIRED:
      '이 인수인계 항목의 수령 또는 정리 증빙을 입력하세요.',
    DEPARTURE_SETTLEMENT_NOTE_REQUIRED: '퇴직 정산 메모를 입력하세요.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      '계속하기 전에 미완료 할 일의 재할당을 완료하세요.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      '예상 마지막 근무일과 인수인계자를 선택하세요.',
    DEPARTURE_TYPE_INVALID: '활성 퇴직 유형을 선택하세요.',
    DEPARTURE_ALREADY_ACTIVE:
      '이미 진행 중인 퇴직 신청이 있습니다. 기존 신청을 여세요.',
    DEPARTURE_CANCELLATION_PENDING:
      '퇴직 취소가 대기 중입니다. 먼저 해결하세요.',
    DEPARTURE_EXECUTION_BASELINE_CHANGED:
      '직원 또는 퇴직 사실이 변경되었습니다. 실행 전에 새로고침하여 검증하세요.',
  },

  authz: {
    cancel: '퇴직 취소',
    resource: '퇴직 및 인수인계',
    view: '퇴직 신청 보기',
    submit: '퇴직 신청 제출',
    delegate: '직원의 퇴직 신청 생성',
    work: '퇴직 인수인계 처리',
    settle: '퇴직 정산 확인',
  },
  schedule: {
    title: '퇴직 처리',
    description:
      '기한이 된 퇴직을 실행하고 미완료 계정 및 구성원 변경을 재시도합니다.',
  },

  title: '퇴직 및 인수인계',
  description: '퇴직, 인수인계 및 효력 발생일 실행을 검토합니다.',
  new: '새 퇴직 신청',
  edit: '편집',
  number: '신청 번호',
  refresh: '새로고침',
  search: '신청 번호, 직원 또는 사유 검색',
  view: '보기',
  allTypes: '모든 퇴직 유형',
  allStatuses: '모든 상태',
  clearFilters: '필터 초기화',
  emptyTitle: '퇴직 신청 없음',
  emptyDescription: '퇴직 신청 및 인수인계 진행 상황이 여기에 표시됩니다.',
  noResults: '일치하는 퇴직 신청 없음',
  departureType: '퇴직 유형',
  reason: '사유',
  expectedLastWorkingDay: '예상 마지막 근무일',
  lastWorkingDay: '확정 마지막 근무일',
  handoverUser: '인수인계자',
  createdBy: '생성자',
  application: '신청',
  settlement: '인사 정산',
  settlementDate: '정산일',
  settlementNote: '정산 메모',
  execution: '퇴직 처리',
  notSettled: '정산이 완료되지 않았습니다.',
  notExecuted: '퇴직 실행이 미완료이며 계정은 비활성화되지 않았습니다.',
  executionComplete: '계정 및 조직 구성원이 비활성화되었습니다.',
  cancellationReason: '취소 사유',
  cancellationGuidance:
    '인사 면담 후 실제 퇴직 전에 인사팀이 취소를 요청할 수 있습니다. 다른 인사 검토자가 확인해야 고용이 복원됩니다.',
  handover: '인수인계 업무',
  claimant: '맡은 사람',
  receiver: '수신자',
  manager: '담당 관리자',
  forcedBy: '면제한 사람',
  forceReason: '면제 사유',
  checklistConfirmed: '체크리스트 확인됨',
  receiverAcknowledged: '수령 확인됨',
  yes: '예',
  no: '아니요',
  notReady: '제출 요건이 미완료입니다.',
  views: {
    mine: '내 것',
    pending: '대기 중',
    done: '완료',
    copied: '복사됨',
  },
  statuses: {
    cancellationReview: '취소 확인',
    cancelled: '취소됨',
    draft: '초안',
    revision: '수정 반려됨',
    manager: '관리자 검토',
    head: '부서장 검토',
    hr: '인사 면담',
    gm: '총괄 책임자 검토',
    handover: '인수인계',
    completed: '정산 완료',
    withdrawn: '철회됨',
    rejected: '거절됨',
    terminated: '종료됨',
  },
  workKinds: {
    work: '업무 인수인계',
    it: 'IT 및 계정',
    admin: '자산 및 행정',
    finance: '대출 및 경비 정산',
  },
  workStates: {
    cancelled: '취소됨',
    open: '맡기 가능',
    claimed: '진행 중',
    completed: '완료됨',
  },
  executionStates: {
    cancelled: '취소됨',
    ready: '효력 발생일 대기',
    transferring: '대기 결재 이관 중',
    blocked: '실행 차단됨',
    executed: '계정 비활성화됨',
  },
  errors: {
    missingUnnamed: '퇴직 신청이 없어 원본 목록으로 돌아갔습니다.',
    missingReturned:
      '"{{name}}"을 더 이상 사용할 수 없어 원본 목록으로 돌아갔습니다.',
    forbidden: '이 레코드에 더 이상 접근할 수 없습니다.',
    notFound: '레코드가 없습니다. 목록으로 돌아가세요.',
    conflict:
      '레코드가 변경되었습니다. 최신 레코드를 불러온 후 다시 확인하세요.',
    invalid: '작업 요건을 충족하지 않습니다. 현재 레코드를 검토하세요.',
    failed: '요청에 실패했습니다. 다시 불러오세요.',
  },
  form: {
    create: '새 퇴직 신청',
    confirmSubmission: '퇴직 제출 확인',
    submissionHelp:
      '결재 제출 전에 예상 마지막 근무일과 인수인계자를 확인하세요.',
    edit: '퇴직 신청 편집',
    save: '초안 저장',
    saved: '"{{name}}"을 저장했습니다',
    mode: '생성 대상',
    self: '내 사직',
    manual: '인사 대리 신청',
    employee: '직원',
    employeeSearch: '직원 검색',
    chooseEmployee: '활성 직원 선택',
    employeesDenied: '대상 선택에는 직원 인사 기록 접근 권한이 필요합니다.',
    previous: '이전 후보자',
    next: '다음 후보자',
    chooseType: '퇴직 유형 선택',
    chooseHandover: '인수인계자 선택',
    searchHandover: '적격 수신자 검색',
    handoverSearchMinimum:
      '이름 또는 사번으로 검색하려면 두 글자 이상 입력하세요.',
    noHandoverCandidates:
      '적격 수신자가 없습니다. 다른 이름 또는 사번으로 검색하거나 인사팀에 직원 및 계정 상태를 확인하세요.',
    requiredOnSubmit: '제출 시 필수이며 초안 저장 시 선택 사항입니다.',
    handoverHelp:
      '제출 시 필수, 초안 시 선택 사항입니다. 활성 계정이 있는 다른 수습 또는 정규 직원을 이름이나 사번으로 검색하세요.',
    refineHandoverSearch:
      '일치하는 수신자가 많습니다. 더 구체적인 이름을 입력하세요.',
    required: '이 필드를 입력하세요.',
    dateInvalid: '올바른 달력 날짜를 선택하세요.',
    invalid: '필드를 검토하고 다시 시도하세요.',
    dateHelp: '인사 면담 중 확정한 날짜가 최종 마지막 근무일입니다.',
    manualHelp:
      '인사팀은 직원의 해고 또는 계약 만료 신청을 생성할 수 있습니다.',
    unavailable: '신청을 생성할 수 없습니다. 직원 상태와 권한을 확인하세요.',
    unknown:
      '저장 결과가 확인되지 않았습니다. 새 신청 전에 기존 초안을 확인하세요.',
    checkDrafts: '기존 초안 확인',
    noProof:
      '일치하는 초안이 없지만 저장 실패를 의미하지는 않습니다. 신청 잠금을 유지하고 인사팀에 문의하세요.',
    openDraft: '확인을 위해 초안 열기',
    confirmDraft: '저장된 신청입니다',
    storageUnavailable:
      '브라우저 저장소를 사용할 수 없습니다. 중단된 저장 후 중복 신청을 방지하기 위해 저장을 비활성화했습니다.',
    unknownPersisted:
      '이전 생성 요청이 아직 확인되지 않았습니다. 새로고침 후에도 잠금이 유지됩니다.',
  },
  actionForm: {
    approveConsequence:
      '제공된 결재가 기록됩니다. 최종 승인 시 승인된 고용 결과가 적용됩니다.',

    uncertain:
      '결과가 확인되지 않았습니다. 입력을 유지하고 동일한 작업을 재시도하세요. 변경된 요청을 보내지 마세요.',
    replay: '동일한 작업 재시도',
    unsupported:
      '이 작업에는 이 페이지가 지원하지 않는 입력 계약이 필요합니다.',
    person: '수신자',
    mode: '결재자 위치',
    place: '결재 자리',
    releaseConsequence:
      '대기 결재 할 일을 해제하며 여기에서 되돌릴 수 없습니다.',
    returnConsequence: '수정을 위해 신청을 반려하고 현재 대기 업무를 닫습니다.',
    submitConsequence: '제출한 사실을 고정하여 결재를 시작합니다.',
    genericConsequence: '서버가 선택한 결재 대상에 제공된 작업을 적용합니다.',
    latest: '최신 버전 읽기',
    conflict:
      '퇴직 신청이 변경되었습니다. 입력은 유지됩니다. 최신 버전을 읽고 검토한 후 다시 확인하세요.',
    completed: '"{{name}}"의 {{action}}을 완료했습니다',
    committed:
      '작업을 완료했습니다. 추가 작업 전에 퇴직 신청을 새로고침하세요.',
    before: '이전',
    after: '이후',
    alongside: '동시에',
    revision: '신청자 정정',
    required: '이 필드를 입력하세요.',
    limit: '값이 너무 깁니다.',
    title: '"{{name}}" 퇴직 {{action}}',
    comment: '의견 / 사유',
    confirm: '확인',
    saved: '"{{name}}"을 업데이트했습니다',
    unavailable: '더 이상 가능한 작업이 아닙니다. 최신 레코드를 불러오세요.',
    unknown:
      '결과가 확인되지 않았습니다. 계속하기 전에 최신 레코드를 불러오세요.',
    to: '수신자',
    returnTarget: '반려 대상',
    confirmTitle: '"{{name}}"을 {{action}}하시겠습니까?',
    confirmDescription:
      '퇴직 결정을 업데이트합니다. 직원과 현재 레코드를 확인하세요.',
    lastWorkingDay: '확정 마지막 근무일',
    settlementDate: '정산일',
    settlementNote: '정산 메모',
    labels: {
      requestCancellation: '퇴직 취소 요청',
      submit: '제출',
      withdraw: '철회',
      terminate: '종료',
      settle: '정산 확인',
      approve: '승인',
      reject: '거절',
      return: '반려',
      returnTo: '반려',
      comment: '의견',
      read: '읽음 표시',
      urge: '독촉',
      transfer: '이관',
      addSigner: '결재자 추가',
      cc: '참조',
      claim: '맡기',
      release: '해제',
      appoint: '지정',
      reassign: '재할당',
    },
  },
  work: {
    labels: {
      requestCancellation: '퇴직 취소 요청',
      claim: '맡기',
      confirmChecklist: '체크리스트 확인',
      acknowledgeReceipt: '수령 확인',
      complete: '완료',
      forceComplete: '강제 완료',
    },
    title: '"{{name}}"의 {{kind}} {{action}}',
    reason: '면제 사유',
    confirmChecklist: '체크리스트를 완료했습니다.',
    acknowledgeReceipt: '인수인계를 받았습니다.',
    blocked: '정리가 미완료입니다. 나열된 미결 항목을 해결하세요.',
    forceWarning:
      '인수인계를 강제 완료해도 자산 및 재무 원장 사실은 변경되지 않습니다.',
    forceConfirm: '"{{name}}"의 {{kind}}을 면제하시겠습니까?',
    forceDescription:
      '일반 정리 증빙을 건너뜁니다. 사유와 실제 작업자는 감사에 기록됩니다.',
  },
  blockers: {
    generic:
      '요건을 충족하지 않습니다. 새로고침하고 담당자에게 해결을 요청하세요.',
    DEPARTURE_ASSET_SERVICE_UNAVAILABLE:
      '일반 자산 정리를 아직 사용할 수 없습니다.',
    DEPARTURE_REIMBURSEMENT_SERVICE_UNAVAILABLE:
      '경비 정산 정리를 사용할 수 없습니다.',
    DEPARTURE_LOANS_NOT_CLEARED: '대출 또는 예약 상환이 정리되지 않았습니다.',
    REIMBURSEMENT_DEPARTURE_NOT_CLEARED: '미종결 경비 정산 신청이 있습니다.',
    DEPARTURE_APPLICATION_INCOMPLETE: '예상 날짜와 인수인계자를 선택하세요.',
    DEPARTURE_DATE_PAST: '예상 마지막 근무일이 과거입니다.',
    DEPARTURE_REASSIGNMENT_UNAVAILABLE:
      '결재 이관을 사용할 수 없습니다. 계정은 활성 상태로 유지됩니다.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      '직원에게 할당된 대기 결재가 남아 있습니다.',
    DEPARTURE_EXECUTION_FAILED:
      '퇴직 실행이 실패했으며 일일 작업에서 재시도합니다.',
  },
};
