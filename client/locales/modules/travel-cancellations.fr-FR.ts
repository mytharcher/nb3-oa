export default {
  // Existing permission titles use the collection name.
  travelCancellations: {
    authz: {
      resource: 'Demandes d’annulation de déplacement',
      submit: 'Soumettre une demande d’annulation de déplacement',
      delegate: 'Soumettre au nom d’un employé',
      view: 'Consulter les demandes d’annulation de déplacement',
    },
  },
  travelCancellation: {
    fieldInvalid: 'Vérifiez {{field}}.',

    sourceUnavailable: 'Déplacement source indisponible',
    exceptionReason: 'Motif d’exception',
    exception: 'Exception d’annulation de réservation',
    businessErrors: {
      TRAVEL_CANCELLATION_REASON_REQUIRED:
        'Saisissez le motif d’annulation du déplacement.',
      TRAVEL_CANCELLATION_ALREADY_PENDING:
        'Une annulation est déjà en attente pour ce déplacement. Ouvrez la demande existante.',
      TRAVEL_CANCELLATION_BASELINE_CHANGED:
        'Le déplacement approuvé a changé. Actualisez-le et révisez l’annulation avant de soumettre à nouveau.',
      TRAVEL_CANCELLATION_INVALID_SOURCE:
        'Le déplacement d’origine n’est plus admissible à l’annulation. Sélectionnez un déplacement approuvé en vigueur.',
    },

    retryUnbooking: 'Réessayer l’annulation administrative',
    bookingInformation: 'Ordre d’annulation et modalités de remboursement',
    unbookingHint:
      'Le déplacement d’origine est révoqué après approbation du chef de service. L’administration doit enregistrer l’annulation et les modalités de remboursement ; cela ne confirme pas un paiement de remboursement.',
    complete: 'Terminer l’annulation administrative',
    unable: 'Impossible d’annuler la réservation',
    forceComplete: 'Forcer la clôture de l’annulation',
    source: 'Déplacement d’origine',
    chooseSource: 'Choisir un déplacement approuvé',
    effectHint:
      'Le chef de service d’origine doit approuver avant la révocation de la présence et de l’autorisation de remboursement. Les avances liées sont traitées selon leur état de versement.',
    cc: 'Ajouter un destinataire en copie',
    authz: {
      resource: 'Demandes d’annulation de déplacement',
      submit: 'Soumettre une demande d’annulation de déplacement',
      delegate: 'Soumettre au nom d’un employé',
      view: 'Consulter les demandes d’annulation de déplacement',
    },
    new: 'Nouvelle demande d’annulation de déplacement',
    edit: 'Modifier la demande d’annulation de déplacement',
    formDescription: 'Demandez l’annulation d’un déplacement approuvé.',
    name: 'Nom de l’annulation de déplacement',
    institution: 'Organisme',
    startAt: 'Début',
    endAt: 'Fin',
    usesWorkingTime: 'Utilise du temps de travail',
    amount: 'Coût (yuans)',
    yuan: 'yuans',
    yes: 'Oui',
    no: 'Non',
    timeZone: 'Fuseau horaire de l’entreprise : {{zone}}',
    amountHint:
      'Saisissez des yuans avec au maximum deux décimales. Les frais nuls sont autorisés.',
    amountInvalid:
      'Saisissez un montant positif ou nul avec au maximum deux décimales.',
    dateInvalid: 'Choisissez une plage valide dont la fin suit le début.',
    approvalHint:
      'L’approbation enregistre la présence liée à l’annulation du déplacement si du temps de travail est utilisé. Une annulation payante crée une enveloppe approuvée de remboursement ; aucun paiement n’a été effectué.',
    approvedFacts:
      'Cette annulation de déplacement a été approuvée. Les RH reçoivent une copie.',
    attendanceRecorded:
      'La présence liée à l’annulation du déplacement a été enregistrée.',
    authorizationIssued:
      'Enveloppe approuvée de remboursement : {{amount}} yuans. Les demandes suivent la politique de l’enveloppe.',
    zeroNoAuthorization:
      'Aucune enveloppe de frais n’est créée pour une annulation de déplacement gratuite.',
    uncertainCreate:
      'Le résultat de l’enregistrement est inconnu. Consultez Mes demandes avant de créer une autre demande.',
    inactive: 'Un dossier d’employé actif est requis.',
    configuration:
      'Impossible de soumettre l’approbation. Contactez un administrateur pour vérifier les délais d’approbation.',
    invalid:
      'Vérifiez les champs de la demande et rechargez le dernier enregistrement si nécessaire.',
    stages: {
      unbooking: 'Annulation administrative de réservation',
      manager: 'Responsable direct',
      head: 'Chef de service',
      finance: 'Finances',
      executive: 'Direction',
      gm: 'Directeur général',
    },
  },
};
