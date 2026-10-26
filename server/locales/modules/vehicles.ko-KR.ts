export default {
  vehicles: {
    authz: {
      requests: '차량 신청',
      garage: '차량 차고',
      manage: '차량 명단 관리',
      viewCost: '비공개 연료비 보기',
    },
    errors: {
      VEHICLE_SORT_LIMIT: '많은 레코드를 정렬하기 전에 검색을 좁히세요.',
      VEHICLE_ACCESS_DENIED: '운전기사 업데이트가 부여된 정책 밖입니다.',
      VEHICLE_ALREADY_DISPATCHED:
        '원본에 이미 변경 불가능한 배차 사실이 있습니다.',
      VEHICLE_APPROVAL_REFUSED:
        '차량 작업을 사용할 수 없습니다. 신청을 새로고침하고 권한을 확인하세요.',
      VEHICLE_CONTENT_CHANGED:
        '배차에는 변경되지 않은 승인 내용과 비공개 작업 페이로드가 필요합니다.',
      VEHICLE_COST_NOT_FOUND: '사용 비용을 읽을 수 없습니다.',
      VEHICLE_DISPATCH_NOT_OFFERED: '실제 허용된 배차 할 일이 필요합니다.',
      VEHICLE_DRIVER_INACTIVE: '현재 적격하지 않은 운전기사입니다.',
      VEHICLE_DRIVER_REQUIRED: '운전기사 선택은 승인 신청과 일치해야 합니다.',
      VEHICLE_EMPLOYEE_INACTIVE: '활성 직원 인사 기록이 필요합니다.',
      VEHICLE_FIELDS_RESTRICTED:
        '결재 파사드에 전체 비재무 신청 필드가 필요합니다.',
      VEHICLE_GARAGE_DENIED: '활성 행정 업무 구성원이 필요합니다.',
      VEHICLE_INTERVAL_CONFLICT:
        '이 구간에 이미 배차된 차량 또는 운전기사입니다.',
      VEHICLE_INVALID_COMMAND: '원본 및 고정 요청 키가 필요합니다.',
      VEHICLE_INVALID_INPUT:
        '차량 식별자, 양수 정원 및 유효 상태를 제공하세요.',
      VEHICLE_INVALID_INTERVAL:
        '순서가 올바른 시간 구간과 양수 탑승 인원을 제공하세요.',
      VEHICLE_INVALID_USAGE:
        '주행 거리와 연료는 정확한 음수가 아닌 정수여야 합니다.',
      VEHICLE_INVALID_VERSION: '저장 버전을 진행할 수 없습니다.',
      VEHICLE_NOT_DISPATCHED: '이 신청의 실제 배차가 없습니다.',
      VEHICLE_NOT_FOUND: '차량 또는 운전기사를 찾지 못했습니다.',
      VEHICLE_NO_AVAILABLE_CAPACITY:
        '이 구간에 충분한 정원의 차량이 없습니다. 제출은 차량을 예약하지 않습니다.',
      VEHICLE_OUTSTANDING_USE:
        '운전기사를 비활성화하기 전에 실제 사용을 완료하세요.',
      VEHICLE_PRIVATE_INPUT_REQUIRED:
        '업무 실행 페이로드는 비공개 파사드를 사용해야 합니다.',
      VEHICLE_REQUEST_KEY_REQUIRED: '고정 요청 키가 필요합니다.',
      VEHICLE_REQUEST_REUSED:
        '요청 키가 다른 작업자 또는 페이로드에 연결되어 있습니다.',
      VEHICLE_SLA_UNSUPPORTED:
        '이 릴리스는 기본 근무 시간 결재 시계가 필요합니다.',
      VEHICLE_SOURCE_DENIED: '트랜잭션 내 실제 허용된 결재 작업이 필요합니다.',
      VEHICLE_SOURCE_MISMATCH: '명령이 결재 원본과 일치하지 않습니다.',
      VEHICLE_SOURCE_UNAVAILABLE: '실제 결재 원본 어댑터를 사용할 수 없습니다.',
      VEHICLE_TARGET_MISMATCH: '작업 대상이 다른 신청에 속합니다.',
      VEHICLE_TYPE_INACTIVE: '활성 차량 유형을 선택하세요.',
      VEHICLE_UNAVAILABLE: '정원이 충분한 활성 차량을 선택하세요.',
      VEHICLE_USAGE_OWNER: '실제 신청자만 사용을 등록할 수 있습니다.',
      VEHICLE_VERSION_CONFLICT: '현재 차량 버전을 불러오세요.',
    },
  },
};
