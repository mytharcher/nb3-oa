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
  'deviceApproval.title': 'Gerät autorisieren',
  'deviceApproval.description':
    'Eine Befehlszeile oder ein anderes Gerät möchte sich als Sie anmelden. Genehmigen Sie dies nur, wenn Sie die Anmeldung selbst gestartet haben.',
  'deviceApproval.enterCode':
    'Geben Sie den auf Ihrem Gerät angezeigten Code ein.',
  'deviceApproval.codeLabel': 'Code',
  'deviceApproval.continue': 'Weiter',
  'deviceApproval.checking': 'Code wird geprüft…',
  'deviceApproval.confirm':
    'Prüfen Sie, ob dieser Code mit dem auf Ihrem Gerät angezeigten Code übereinstimmt.',
  'deviceApproval.client': 'Angefordert von {{client}}',
  'deviceApproval.approve': 'Genehmigen',
  'deviceApproval.approving': 'Wird genehmigt…',
  'deviceApproval.deny': 'Verweigern',
  'deviceApproval.denying': 'Wird verweigert…',
  'deviceApproval.approved':
    'Gerät genehmigt. Kehren Sie zum Terminal zurück, um fortzufahren. Sie können diese Seite schließen.',
  'deviceApproval.denied':
    'Anfrage verweigert. Das Gerät wurde nicht angemeldet. Sie können diese Seite schließen.',
  'deviceApproval.expired':
    'Dieser Code ist abgelaufen. Starten Sie die Anmeldung auf Ihrem Gerät erneut.',
  'deviceApproval.invalid':
    'Dieser Code ist ungültig. Vergleichen Sie ihn mit Ihrem Gerät und versuchen Sie es erneut.',
  'deviceApproval.notYours':
    'Dieser Code wird bereits von einem anderen Konto genehmigt.',
  'deviceApproval.error':
    'Ein Fehler ist aufgetreten. Versuchen Sie es erneut.',
  'deviceApproval.retry': 'Erneut versuchen',
  'deviceApproval.otherCode': 'Anderen Code eingeben',
};

export default enUS;
