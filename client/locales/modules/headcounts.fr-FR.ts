export default {
  headcounts: {
    technicalDetails: 'Détails techniques',
    copyId: 'Copier l’identifiant interne',
    copyFailed: 'Impossible de copier l’identifiant interne.',

    name: '{{department}} / {{position}} / {{year}}',
    createSubmit: 'Créer',
    idCopied: 'Identifiant du compte copié',
    title: 'Registre des effectifs',
    description:
      'Capacité annuelle et occupation effective par les employés. Initialisez un compte avant le recrutement.',
    account: 'Effectif annuel',
    state: 'Statut d’initialisation',
    create: 'Nouvel effectif annuel',
    adjust: 'Ajuster le plafond',
    alreadyInitialized:
      'Ce compte est déjà initialisé. Son occupation réelle ne peut pas être recomptée ici.',
    reconcile: 'Vérifier et initialiser',
    confirmInitialize: 'Confirmer l’initialisation',
    initialized: 'Initialisé',
    uninitialized: 'Non initialisé',
    view: 'Consulter les effectifs',
    refresh: 'Actualiser',
    cancel: 'Annuler',
    save: 'Enregistrer',
    clearFilters: 'Effacer les filtres',
    allPositions: 'Tous les postes',
    rowActions: 'Actions pour « {{name}} »',
    empty: 'Aucun effectif annuel',
    noResults: 'Aucun effectif annuel correspondant',
    filterHelp: 'Modifiez les filtres.',
    emptyManage: 'Créez un compte et vérifiez sa liste d’employés.',
    emptyRead: 'Demandez aux RH de saisir l’effectif annuel.',
    journal: 'Journal des sources',
    noJournal: 'Aucun événement source',
    noJournalPermission:
      'Vous n’avez pas l’autorisation de lire le journal des sources.',
    uninitializedHelp:
      'Ce compte n’est pas initialisé et ne peut pas servir au recrutement. Vérifiez la liste complète des employés.',
    rosterHelp:
      'Vérifiez la liste complète, y compris les employés en période d’essai, confirmés et en cours de départ.',
    rosterEmpty:
      'Aucun employé correspondant n’occupe actuellement ce compte. Confirmez que la liste effective est vide.',
    rosterCount: '{{count}} employés',
    confirmRoster: 'J’ai vérifié la liste complète des employés',
    created: '« {{name}} » créé. Vérifiez-le puis initialisez-le.',
    adjusted: 'Plafond de « {{name}} » mis à jour.',
    reconciled: '« {{name}} » initialisé pour le recrutement.',
    invalidYear: 'Saisissez une année entière comprise entre 1900 et 9999.',
    invalidLimit: 'Saisissez un entier compris entre 0 et 1 000 000.',
    reasonRequired: 'Saisissez un motif de 1 à 5 000 caractères.',
    selectRequired:
      'Sélectionnez un service et un poste actuellement autorisés.',
    rosterConfirmationRequired:
      'Confirmez avoir vérifié la liste complète des employés.',
    noAccess: 'Vous n’avez pas l’autorisation de lire cet effectif.',
    missing: 'Ce compte d’effectif n’existe pas ou est inaccessible.',
    failed: 'Impossible de terminer la requête. Réessayez.',
    loadLatest: 'Charger les dernières données',
    unknownOutcome:
      'Le résultat n’est pas confirmé. Conservez cette commande et réessayez.',
    retryCommand: 'Réessayer cette opération',
    reduceTitle: 'Réduire le plafond d’effectif de « {{account}} » ?',
    reduceDescription:
      'Le plafond passera de {{previous}} à {{next}}. L’occupation et les réservations existantes doivent rester couvertes.',
    reduceConfirm: 'Confirmer la réduction',
    minimumLimit:
      'L’occupation et les réservations actuelles totalisent {{count}}. Le nouveau plafond ne peut pas être inférieur.',
    discard: 'Abandonner les modifications non enregistrées ?',
    discardDescription:
      'La fermeture abandonnera ces modifications non enregistrées.',
    discardConfirm: 'Abandonner les modifications',
    noTargets:
      'Aucune cible de service et de poste autorisée. Demandez à un administrateur de vérifier les autorisations de gestion des effectifs.',
    recruitmentSource: 'Consulter la demande de recrutement',
    transferSource: 'Consulter la demande de mutation',
    fields: {
      department: 'Service',
      position: 'Poste',
      year: 'Année de l’effectif',
      limit: 'Plafond autorisé',
      used: 'Occupation par les employés',
      pending: 'Réservations en attente',
      allocated: 'Approuvé, non intégré',
      available: 'Capacité disponible',
      id: 'Identifiant interne',
      version: 'Version',
      updatedAt: 'Mis à jour le',
      reason: 'Motif',
      replacementPending: 'Remplacements futurs en attente',
      replacementAllocated: 'Remplacements futurs approuvés',
      replacementBlocked: 'Places de remplacement bloquées',
    },
    journalActions: {
      create: 'Créer le compte',
      reconcile: 'Vérifier et initialiser',
      adjustLimit: 'Ajuster le plafond',
      hold: 'Réserver la capacité',
      reviseHold: 'Réviser la réservation',
      allocate: 'Allouer la capacité approuvée',
      close: 'Clôturer la source',
      consume: 'Consommer pour l’intégration',
      releaseEmployee: 'Libérer l’occupation de l’employé',
      invalidateReplacement: 'Invalider le remplacement',
      rebindOut: 'Réaffectation sortante',
      rebindIn: 'Réaffectation entrante',
      transferOut: 'Mutation sortante',
      transferIn: 'Mutation entrante',
      claimReplacement: 'Prendre le remplacement',
      cancelReplacement: 'Annuler le remplacement',
      fulfillReplacement: 'Réaliser le remplacement',
      other: 'Modification d’effectif',
    },
    journalColumns: {
      time: 'Heure',
      actor: 'Acteur',
      action: 'Action',
      source: 'Source métier',
    },
    employeeStatus: {
      probation: 'Période d’essai',
      regular: 'Confirmé',
      leaving: 'En cours de départ',
    },
    authz: {
      title: 'Capacité d’effectif',
      view: 'Consulter la capacité',
      manage: 'Gérer la capacité annuelle',
      viewJournal: 'Consulter le journal des sources',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        'La liste complète des employés n’est pas lisible. Demandez à un administrateur de vérifier les autorisations de lecture des employés.',
      HEADCOUNT_ACCESS_DENIED:
        'Vous n’avez pas l’autorisation d’effectuer cette opération sur les effectifs.',
      HEADCOUNT_FIELD_ACCESS_DENIED:
        'Les champs de synthèse de capacité sont hors de vos autorisations.',
      HEADCOUNT_NOT_FOUND: 'Le compte d’effectif est indisponible.',
      HEADCOUNT_ALREADY_EXISTS:
        'Un compte existe déjà pour ce service, ce poste et cette année.',
      HEADCOUNT_NOT_INITIALIZED:
        'Rapprochez la liste complète des employés avant de réserver la capacité.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        'Sélectionnez la liste réelle complète des employés en période d’essai, confirmés et en cours de départ.',
      HEADCOUNT_ROSTER_DRIFT:
        'La liste réelle des employés a changé. Rapprochez ses données sources avant de poursuivre.',
      HEADCOUNT_VERSION_CONFLICT:
        'Le compte a changé. Actualisez-le avant d’enregistrer.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT:
        'Cet identifiant de requête appartient déjà à une autre opération.',
      HEADCOUNT_INSUFFICIENT:
        'Le plafond annuel ne couvre pas l’effectif réellement occupé et réservé.',
      HEADCOUNT_INVALID_NUMBER:
        'Saisissez un nombre entier de personnes dans les limites autorisées.',
      HEADCOUNT_INVALID_ACCOUNT:
        'Sélectionnez un service, un poste et une année réels.',
      HEADCOUNT_INVALID_IDENTITY:
        'Sélectionnez un service et un poste actifs de l’organisation.',
      HEADCOUNT_INVALID_COMMAND:
        'Un acteur, un identifiant de requête et un motif sont requis.',
      HEADCOUNT_INVALID_SOURCE:
        'Un type de source réel et un identifiant sont requis.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        'Chaque place de remplacement nécessite un employé partant distinct.',
      HEADCOUNT_INVALID_REPLACEMENT:
        'La source du remplacement doit correspondre à une occupation réelle en cours de départ ou terminée.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'Cette occupation de remplacement est absente ou déjà prise.',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        'L’employé source rétabli bloque ce remplacement.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND: 'Le dossier de l’employé est indisponible.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        'L’employé réel ne correspond pas au service et au poste alloués.',
      HEADCOUNT_ALREADY_OCCUPIED: 'Cet employé occupe déjà ce compte annuel.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        'Réaffectez explicitement à l’année actuelle de l’entreprise avant consommation.',
      HEADCOUNT_SOURCE_NOT_FOUND: 'La source de capacité est indisponible.',
      HEADCOUNT_SOURCE_EXISTS: 'Cette source possède déjà une réservation.',
      HEADCOUNT_SOURCE_STATE:
        'L’état de la source ne permet pas cette opération.',
      HEADCOUNT_SOURCE_CLOSED: 'La source de capacité est déjà close.',
      HEADCOUNT_SEAT_STATE: 'La place réservée n’est pas en attente.',
      HEADCOUNT_STATE_CONFLICT: 'La place réservée a changé.',
      HEADCOUNT_NO_ALLOCATION: 'Il ne reste aucune place approuvée disponible.',
      HEADCOUNT_NOT_LEFT:
        'Un départ effectif est requis pour libérer la capacité occupée.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        'Une occupation réelle non libérée d’un employé est requise.',
      HEADCOUNT_NOT_RESTORED:
        'Un rétablissement effectif est requis pour bloquer les remplacements futurs.',
      HEADCOUNT_INVALID_REBIND:
        'La réaffectation annuelle doit conserver le service et le poste et avancer dans le temps.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        'Les crédits de remplacement nécessitent des sources explicites pour l’année cible.',
      HEADCOUNT_INVALID_TRANSFER:
        'Une réservation cible approuvée distincte est requise.',
      HEADCOUNT_INVALID_PAGE:
        'Sélectionnez une taille de page comprise entre 1 et 100.',
      HEADCOUNT_GUARD_UNAVAILABLE:
        'Le garde de transaction de capacité est indisponible.',
    },
  },
};
