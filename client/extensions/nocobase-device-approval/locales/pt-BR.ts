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
  'deviceApproval.title': 'Autorizar um dispositivo',
  'deviceApproval.description':
    'Uma linha de comando ou outro dispositivo solicitou acesso em seu nome. Aprove somente se você iniciou o acesso.',
  'deviceApproval.enterCode': 'Informe o código exibido pelo dispositivo.',
  'deviceApproval.codeLabel': 'Código',
  'deviceApproval.continue': 'Continuar',
  'deviceApproval.checking': 'Verificando o código…',
  'deviceApproval.confirm':
    'Verifique se este código corresponde ao exibido no dispositivo.',
  'deviceApproval.client': 'Solicitado por {{client}}',
  'deviceApproval.approve': 'Aprovar',
  'deviceApproval.approving': 'Aprovando…',
  'deviceApproval.deny': 'Negar',
  'deviceApproval.denying': 'Negando…',
  'deviceApproval.approved':
    'Dispositivo aprovado. Volte ao terminal para continuar; você pode fechar esta página.',
  'deviceApproval.denied':
    'Requisição negada. O dispositivo não foi conectado; você pode fechar esta página.',
  'deviceApproval.expired':
    'Este código expirou. Inicie o acesso no dispositivo novamente.',
  'deviceApproval.invalid':
    'Este código é inválido. Confira no dispositivo e tente novamente.',
  'deviceApproval.notYours':
    'Este código já está sendo aprovado por outra conta.',
  'deviceApproval.error': 'Algo deu errado. Tente novamente.',
  'deviceApproval.retry': 'Tentar novamente',
  'deviceApproval.otherCode': 'Informar outro código',
};

export default enUS;
