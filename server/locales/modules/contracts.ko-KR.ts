export default {
  contracts: {
    errors: {
      CONTRACT_SEAL_EVIDENCE_REQUIRED: '실제 완료된 날인 증빙이 필요합니다.',
      CONTRACT_SEAL_EVIDENCE_CONFLICT:
        '다른 계약 사실에 속하는 인감 증빙입니다.',
      CONTRACT_ACCESS_DENIED: '부여된 접근 범위 밖의 계약입니다.',
      CONTRACT_ACTION_NOT_ALLOWED: '이 계약에 사용할 수 없는 작업입니다.',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        '계약 금액은 지급액과 예약 지급액의 합계보다 작을 수 없습니다.',
      CONTRACT_ATTACHMENT_DENIED:
        '계약 첨부 필드 또는 레코드가 부여된 접근 범위 밖입니다.',
      CONTRACT_ATTACHMENT_INVALID:
        '이 계약 신청에 속하는 유효한 첨부 파일을 선택하세요.',
      CONTRACT_CANDIDATE_REMOVED:
        '게시되지 않은 계약 후보가 제거되었습니다. 새 신청을 생성하세요.',
      CONTRACT_CATEGORY_INACTIVE: '활성 계약 유형을 선택하세요.',
      CONTRACT_CORRUPT_BALANCE:
        '계약 지급 합계가 불일치합니다. 관리자에게 문의하세요.',
      CONTRACT_EMPLOYEE_REQUIRED: '기본 부서가 있는 활성 직원이 필요합니다.',
      CONTRACT_FIELDS_RESTRICTED: '필수 계약 필드가 부여된 접근 범위 밖입니다.',
      CONTRACT_FILE_SIZE: '비어 있지 않은 최대 5MiB 계약 파일을 선택하세요.',
      CONTRACT_FILE_TYPE:
        '계약 본문은 PDF여야 하며 증빙은 내용이 일치하는 PDF, JPEG, PNG, WebP입니다.',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        '다른 내용으로 이미 사용한 요청 키입니다. 다시 제출하기 전에 새로고침하세요.',
      CONTRACT_INACTIVE_SOURCE: '유효한 승인 계약 원본을 선택하세요.',
      CONTRACT_INCOMPLETE_PROPOSAL:
        '계약 사유, 지급 조건 및 변경 불가능한 본문 버전을 완성하세요.',
      CONTRACT_INPUT_INVALID: '선언된 계약 입력 필드를 확인하세요.',
      CONTRACT_INVALID_AMOUNT:
        '지원 범위 내의 정확한 정수 센트로 음수가 아닌 금액을 입력하세요.',
      CONTRACT_INVALID_ID: '유효하고 길이가 제한된 식별자가 필요합니다.',
      CONTRACT_INVALID_TIME: '계약 타임스탬프가 유효하지 않습니다.',
      CONTRACT_LIMIT_EXCEEDED: '대기 및 지급 금액이 계약 한도를 초과합니다.',
      CONTRACT_NOT_CANDIDATE:
        '이 신청의 미게시 계약 후보만 제거할 수 있습니다.',
      CONTRACT_NOT_FOUND: '계약 원본을 찾지 못했습니다.',
      CONTRACT_OUTSTANDING_PAYMENTS: '계약 해지 전에 대기 지급을 해제하세요.',
      CONTRACT_REASON_REQUIRED: '지원 길이 이내의 사유를 입력하세요.',
      CONTRACT_REBASE_NOT_ALLOWED:
        '반려된 변경의 기준 버전은 신청자만 명시적으로 갱신할 수 있습니다.',
      CONTRACT_REQUEST_KEY_REQUIRED: '고정 요청 키가 필요합니다.',
      CONTRACT_RESERVATION_CLOSED: '지급 예약이 이미 종료되었습니다.',
      CONTRACT_RULE_INVALID:
        '계약 결재 정책이 없거나 유효하지 않습니다. 관리자에게 문의하세요.',
      CONTRACT_SLA_UNSUPPORTED:
        '설치된 결재 어댑터는 설정된 24/48시간 시계만 지원합니다.',
      CONTRACT_SOURCE_CONFLICT: '다른 계약 원본에 속하는 참조입니다.',
      CONTRACT_STORED_ID_INVALID:
        '저장된 계약 식별자가 유효하지 않습니다. 관리자에게 문의하세요.',
      CONTRACT_SUPPLIER_INVALID:
        '공급업체는 활성이며 자격이 승인되어야 합니다. 승인 전에 자격을 갱신하세요.',
      CONTRACT_TARGET_MISMATCH: '결재 대상이 다른 계약 신청에 속합니다.',
      CONTRACT_TEXT_INVALID:
        '이 신청에 속하는 변경 불가능한 PDF 본문 버전을 선택하세요.',
      CONTRACT_TEXT_NOT_EDITABLE:
        '계약 본문 버전은 내 초안 또는 반려된 개정본에만 추가할 수 있습니다.',
      CONTRACT_TEXT_REQUIRED:
        '유효하고 변경 불가능한 계약 본문 버전을 선택하세요.',
      CONTRACT_TRANSITION_NOT_ALLOWED: '전용 보호 계약 작업을 사용하세요.',
      CONTRACT_VERSION_CONFLICT:
        '승인된 계약이 변경되었습니다. 신청을 반려하고 기준 버전을 명시적으로 갱신한 후 다시 검토 요청하세요.',
    },
    authz: {
      resource: '계약 및 변경',
      view: '계약 신청 보기',
      submit: '내 계약 신청 생성 및 편집',
      ledger: '승인된 계약 원장 및 변경 불가능한 버전 읽기',
      historicalEntry: '감사된 법률 기록으로 기존 계약 등록',
    },
  },
};
