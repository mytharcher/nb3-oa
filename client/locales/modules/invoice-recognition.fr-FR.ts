export default {
  invoiceRecognition: {
    currentValues: 'Valeurs actuelles non enregistrées',
    reload: 'Actualiser le résultat enregistré',
    receivedAt: 'Résultat reçu : {{time}}',
    notConfigured:
      'La passerelle de factures n’est pas connectée. Vous pouvez continuer à saisir les détails des factures manuellement.',
    title: 'Reconnaissance et vérification des factures',
    readPermission: 'Lire les résultats des factures',
    recognizePermission:
      'Reconnaître les pièces jointes de factures modifiables',
    verifyPermission: 'Vérifier les lignes de facture autorisées',
    recognizeAttachment: 'Reconnaître la pièce jointe {{index}}',
    verifyAttachment: 'Vérifier la facture · pièce jointe {{index}}',
    processing: 'Traitement de la facture…',
    failed:
      'Impossible de terminer cette opération. Vérifiez vos accès et la configuration de la passerelle, puis réessayez. Les valeurs saisies restent inchangées.',
    changed:
      'Cette ligne a changé. Exécutez à nouveau l’opération avant d’appliquer ce résultat ou de vous y fier.',
    unconfirmed: 'Le résultat n’a pas été confirmé.',
    recover: 'Vérifier le résultat externe',
    reference: 'Référence de vérification : {{reference}}',
    confirmTitle: 'Vérifier la facture reconnue',
    confirmDescription:
      'Comparez ces suggestions à la pièce jointe d’origine. Leur application ne modifie que cette ligne non enregistrée ; elle n’enregistre, ne soumet ni ne vérifie la facture.',
    number: 'Numéro de facture',
    date: 'Date de facture',
    amount: 'Total toutes taxes comprises',
    cancel: 'Annuler',
    apply: 'Appliquer à cette ligne',
    states: {
      not_checked: 'Non vérifié',
      pending: 'En attente de traitement',
      running: 'Traitement en cours',
      recognized: 'Reconnu ; vérifier avant application',
      multiple:
        'Plusieurs factures trouvées. Séparez la pièce jointe ou saisissez cette ligne manuellement.',
      unreadable:
        'Impossible de reconnaître cette facture. Saisissez ses détails manuellement.',
      rejected: 'Le service externe n’a pas pu traiter cette facture.',
      valid:
        'La vérification externe correspond aux données actuelles de la facture.',
      mismatch:
        'Les données de la facture ne correspondent pas à la vérification externe.',
      not_found:
        'Aucune facture correspondante trouvée. Demandez aux finances de vérifier.',
      unknown:
        'Résultat non confirmé. Consultez le résultat externe avant de réessayer.',
    },
  },
};
