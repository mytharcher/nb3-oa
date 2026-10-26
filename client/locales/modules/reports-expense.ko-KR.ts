export default {
  reportsExpense: {
    firstPage: '첫 페이지로 이동',

    pageEmpty: '이 페이지에 경비 그룹 없음',
    pageEmptyHint:
      '현재 원본의 그룹이 줄었습니다. 첫 페이지로 이동하거나 이전을 사용하여 사용 가능한 페이지로 돌아가세요.',

    exportStarted: 'Excel 다운로드 시작됨',
    reloading:
      '새로고침 중… 현재 필터 로딩이 끝날 때까지 이전 결과를 표시합니다.',
    exportLock: '내보내는 중… 다운로드 완료까지 필터 및 탐색이 잠깁니다.',

    title: '월별 정산 경비',
    description:
      '원래 경비 일자 및 분류별 정산 총경비이며 지급된 순현금이 아닙니다.',
    month: '경비 월(1~12, 선택)',
    effectiveYear: '회사 달력 연도: {{year}}',
    sourceNotice:
      '권한이 있는 정산 신청을 최대 10,000개 확인합니다. 연도 또는 월 변경으로 원본 검색량이 줄지는 않습니다.',
    precondition:
      '정산 증빙을 검증하지 못했거나 보고서 한도를 초과했습니다. 관리자에게 원본 증빙 및 보고서 크기 확인을 요청하세요.',
    forbidden:
      '현재 정산 원본 접근 권한이 없습니다. 관리자에게 원본 권한 확인을 요청하세요.',
    empty: '올해 정산 경비 없음',
    emptyHint:
      '권한이 있고 정산 증빙이 검증된 신청만 포함합니다. 연도와 월을 확인하거나 관리자에게 원본 접근 확인을 요청하세요.',
    fields: {
      year: '연도',
      month: '경비 월',
      category: '분류 코드',
      settledRequestCount: '정산 신청',
      settledExpenseCents: '정산 총경비(CNY, 현금 아님)',
    },
  },
};
