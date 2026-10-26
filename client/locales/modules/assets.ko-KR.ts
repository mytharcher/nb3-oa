export default {
  authz: {
    returnHeld: '기존 보유 자산의 실물 반납 확인',
    resource: '자산 대장',
    view: '자산 대장 및 원가 읽기',
    viewHeld: '내 보유 자산 읽기',
    manage: '자산 설명 기록 및 정정',
    heldScope: '내 보유 자산',
  },
  errors: {
    ASSET_RETURN_FORBIDDEN: '활성 자산 관리자가 실물 반납을 확인해야 합니다.',
    ASSET_REQUEST_REUSED: '이 반납 요청 키는 다른 수령을 식별합니다.',
    ASSET_RETURN_INELIGIBLE: '실제 보유 물품, 직원 및 일련번호를 확인하세요.',
    ASSET_RETURN_FLOW_REQUIRED:
      '반납 확인 전에 실제 신청을 통해 이 자산을 처리하세요.',

    ASSET_ACCESS_DENIED: '이 자산 작업 권한이 없습니다.',
    ASSET_NOT_FOUND: '자산을 찾지 못했습니다.',
    ASSET_INVALID_INPUT:
      '자산 코드, 이름 및 센트 단위의 음수가 아닌 정확한 금액을 입력하세요.',
    ASSET_CATEGORY_INACTIVE: '활성 자산 분류를 선택하세요.',
    ASSET_INVALID_COMMAND: '작업자와 정정 사유가 필요합니다.',
    ASSET_INVALID_VERSION: '현재 자산 버전을 입력하세요.',
    ASSET_VERSION_CONFLICT: '자산이 변경되었습니다. 최신 버전을 불러오세요.',
    ASSET_CODE_EXISTS: '이미 존재하는 자산 코드입니다.',
    ASSET_INVALID_STORED_AMOUNT:
      '저장된 자산 가치가 지원하는 정확한 범위를 벗어났습니다.',
    ASSET_WRITE_UNCONFIRMED: '자산 쓰기를 확인하지 못했습니다.',
    ASSET_DEPARTURE_NOT_CLEARED:
      '배정, 대여 또는 예약된 자산은 퇴직 정산 전에 반납해야 합니다.',
  },
};
