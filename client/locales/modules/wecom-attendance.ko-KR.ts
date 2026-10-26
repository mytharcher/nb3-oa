export default {
  wecomAttendance: {
    title: 'WeCom 근태 원본',
    description:
      '매핑된 직원의 출퇴근 기록을 가져오고 최근 동기화 실행 30개를 검토합니다.',
    sync: '동기화',
    refresh: '새로고침',
    runs: '동기화 실행',
    retry: '다시 시도',
    counts: '커밋된 레코드: {{records}} · 일괄 처리: {{batches}}',
    runFailed:
      '일부 레코드를 가져오지 못했습니다. 직원 매핑, 근무조 할당 및 원본 접근을 확인하고 재시도하세요. 완료된 일괄 처리는 유지됩니다.',
    denied: '근태 동기화 접근 권한이 없습니다.',
    disabled:
      '원본이 비활성 상태입니다. 관리자에게 전용 근태 애플리케이션 설정을 요청하세요.',
    unconfigured:
      '동기화 전에 원본 자격 증명 및 명시적인 직원 매핑이 필요합니다.',
    ready_one: '매핑된 직원 {{count}}명의 동기화 준비 완료.',
    ready_other: '매핑된 직원 {{count}}명의 동기화 준비 완료.',
    startedAt: '시작 {{time}}',
    empty: '동기화 실행 없음.',
    rangeHint:
      '완료된 회사 현지 달력 날짜를 최대 7일 선택하세요. 중복 원본 레코드는 다시 생성하지 않습니다.',
    start: '시작일',
    end: '종료일',
    reason: '사유',
    cancel: '취소',
    syncing: '동기화 중…',
    states: {
      running: '진행 중',
      completed: '완료됨',
      failed: '확인 필요',
    },
  },
};
