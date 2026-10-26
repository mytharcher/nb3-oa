import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: {
    notifications: 'Уведомления',
    logs: 'Журнал уведомлений',
  },
  logs: {
    retry: 'Повторить',
    limitNotice:
      'Показаны только последние {{count}} уведомлений; итоги охватывают эти записи.',
    deliveryOperations: 'Операции доставки',
    recipeDescription:
      'Отслеживайте передачу в каждый канал и все попытки провайдеров.',
    redacted: 'Содержимое сообщений, получатели и токены аренды скрыты.',
    providerAttempts: 'Попытки провайдеров',

    eyebrow: 'Уведомления',
    title: 'Журнал уведомлений',
    description:
      'Отслеживайте доставку уведомлений и все попытки провайдеров. Содержимое сообщений, получатели и токены аренды скрыты.',
    refreshing: 'Обновление…',
    refresh: 'Обновить',
    deliveriesShown: 'Показанные доставки',
    needAttention: 'Требуют внимания',
    unavailable: 'Журнал недоступен',
    recent: 'Последние уведомления',
    loading: 'Загрузка истории доставки…',
    emptyTitle: 'Доставок пока нет',
    emptyDescription:
      'После отправки уведомлений здесь появятся записи о доставке.',
    expand: 'Развернуть уведомление',
    collapse: 'Свернуть уведомление',
    noDeliveries: 'Нет записей о доставке.',
    noAttempts: 'Нет записей о попытках.',
    columns: {
      source: 'Источник',
      notificationId: 'ID уведомления',
      status: 'Статус',
      deliveries: 'Доставки',
      created: 'Создано',
      channel: 'Канал',
      provider: 'Провайдер',
      attempts: 'Попытки',
      updated: 'Обновлено',
    },
  },
  status: {
    pending: 'Ожидает',
    processing: 'Обработка',
    completed: 'Завершено',
    partial: 'Частично',
    failed: 'Ошибка',
    unknown: 'Неизвестно',
    preparing: 'Подготовка',
    submitting: 'Отправка',
    retrying: 'Повторная попытка',
    accepted: 'Принято',
  },
  errors: {
    forbidden: 'Доступ отозван. Обратитесь к администратору.',
    notFound: 'Эти записи недоступны. Вернитесь на рабочий стол.',
    providerFailed:
      'Ошибка доставки. Проверьте настройки канала или обратитесь к администратору.',
    requestFailed: 'Ошибка запроса уведомления.',
    inAppRecipientNotFound: 'Получатель внутреннего уведомления не существует.',
  },
};

export type NotificationResource = LocaleResource<typeof enUS>;

export default enUS;
