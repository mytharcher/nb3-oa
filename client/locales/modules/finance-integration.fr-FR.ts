export default {
  financeIntegration: {
    title: 'Système financier',
    readPermission: 'Consulter la synchronisation financière',
    sendPermission: 'Envoyer et rapprocher les écritures financières',
    send: 'Envoyer au système financier',
    resend: 'Réessayer l’envoi',
    lookup: 'Vérifier le résultat externe',
    reload: 'Actualiser le statut enregistré',
    retry: 'Réessayer',
    cancel: 'Annuler',
    confirmSend: 'Envoyer',
    confirmTitle: 'Envoyer cette demande payée au système financier ?',
    confirmDescription:
      'Les données comptables approuvées seront envoyées au système financier connecté. Cette action n’effectue pas un autre paiement. Une nouvelle tentative réutilise la même référence métier.',
    notConfigured:
      'Aucune passerelle financière n’est connectée. Demandez à votre administrateur de terminer la connexion.',
    loadFailed:
      'Impossible de charger le statut financier. Vérifiez vos accès ou réessayez.',
    actionFailed:
      'L’opération n’a pas pu être confirmée. Actualisez le statut avant de réessayer.',
    conflict:
      'Les données comptables ou la destination ont changé après le premier envoi. Rapprochez l’écriture existante avec les finances avant de poursuivre.',
    confirmBeforeRetry:
      'L’accusé de réception ne prouve pas la comptabilisation. Vérifiez le résultat externe ; si nécessaire, réessayez la même demande.',
    voucher: 'Pièce comptable externe : {{number}}',
    states: {
      not_sent: 'Non envoyé',
      sending: 'Envoi ou vérification du résultat',
      accepted:
        'Reçu par le système financier ; comptabilisation non confirmée',
      posted: 'Pièce comptable créée',
      rejected: 'Refusé par le système financier',
      unknown: 'Résultat à confirmer',
    },
    results: {
      transport:
        'La connexion s’est interrompue avant confirmation du résultat.',
      unconfirmed:
        'Le système financier n’a pas retourné de résultat confirmé.',
      invalid_receipt:
        'L’accusé de réception n’a pas pu être associé à cette demande.',
      not_found:
        'Aucun enregistrement externe trouvé lors de cette vérification. Un accusé de réception antérieur reste valide.',
      invalid_mapping:
        'Le mappage des comptes financiers ou des fournisseurs doit être vérifié.',
      invalid_document:
        'Le système financier a refusé les données du document.',
      duplicate_source:
        'Une écriture externe utilise déjà cette référence métier.',
      accounting_period_closed: 'La période comptable est close.',
      other: 'Demandez aux finances de vérifier le résultat externe.',
    },
  },
};
