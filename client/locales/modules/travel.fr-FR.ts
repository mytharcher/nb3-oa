export default {
  travel: {
    fieldInvalid: 'Vérifiez {{field}}.',

    confirmRetryBooking:
      'Réessayer la réservation de ce déplacement approuvé ?',
    confirmReviseTrip: 'Réviser ce déplacement et relancer son approbation ?',
    states: {
      completed: 'Terminé',
      cancelled: 'Annulé',
      exception: 'Exception de réservation',
    },
    businessErrors: {
      TRAVEL_ITINERARY_REQUIRED:
        'Un déplacement international nécessite un itinéraire joint. Téléversez-en ou sélectionnez-en un avant de soumettre.',
      TRAVEL_OVERLAP:
        'Cette période chevauche un déplacement approuvé. Ajustez les dates du déplacement.',
      TRAVEL_COMPANIONS_INVALID:
        'Sélectionnez des accompagnants distincts du demandeur.',
      TRAVEL_COMPANION_INACTIVE:
        'Un voyageur sélectionné n’est plus actif. Sélectionnez à nouveau des employés actuels.',
      TRAVEL_DEPARTMENT_REQUIRED:
        'Le demandeur doit avoir un service principal actif. Demandez aux RH de mettre à jour le dossier de l’employé.',
      TRAVEL_INVALID_DATE:
        'La fin du déplacement doit suivre son début. Vérifiez les deux dates et horaires.',
      TRAVEL_INVALID_INPUT:
        'Complétez la destination et le motif, puis saisissez des frais de déplacement positifs ou nuls valides.',
    },

    requestLoan: 'Demander une avance liée',
    reviseTrip: 'Réviser le déplacement et relancer l’approbation',
    revisionWarning:
      'La révision clôture l’ancienne enveloppe de remboursement et termine l’ancienne activité de présence avant une nouvelle approbation. Le capital des avances existantes et leurs échéances d’origine restent inchangés ; traitez les avances séparément.',
    cancelTrip: 'Demander l’annulation du déplacement',
    complete: 'Terminer la réservation',
    unable: 'Impossible de réserver',
    forceComplete: 'Forcer la clôture de la réservation',
    retryBooking: 'Réessayer la réservation',
    standard: 'Barème de déplacement figé',
    lodgingPerNight: 'Barème d’hébergement par nuit (yuans)',
    allowancePerDay: 'Barème d’indemnité par jour (yuans)',
    companions: 'Accompagnants',
    addCompanion: 'Ajouter un accompagnant',
    removeCompanion: 'Retirer',
    companionsInvalid: 'Les accompagnants doivent être distincts',
    peopleUnavailable:
      'Vos autorisations ne permettent pas la recherche d’employés. Contactez un administrateur.',
    destination: 'Destination',
    international: 'Déplacement international',
    needsBooking: 'Réservation administrative',
    needsLoan: 'Avance demandée',
    transportCents: 'Transport',
    lodgingCents: 'Hébergement',
    allowanceCents: 'Indemnité',
    bookingInformation: 'Détails de la réservation',
    exceptionReason: 'Motif d’exception',
    cc: 'Ajouter un destinataire en copie',
    authz: {
      resource: 'Demandes de déplacement',
      submit: 'Soumettre une demande de déplacement',
      delegate: 'Soumettre au nom d’un employé',
      view: 'Consulter les demandes de déplacement',
    },
    new: 'Nouvelle demande de déplacement',
    edit: 'Modifier la demande de déplacement',
    formDescription: 'Demandez un déplacement professionnel.',
    name: 'Nom du déplacement',
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
      'L’approbation enregistre la présence en déplacement et crée une enveloppe de remboursement pour les estimations positives. La réservation et le versement des avances sont distincts.',
    approvedFacts:
      'L’approbation du déplacement est terminée ; la progression de la réservation est affichée séparément.',
    attendanceRecorded:
      'L’activité de présence en déplacement a été enregistrée.',
    authorizationIssued:
      'Enveloppe approuvée de remboursement : {{amount}} yuans. Les demandes suivent la politique de l’enveloppe.',
    zeroNoAuthorization:
      'Des coûts estimés nuls ne créent aucune enveloppe ; l’examen financier reste requis.',
    uncertainCreate:
      'Le résultat de l’enregistrement est inconnu. Consultez Mes demandes avant de créer une autre demande.',
    inactive: 'Un dossier d’employé actif est requis.',
    configuration:
      'Impossible de soumettre l’approbation. Contactez un administrateur pour vérifier les délais d’approbation.',
    invalid:
      'Vérifiez les champs de la demande et rechargez le dernier enregistrement si nécessaire.',
    stages: {
      completed: 'Terminé',
      manager: 'Responsable direct',
      head: 'Chef de service',
      finance: 'Finances',
      executive: 'Direction',
      gm: 'Directeur général',
      booking: 'Réservation administrative',
    },
  },
};
