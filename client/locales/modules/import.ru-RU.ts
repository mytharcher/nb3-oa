/**
 * English wording of the `import` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `import.zh-CN.ts` is checked against this shape.
 */
const importEnUS = {
  import: {
    navigation: { title: 'Импорт данных' },
    // Titles the server registers in the permission workspace (`server/providers/import/index.ts`).
    authz: {
      settings: 'Импорт данных',
      read: 'Просмотр истории и шаблонов',
      update: 'Импорт',
    },
    title: 'Импорт данных',
    description:
      'Импортируйте отделы, должности, разряды, архивы сотрудников и участников служебных ролей из шаблонов Excel.',
    kinds: {
      departments: 'Отделы',
      positions: 'Должности',
      grades: 'Разряды',
      employees: 'Архивы сотрудников',
      dutyRoleMembers: 'Участники служебных ролей',
    },
    kindHints: {
      departments:
        'Сопоставление по коду отдела. Родительские отделы можно определить ниже на листе.',
      positions: 'Сопоставление по коду должности.',
      grades: 'Сопоставление по коду разряда.',
      employees:
        'Сопоставление по номеру сотрудника. Сначала импортируйте отделы, должности и разряды; руководителей можно определить на том же листе.',
      dutyRoleMembers:
        'Сопоставление по коду роли и учётной записи. «Нет» в столбце активности удаляет участника.',
    },
    actions: {
      new: 'Новый импорт',
      templates: 'Скачать шаблон',
      templateFor: 'Скачать шаблон {{kind}}',
      check: 'Проверить',
      checking: 'Проверка…',
      confirm: 'Импорт',
      importing: 'Импорт…',
      chooseAgain: 'Выбрать другой файл',
      back: 'Назад',
      chooseFile: 'Выбрать файл',
      downloadFile: 'Скачать исходный файл',
      refresh: 'Обновить',
      clearFilters: 'Сбросить фильтры',
    },
    fields: {
      kind: 'Вид',
      file: 'Файл',
      createdAt: 'Начато',
      finishedAt: 'Завершено',
      status: 'Результат',
      summary: 'Сводка',
      actor: 'Кем',
      rowCount: 'Прочитано строк',
      createdCount: 'Создано',
      updatedCount: 'Обновлено',
      unchangedCount: 'Без изменений',
      errorCount: 'Проблемы',
      row: 'Строка',
      column: 'Столбец',
      problem: 'Проблема',
    },
    filters: { allKinds: 'Все виды' },
    status: { succeeded: 'Успешно', failed: 'Ошибка' },
    summary: {
      succeeded:
        'Создано: {{created}} · обновлено: {{updated}} · без изменений: {{unchanged}}',
      failed: 'Проблем: {{count}}',
    },
    noFile: 'Файл не выбран',
    templateFile: 'Шаблон импорта {{kind}}.xlsx',
    fileHint: 'Книга .xlsx размером не более 5 МБ, оформленная по шаблону.',
    notice: {
      title: 'Перед импортом',
      accounts:
        'Импорт никогда не создаёт учётные записи: каждая указанная в файле запись (имя пользователя или эл. почта) должна существовать и быть включённой, иначе строка будет отмечена ошибкой.',
      atomic:
        'Сначала проверяется весь файл, затем записывается целиком: если есть проблема хотя бы в одной строке, ничего не записывается.',
    },
    validation: {
      kindRequired: 'Выберите содержимое файла.',
      fileRequired: 'Выберите файл .xlsx.',
      fileType: 'Можно импортировать только книги .xlsx.',
      fileSize: 'Файл больше 5 МБ. Разделите его на несколько файлов.',
    },
    report: {
      invalidTitle: 'Найдено проблем: {{count}}. Ничего не импортировано.',
      invalidDescription:
        'Исправьте указанные ниже строки в файле, затем проверьте его снова.',
      truncated: 'Перечислены только первые {{shown}} из {{count}} проблем.',
      okTitle: 'Файл прошёл проверку',
      okDescription:
        'Прочитано строк: {{rows}}; будет создано: {{created}}, обновлено: {{updated}}, оставлено без изменений: {{unchanged}}.',
      wholeFile: 'Файл',
    },
    toast: {
      imported: '«{{name}}» импортировано',
      templateFailed: 'Не удалось скачать шаблон. Повторите попытку.',
    },
    failure: {
      forbidden: 'У вас нет права на импорт.',
      tooLarge: 'Файл больше 5 МБ. Разделите его на несколько файлов.',
      invalidFile: 'Не удалось отправить файл. Выберите книгу .xlsx.',
      generic: 'Ошибка запроса. Проверьте соединение и повторите попытку.',
    },
    empty: {
      title: 'Импортов пока нет',
      description:
        'Скачайте шаблон, заполните и импортируйте его для добавления отделов, людей и ролей.',
      readOnly:
        'Импортов пока нет. Попросите администратора импортировать данные организации.',
    },
    noResults: 'Нет импортов, соответствующих фильтру.',
    loadFailedTitle: 'Не удалось загрузить историю импорта',
    detail: {
      title: 'Сведения импорта · {{name}}',
      titleLoading: 'Сведения импорта',
      notFound: 'Этот импорт не существует или удалён.',
      problems: 'Проблемы',
    },
    common: {
      forbidden: 'У вас нет права просматривать это.',
      notFound: 'Эта запись не существует или удалена.',
      loadFailed:
        'Не удалось загрузить данные. Проверьте соединение и повторите.',
    },
    // One sentence per problem code the server reports; {{value}} is the cell, {{header}} its column.
    errors: {
      FILE_UNREADABLE:
        'Файл не является читаемой книгой .xlsx. Сохраните его как книгу Excel и повторите.',
      SHEET_EMPTY:
        'На первом листе нет строк данных. Заполните строки под заголовком.',
      TOO_MANY_ROWS:
        'В файле более {{max}} строк. Разделите его на несколько файлов.',
      HEADER_MISSING:
        'Обязательный столбец «{{header}}» отсутствует в строке заголовков.',
      HEADER_DUPLICATE: 'Столбец «{{header}}» встречается более одного раза.',
      REQUIRED: 'Обязательно.',
      INVALID_CODE:
        '«{{value}}» — недопустимый код: используйте буквы, цифры, «.», «_» и «-», не более 64 символов.',
      TOO_LONG: 'Длина превышает {{max}} символов.',
      INVALID_INTEGER: '«{{value}}» не является целым числом.',
      INVALID_BOOLEAN: '«{{value}}» не является 是 / 否 (да / нет).',
      CAREER_START_FUTURE:
        'Дата начала трудовой деятельности не может быть позже сегодняшней даты в часовом поясе рабочего календаря.',
      CAREER_START_AFTER_HIRE:
        'Дата начала трудовой деятельности не может быть позже даты приёма.',
      INVALID_DATE:
        '«{{value}}» — недопустимая дата. Используйте ячейку даты или YYYY-MM-DD.',
      INVALID_STATUS:
        '«{{value}}» — недопустимый статус: используйте 试用, 正式, 离职中 или 已离职.',
      INVALID_EMAIL: '«{{value}}» не является адресом эл. почты.',
      DUPLICATE_IN_FILE: '«{{value}}» уже встречается в строке {{firstRow}}.',
      USER_NOT_FOUND:
        'Нет учётной записи «{{value}}». Импорт не создаёт учётных записей: сначала создайте её на странице пользователей.',
      USER_DISABLED:
        'Учётная запись «{{value}}» отключена. Сначала включите её на странице пользователей.',
      USER_TAKEN:
        'Учётная запись «{{value}}» уже принадлежит сотруднику {{code}}.',
      USER_MISMATCH:
        'Этот номер сотрудника связан с другой учётной записью; архив сохраняет свою учётную запись.',
      PARENT_NOT_FOUND: 'Нет отдела с кодом «{{value}}» в файле или системе.',
      EXECUTIVE_TOP_LEVEL_ONLY:
        'Только отделы верхнего уровня могут назначать курирующего руководителя; дочерние наследуют его.',
      PARENT_CYCLE: 'Родительские отделы образуют цикл.',
      DEPARTMENT_NOT_FOUND:
        'Нет отдела с кодом «{{value}}». Сначала импортируйте отделы.',
      DEPARTMENT_INACTIVE: 'Отдел «{{value}}» отключён.',
      POSITION_NOT_FOUND: 'Нет должности с кодом «{{value}}».',
      POSITION_INACTIVE: 'Должность «{{value}}» отключена.',
      GRADE_NOT_FOUND: 'Нет разряда с кодом «{{value}}».',
      GRADE_INACTIVE: 'Разряд «{{value}}» отключён.',
      MANAGER_NOT_FOUND:
        'Нет номера сотрудника «{{value}}» в файле или системе.',
      MANAGER_SELF: 'Сотрудник не может быть собственным руководителем.',
      MANAGER_INACTIVE: 'Руководитель «{{value}}» уволен.',
      MANAGER_CYCLE: 'Руководители образуют цикл.',
      DUTY_ROLE_INACTIVE:
        'Эта роль неактивна; новых участников добавить нельзя.',
      DUTY_ROLE_NOT_FOUND: 'Нет служебной роли с кодом «{{value}}».',
      WRITE_FAILED:
        'Эту строку не удалось записать ({{reason}}), поэтому ничего не импортировано. Проверьте строку и повторите.',
      unknown: 'Эту строку нельзя импортировать.',
    },
  },
};

export type ImportLocale = typeof importEnUS;

export default importEnUS;
