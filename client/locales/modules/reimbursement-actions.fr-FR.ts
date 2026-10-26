export default {
  actionForm: {
    uncertain:
      'Le résultat n’est pas confirmé. Conservez cette saisie et réessayez l’opération identique ; n’émettez pas une demande modifiée.',
    replay: 'Réessayer l’opération identique',
    ownedScope: 'Remboursements dont je suis propriétaire ou créateur',
    title: '{{action}} le remboursement « {{name}} »',
    unavailable:
      'Cette action n’est plus disponible. Lisez le dernier remboursement.',
    unsupported:
      'Cette action nécessite un contrat de saisie que cette page ne prend pas en charge.',
    submitRequirements:
      'L’approbation utilise le motif et les lignes de frais enregistrés dans le brouillon. Modifiez le remboursement pour saisir son motif, les catégories, dates, montants et numéros de facture, puis sélectionnez des justificatifs pour chaque ligne.',
    reasonRequired:
      'Le brouillon n’a pas de motif de remboursement. Modifiez d’abord le remboursement.',
    linesRequired:
      'Le brouillon ne comporte aucune ligne de frais. Modifiez le remboursement et téléversez d’abord les justificatifs.',
    lineIncomplete:
      'La ligne de frais {{number}} est incomplète. Ajoutez une catégorie, une date, un montant positif, un numéro de facture et des justificatifs.',
    duplicateLines:
      'Des lignes de frais sont en double. Modifiez le remboursement et vérifiez ses lignes.',
    editDraft: 'Modifier le remboursement',
    comment: 'Avis ou motif',
    person: 'Destinataire',
    mode: 'Position de l’approbateur',
    place: 'Emplacement d’approbation',
    returnTarget: 'Destination du retour',
    voucher: 'Numéro du justificatif de paiement',
    voucherHint:
      'Laissez vide uniquement pour l’enregistrement administratif d’un règlement sans justificatif.',
    grossConfirm: 'Confirmer le remboursement brut',
    offsetConfirm: 'Confirmer la compensation d’avance',
    netConfirm: 'Confirmer le net en espèces',
    exactAmount: 'Saisissez le montant exact affiché ci-dessus.',
    confirm: 'Confirmer {{action}}',
    confirmDescription:
      'Confirmez cette opération sur « {{name}} ». Brut {{gross}}, compensation d’avance {{offset}}, net en espèces {{net}}. {{consequence}}',
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
    line: 'Ligne de frais sélectionnée',
    noLine: 'La ligne d’approbation sélectionnée est indisponible.',
    latest: 'Lire la dernière version',
    conflict:
      'Le remboursement a changé. Votre saisie est conservée. Lisez la dernière version, vérifiez-la, puis confirmez à nouveau.',
    completed: '{{action}} terminé pour « {{name}} »',
    committed:
      'L’opération est terminée. Actualisez le remboursement avant toute autre action.',
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
      returnItem: 'Renvoyer la ligne de frais',
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
