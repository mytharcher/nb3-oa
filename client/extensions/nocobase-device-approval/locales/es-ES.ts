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
  'deviceApproval.title': 'Autorizar un dispositivo',
  'deviceApproval.description':
    'Una línea de comandos u otro dispositivo ha solicitado iniciar sesión con tu identidad. Apruébalo solo si has iniciado tú el acceso.',
  'deviceApproval.enterCode': 'Introduce el código que muestra tu dispositivo.',
  'deviceApproval.codeLabel': 'Código',
  'deviceApproval.continue': 'Continuar',
  'deviceApproval.checking': 'Comprobando el código…',
  'deviceApproval.confirm':
    'Comprueba que este código coincide con el que muestra tu dispositivo.',
  'deviceApproval.client': 'Solicitado por {{client}}',
  'deviceApproval.approve': 'Aprobar',
  'deviceApproval.approving': 'Aprobando…',
  'deviceApproval.deny': 'Denegar',
  'deviceApproval.denying': 'Denegando…',
  'deviceApproval.approved':
    'Dispositivo aprobado. Vuelve al terminal para continuar; puedes cerrar esta página.',
  'deviceApproval.denied':
    'Solicitud denegada. El dispositivo no ha iniciado sesión; puedes cerrar esta página.',
  'deviceApproval.expired':
    'Este código ha caducado. Vuelve a iniciar el acceso en tu dispositivo.',
  'deviceApproval.invalid':
    'Este código no es válido. Compáralo con el de tu dispositivo y vuelve a intentarlo.',
  'deviceApproval.notYours': 'Otra cuenta ya está aprobando este código.',
  'deviceApproval.error': 'Se ha producido un error. Vuelve a intentarlo.',
  'deviceApproval.retry': 'Volver a intentar',
  'deviceApproval.otherCode': 'Introducir otro código',
};

export default enUS;
