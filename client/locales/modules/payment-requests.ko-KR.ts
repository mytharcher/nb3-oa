export default {
  paymentRequests: {
    relatedUnavailable: '관련 레코드 확인 불가',
    businessErrors: {
      PAYMENT_REQUEST_INVALID_INPUT:
        '사유, 수취인, 양수 금액, 청구서 번호 및 청구서 증빙을 입력하세요.',
      PAYMENT_REQUEST_ACCOUNT_REQUIRED:
        '제출 전에 수취인의 보호 은행 계좌를 완성하세요.',
      PAYMENT_REQUEST_ACCOUNT_STALE:
        '수취 계좌가 변경되었습니다. 정정 전에 최신 계좌를 불러오세요.',
      PAYMENT_REQUEST_DEPARTMENT_REQUIRED:
        '신청자에게 활성 기본 부서가 필요합니다. 인사팀에 직원 레코드 업데이트를 요청하세요.',
      PAYMENT_REQUEST_METHOD_INVALID: '활성 지급 방식을 선택하세요.',
      PAYMENT_REQUEST_SOURCE_REQUIRED:
        '사전 승인이 없는 이유를 설명하고 연결된 구매 주문을 지우세요.',
      PAYMENT_REQUEST_SOURCE_INVALID:
        '유효한 구매 주문 또는 계약과 원래 수취인을 선택하세요.',
      PAYMENT_REQUEST_SOURCE_STALE:
        '원본 문서가 변경되었습니다. 다시 처리하기 전에 지급 및 원본을 새로고침하세요.',
      PAYMENT_REQUEST_CONTRACT_STALE:
        '계약이 변경되었습니다. 버전을 갱신하고 지급을 수정한 후 다시 제출하세요.',
      PAYMENT_REQUEST_VOUCHER_REQUIRED:
        '지급 전표 번호를 입력하고 지급 증빙을 업로드하거나 선택하세요.',
      PAYMENT_REQUEST_FORCE_CONFIRMATION_REQUIRED:
        '지급 강제 완료 전에 정확한 승인 금액을 확인하세요.',
      PAYMENT_REQUEST_HANDLING_REASON_REQUIRED:
        '지급하지 못한 사유를 입력하세요.',
      PAYMENT_REQUEST_ALREADY_PAID:
        '이미 정산된 지급입니다. 새로고침하여 기록된 결과를 확인하세요.',
      PAYMENT_REQUEST_CONTRACT_ACTUAL_PAYMENT_REQUIRED:
        '작업 완료 전에 실제 계약 지급을 기록하세요.',
      PAYMENT_FILE_SIZE: '비어 있지 않은 최대 5MB 첨부를 선택하세요.',
      PAYMENT_FILE_TYPE:
        '유형이 일치하는 PDF, JPEG, PNG, WebP 파일을 업로드하세요.',
      PAYMENT_ATTACHMENT_INVALID: '이 지급 신청에 업로드한 증빙을 선택하세요.',
    },

    title: '지급 신청',
    description: '지급 신청, 고정 원본 사실 및 출납 처리를 검토합니다.',
    new: '새 지급 신청',
    edit: '편집',
    details: '세부 정보 보기',
    number: '숫자',
    reason: '사유',
    vendor: '수취인',
    amount: '지급 금액(위안)',
    search: '번호, 사유, 신청자 또는 수취인 검색',
    view: '레코드 보기',
    allStatuses: '모든 상태',
    refresh: '새로고침',
    clearFilters: '필터 초기화',
    emptyTitle: '지급 신청 없음',
    emptyDescription: '지급 신청 초안을 생성하고 청구서 증빙을 첨부하세요.',
    noResults: '일치하는 레코드가 없습니다. 필터를 지우거나 조정하세요.',
    rowActions: '{{name}} 작업',
    yes: '예',
    no: '아니요',
    frozenHint: '원본, 수취인, 금액 및 청구서는 제출 시 고정됩니다.',
    sourceModes: {
      contract: '계약',
      purchase: '구매 주문',
      none: '사전 승인 없음',
    },
    views: {
      mine: '내 것',
      pending: '대기 중',
      done: '완료',
      copied: '복사됨',
    },
    statuses: {
      draft: '초안',
      revision: '개정본',
      head: '부서 검토',
      finance: '재무 검토',
      executive: '임원 검토',
      gm: '총괄 책임자 검토',
      cashier: '출납 처리',
      exception: '처리 예외',
      paid: '지급됨',
      forcedPaid: '강제 지급 기록됨',
      rejected: '거절됨',
      withdrawn: '철회됨',
      terminated: '종료됨',
    },
    errors: {
      forbidden: '접근할 수 없습니다. 관리자에게 권한 확인을 요청하세요.',
      notFound: '레코드가 없거나 사용할 수 없습니다. 원본 페이지로 돌아가세요.',
      conflict: '지급이 변경되었습니다. 최신 레코드를 읽은 후 다시 처리하세요.',
      invalid: '지급 내용 및 필수 증빙을 확인하세요.',
      failed: '요청을 완료하지 못했습니다. 다시 시도하세요.',
    },
    detail: {
      creator: '생성자',
      sourceMode: '출처',
      order: '구매 주문',
      noPriorReason: '사전 승인 없음 사유',
      invoice: '청구서 번호',
      method: '지급 방식',
      failure: '처리 실패',
      voucher: '지급 전표',
      forcedReason: '강제 지급 사유',
      paidAt: '지급 시간',
      sourceFacts: '고정 원본 사실',
      cumulativeHint:
        '제출된 누적 지급에는 대기 지급이 포함됩니다. 현재 요청 예약은 별도 표시되므로 다시 더하지 마세요. 지급은 납품 또는 수령을 확인하지 않습니다.',
      sourceApproved: '승인 주문 금액(위안)',
      sourceCumulative: '제출 누적 금액(위안)',
      sourceHeld: '현재 원본 예약(위안)',
      fullApproval: '전체 결재 필요',
      attachments: '청구서 증빙',
      voucherAttachments: '지급 증빙',
      notSubmitted: '규칙은 제출 시 고정됩니다.',
    },
    rules: {
      spend_vp: '담당 임원 기준(위안)',
      spend_gm: '총괄 책임자 기준(위안)',
      sla_remindHours: '알림 근무 시간',
      sla_escalateHours: '상신 근무 시간',
      sla_urgeCooldownHours: '알림 대기 시간',
    },
    authz: {
      voucherEvidence: '지급 전표 증빙 업로드',
      ownScope: '내가 소유하거나 생성한 지급',
      resource: '지급 신청',
      view: '지급 신청 보기',
      submit: '내 지급 생성 및 제출',
      delegate: '직원의 지급 생성',
      paymentAccount: '권한이 있는 지급 계좌 읽기 및 정정',
    },
  },
};
