export default {
  headcounts: {
    authz: {
      title: 'Штатная вместимость',
      view: 'Просмотр вместимости',
      manage: 'Управление годовой вместимостью',
      viewJournal: 'Просмотр журнала источников',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        'Полный список сотрудников недоступен для чтения. Попросите администратора проверить права чтения сотрудников.',
      HEADCOUNT_ACCESS_DENIED:
        'У вас нет права выполнять эту операцию со штатной численностью.',
      HEADCOUNT_FIELD_ACCESS_DENIED: 'Поля сводки вместимости вне ваших прав.',
      HEADCOUNT_NOT_FOUND: 'Счёт штатной численности недоступен.',
      HEADCOUNT_ALREADY_EXISTS:
        'Для этих отдела, должности и года уже есть счёт.',
      HEADCOUNT_NOT_INITIALIZED:
        'Сверьте полный список сотрудников перед резервированием мест.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        'Выберите полный фактический список сотрудников на испытательном сроке, штатных и увольняющихся.',
      HEADCOUNT_ROSTER_DRIFT:
        'Фактический список сотрудников изменился. Сверьте исходные факты перед продолжением.',
      HEADCOUNT_VERSION_CONFLICT:
        'Счёт изменился. Обновите его перед сохранением.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT:
        'Этот идентификатор запроса уже принадлежит другой операции.',
      HEADCOUNT_INSUFFICIENT:
        'Годовой лимит не покрывает фактически занятые и зарезервированные места.',
      HEADCOUNT_INVALID_NUMBER:
        'Введите целое число людей в допустимом диапазоне.',
      HEADCOUNT_INVALID_ACCOUNT: 'Выберите реальные отдел, должность и год.',
      HEADCOUNT_INVALID_IDENTITY:
        'Выберите активные отдел и должность организации.',
      HEADCOUNT_INVALID_COMMAND:
        'Требуются исполнитель, идентификатор запроса и причина.',
      HEADCOUNT_INVALID_SOURCE:
        'Требуются реальные тип источника и идентификатор.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        'Каждому месту замены нужен отдельный увольняющийся сотрудник.',
      HEADCOUNT_INVALID_REPLACEMENT:
        'Источник замены должен соответствовать реальному месту увольняющегося или уволенного сотрудника.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'Это место замены отсутствует или уже занято.',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        'Восстановленный исходный сотрудник блокирует эту замену.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND: 'Архив сотрудника недоступен.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        'Фактический сотрудник не соответствует выделенным отделу и должности.',
      HEADCOUNT_ALREADY_OCCUPIED:
        'Этот сотрудник уже занимает этот годовой счёт.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        'Явно перепривяжите к текущему году компании перед использованием.',
      HEADCOUNT_SOURCE_NOT_FOUND: 'Источник вместимости недоступен.',
      HEADCOUNT_SOURCE_EXISTS: 'У этого источника уже есть резерв.',
      HEADCOUNT_SOURCE_STATE: 'Состояние источника не разрешает эту операцию.',
      HEADCOUNT_SOURCE_CLOSED: 'Источник вместимости уже закрыт.',
      HEADCOUNT_SEAT_STATE: 'Резервируемое место не в ожидании.',
      HEADCOUNT_STATE_CONFLICT: 'Резервируемое место изменилось.',
      HEADCOUNT_NO_ALLOCATION: 'Согласованных свободных мест не осталось.',
      HEADCOUNT_NOT_LEFT:
        'Для освобождения занятого места требуется фактическое увольнение.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        'Требуется реальное неосвобождённое место сотрудника.',
      HEADCOUNT_NOT_RESTORED:
        'Для блокировки будущих замен требуется фактическое восстановление.',
      HEADCOUNT_INVALID_REBIND:
        'Годовая перепривязка должна сохранять отдел и должность и двигаться вперёд.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        'Для зачёта замен требуются явные источники целевого года.',
      HEADCOUNT_INVALID_TRANSFER:
        'Требуется отдельный согласованный целевой резерв.',
      HEADCOUNT_INVALID_PAGE: 'Выберите размер страницы от 1 до 100.',
      HEADCOUNT_GUARD_UNAVAILABLE: 'Защита транзакций вместимости недоступна.',
    },
  },
};
