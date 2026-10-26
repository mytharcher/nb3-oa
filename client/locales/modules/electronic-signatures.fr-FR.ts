export default {
  electronicSignatures: {
    archivedHint:
      'Le service de signature a confirmé la fin du processus. Le PDF signé et vérifié a été archivé avec cette demande.',
    reference: 'Référence de signature : {{value}}',
    completedAction: 'Signature électronique archivée',
    title: 'Signature électronique',
    readPermission: 'Consulter les documents signés',
    sendPermission: 'Envoyer et récupérer la signature',
    channel: 'Canal d’exécution',
    physical: 'Sceau physique',
    electronic: 'Signature électronique',
    channelHint:
      'Choisissez avant l’approbation. La signature électronique exige un PDF approuvé et ne prévoit pas de nombre d’exemplaires papier.',
    hint: 'Le PDF approuvé est envoyé au service de signature configuré. L’achèvement n’est confirmé qu’après vérification et archivage du document signé.',
    notConfigured:
      'La signature électronique n’est pas connectée. Contactez votre administrateur.',
    notEligible:
      'La signature exige un document actuel approuvé au format PDF. Les demandes de sceau électronique doivent contenir exactement un PDF.',
    loadFailed:
      'Impossible de charger le statut de signature, ou vous n’avez pas l’autorisation de le consulter.',
    actionFailed:
      'L’action n’a pas pu être terminée. Actualisez le statut avant de réessayer.',
    retry: 'Réessayer',
    send: 'Envoyer pour signature',
    refresh: 'Vérifier le statut / récupérer',
    open: 'Poursuivre la signature',
    download: 'Télécharger le PDF signé',
    recovery:
      'Le résultat distant ou l’archive nécessite une confirmation. Vérifiez le statut pour récupérer la même demande de signature.',
    signedAt: 'Signé le {{at}}',
    confirmTitle: 'Envoyer ce PDF approuvé pour signature ?',
    confirmHint:
      'Le service de signature configuré reçoit le document approuvé. Une nouvelle tentative utilise la même demande de signature.',
    cancel: 'Annuler',
    states: {
      not_sent: 'Non envoyé',
      pending: 'En attente de soumission',
      sending: 'Envoi',
      accepted: 'Accepté par le service de signature',
      signing: 'En attente des signatures',
      unknown: 'Résultat en attente de confirmation',
      archivePending: 'Signé — récupération de l’archive nécessaire',
      archived: 'Document signé archivé',
      rejected: 'Refusé par le service de signature',
      cancelled: 'Annulé par le service de signature',
    },
  },
};
