export default {
  onboarding: {
    authz: {
      resource: 'Intégration',
      readable: 'Participants à l’intégration',
      view: 'Consulter l’intégration',
      create: 'Créer une intégration',
      cancel: 'Annuler l’intégration',
      claim: 'Prendre la tâche en charge',
      reassignMentor: 'Réattribuer le chef de service',
      transfer: 'Transférer',
      release: 'Libérer la tâche',
      complete: 'Terminer la tâche',
      forceComplete: 'Forcer la clôture',
      viewSalary: 'Consulter le salaire à l’intégration',
      viewBank: 'Consulter les coordonnées bancaires à l’intégration',
    },
    noPeople: 'Aucun employé ne correspond à votre recherche',
    loadLatest: 'Charger la dernière version',
    actionChanged:
      'Cette action n’est plus disponible. Votre saisie est conservée ; fermez ce formulaire et vérifiez l’enregistrement mis à jour.',

    confirmAction: 'Confirmer',
    noMatches: 'Aucune intégration ne correspond à vos filtres',

    directoryCap:
      'Affichage des 100 premières correspondances. Affinez votre recherche.',
    organizationLabel: '{{department}} / {{position}} / {{grade}}',
    historicalPersonUnavailable: 'Personne historique indisponible',
    allocationLabel:
      '{{department}} / {{position}} / {{grade}} / {{year}} · {{count}} restants',
    namedAction: '{{action}} pour « {{name}} » ?',
    completedAction: '{{action}} terminé pour « {{name}} »',
    createAction: 'Créer',
    created: 'Intégration de « {{name}} » créée',

    businessErrors: {
      ONBOARDING_SOURCE_INVALID:
        'La source d’intégration ou les détails de l’employé ne sont plus valides. Actualisez et vérifiez la source, l’identité et les détails requis.',
      ONBOARDING_IDEMPOTENCY_CONFLICT:
        'Cette opération a déjà utilisé un contenu différent. Actualisez pour vérifier son résultat avant de continuer.',
    },

    clear: 'Effacer les filtres',
    timeline: {
      unknownActor: 'Responsable historique indisponible',
      parentCompleted: 'Intégration terminée',
      accountEnabled: 'Compte de l’employé activé',
      title: 'Chronologie',
      empty: 'Aucun événement enregistré',
      historyNotice:
        'Seuls les faits enregistrés sont affichés. Les anciens événements peuvent manquer de détails. L’acceptation d’une notification ne prouve pas sa distribution.',
      system: 'Système',
      from: 'Responsable précédent',
      to: 'Nouveau responsable',
      create: 'Intégration créée',
      cancel:
        'Intégration annulée ; tâches de récupération créées pour les tâches terminées',
      claim: 'Tâche prise en charge',
      release: 'Tâche libérée',
      transfer: 'Tâche transférée',
      reassignMentor: 'Chef de service réattribué',
      complete: 'Tâche terminée',
      forceComplete: 'Tâche clôturée de force',
      queued: 'Rappel de retard mis en file',
      sent: 'Notification de retard acceptée',
    },
    reassignMentorNotice:
      'Attribuez cette tâche en attente au chef de service actif actuel. L’échéance et les données enregistrées restent inchangées ; cela ne termine pas la tâche.',
    transferTarget: 'Nouveau responsable du même groupe de traitement',
    attachments: 'Pièces jointes',
    fileLimit: 'PDF, PNG, JPEG ou TXT ; jusqu’à 10 fichiers de 20 Mo chacun.',
    upload: 'Ajouter une pièce jointe',
    uploading: 'Téléversement…',
    removeFile: 'Retirer le fichier {{number}}',
    fileMissing: 'Pièce jointe indisponible',
    assetUnits: 'Biens réels',
    assetUnitsHelp:
      'Saisissez le code et le numéro de série de chaque bien réel. La récupération exige tous les articles de la remise d’origine. Laisser cette liste vide enregistre l’absence de remise de biens.',
    assetCode: 'Code du bien',
    assetSerial: 'Numéro de série',
    removeAsset: 'Retirer',
    addAsset: 'Ajouter un bien',

    employeeSearch: 'Rechercher par nom ou code employé',
    mentorDenied:
      'L’autorisation d’accès à l’annuaire est requise pour choisir un employé',
    loading: 'Soumission…',
    requiredField: 'Saisissez {{field}}.',
    chooseSource:
      'Choisissez une allocation de recrutement disposant de capacité restante.',
    invalidEmail: 'Saisissez une adresse e-mail de compte valide.',
    invalidPassword:
      'Utilisez au moins 8 caractères pour le mot de passe initial.',
    invalidSalary:
      'Saisissez un salaire de base avec exactement deux décimales.',
    title: 'Intégration',
    description:
      'Créez l’intégration des employés et traitez les tâches parallèles',
    employee: 'Employé',
    creator: 'Créé par',
    status: 'Statut',
    refresh: 'Actualiser',
    new: 'Nouvelle intégration',
    detail: 'Détails de l’intégration',
    empty: 'Aucun enregistrement d’intégration',
    forced: 'Clôture forcée',
    dueDate: 'Échéance',
    assignee: 'Traité par',
    bank: 'Compte de paie et assurance sociale',
    salary: 'Salaire',
    privateEmpty: {
      bank: 'Les coordonnées de paie et d’assurance sociale n’ont pas été enregistrées. Vérifiez la progression de la tâche financière.',
      salary:
        'Les détails du salaire n’ont pas été enregistrés. Contactez les RH pour vérifier.',
    },
    save: 'Soumettre',
    saved: 'Enregistré',
    unknown:
      'Le résultat est inconnu. Réessayez la même commande pour confirmer ; ne créez pas une nouvelle demande.',
    retryExact: 'Réessayer la même commande',
    discard: 'Abandonner les modifications',
    discardDescription: 'Vos modifications non enregistrées seront perdues.',
    stay: 'Continuer la modification',
    unavailable: 'Opération indisponible',
    invalid:
      'Vérifiez les champs obligatoires et le format du salaire (deux décimales).',
    reason: 'Motif',
    forceNotice:
      'La clôture forcée enregistre le motif et peut activer le compte. Elle ne prouve pas que le matériel a été remis.',
    cancelNotice:
      'L’annulation libère la capacité réelle et laisse les tâches terminées à récupérer. Elle ne marque pas les articles comme retournés.',
    createNotice:
      'Cette action crée un employé réel avec un compte désactivé et consomme une allocation de recrutement. Le service, le poste et le grade sont fixés par l’allocation.',
    remaining: '{{count}} restants',
    noSources:
      'Aucune allocation de recrutement lisible avec capacité restante',
    userPickerDenied:
      'L’autorisation de recherche des utilisateurs est requise pour sélectionner un responsable hiérarchique.',
    states: {
      all: 'Tous les statuts',
      handling: 'Traitement',
      completed: 'Terminé',
      cancelled: 'Annulé',
      open: 'Ouvrir',
      claimed: 'Pris en charge',
    },
    actions: {
      claim: 'Prendre en charge',
      reassignMentor: 'Réattribuer le mentor',
      transfer: 'Transférer',
      release: 'Libérer',
      complete: 'Terminer',
      forceComplete: 'Forcer la clôture',
      cancel: 'Annuler l’intégration',
    },
    kinds: {
      it: 'Compte et équipement',
      administration: 'Poste de travail et badge',
      finance: 'Compte de paiement et assurance sociale',
      mentor: 'Mentor et plan de 30 jours',
      recovery: 'Tâche de récupération',
    },
    fields: {
      name: 'Nom de l’employé',
      email: 'E-mail du compte',
      password: 'Mot de passe initial',
      code: 'Code employé',
      hireDate: 'Date d’embauche',
      careerStartDate: 'Date de début de carrière',
      probationEndDate: 'Fin de période d’essai',
      baseSalary: 'Salaire de base',
      reason: 'Motif de création',
      requisitionId: 'Allocation de recrutement',
      managerId: 'Responsable hiérarchique',
      accountId: 'Compte créé',
      deviceReference: 'Référence de l’appareil',
      workstationRequirement: 'Besoins du poste de travail',
      workstation: 'Poste de travail',
      badgeReference: 'Référence du badge d’accès',
      bankName: 'Banque',
      bankAccount: 'Compte bancaire',
      bankAccountName: 'Titulaire du compte',
      socialInsuranceReference: 'Référence d’assurance sociale',
      mentorEmployeeId: 'Employé mentor',
      plan: 'Plan d’intégration de 30 jours',
      assetReceiptId: 'Reçu du bien',
      returnReceipt: 'Reçu de récupération',
      compensationId: 'Référence de rémunération',
      gradeId: 'Grade',
      effectiveFrom: 'En vigueur à partir du',
    },
  },
};
