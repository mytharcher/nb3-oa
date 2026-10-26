export default {
  certificates: {
    authz: {
      requests: 'Заявки на справки',
      view: 'Просмотр',
      create: 'Создать',
      edit: 'Изменить',
      operate: 'Выполнить',
      issue: 'Выдать',
      income: 'Доход',
      owned: 'Собственное',
    },
    errors: {
      CERTIFICATE_ACCESS_DENIED:
        'Операция со справкой отклонена: доступ запрещён',
      CERTIFICATE_APPROVAL_REFUSED:
        'Операция со справкой отклонена: согласование отказано',
      CERTIFICATE_ARTIFACT_MISSING:
        'Операция со справкой отклонена: артефакт отсутствует',
      CERTIFICATE_CLAIM_REQUIRED:
        'Операция со справкой отклонена: требуется принятие в работу',
      CERTIFICATE_COMMAND_CONFLICT:
        'Операция со справкой отклонена: конфликт команд',
      CERTIFICATE_COMMAND_INVALID:
        'Операция со справкой отклонена: недопустимая команда',
      CERTIFICATE_DEPARTMENT_REQUIRED:
        'Операция со справкой отклонена: требуется отдел',
      CERTIFICATE_EMPLOYEE_REQUIRED:
        'Операция со справкой отклонена: требуется сотрудник',
      CERTIFICATE_HEAD_REQUIRED:
        'Операция со справкой отклонена: требуется начальник',
      CERTIFICATE_HR_REQUIRED:
        'Операция со справкой отклонена: требуется отдел кадров',
      CERTIFICATE_INCOME_DENIED:
        'Операция со справкой отклонена: доступ к доходу запрещён',
      CERTIFICATE_INCOME_INVALID:
        'Операция со справкой отклонена: недопустимый доход',
      CERTIFICATE_INVALID:
        'Операция со справкой отклонена: недопустимые данные',
      CERTIFICATE_PREPARATION_INVALID:
        'Операция со справкой отклонена: недопустимая подготовка',
      CERTIFICATE_PREPARATION_MISSING:
        'Операция со справкой отклонена: подготовка отсутствует',
      CERTIFICATE_PREPARATION_STALE:
        'Операция со справкой отклонена: подготовка устарела',
      CERTIFICATE_SOURCE_STALE:
        'Операция со справкой отклонена: источник устарел',
      CERTIFICATE_TARGET_MISMATCH:
        'Операция со справкой отклонена: цель не совпадает',
      CERTIFICATE_TEMPLATE_DENIED:
        'Операция со справкой отклонена: доступ к шаблону запрещён',
    },
  },
};
