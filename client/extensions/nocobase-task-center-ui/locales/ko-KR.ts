/**
 * The wording of the task-center-ui components' own chrome, under `taskCenterUi`. Everything the data says — sources,
 * subjects, titles, statuses, summaries and batch actions — arrives translated from the page; merge these into the
 * locale resources of the namespace that renders the components.
 */
const enUS = {
  taskCenterUi: {
    nav: {
      label: '할 일 출처',
      search: '할 일 유형 검색',
      noMatches: '일치하는 할 일 유형 없음',
      clearSearch: '검색 지우기',
      expand: '{{name}} 펼치기',
      collapse: '{{name}} 접기',
      subjects: '{{name}}의 할 일 유형',
      pending: '할 일 {{count}}개',
    },
    tabs: {
      pending: '할 일',
      closed: '완료',
      all: '전체',
    },
    groups: {
      today: '오늘',
      yesterday: '어제',
      earlier: '이전',
    },
    time: {
      received: '{{time}}',
      closed: '종료 {{time}}',
    },
    selection: {
      select: '"{{name}}" 선택',
      lockedTask:
        '"{{name}}" 사용 불가: {{type}}이 선택되었으며 같은 유형의 할 일만 함께 선택할 수 있습니다',
      otherType:
        '{{type}}이 선택되었습니다. 같은 유형의 할 일만 함께 선택할 수 있습니다',
      unsupportedTask: '"{{name}}"에 일괄 작업 없음',
      unsupported: '이 유형의 할 일은 한 번에 하나씩 처리합니다',
    },
    bulk: {
      label: '일괄 작업',
      selected: '{{count}}개 선택됨',
      clear: '선택 지우기',
      cancel: '취소',
      skipped: '다른 선택 할 일 {{count}}개는 지원하지 않아 그대로 유지됩니다.',
    },
    empty: {
      pending: {
        title: '모두 처리함',
        description: '내 대기 항목이 없습니다.',
      },
      closed: {
        title: '아직 처리한 항목 없음',
        description: '완료되거나 취소된 할 일이 여기에 표시됩니다.',
      },
      all: {
        title: '할 일 없음',
        description: '이 유형의 할 일이 도착하면 여기에 표시됩니다.',
      },
      showAll: '모두 표시',
    },
    loading: '할 일 불러오는 중',
    pagination: {
      label: '페이지',
      summary: '{{pages}}페이지 중 {{page}}페이지, 할 일 {{total}}개',
      previous: '이전',
      next: '다음',
    },
  },
};

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

/** The shape every locale of task-center-ui has. */
export type TaskCenterUiLocale = Widen<typeof enUS>;

const locale: TaskCenterUiLocale = enUS;

export default locale;
