export default {
  actionForm: {
    limit: 'Cette valeur est trop longue.',
    evaluation: 'Évaluation du responsable',
    conclusion: 'Conclusion',
    regular: 'Confirmer l’emploi',
    deferred: 'Prolonger la période d’essai',
    declined: 'Refuser la confirmation',
    deferredTo: 'Fin de période d’essai prolongée',
    dateRequired:
      'Choisissez une date valide postérieure à la fin de période d’essai soumise.',
    grade: 'Grade',
    baseSalary: 'Salaire de base',
    salaryInvalid:
      'Saisissez un montant décimal avec au maximum 14 chiffres entiers et 2 décimales.',
    privateDenied:
      'Vous ne pouvez pas consulter la rémunération. L’approbation RH ne peut pas être confirmée.',
    approveConsequence:
      'L’approbation proposée est enregistrée. L’approbation finale applique le résultat d’emploi approuvé.',

    uncertain:
      'Le résultat n’est pas confirmé. Conservez cette saisie et réessayez l’opération identique ; n’émettez pas une demande modifiée.',
    replay: 'Réessayer l’opération identique',
    title: '{{action}} la demande de période d’essai « {{name}} »',
    unavailable:
      'Cette action n’est plus disponible. Lisez la dernière demande de période d’essai.',
    unsupported:
      'Cette action nécessite un contrat de saisie que cette page ne prend pas en charge.',
    comment: 'Avis ou motif',
    person: 'Destinataire',
    mode: 'Position de l’approbateur',
    place: 'Emplacement d’approbation',
    returnTarget: 'Destination du retour',
    confirm: 'Confirmer {{action}}',
    confirmDescription:
      'Confirmez cette opération sur « {{name}} ». {{consequence}}',
    releaseConsequence:
      'Cette action libère les tâches d’approbation en attente et ne peut pas être annulée ici.',
    returnConsequence:
      'La demande est renvoyée pour correction et les tâches actuellement en attente sont clôturées.',
    submitConsequence:
      'La demande entre en approbation avec ses données soumises figées.',
    genericConsequence:
      'Le serveur applique l’opération proposée à la cible d’approbation sélectionnée.',
    latest: 'Lire la dernière version',
    conflict:
      'La demande de période d’essai a changé. Votre saisie est conservée. Lisez la dernière version, vérifiez-la, puis confirmez à nouveau.',
    completed: '{{action}} terminé pour « {{name}} »',
    committed:
      'L’opération est terminée. Actualisez la demande de période d’essai avant toute autre action.',
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
      claim: 'Prendre en charge',
      release: 'Libérer',
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
