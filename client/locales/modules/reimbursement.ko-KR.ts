import actionCopy from './reimbursement-actions.ko-KR.js';
import formCopy from './reimbursement-forms.ko-KR.js';
export default {
  reimbursementRequests: {
    relatedUnavailable: '관련 레코드 확인 불가',
    categoryUnavailable: '분류 사용 불가',

    businessErrors: {
      REIMBURSEMENT_INVALID_LINE_AMOUNT:
        '각 경비 행은 지원 범위 내의 양수 금액이어야 합니다.',
      REIMBURSEMENT_INVALID_LINE_DATE: '각 행의 올바른 경비 일자를 선택하세요.',
      REIMBURSEMENT_VOUCHER_REQUIRED:
        '지급 확인 전에 지급 전표 번호를 입력하세요.',
      REIMBURSEMENT_PAYMENT_CONFIRMATION_REQUIRED:
        '사유를 입력하고 정확한 정산 총액, 대출 상계 및 현금 지급액을 확인하세요.',
      REIMBURSEMENT_HANDLING_REASON_REQUIRED:
        '지급하지 못한 사유를 입력하세요.',
      REIMBURSEMENT_PAYMENT_ACCOUNT_STALE:
        '지급 계좌가 변경되었습니다. 정정 전에 최신 계좌를 불러오세요.',
      REIMBURSEMENT_AUTHORIZATION_CHANGED:
        '승인 한도가 변경되었습니다. 새로고침하여 정산 총액을 확인하세요.',
      REIMBURSEMENT_INVOICES_CHANGED:
        '청구서 증빙이 변경되었습니다. 신청을 새로고침하고 사용 가능한 청구서를 다시 선택하세요.',
      REIMBURSEMENT_LOAN_CHANGED:
        '대출 상계가 변경되었습니다. 대출을 새로고침하고 상계 금액을 확인하세요.',
      REIMBURSEMENT_TOTAL_TOO_LARGE:
        '경비 합계가 지원 금액을 초과합니다. 총액을 줄이거나 신청을 나누세요.',
      REIMBURSEMENT_FILE_SIZE: '비어 있지 않은 최대 5MB 첨부를 선택하세요.',
      REIMBURSEMENT_FILE_TYPE:
        '유형이 일치하는 PDF, JPEG, PNG, WebP 파일을 업로드하세요.',
    },

    ...formCopy,
    ...actionCopy,
    title: '경비 정산',
    description: '경비 증빙을 검토하고 행별 결재 및 지급 처리를 추적합니다.',
    new: '새 경비 정산',
    edit: '경비 정산 편집',
    details: '세부 정보 보기',
    number: '숫자',
    reason: '사유',
    gross: '총 정산액',
    offset: '대출 상계',
    net: '순현금',
    search: '번호, 사유 또는 신청자 검색',
    view: '레코드 보기',
    allStatuses: '모든 상태',
    refresh: '정산 새로고침',
    clearFilters: '필터 초기화',
    emptyTitle: '경비 정산 없음',
    emptyDescription: '초안을 생성하고 경비 행과 증빙을 추가하세요.',
    noResults: '일치하는 정산이 없습니다. 필터를 조정하세요.',
    rowActions: '{{name}} 작업',
    views: {
      mine: '내 것',
      pending: '대기 중',
      done: '완료',
      copied: '복사됨',
    },
    statuses: {
      draft: '초안',
      revision: '개정본',
      manager: '관리자 검토',
      head: '부서 검토',
      finance: '재무 검토',
      executive: '임원 검토',
      gm: '총괄 책임자 검토',
      cashier: '출납 처리',
      exception: '처리 예외',
      paid: '지급됨',
      forcedPaid: '관리자 기록 정산',
      rejected: '거절됨',
      withdrawn: '철회됨',
      terminated: '종료됨',
    },
    errors: {
      invoiceDuplicate:
        '이 정산 내 청구서 번호는 고유해야 합니다. 각 경비 행을 확인하세요.',
      overrunReasonRequired:
        '누적 청구가 연결된 승인 한도를 20% 초과합니다. 초과 설명을 입력하세요.',
      invoiceUnavailable:
        '다른 정산이 예약하거나 사용한 청구서입니다. 청구서 번호와 신청을 확인하세요.',
      paymentAccountRequired:
        '직원 지급 계좌가 미완료입니다. 제출 전에 인사팀에 은행명, 계좌 번호 및 예금주 입력을 요청하세요.',
      employeeInactive:
        '신청자에게 활성 직원 프로필이 필요합니다. 인사팀에 확인하세요.',
      departmentRequired:
        '신청자에게 활성 기본 부서가 없습니다. 인사팀 또는 조직 관리자에게 할당을 요청하세요.',
      categoryInvalid:
        '경비 분류가 비활성이거나 사용할 수 없습니다. 각 행에 활성 분류를 선택하세요.',
      sourceInvalid:
        '연결 한도가 없거나 미승인 또는 다른 신청자 소유입니다. 연결 신청을 확인하세요.',
      sourceRebind:
        '제출한 정산은 연결 한도 또는 대출을 변경할 수 없습니다. 원래 연결을 유지하세요.',
      loanRequired: '상계할 대출을 선택하거나 상계하지 않으면 0을 입력하세요.',
      loanInvalid:
        '선택한 대출을 사용할 수 없거나 다른 신청자 소유입니다. 다른 대출을 선택하세요.',
      loanInsufficient:
        '가용 대출 잔액이 부족합니다. 상계를 줄이고 잔액을 확인하세요.',
      invalidOffset:
        '대출 상계는 정산 총액을 초과할 수 없습니다. 금액을 확인하세요.',
      attachmentInvalid:
        '일부 증빙을 사용할 수 없거나 다른 정산에 속합니다. 이 신청의 증빙을 선택하거나 업로드하세요.',
      slaConfiguration:
        '지원하지 않는 결재 기한입니다. 워크플로 관리자에게 문의하세요.',
      inputInvalid: '정산 사유와 증빙이 있는 서로 다른 경비 행을 완성하세요.',
      configuration:
        '정산 데이터 구조가 미완료입니다. 시스템 관리자에게 복구를 요청한 후 재시도하세요.',
      forbidden: '이 정산에 접근할 수 없습니다.',
      notFound: '정산이 더 이상 존재하지 않습니다.',
      conflict: '정산이 변경되었습니다. 다시 불러와 검토한 후 처리하세요.',
      standardReason: '승인된 일별 기준을 초과하는 각 행을 설명하세요.',
      standardCategoryChanged:
        '원래 정책에 없는 분류입니다. 현재 정책을 사용하려면 새 신청을 생성하세요.',
      standardConfiguration:
        '승인된 출장 기준이 미완료입니다. 관리자에게 설정 확인을 요청하세요.',
      invalid: '정산 내용 및 필수 증빙을 확인하세요.',
      failed: '요청을 완료하지 못했습니다. 다시 시도하세요.',
    },
    standard: {
      title: '고정 경비 정책',
      unsubmitted: '정책은 최초 제출 시 고정됩니다.',
      frozenHint:
        '저장된 분류 및 승인 출장 한도는 수정 시에도 유지됩니다. 일별 금액은 기준 종류별로 합산합니다.',
      gradeCode: '출장 직급',
      gradeRank: '직급 순위',
      lodging: '1박당 숙박(위안)',
      allowance: '1일당 수당(위안)',
      notApplicable: '적용되는 승인 출장 기준이 없습니다.',
      kinds: {
        none: '출장 일별 한도 없음',
        lodging: '숙박 일별 한도',
        allowance: '수당 일별 한도',
      },
    },
    detail: {
      lines: '경비 행',
      failure: '처리 실패',
      voucher: '지급 전표',
      forcedReason: '관리자 정산 사유',
      noLines: '경비 행 없음.',
      line: '경비 행 {{number}}',
      financeResult: '재무 결과',
      lineStates: {
        approved: '승인됨',
        returned: '정정 반려됨',
        pending: '검토 대기',
      },
    },
    bank: {
      title: '비공개 지급 계좌',
      bankName: '은행',
      bankAccount: '은행 계좌',
      bankAccountName: '예금주',
      missing: '저장된 지급 계좌 없음.',
      correct: '지급 계좌 정정',
      saved: '지급 계좌 정정됨',
      denied: '지급 계좌 접근 거부.',
      unavailable:
        '계좌 정정을 사용할 수 없습니다. 정산을 다시 불러와 저장된 계좌를 확인하세요.',
    },
    authz: {
      resource: '경비 정산',
      submit: '내 정산 생성 및 제출',
      delegate: '직원의 정산 생성',
      view: '정산 보기',
      paymentAccount: '권한이 있는 지급 계좌 읽기 및 정정',
    },
  },
};
