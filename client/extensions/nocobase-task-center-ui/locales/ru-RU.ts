/**
 * The wording of the task-center-ui components' own chrome, under `taskCenterUi`. Everything the data says — sources,
 * subjects, titles, statuses, summaries and batch actions — arrives translated from the page; merge these into the
 * locale resources of the namespace that renders the components.
 */
const enUS = {
  taskCenterUi: {
    nav: {
      label: 'Источники задач',
      search: 'Поиск типов задач',
      noMatches: 'Подходящих типов задач нет',
      clearSearch: 'Очистить поиск',
      expand: 'Развернуть {{name}}',
      collapse: 'Свернуть {{name}}',
      subjects: 'Типы задач {{name}}',
      pending: 'К выполнению: {{count}}',
    },
    tabs: {
      pending: 'К выполнению',
      closed: 'Готово',
      all: 'Все',
    },
    groups: {
      today: 'Сегодня',
      yesterday: 'Вчера',
      earlier: 'Ранее',
    },
    time: {
      received: '{{time}}',
      closed: 'Закрыто {{time}}',
    },
    selection: {
      select: 'Выбрать «{{name}}»',
      lockedTask:
        '«{{name}}» недоступно: выбрано {{type}}, вместе можно выбирать только задачи одного типа',
      otherType:
        'Выбрано {{type}}; вместе можно выбирать только задачи одного типа',
      unsupportedTask: 'У «{{name}}» нет пакетных действий',
      unsupported: 'Задачи этого типа обрабатываются по одной',
    },
    bulk: {
      label: 'Пакетные действия',
      selected: 'Выбрано: {{count}}',
      clear: 'Снять выбор',
      cancel: 'Отмена',
      skipped:
        'Другие выбранные задачи ({{count}}) не поддерживают действие и останутся без изменений.',
    },
    empty: {
      pending: {
        title: 'Всё выполнено',
        description: 'Здесь ничто не ожидает вас.',
      },
      closed: {
        title: 'Пока ничего не выполнено',
        description: 'Здесь появляются завершённые вами или отменённые задачи.',
      },
      all: {
        title: 'Нет задач',
        description: 'Задачи этого типа появляются здесь, когда поступают вам.',
      },
      showAll: 'Показать все',
    },
    loading: 'Загрузка задач',
    pagination: {
      label: 'Страницы',
      summary: 'Страница {{page}} из {{pages}}, задач {{total}}',
      previous: 'Назад',
      next: 'Далее',
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
