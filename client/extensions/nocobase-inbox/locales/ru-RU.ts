/** Every key the inbox looks up, so each locale is checked against the same list. */
export interface InboxLocale {
  readonly 'inbox.title': string;
  readonly 'inbox.description': string;
  readonly 'inbox.views.all': string;
  readonly 'inbox.views.todo': string;
  readonly 'inbox.kinds.label': string;
  readonly 'inbox.kinds.all': string;
  readonly 'inbox.kinds.decision': string;
  readonly 'inbox.kinds.info': string;
  readonly 'inbox.tabs.decision': string;
  readonly 'inbox.tabs.info': string;
  readonly 'inbox.clearFilter': string;
  readonly 'inbox.noMatchDescription': string;
  readonly 'inbox.readAll': string;
  readonly 'inbox.allRead': string;
  readonly 'inbox.loading': string;
  readonly 'inbox.loadFailed': string;
  readonly 'inbox.loadFailedDescription': string;
  readonly 'inbox.retry': string;
  readonly 'inbox.loadMore': string;
  readonly 'inbox.emptyAll': string;
  readonly 'inbox.empty.todo': string;
  readonly 'inbox.empty.decision': string;
  readonly 'inbox.empty.info': string;
  readonly 'inbox.emptyDescription': string;
  readonly 'inbox.unread': string;
  readonly 'inbox.unreadCount': string;
  readonly 'inbox.pendingDecisions': string;
  readonly 'inbox.resolved': string;
  readonly 'inbox.outcomes.approved': string;
  readonly 'inbox.outcomes.rejected': string;
  readonly 'inbox.outcomes.withdrawn': string;
  readonly 'inbox.count': string;
  readonly 'inbox.actionsFor': string;
  readonly 'inbox.actions.read': string;
  readonly 'inbox.actions.unread': string;
  readonly 'inbox.actions.delete': string;
  readonly 'inbox.deleted': string;
  readonly 'inbox.requestFailed': string;
  readonly 'inbox.forbidden': string;
  readonly 'inbox.nothingSelected': string;
  readonly 'inbox.back': string;
  readonly 'inbox.open': string;
  readonly 'inbox.keyMove': string;
  readonly 'inbox.keyOpen': string;
  readonly 'inbox.cancel': string;
  readonly 'inbox.request.approve': string;
  readonly 'inbox.request.reject': string;
  readonly 'inbox.request.commentPlaceholder': string;
  readonly 'inbox.request.commentFor': string;
  readonly 'inbox.request.quickSend': string;
  readonly 'inbox.request.newLine': string;
}

const enUS: InboxLocale = {
  'inbox.title': 'Входящие',
  'inbox.description': 'Уведомления и запросы, отправленные вам.',
  'inbox.views.all': 'Все',
  'inbox.views.todo': 'К выполнению',
  'inbox.kinds.label': 'Тип',
  'inbox.kinds.all': 'Все типы',
  'inbox.kinds.decision': 'Решения',
  'inbox.kinds.info': 'Уведомления',
  'inbox.tabs.decision': 'Требует моего решения',
  'inbox.tabs.info': 'Уведомления',
  'inbox.clearFilter': 'Сбросить фильтр',
  'inbox.noMatchDescription': 'Сбросьте фильтр для просмотра всех типов.',
  'inbox.readAll': 'Отметить все прочитанными',
  'inbox.allRead': 'Все отмечены прочитанными.',
  'inbox.loading': 'Загрузка',
  'inbox.loadFailed': 'Не удалось загрузить входящие',
  'inbox.loadFailedDescription': 'Проверьте соединение и повторите.',
  'inbox.retry': 'Повторить',
  'inbox.loadMore': 'Загрузить ещё',
  'inbox.emptyAll': 'Здесь пусто',
  'inbox.empty.todo': 'Ничего не ожидает вас',
  'inbox.empty.decision': 'Нет решений, ожидающих вас',
  'inbox.empty.info': 'Нет уведомлений',
  'inbox.emptyDescription':
    'Здесь появляются уведомления и запросы, отправленные вам.',
  'inbox.unread': 'Не прочитано',
  'inbox.unreadCount': 'Непрочитанных: {{count}}',
  'inbox.pendingDecisions': 'Ожидает: {{count}}',
  'inbox.resolved': 'Обработано',
  'inbox.outcomes.approved': 'Согласовано',
  'inbox.outcomes.rejected': 'Отклонено',
  'inbox.outcomes.withdrawn': 'Отозвано',
  'inbox.count': '×{{count}}',
  'inbox.actionsFor': 'Действия для {{title}}',
  'inbox.actions.read': 'Отметить прочитанным',
  'inbox.actions.unread': 'Отметить непрочитанным',
  'inbox.actions.delete': 'Удалить',
  'inbox.deleted': 'Удалено.',
  'inbox.requestFailed': 'Ошибка запроса. Попробуйте снова.',
  'inbox.forbidden': 'Вам не разрешено это действие.',
  'inbox.nothingSelected': 'Выберите элемент для просмотра',
  'inbox.back': 'Назад к списку',
  'inbox.open': 'Открыть',
  'inbox.keyMove': 'Переместить',
  'inbox.keyOpen': 'Открыть',
  'inbox.cancel': 'Отмена',
  'inbox.request.approve': 'Согласовать',
  'inbox.request.reject': 'Отклонить',
  'inbox.request.commentPlaceholder': 'Напишите что-нибудь…',
  'inbox.request.commentFor': '{{action}}: {{title}}',
  'inbox.request.quickSend': 'для отправки',
  'inbox.request.newLine': 'для новой строки',
};

export default enUS;
