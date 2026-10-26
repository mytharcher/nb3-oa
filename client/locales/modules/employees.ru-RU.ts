/**
 * English wording of the `employees` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `employees.zh-CN.ts` is checked against this shape.
 */
const employeesEnUS = {
  employees: {
    refresh: 'Обновить',
    personal: {
      title: 'Личный архив',
      description:
        'Просматривайте свои кадровые сведения; для исправлений обращайтесь в отдел кадров.',
      identity: '{{name}} · {{code}}',
      basic: 'Основная информация',
      profile: 'Личные сведения',
      bank: 'Платёжный счёт',
      emptyTitle: 'Архива сотрудника пока нет',
      emptyDescription:
        'Обратитесь в отдел кадров для создания архива сотрудника для вашей учётной записи.',
      profileMissing:
        'Личные сведения не найдены; попросите отдел кадров проверить ваш архив.',
      forbidden:
        'Нет доступа к вашему архиву; попросите администратора проверить доступ.',
      refresh: 'Обновить',
    },
    authz: {
      section: 'Сотрудники',
      settings: 'Страница архивов сотрудников',
      settingsRead: 'Открыть',
      collections: {
        employees: 'Архивы сотрудников',
        employeeProfiles: 'Контролируемая информация сотрудников',
        employeeCompensation: 'Оплата сотрудников',
      },
      archive: {
        title: 'Архив сотрудника',
        view: 'Просмотр',
        manage: 'Создание и изменение',
        correctStatus: 'Исправление статуса',
      },
      profile: {
        title: 'Контролируемая информация сотрудников',
        view: 'Просмотр всех',
        viewBank: 'Просмотр банковского счёта',
        update: 'Изменить',
      },
      compensation: {
        title: 'Оплата сотрудников',
        view: 'Просмотр',
      },
      directory: {
        title: 'Справочник',
        view: 'Просмотр людей',
        viewContact: 'Просмотр телефона и эл. почты',
      },
      scopes: {
        reports: 'Мои подчинённые (все уровни)',
        selfAndReports: 'Я и мои подчинённые',
        reportsHint:
          'Люди ниже просматривающего по линии подчинения на любой глубине; неактивный промежуточный руководитель не разрывает связь.',
      },
      subjects: {
        position: 'Должности',
        reportingManager: 'Прямые руководители',
      },
    },
    permissionSets: {
      hr: 'Отдел кадров: архивы сотрудников',
      compensation: 'Оплата сотрудников (генеральный и финансовый директора)',
      bank: 'Банковские счета сотрудников (финансы)',
      manager: 'Прямой руководитель: архивы подчинённых',
      head: 'Начальник отдела: архивы отдела',
      admin: 'Исправление данных архива сотрудника',
      directory: 'Справочник',
    },
    navigation: {
      archive: 'Сотрудники',
      directory: 'Справочник',
    },
    title: 'Сотрудники',
    description:
      'Поддерживайте учётную запись, подчинённость, должность и контролируемую информацию каждого сотрудника.',
    fields: {
      name: 'Имя',
      code: 'Код сотрудника',
      user: 'Учётная запись',
      primaryDepartment: 'Основной отдел',
      position: 'Должность',
      grade: 'Разряд',
      manager: 'Прямой руководитель',
      status: 'Статус',
      careerStartDate: 'Дата начала трудовой деятельности',
      hireDate: 'Дата приёма',
      probationEndDate: 'Дата окончания испытательного срока',
      lastWorkingDay: 'Последний рабочий день',
      phone: 'Телефон',
      email: 'Эл. почта',
      workLocation: 'Место работы',
      emergencyContact: 'Контакт на экстренный случай',
      active: 'Активен',
      updatedAt: 'Обновлено',
      idType: 'Тип удостоверения',
      idNumber: 'Номер удостоверения',
      birthDate: 'Дата рождения',
      address: 'Адрес',
      education: 'Образование',
      school: 'Учебное заведение',
      major: 'Специальность',
      bankName: 'Банк',
      bankAccount: 'Банковский счёт',
      bankAccountName: 'Владелец счёта',
      effectiveFrom: 'Действует с',
      baseSalary: 'Оклад',
      sourceApplication: 'Исходная заявка',
      note: 'Примечание',
      kind: 'Изменение',
      effectiveAt: 'Дата вступления в силу',
      changes: 'Изменения',
    },
    status: {
      probation: 'На испытательном сроке',
      regular: 'В штате',
      leaving: 'Увольняется',
      left: 'Уволен',
    },
    historyKind: {
      hire: 'Приём',
      regularization: 'Зачисление в штат',
      transfer: 'Передать',
      salaryChange: 'Изменение зарплаты',
      departure: 'Увольнение',
      correction: 'Исправление данных',
    },
    boolean: {
      yes: 'Да',
      no: 'Нет',
    },
    search: {
      placeholder: 'Поиск по имени или коду сотрудника',
      label: 'Поиск сотрудников',
    },
    filters: {
      department: 'Отдел',
      allDepartments: 'Все отделы',
      status: 'Статус',
      allStatuses: 'Все статусы',
      clear: 'Сбросить фильтры',
    },
    empty: {
      title: 'Архивов сотрудников пока нет',
      description:
        'Создайте архив для связи учётной записи, подчинённости и должности.',
      descriptionReadOnly:
        'Вам пока не видны архивы. Обратитесь в отдел кадров, если ожидали их здесь.',
      noResults: 'Нет сотрудников, соответствующих фильтрам.',
    },
    error: {
      title: 'Не удалось загрузить сотрудников',
      requestFailed: 'Ошибка запроса. Проверьте соединение и повторите.',
      forbidden: 'У вас нет права просматривать это.',
      notFound: 'Архив сотрудника не существует или удалён.',
      tabForbidden: 'У вас нет права просматривать этот раздел.',
    },
    actions: {
      label: 'Действия',
      more: 'Действия для {{name}}',
      edit: 'Изменить',
      correctStatus: 'Исправление статуса',
      editProfile: 'Изменить',
      moreActions: 'Другие действия',
    },
    create: {
      action: 'Новый сотрудник',
      title: 'Новый сотрудник',
      description: 'Привяжите учётную запись и заполните архив.',
      submit: 'Создать',
      success: 'Сотрудник «{{name}}» создан',
    },
    edit: {
      title: 'Изменить сотрудника',
      success: 'Сотрудник «{{name}}» сохранён',
    },
    form: {
      basicSection: 'Основная информация',
      contactSection: 'Контакт',
      nameRequired: 'Введите имя.',
      codeRequired: 'Введите код сотрудника.',
      userRequired: 'Выберите учётную запись для привязки.',
      careerStartInvalid:
        'Выберите допустимую дату начала трудовой деятельности.',
      careerStartFuture:
        'Дата начала трудовой деятельности не может быть в будущем.',
      careerStartAfterHire:
        'Дата начала трудовой деятельности не может быть позже даты приёма.',
      hireDateRequired: 'Выберите дату приёма.',
      tooLong: 'Используйте не более {{max}} символов.',
      emailInvalid: 'Недопустимый формат эл. почты.',
      userTaken: 'У этой учётной записи уже есть архив.',
      codeTaken: 'Этот код сотрудника уже используется.',
      userInvalid: 'Эта учётная запись не существует или отключена.',
      managerInvalid:
        'Выберите активного сотрудника, который не подчиняется этому сотруднику.',
      positionInvalid: 'Эта должность не существует или отключена.',
      gradeInvalid: 'Этот разряд не существует или отключён.',
      initialStatus: 'Начальный статус',
      managerPlaceholder: 'Поиск по имени или коду сотрудника',
      managerEmpty: 'Подходящих сотрудников нет',
      none: 'Нет',
      positionPlaceholder: 'Выберите должность',
      gradePlaceholder: 'Выберите разряд',
      optionsFailed: 'Не удалось загрузить варианты.',
      userPlaceholder: 'Поиск учётных записей по имени или эл. почте',
    },
    page: {
      title: 'Сотрудник',
      tabsLabel: 'Разделы сотрудника',
    },
    tabs: {
      basic: 'Основная информация',
      profile: 'Контролируемая информация',
      compensation: 'Оплата',
      history: 'История изменений',
    },
    profile: {
      title: 'Контролируемая информация',
      description:
        'Удостоверение, адрес, образование и банковский счёт; видны только уполномоченным ролям.',
      bankOnly: 'Вам виден только банковский счёт.',
      editTitle: 'Изменить контролируемую информацию',
      success: 'Контролируемая информация «{{name}}» сохранена',
      identitySection: 'Личность',
      educationSection: 'Образование',
      bankSection: 'Банковский счёт',
    },
    compensation: {
      title: 'Оплата',
      description:
        'Каждое зачисление в штат и изменение зарплаты добавляет строку; строки никогда не редактируются.',
      empty: 'Записей об оплате пока нет.',
    },
    history: {
      referenceNotice:
        'Ссылочные имена берутся из текущего справочника; имена на момент изменения не сохранены.',
      sources: {
        onboarding: 'Приём на работу',
        departure: 'Увольнение',
        transfer: 'Кадровое изменение',
        probation: 'Зачисление в штат',
        other: 'Другая бизнес-операция',
      },
      referenceUnavailable: 'Историческая ссылка недоступна',
      personUnavailable: 'Исторический человек недоступен',
      otherField: 'Другое изменение',
      title: 'История изменений',
      description:
        'Приёмы, зачисления в штат, переводы, увольнения и исправления данных.',
      empty: 'Изменений пока не зарегистрировано.',
    },
    correction: {
      title: 'Исправление статуса',
      description:
        'Исправление данных вне процессов согласования. В аудит записывается ваша причина.',
      reason: 'Причина',
      reasonPlaceholder: 'Почему зарегистрированный статус неверен',
      reasonRequired: 'Введите причину исправления.',
      submit: 'Исправить',
      unchanged: 'Исправление ничего не меняет.',
      success: 'Статус «{{name}}» исправлен',
    },
    directory: {
      title: 'Справочник',
      description:
        'Находите коллег по отделу или имени и их контактные данные.',
      searchPlaceholder: 'Поиск по имени или коду сотрудника',
      searchLabel: 'Поиск в справочнике',
      contactHidden: 'Не видно',
      emptyTitle: 'Справочник пуст',
      emptyDescription:
        'Люди появятся здесь после создания архивов отделом кадров.',
      noResults: 'Нет коллег, соответствующих фильтрам.',
      errorTitle: 'Не удалось загрузить справочник',
    },
  },
};

export type EmployeesLocale = typeof employeesEnUS;

export default employeesEnUS;
