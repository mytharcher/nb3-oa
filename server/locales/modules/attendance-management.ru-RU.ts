export default {
  attendanceManagement: {
    errors: {
      ATTENDANCE_INVALID_INPUT: 'Недопустимые исходные данные посещаемости.',
      ATTENDANCE_INVALID_TIME:
        'Отметка должна принадлежать дате посещаемости компании.',
      ATTENDANCE_INVALID_BATCH:
        'Предоставьте 1–1000 строк в пределах лимита размера данных.',
      ATTENDANCE_SOURCE_CONFLICT:
        'Ключ источника определяет другие неизменяемые данные.',
      ATTENDANCE_IDENTITY_UNAVAILABLE:
        'Каждой строке нужен реальный человек с архивом сотрудника.',

      NOT_FOUND: 'Эта смена больше не существует.',
      ACCESS_DENIED: 'У вас нет доступа к этой конфигурации посещаемости.',
      ATTENDANCE_ACCESS_DENIED:
        'Текущие права на запись или поля не разрешают это изменение.',
      ATTENDANCE_VERSION_CONFLICT:
        'Конфигурация изменилась. Перезагрузите перед сохранением.',
      ATTENDANCE_SHIFT_INVALID: 'Введите допустимое явное определение смены.',
      ATTENDANCE_SHIFT_NOT_FOUND: 'Смена отсутствует или отключена.',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE: 'Код смены нельзя изменить.',
      ATTENDANCE_SHIFT_CODE_CONFLICT: 'Этот код смены уже существует.',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED:
        'Используйте редакцию в текущем часовом поясе компании.',
      ATTENDANCE_SCHEDULE_INVALID:
        'Выберите реальную дату и явную смену или выходной.',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE: 'Этот отдел недоступен.',
      ATTENDANCE_SCHEDULE_NOT_READABLE:
        'Текущая редакция расписания недоступна для чтения.',
      ATTENDANCE_LIST_INVALID: 'Недопустимые параметры страницы.',
      ATTENDANCE_LOCAL_TIME_INVALID:
        'Местное время пропущено или повторяется из-за перехода на летнее время. Выберите однозначные границы.',
    },
    authz: {
      importResource: 'Импорт исходной посещаемости',
      ingest: 'Импорт неизменяемых данных',
      attendanceRecords: 'Исходные записи посещаемости',

      resource: 'Настройки посещаемости',
      view: 'Просмотр настроек посещаемости',
      manage: 'Управление настройками посещаемости',
      attendanceShifts: 'Смены посещаемости',
      attendanceShiftRevisions: 'Редакции смен',
      attendanceSchedules: 'Расписания отделов',
      attendanceScheduleRevisions: 'Редакции расписаний',
    },
  },
};
