const enUS = {
  approvalUi: {
    timeline: {
      onBehalf: 'для {{name}}',
      showEvents: 'Что изменилось ({{count}})',
      system: 'Системных обновлений: {{count}}',
      empty: 'Пока ничего не произошло.',
    },
    progress: {
      empty: 'Согласование ещё не началось.',
      copies: 'В копии',
      read: 'прочитано',
      unread: 'не прочитано',
      step: {
        current: 'в процессе',
        rejected: 'отклонено',
        returned: 'возвращено',
        ended: 'завершено',
        skipped: 'пропущено',
      },
      tally: {
        answered: 'Ответили {{count}} из {{total}}',
        needed: 'Для одобрения нужно {{count}}',
      },
    },
    branches: {
      done: 'Завершено {{count}} из {{total}}',
      blocked: 'Задерживает заявку',
    },
    receipts: {
      read: 'Чтение',
      confirmed: 'Подтверждено',
      empty: 'Ещё никто не получил.',
    },
    preview: {
      title: 'Кто примет решение',
      loading: 'Расчёт маршрута…',
      submit: 'Подать',
      finished: 'Решение принято',
      automatic: 'Согласовано без решения',
      parallel: 'Параллельно',
      optional: 'Необязательно',
      nobody: 'Пока никто не подходит',
      none: 'Решение по заявке принимается без согласования.',
      skipped: 'Не требуется: {{stages}}',
    },
    actions: {
      more: 'Ещё',
      all: 'Действия',
      admin: 'Администрирование',
      confirm: '{{action}}?',
      loading: 'Загрузка…',
      loadFailed: 'Не удалось загрузить. Закройте и повторите.',
      cancel: 'Отмена',
    },
  },
};

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

/** The shape every locale of approval-ui has. */
export type ApprovalUiLocale = Widen<typeof enUS>;

const locale: ApprovalUiLocale = enUS;

export default locale;
