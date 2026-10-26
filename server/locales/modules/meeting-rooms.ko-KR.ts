export default {
  meetingRooms: {
    authz: {
      title: '회의실',
      bookings: '회의 예약',
      view: '보기',
      manage: '회의실 관리',
      create: '회의실 예약',
      edit: '예약 편집',
      cancel: '예약 취소',
      confirm: '행정 신청 확인',
      reject: '행정 신청 거절',
      checkIn: '체크인',
      owned: '내가 주최함',
      participating: '내가 참석하는 회의',
      readable: '내가 주최하거나 참석하는 회의',
    },
    notifications: {
      title: '회의 예약 업데이트',
      body: '나와 관련된 회의 예약이 변경되었습니다. 내 회의 예약을 열어 접근 가능한 세부 정보를 확인하세요.',
    },
    errors: {
      SORT_LIMIT_EXCEEDED:
        '일치 레코드가 너무 많습니다. 이름순 정렬 전에 검색을 좁히세요.',
      ACCESS_DENIED: '작업 또는 해당 필드가 권한 밖입니다.',
      ACTIVE_EMPLOYEE_REQUIRED: '활성 직원 인사 기록이 필요합니다.',
      BOOKING_NOT_FOUND: '예약을 사용할 수 없습니다.',
      CAPACITY_EXCEEDED: '주최자 및 참석자가 회의실 정원을 초과합니다.',
      COMMAND_CONFLICT: '요청 식별자가 다른 작업 또는 작업자에 속합니다.',
      INVALID_BOOKING: '제목과 중복되지 않은 활성 참석자를 입력하세요.',
      INVALID_INTERVAL: '종료가 시작 이후인 미래 구간을 선택하세요.',
      INVALID_PARTICIPANT: '모든 참석자는 활성 직원이어야 합니다.',
      INVALID_RECURRENCE: '1~52회의 일별 또는 주별 시리즈를 선택하세요.',
      INVALID_REQUEST_ID: '요청 식별자가 필요합니다.',
      INVALID_ROOM: '회의실 이름, 수용 인원 및 변경 사유를 입력하세요.',
      INVALID_SERIES: '기존 시리즈를 선택하세요.',
      INVALID_STATE:
        '현재 상태 또는 시간 구간에서 수행할 수 없는 예약 작업입니다.',
      REASON_REQUIRED: '이 관리자 결정의 사유를 입력하세요.',
      ROOM_INACTIVE: '비활성 회의실입니다.',
      ROOM_NOT_FOUND: '회의실을 사용할 수 없습니다.',
      TIME_CONFLICT: '요청 구간이 하나 이상 사용 중인 구간과 충돌합니다.',
      VERSION_CONFLICT:
        '예약 또는 회의실이 변경되었습니다. 재시도 전에 새로고침하세요.',
      INVALID_LOCAL_TIME: '올바른 회사 현지 날짜와 시간을 입력하세요.',
      NONEXISTENT_LOCAL_TIME:
        '시간대 변경으로 존재하지 않는 현지 시간입니다. 다른 시간을 선택하세요.',
      AMBIGUOUS_LOCAL_TIME:
        '시간대 변경으로 두 번 발생하는 현지 시간입니다. 모호하지 않은 시간을 선택하세요.',
    },
  },
};
