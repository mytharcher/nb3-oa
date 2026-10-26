export default {
  authz: {
    ownedScope: '내 자산 신청',
    resource: '자산 신청',
    view: '자산 신청 읽기',
    viewValue: '자산 원가 읽기',
    create: '내 자산 신청 생성',
    edit: '내 자산 신청 편집',
    operate: '권한이 있는 자산 결재 및 처리 작업 수행',
    returnIssued: '지급된 사용 자산의 실물 반납 확인',
  },
  errors: {
    ASSET_RETURN_REASON_REQUIRED: '실물 수령 사유를 입력하세요.',
    ASSET_ACCESS_DENIED: '이 자산 신청에 접근할 수 없습니다.',
    ASSET_ACTION_INVALID: '이 신청에 가능한 작업이 아닙니다.',
    ASSET_REQUEST_NOT_FOUND: '자산 신청을 찾지 못했습니다.',
    ASSET_INVALID_COMMAND: '고정 요청 식별자와 필수 사유를 입력하세요.',
    ASSET_REQUEST_REUSED: '이 요청 식별자가 다른 작업에 연결되어 있습니다.',
    ASSET_REQUIRED_FIELDS: '목적, 수량 및 자산 선택을 완성하세요.',
    ASSET_CATEGORY_INACTIVE: '활성 자산 분류를 선택하세요.',
    ASSET_EMPLOYEE_INACTIVE: '신청자에게 활성 직원 레코드가 있어야 합니다.',
    ASSET_DEPARTMENT_MISSING: '신청자에게 활성 기본 부서가 필요합니다.',
    ASSET_HEAD_MISSING: '부서에 활성 부서장 결재자가 필요합니다.',
    ASSET_BORROW_DATE_INVALID:
      '회사 현지 날짜 기준 올바른 미래 반납일을 선택하세요.',
    ASSET_SCRAP_REQUIRED: '자산 하나를 선택하고 폐기 사유와 사진을 첨부하세요.',
    ASSET_SCRAP_INELIGIBLE:
      '적격 보유 자산 또는 관리자 관리 재고만 폐기할 수 있습니다.',
    ASSET_PHOTO_DENIED: '신청 또는 사진 필드에 접근할 수 없습니다.',
    ASSET_PHOTO_INVALID: '이 신청에 연결된 유효한 사진을 최대 10개 선택하세요.',
    ASSET_PHOTO_SIZE: '각 사진은 최대 5MiB입니다.',
    ASSET_PHOTO_TYPE: '유효한 JPEG, PNG 또는 WebP 이미지를 업로드하세요.',
    ASSET_STOCK_SHORTAGE: '전체 신청을 처리할 수량이 부족합니다.',
    ASSET_INVALID_QUANTITY: '1~100의 정수 수량을 확인하세요.',
    ASSET_INVALID_AMOUNT:
      '저장된 자산 가치가 지원하는 정확한 범위를 벗어났습니다.',
    ASSET_NOT_FOUND: '이 신청의 자산을 찾지 못했습니다.',
    ASSET_INVALID_VERSION: '현재 자산 버전을 불러오세요.',
    ASSET_VERSION_CONFLICT: '자산이 변경되었습니다. 확인 전에 다시 불러오세요.',
    ASSET_ALREADY_RESERVED: '다른 신청에서 예약한 자산입니다.',
    ASSET_EXISTING_HOLD: '재고를 변경하기 전에 기존 예약을 해결하세요.',
    ASSET_HOLD_MISMATCH: '실제 예약이 이 신청과 일치하지 않습니다.',
    ASSET_BASELINE_CONFLICT:
      '승인 후 자산 정보가 변경되었습니다. 실행 전에 검토 단계로 반려하세요.',
    ASSET_UNITS_INCOMPLETE: '배정된 모든 단위와 실제 일련번호를 확인하세요.',
    ASSET_SERIAL_MISMATCH: '일련번호가 실제 자산과 다릅니다.',
    ASSET_RETURN_MISMATCH:
      '반납 물품이 실제 지급 보관 내역과 일치하지 않습니다.',
    ASSET_ALREADY_RETURNED: '이미 반납된 자산입니다.',
    ASSET_RETURN_FORBIDDEN: '활성 자산 관리자가 실물 반납을 확인해야 합니다.',
    ASSET_RETURN_INELIGIBLE: '적격 지급 사용 신청이 아닙니다.',
    ASSET_ALLOCATION_MISSING: '전체 실제 배정 내역이 없습니다.',
    ASSET_SOURCE_UNAVAILABLE: '자산 신청 원본을 사용할 수 없습니다.',
    ASSET_SOURCE_MISSING: '소유 자산 신청이 더 이상 존재하지 않습니다.',
    ASSET_SOURCE_FORBIDDEN: '원본에서 이 재고 작업을 허가하지 않았습니다.',
    ASSET_SOURCE_MISMATCH: '재고 원본이 실제 신청과 일치하지 않습니다.',
    ASSET_TARGET_MISMATCH: '결재 대상이 다른 신청에 속합니다.',
    ASSET_DIRECTORY_UNAVAILABLE: '최신 결재 디렉터리가 필요합니다.',
    ASSET_SLA_UNSUPPORTED:
      '이 릴리스는 기본 24/48근무 시간 결재 시계만 지원합니다.',
  },
  schedule: {
    title: '대여 자산 반납 알림',
    description:
      '매일 회사 현지 기준 만기 알림 및 매주 연체 알림을 보냅니다. 전송 대기는 실패한 실행으로 보고됩니다.',
  },
  reminders: {
    before:
      '자산 신청 {{number}}: 대여 물품 {{quantity}}개의 반납일은 {{date}}입니다. 실물 반납을 준비하세요.',
    overdue:
      '자산 신청 {{number}}: 대여 물품 {{quantity}}개가 {{date}}에 만료되었으며 아직 반납되지 않았습니다.',
  },
};
