/**
 * The wording of the task-center-ui components' own chrome, under `taskCenterUi`. Everything the data says — sources,
 * subjects, titles, statuses, summaries and batch actions — arrives translated from the page; merge these into the
 * locale resources of the namespace that renders the components.
 */
const enUS = {
  taskCenterUi: {
    nav: {
      label: 'タスクソース',
      search: 'タスク種類を検索',
      noMatches: '一致するタスク種類なし',
      clearSearch: '検索をクリア',
      expand: '{{name}}を展開',
      collapse: '{{name}}を折りたたむ',
      subjects: '{{name}}のタスク種類',
      pending: '未処理{{count}}件',
    },
    tabs: {
      pending: '未処理',
      closed: '完了',
      all: 'すべて',
    },
    groups: {
      today: '今日',
      yesterday: '昨日',
      earlier: '以前',
    },
    time: {
      received: '{{time}}',
      closed: '終了{{time}}',
    },
    selection: {
      select: '「{{name}}」を選択',
      lockedTask:
        '「{{name}}」は選択不可：{{type}}を選択中です。同じ種類のタスクのみ同時選択できます',
      otherType: '{{type}}を選択中です。同じ種類のタスクのみ同時選択できます',
      unsupportedTask: '「{{name}}」には一括操作がありません',
      unsupported: 'この種類のタスクは1件ずつ処理します',
    },
    bulk: {
      label: '一括操作',
      selected: '{{count}}件選択中',
      clear: '選択を解除',
      cancel: 'キャンセル',
      skipped: '選択した他の{{count}}件は対応していないため、変更しません。',
    },
    empty: {
      pending: {
        title: 'すべて対応済み',
        description: '対応待ちの項目はありません。',
      },
      closed: {
        title: '完了した項目はまだありません',
        description: '完了または取消したタスクがここに表示されます。',
      },
      all: {
        title: 'タスクなし',
        description: 'この種類のタスクが届くとここに表示されます。',
      },
      showAll: 'すべて表示',
    },
    loading: 'タスクを読み込み中',
    pagination: {
      label: 'ページ',
      summary: '{{pages}}ページ中{{page}}ページ、{{total}}件のタスク',
      previous: '前へ',
      next: '次へ',
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
