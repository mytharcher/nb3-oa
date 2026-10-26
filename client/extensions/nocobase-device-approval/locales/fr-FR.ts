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
  'deviceApproval.title': 'Autoriser un appareil',
  'deviceApproval.description':
    'Un outil en ligne de commande ou un autre appareil a demandé à se connecter en votre nom. Approuvez uniquement si vous avez vous-même lancé la connexion.',
  'deviceApproval.enterCode': 'Saisissez le code affiché par votre appareil.',
  'deviceApproval.codeLabel': 'Code',
  'deviceApproval.continue': 'Continuer',
  'deviceApproval.checking': 'Vérification du code…',
  'deviceApproval.confirm':
    'Vérifiez que ce code correspond à celui affiché par votre appareil.',
  'deviceApproval.client': 'Demandé par {{client}}',
  'deviceApproval.approve': 'Approuver',
  'deviceApproval.approving': 'Approbation…',
  'deviceApproval.deny': 'Refuser',
  'deviceApproval.denying': 'Refus…',
  'deviceApproval.approved':
    'Appareil approuvé. Revenez à votre terminal pour continuer ; vous pouvez fermer cette page.',
  'deviceApproval.denied':
    'Demande refusée. L’appareil n’a pas été connecté ; vous pouvez fermer cette page.',
  'deviceApproval.expired':
    'Ce code a expiré. Relancez la connexion sur votre appareil.',
  'deviceApproval.invalid':
    'Ce code est invalide. Comparez-le avec votre appareil et réessayez.',
  'deviceApproval.notYours':
    'Ce code est déjà en cours d’approbation par un autre compte.',
  'deviceApproval.error': 'Un problème est survenu. Réessayez.',
  'deviceApproval.retry': 'Réessayer',
  'deviceApproval.otherCode': 'Saisir un autre code',
};

export default enUS;
