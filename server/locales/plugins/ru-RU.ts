// Application-owned Russian translations for installed plugin namespaces.
const plugins = {
  '@nocobase/app-plugin-authorization': {
    sections: {
      pages: 'Доступ к страницам',
      page: 'Страницы',
      business: 'Бизнес-операции',
      administration: 'Система и инструменты',
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
      settingsModules: {
        authorization: 'Авторизация',
      },
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
  },
  '@nocobase/app-plugin-authz-default-access': {
    resourceTitle: 'Область данных по умолчанию',
  },
  '@nocobase/app-plugin-authz-sharing-rules': {
    resourceTitle: 'Правила совместного доступа',
  },
  '@nocobase/app-plugin-authz-restriction-rules': {
    resourceTitle: 'Правила ограничений',
  },
  '@nocobase/app-plugin-users': {
    invitationEmail: {
      subject: '{{inviter}} пригласил(а) вас в {{app}}',
      intro: '{{inviter}} пригласил(а) вас в {{app}}.',
      summary: 'Вы также присоединитесь к: {{items}}.',
      separator: ', ',
      action: 'Принять приглашение',
      validity:
        'Откройте ссылку для задания имени и пароля. Действует один раз до {{date}}.',
      fallback: 'Если ссылка не открывается, скопируйте её в браузер:',
    },
  },
  '@nocobase/app-plugin-notification-in-app': {
    channels: {
      inApp: 'В приложении',
    },
    providers: {
      builtIn: 'Встроенный',
    },
    errors: {
      authenticationRequired: 'Требуется аутентификация.',
      invalidPageToken:
        'pageToken не является токеном, возвращённым этим списком.',
      notFound: 'Сообщение уведомления не найдено.',
    },
  },
  '@nocobase/app-plugin-notification': {
    errors: {
      logsForbidden: 'Требуется доступ к журналу уведомлений.',
      logNotFound: 'Запись журнала уведомлений не найдена.',
    },
  },
  '@nocobase/app-plugin-scheduler': {
    nav: {
      automation: 'Автоматизация',
    },
    authorization: {
      title: 'Расписания',
      read: 'Чтение',
    },
  },
  '@nocobase/app-plugin-agents': {
    access: {
      section: 'Команда агентов',
      businessSection: 'Команда агентов',
      businesses: {
        agents: {
          title: 'Агенты и навыки',
          description: 'Агенты команды и используемые ими навыки.',
          actions: {
            edit: {
              title: 'Управление агентами и навыками',
              description:
                'Изменение настроек, навыков и переменных агента, архивирование, восстановление, удаление и редактирование навыков. Агент не получает возможностей сверх прав редактора',
              related:
                'Управление агентами и навыками (свои агенты и созданные навыки)',
              relatedLabel: 'Мои агенты и созданные мной навыки',
              relatedHint: 'Агенты, которыми я владею, и созданные мной навыки',
              all: 'Управление агентами и навыками (все)',
            },
          },
        },
      },
      settings: {
        agents: {
          agents: 'Агенты',
          runners: 'Среды выполнения',
          prices: 'Цены моделей',
          services: 'Модельные сервисы',
        },
      },
      actions: {
        read: 'Просмотр',
        manage: 'Управление',
      },
      keyScopes: {
        agents: {
          title: 'Агенты',
          description:
            'Просмотр агентов, навыков и запусков; изменение агентов и навыков, отмена и повтор запусков.',
        },
        runners: {
          title: 'Среды выполнения',
          description:
            'Просмотр раннеров и токенов регистрации; управление раннерами.',
        },
        prices: {
          title: 'Цены моделей',
          description:
            'Просмотр цен моделей для оценки стоимости; их изменение.',
        },
        services: {
          title: 'Модельные сервисы',
          description: 'Просмотр модельных сервисов и моделей, без ключей.',
        },
      },
    },
  },
  '@nocobase/app-plugin-notification-providers': {
    providers: {
      smtp: 'SMTP',
      resend: 'Resend',
      feishuWebhook: 'Вебхук Feishu',
      dingtalkWebhook: 'Вебхук DingTalk',
    },
  },
};

export default plugins;
