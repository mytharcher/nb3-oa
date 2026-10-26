import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Закрыть',
  nav: { apiKeys: 'Ключи API' },
  page: {
    search: 'Поиск по имени ключа',
    retry: 'Повторить',
    clear: 'Сбросить фильтры',
    noResults: 'Нет ключей, соответствующих запросу.',
    loading: 'Загрузка',
    title: 'Ключи API',
    description:
      'Создавайте ключи, позволяющие скриптам и интеграциям обращаться к приложению от вашего имени.',
    add: 'Создать ключ',
    empty: 'У вас пока нет ключей API.',
    unnamed: 'Ключ без имени',
    never: 'Никогда',
    unused: 'Не использовался',
    active: 'Активен',
    expired: 'Истёк',
    disabled: 'Отключён',
    columns: {
      name: 'Имя',
      key: 'Ключ',
      status: 'Статус',
      lastUsed: 'Последнее использование',
      expires: 'Срок действия',
      actions: 'Действия',
    },
    actions: { revoke: 'Отозвать', menu: 'Действия для «{{name}}»' },
  },
  form: {
    title: 'Создать ключ API',
    description:
      'Ключ действует от вашего имени и имеет те же права, что и ваша учётная запись.',
    name: 'Имя',
    namePlaceholder: 'Ночная задача экспорта',
    expiry: 'Срок действия',
    expiryChoices: {
      never: 'Никогда',
      '7': 'Через 7 дней',
      '30': 'Через 30 дней',
      '90': 'Через 90 дней',
      '365': 'Через 1 год',
    },
    cancel: 'Отмена',
    create: 'Создать',
  },
  reveal: {
    title: 'Скопируйте ключ сейчас',
    description: 'Ключ «{{name}}» создан. Он отображается только один раз.',
    usage: 'Передавайте его в заголовке запроса x-api-key.',
    copy: 'Скопировать ключ',
    done: 'Готово',
  },
  revoke: {
    success: 'Ключ «{{name}}» отозван',
    title: 'Отозвать ключ «{{name}}»?',
    description:
      'Запросы с ключом «{{name}}» сразу перестанут работать. Это действие необратимо.',
    cancel: 'Отмена',
    confirm: 'Отозвать',
  },
  errors: {
    forbidden:
      'Просмотр ключей вам больше недоступен. Обратитесь к администратору.',
    notFound: 'Управление ключами API недоступно. Вернитесь на рабочий стол.',
    nameRequired: 'Введите имя ключа.',
    copyFailed:
      'Не удалось скопировать ключ. Выделите и скопируйте его вручную.',
    loadFailed: 'Не удалось загрузить ваши ключи API.',
    createFailed: 'Не удалось создать ключ API.',
    revokeFailed: 'Не удалось отозвать ключ API.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type ApiKeysResource = LocaleResource<typeof enUS>;

export default enUS;
