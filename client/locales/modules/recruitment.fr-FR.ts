export default {
  recruitment: {
    authz: {
      reviewEdit: 'Modifier les champs d’examinateur autorisés',
      resource: 'Demandes de recrutement',
      requisitions: 'Allocations de recrutement',
      view: 'Consulter le recrutement',
      submit: 'Créer et soumettre un recrutement',
      operate: 'Agir sur les approbations de recrutement',
      viewSalary: 'Consulter la fourchette salariale privée',
      close: 'Clôturer l’allocation de recrutement restante',
    },
    identityUnavailable: 'Nom de l’organisation indisponible',
    catalogRequired:
      'Chargez les noms du service et du poste avant de clôturer cette allocation.',
    requisitionName:
      '{{year}} / {{department}} / {{position}} demande de recrutement',
    preciseAllocationName:
      '{{year}} / {{department}} / {{position}} allocation de recrutement',

    savedRecord: 'Recrutement de « {{name}} » enregistré',

    allocationName: 'Allocation de recrutement {{year}}',

    yearInvalid: 'Saisissez une année entière comprise entre 1900 et 9999.',
    businessErrors: {
      RECRUITMENT_INVALID_QUANTITY:
        'Saisissez un nombre entier positif de recrutements dans la plage prise en charge.',
      RECRUITMENT_INVALID_SALARY:
        'Saisissez une fourchette salariale valide avec un minimum inférieur ou égal au maximum.',
      RECRUITMENT_INVALID_REPLACEMENTS:
        'Sélectionnez des employés en départ ou partis à remplacer correspondant au nombre de recrutements.',
      RECRUITMENT_REPLACEMENT_UNAVAILABLE:
        'Un remplacement n’est plus admissible. Actualisez et sélectionnez un remplacement admissible.',
      RECRUITMENT_ACCOUNT_MISMATCH:
        'Le compte d’effectif doit correspondre au service, au poste et à l’année.',
      RECRUITMENT_YEAR_MISMATCH:
        'L’année d’effectif a changé. Sélectionnez le compte annuel correspondant.',
      RECRUITMENT_DEPARTMENT_UNAVAILABLE: 'Sélectionnez un service actif.',
      RECRUITMENT_POSITION_UNAVAILABLE:
        'Sélectionnez un poste actif dans le service choisi.',
      RECRUITMENT_GRADE_UNAVAILABLE: 'Sélectionnez un grade actif.',
      RECRUITMENT_GRADE_SNAPSHOT_MISMATCH:
        'Le grade a changé. Actualisez et vérifiez la fourchette salariale avant de soumettre à nouveau.',
      RECRUITMENT_RESERVATION_UNAVAILABLE:
        'Aucune réservation d’effectif utilisable n’est disponible. Actualisez le compte d’effectif et vérifiez la capacité.',
      RECRUITMENT_REQUISITION_ALREADY_PUBLISHED:
        'Cette demande de recrutement est déjà publiée. Actualisez pour voir son statut.',
      RECRUITMENT_INVALID_INPUT:
        'Complétez le service, le poste, le grade, l’effectif, la date de début, la description du poste et le motif.',
    },

    capacityEmpty:
      'Aucun effectif annuel initialisé correspondant. Demandez aux RH de le créer et de l’initialiser.',
    capacitySelectTarget:
      'Sélectionnez d’abord un service, un poste et une année.',
    capacityLedger: 'Consulter le registre des effectifs',

    title: 'Demandes de recrutement',
    requisitions: 'Demandes de recrutement',
    new: 'Nouvelle demande de recrutement',
    detailTitle: 'Demande de recrutement · {{name}}',
    detail: 'Demande de recrutement',
    search: 'Rechercher dans la description du poste ou le motif',
    all: 'Tous les statuts',
    clear: 'Effacer les filtres',
    empty: 'Aucune demande de recrutement',
    filteredEmpty: 'Aucune demande ne correspond à ces filtres',
    emptyRequisitions: 'Aucune demande de recrutement autorisée',
    cancel: 'Annuler',
    save: 'Enregistrer la demande de recrutement',
    saved: 'Opération de recrutement enregistrée',
    refresh: 'Actualiser',
    retry: 'Réessayer',
    loadLatest: 'Charger les dernières données',
    noAccess: 'Vous n’avez pas accès à cet enregistrement.',
    fieldsRestricted: 'Les champs obligatoires sont restreints.',
    missing: 'Cet enregistrement est indisponible.',
    conflict:
      'Cet enregistrement a changé. Chargez les dernières données et réessayez.',
    invalid:
      'Complétez les champs obligatoires et sélectionnez un compte de capacité initialisé. Vérifiez le nombre de remplacements et la fourchette salariale.',
    failed: 'L’opération a échoué. Veuillez réessayer.',
    notAvailable:
      'Cette opération n’est plus disponible avec vos autorisations actuelles.',
    commandReason: 'Motif de cette opération',
    replacementNote:
      'Seules les identités actuelles autorisées en départ ou parties sont répertoriées. La soumission vérifie l’admissibilité effective de capacité.',
    unknown:
      'Le résultat est incertain. Réessayez la commande exacte pour confirmer son résultat.',
    retryExact: 'Réessayer la commande exacte',
    progress: 'Progression de l’approbation',
    timeline: 'Chronologie',
    recipient: 'Destinataire',
    candidatesFailed:
      'Impossible de charger les destinataires. Réessayez ou actualisez les détails d’approbation et réessayez.',
    noCandidates:
      'Aucun destinataire ne satisfait aux exigences d’approbation actuelles.',
    actionInvalid:
      'Saisissez un motif d’opération et sélectionnez le destinataire, l’étape de retour, le mode de signature ou l’emplacement requis pour cette action.',
    recipientSearch: 'Rechercher des destinataires admissibles',
    moreCandidates: 'Charger plus de destinataires',
    returnTarget: 'Renvoyer à l’étape',
    signerMode: 'Ordre de signature',
    place: 'Siège non attribué',
    confirmAction: '{{action}} pour {{id}} ?',
    actionConsequence:
      'Cette opération modifie l’approbation ou l’allocation actuelle.',
    closeConsequence:
      'Seule l’allocation de recrutement restante non consommée est libérée. L’historique des employés consommés reste conservé.',
    discard: 'Abandonner les modifications non enregistrées ?',
    discardDescription: 'Les modifications de ce formulaire seront perdues.',
    discardConfirm: 'Abandonner les modifications',
    fields: {
      requisitionTitle: 'Titre de la demande de recrutement',
      id: 'Identifiant',
      requisitionId: 'Identifiant de la demande de recrutement',
      requestId: 'Identifiant de la demande source',
      departmentId: 'Service',
      positionId: 'Poste',
      gradeId: 'Grade',
      accountId: 'Effectif annuel',
      year: 'Année de capacité',
      quantity: 'Quantité',
      kind: 'Type de recrutement',
      replacementEmployeeIds: 'Employés remplacés',
      minimumCents: 'Salaire minimum',
      maximumCents: 'Salaire maximum',
      expectedStartDate: 'Date de début prévue',
      jobDescription: 'Description du poste',
      reason: 'Motif métier',
      applicant: 'Demandeur',
      status: 'Statut',
      createdAt: 'Créé le',
      statusChangedAt: 'Statut mis à jour le',
      sourceYear: 'Année source',
      sourceVersion: 'Version source',
      originalQuantity: 'Quantité approuvée',
      remaining: 'Restant',
      consumed: 'Consommé',
    },
    actions: {
      submit: 'Soumettre',
      withdraw: 'Retirer',
      terminate: 'Clôturer',
      edit: 'Modifier le brouillon',
      reviewEdit: 'Modifier les champs d’examinateur',
      approve: 'Approuver',
      reject: 'Rejeter',
      return: 'Renvoyer',
      comment: 'Commenter',
      appoint: 'Désigner',
      reassign: 'Réattribuer',
      read: 'Marquer comme lu',
      transfer: 'Transférer',
      addSigner: 'Ajouter un approbateur',
      urge: 'Relancer',
      cc: 'Destinataire en copie',
      close: 'Clôturer l’allocation restante',
    },
    status: {
      draft: 'Brouillon',
      revision: 'Révision',
      head: 'Chef de service',
      hrbp: 'Partenaire RH',
      hrDirector: 'Directeur des ressources humaines',
      executive: 'Direction',
      gm: 'Directeur général',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
      terminated: 'Clôturé',
      recruiting: 'Recrutement en cours',
      full: 'Recrutement complet',
      closed: 'Clos',
    },
    kinds: {
      additional: 'Effectif supplémentaire',
      replacement: 'Remplacement',
    },
    modes: {
      before: 'Avant',
      after: 'Après',
      alongside: 'En parallèle',
    },
  },
};
