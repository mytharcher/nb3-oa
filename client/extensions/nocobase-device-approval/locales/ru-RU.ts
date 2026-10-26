/** Every key the device approval looks up, so each locale is checked against the same list. */
export interface DeviceApprovalLocale {
  readonly 'deviceApproval.title': string;
  readonly 'deviceApproval.description': string;
  readonly 'deviceApproval.enterCode': string;
  readonly 'deviceApproval.codeLabel': string;
  readonly 'deviceApproval.continue': string;
  readonly 'deviceApproval.checking': string;
  readonly 'deviceApproval.confirm': string;
  readonly 'deviceApproval.client': string;
  readonly 'deviceApproval.approve': string;
  readonly 'deviceApproval.approving': string;
  readonly 'deviceApproval.deny': string;
  readonly 'deviceApproval.denying': string;
  readonly 'deviceApproval.approved': string;
  readonly 'deviceApproval.denied': string;
  readonly 'deviceApproval.expired': string;
  readonly 'deviceApproval.invalid': string;
  readonly 'deviceApproval.notYours': string;
  readonly 'deviceApproval.error': string;
  readonly 'deviceApproval.retry': string;
  readonly 'deviceApproval.otherCode': string;
}

const enUS: DeviceApprovalLocale = {
  'deviceApproval.title': 'Авторизовать устройство',
  'deviceApproval.description':
    'Командная строка или другое устройство запросило вход от вашего имени. Разрешайте только если вы сами начали вход.',
  'deviceApproval.enterCode': 'Введите код, показанный на устройстве.',
  'deviceApproval.codeLabel': 'Код',
  'deviceApproval.continue': 'Продолжить',
  'deviceApproval.checking': 'Проверка кода…',
  'deviceApproval.confirm':
    'Проверьте совпадение кода с показанным на устройстве.',
  'deviceApproval.client': 'Запрошено {{client}}',
  'deviceApproval.approve': 'Согласовать',
  'deviceApproval.approving': 'Согласование…',
  'deviceApproval.deny': 'Запретить',
  'deviceApproval.denying': 'Отклонение…',
  'deviceApproval.approved':
    'Устройство одобрено. Вернитесь в терминал для продолжения; страницу можно закрыть.',
  'deviceApproval.denied':
    'Запрос отклонён. Вход на устройстве не выполнен; страницу можно закрыть.',
  'deviceApproval.expired':
    'Срок кода истёк. Начните вход на устройстве снова.',
  'deviceApproval.invalid':
    'Код недействителен. Сверьте с устройством и повторите.',
  'deviceApproval.notYours': 'Этот код уже одобряется другой учётной записью.',
  'deviceApproval.error': 'Произошла ошибка. Попробуйте снова.',
  'deviceApproval.retry': 'Попробовать снова',
  'deviceApproval.otherCode': 'Ввести другой код',
};

export default enUS;
