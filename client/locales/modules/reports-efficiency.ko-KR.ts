export default {
  exported: 'Excel 다운로드를 시작했습니다.',
  title: '휴가 결정 할 일 경과 시간',
  description:
    '완료한 휴가 결정 할 일의 생성부터 종료까지 자연 경과 밀리초입니다. 대기 및 과거 재제출을 포함하며 원래 신청 시작 월별로 집계합니다. 근무 시간, SLA, 반려율 또는 전체 절차 소요 시간이 아닙니다.',
  year: '시작 연도',
  month: '시작 월(선택)',
  clear: '필터 초기화',
  export: 'Excel 내보내기',
  exporting: '내보내는 중…',
  refresh: '새로고침',
  selectYear: '보고서를 불러오려면 원래 신청 시작 연도를 선택하세요.',
  invalid: '1900~9998의 연도와 선택적으로 1~12의 월을 입력하세요.',
  forbidden:
    '현재 휴가 레코드 또는 필드 권한으로 보고서를 볼 수 없습니다. 관리자에게 문의하세요.',
  precondition:
    '원본 한도 또는 할 일 타임스탬프 검사에 실패했습니다. 연도/월 범위를 좁히거나 관리자에게 원본 시간 확인을 요청하세요.',
  failed: '보고서를 불러오지 못했습니다. 다시 시도하세요.',
  retry: '다시 시도',
  exportFailed: 'Excel 내보내기에 실패했습니다. 다시 시도하세요.',
  empty: '완료한 결정 할 일 없음',
  noResults: '이 달의 일치 할 일 없음',
  emptyHint:
    '현재 읽을 수 있는 휴가 신청의 완료 결정 할 일만 집계합니다. 다른 시작 연도 또는 월을 선택하세요.',
  total: '단계 그룹 {{count}}개',
  generatedAt: '생성 {{value}}',
  previous: '이전',
  next: '다음',
  fields: {
    stage: '단계',
    completedTaskCount: '완료한 결정 할 일',
    totalElapsedMs: '자연 경과 총 밀리초',
    averageElapsedMs: '자연 경과 평균 밀리초',
  },
  stages: { manager: '관리자', head: '부서장', hr: '인사팀' },
};
