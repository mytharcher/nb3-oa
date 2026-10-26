import type { LocaleResource } from '@nocobase/i18n';

/**
 * Display vocabulary shared by the client and server locale catalogues.
 */
const enUS = {
  // Workspace sections this plugin registers through `authz.ui`.
  sections: {
    pages: 'Права на страницы',
    page: 'Страницы',
    business: 'Бизнес-права',
    administration: 'Администрирование',
    other: 'Другое',
  },
  options: {
    defaultAndSharing: 'Использовать область данных по умолчанию',
    actions: {
      assign: 'Управление назначениями',
      configure: 'Настроить',
      inspect: 'Проверить права',

      read: 'Чтение',
      create: 'Создать',
      update: 'Обновление',
      delete: 'Удалить',
      access: 'Доступ',
    },
    settingsModules: { authorization: 'Авторизация' },
    pages: {
      all: 'Все страницы',
      allDescription:
        'Разрешить доступ ко всем страницам, включая добавленные позднее.',
    },
    settings: {
      inspector: 'Проверка прав',
      'permission-sets': 'Наборы прав',
    },
    subjectTypes: {
      authenticated: 'Все вошедшие пользователи',
      authenticatedDescription:
        'Применяется ко всем пользователям с действующим сеансом входа.',
      user: 'Пользователи',
    },
    recordAccessPolicies: {
      allRecords: 'Все записи',
      recordsIOwn: 'Мои записи',
      recordsICreated: 'Созданные мной записи',
      customFilter: 'Пользовательский фильтр',
      customFilterHint:
        'Выберите записи с помощью пользовательского условия фильтра.',
    },
  },
};

/** English is the source of truth for this catalogue's shape. */
export type AuthorizationServerResource = LocaleResource<typeof enUS>;

export default enUS;
