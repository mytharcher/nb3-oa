export default {
  actionForm: {
    uncertain:
      'Le résultat n’est pas confirmé. Conservez cette saisie et réessayez l’opération identique ; n’émettez pas une demande modifiée.',
    replay: 'Réessayer l’opération identique',
    title: '{{action}} la demande de paiement « {{name}} »',
    unavailable:
      'Cette action n’est plus disponible. Lisez la dernière demande de paiement.',
    unsupported:
      'Cette action nécessite un contrat de saisie que cette page ne prend pas en charge.',
    comment: 'Avis ou motif',
    person: 'Destinataire',
    mode: 'Position de l’approbateur',
    place: 'Emplacement d’approbation',
    returnTarget: 'Destination du retour',
    voucher: 'Numéro du justificatif de paiement',
    voucherHint:
      'Laissez vide uniquement pour l’enregistrement administratif d’un règlement sans justificatif.',
    amount: 'Montant du paiement',
    amountConfirm: 'Confirmer le montant exact du paiement',
    voucherAttachments: 'Pièces justificatives du paiement',
    exactAmount: 'Saisissez le montant exact affiché ci-dessus.',
    confirm: 'Confirmer {{action}}',
    confirmDescription:
      'Confirmez cette opération sur « {{name}} ». Paiement {{amount}}. {{consequence}}',
    releaseConsequence:
      'Cette action libère les réservations non réglées et ne peut pas être annulée ici.',
    returnConsequence:
      'La demande est renvoyée pour correction et les tâches actuellement en attente sont clôturées.',
    paymentConsequence:
      'Enregistrer un paiement réellement effectué avec son justificatif.',
    forcedConsequence:
      'Enregistrer un règlement administratif ; cette action ne déclenche aucun virement bancaire.',
    unableConsequence: 'La demande entre en exception de traitement.',
    submitConsequence:
      'La demande entre en approbation avec ses données soumises figées.',
    genericConsequence:
      'Le serveur applique l’opération proposée à la cible d’approbation sélectionnée.',
    latest: 'Lire la dernière version',
    conflict:
      'La demande de paiement a changé. Votre saisie est conservée. Lisez la dernière version, vérifiez-la, puis confirmez à nouveau.',
    completed: '{{action}} terminé pour « {{name}} »',
    committed:
      'L’opération est terminée. Actualisez la demande de paiement avant toute autre action.',
    before: 'Avant',
    after: 'Après',
    alongside: 'En parallèle',
    revision: 'Correction du demandeur',
    required: 'Remplissez ce champ.',
    labels: {
      approve: 'Approuver',
      reject: 'Rejeter',
      return: 'Renvoyer pour correction',
      returnTo: 'Renvoyer pour correction',
      submit: 'Soumettre pour approbation',
      withdraw: 'Retirer',
      terminate: 'Clôturer',
      retryCash: 'Réessayer le traitement de caisse',
      retryCashAsAdmin: 'Nouvelle tentative administrative de caisse',
      forcePayException: 'Enregistrer un règlement exceptionnel',
      forceComplete: 'Règlement administratif',
      reviseBusiness: 'Réviser pour approbation',
      claim: 'Prendre en charge',
      release: 'Libérer',
      assign: 'Attribuer',
      complete: 'Confirmer le paiement',
      unable: 'Impossible de payer',
      transfer: 'Transférer',
      addSigner: 'Ajouter un approbateur',
      cc: 'Mettre en copie',
      appoint: 'Désigner',
      reassign: 'Réattribuer',
      comment: 'Commenter',
      read: 'Marquer comme lu',
      urge: 'Relancer',
    },
  },
};
