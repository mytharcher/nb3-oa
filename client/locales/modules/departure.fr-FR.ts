export default {
  businessErrors: {
    DEPARTURE_CHECKLIST_REQUIRED:
      'Complétez la liste de départ avant de poursuivre.',
    DEPARTURE_LAST_WORKING_DAY_REQUIRED:
      'Confirmez le dernier jour de travail de l’employé.',
    DEPARTURE_DATE_PAST:
      'Le dernier jour de travail ne peut pas être antérieur à aujourd’hui dans le fuseau horaire de l’entreprise.',
    DEPARTURE_HANDOVER_INVALID:
      'Sélectionnez un destinataire de passation admissible autre que l’employé partant.',
    DEPARTURE_HANDOVER_INCOMPLETE:
      'Complétez les éléments de passation avant de poursuivre.',
    DEPARTURE_ORDINARY_WORK_INCOMPLETE:
      'Terminez la passation ordinaire avant de régler le départ.',
    DEPARTURE_LOAN_UNCLEARED:
      'Soldez les avances en cours de l’employé avant de régler le départ.',
    DEPARTURE_RECEIPT_REQUIRED:
      'Saisissez le justificatif de réception ou de clôture pour cet élément de passation.',
    DEPARTURE_SETTLEMENT_NOTE_REQUIRED:
      'Saisissez la note de règlement du départ.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      'Terminez la réattribution des tâches en attente avant de poursuivre.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      'Choisissez le dernier jour de travail prévu et le destinataire de la passation.',
    DEPARTURE_TYPE_INVALID: 'Sélectionnez un type de départ actif.',
    DEPARTURE_ALREADY_ACTIVE:
      'Cet employé possède déjà une demande de départ active. Ouvrez la demande existante.',
    DEPARTURE_CANCELLATION_PENDING:
      'L’annulation du départ est en attente. Résolvez-la avant de poursuivre.',
    DEPARTURE_EXECUTION_BASELINE_CHANGED:
      'L’employé ou les données du départ ont changé. Actualisez et vérifiez-les avant l’exécution.',
  },

  authz: {
    cancel: 'Annuler le départ',
    resource: 'Départ et passation',
    view: 'Consulter les demandes de départ',
    submit: 'Soumettre des demandes de départ',
    delegate: 'Créer des demandes de départ pour les employés',
    work: 'Traiter la passation de départ',
    settle: 'Confirmer le règlement du départ',
  },
  schedule: {
    title: 'Exécution du départ',
    description:
      'Exécuter les départs arrivés à échéance et réessayer les modifications incomplètes de compte et d’appartenance.',
  },

  title: 'Départ et passation',
  description:
    'Examinez les départs, les passations et leur exécution à la date d’effet.',
  new: 'Nouvelle demande de départ',
  edit: 'Modifier',
  number: 'Numéro de demande',
  refresh: 'Actualiser',
  search: 'Rechercher par numéro de demande, employé ou motif',
  view: 'Consulter',
  allTypes: 'Tous les types de départ',
  allStatuses: 'Tous les statuts',
  clearFilters: 'Effacer les filtres',
  emptyTitle: 'Aucune demande de départ',
  emptyDescription:
    'Les demandes de départ et la progression des passations apparaîtront ici.',
  noResults: 'Aucune demande de départ correspondante',
  departureType: 'Type de départ',
  reason: 'Motif',
  expectedLastWorkingDay: 'Dernier jour de travail prévu',
  lastWorkingDay: 'Dernier jour de travail confirmé',
  handoverUser: 'Destinataire de la passation',
  createdBy: 'Créé par',
  application: 'Demande',
  settlement: 'Règlement RH',
  settlementDate: 'Date de règlement',
  settlementNote: 'Note de règlement',
  execution: 'Exécution du départ',
  notSettled: 'Le règlement n’est pas terminé.',
  notExecuted:
    'L’exécution du départ est incomplète. Le compte n’a pas été désactivé.',
  executionComplete:
    'Le compte et les appartenances organisationnelles ont été désactivés.',
  cancellationReason: 'Motif d’annulation',
  cancellationGuidance:
    'Après l’entretien RH, les RH peuvent demander une annulation avant le départ effectif. Un autre examinateur RH doit confirmer avant le rétablissement de l’emploi.',
  handover: 'Travail de passation',
  claimant: 'Pris en charge par',
  receiver: 'Destinataire',
  manager: 'Responsable',
  forcedBy: 'Dispensé par',
  forceReason: 'Motif de dispense',
  checklistConfirmed: 'Liste de contrôle confirmée',
  receiverAcknowledged: 'Réception accusée',
  yes: 'Oui',
  no: 'Non',
  notReady: 'Les conditions de soumission ne sont pas remplies.',
  views: {
    mine: 'Les miens',
    pending: 'En attente',
    done: 'Terminé',
    copied: 'Copié',
  },
  statuses: {
    cancellationReview: 'Confirmation d’annulation',
    cancelled: 'Annulé',
    draft: 'Brouillon',
    revision: 'Renvoyé pour correction',
    manager: 'Examen du responsable',
    head: 'Examen du chef de service',
    hr: 'Entretien RH',
    gm: 'Examen de la direction générale',
    handover: 'Passation',
    completed: 'Règlement terminé',
    withdrawn: 'Retiré',
    rejected: 'Rejeté',
    terminated: 'Clôturé',
  },
  workKinds: {
    work: 'Passation du travail',
    it: 'Informatique et comptes',
    admin: 'Biens et services généraux',
    finance: 'Avances et remboursements',
  },
  workStates: {
    cancelled: 'Annulé',
    open: 'Disponible à la prise en charge',
    claimed: 'En cours',
    completed: 'Terminé',
  },
  executionStates: {
    cancelled: 'Annulé',
    ready: 'En attente de la date d’effet',
    transferring: 'Transfert des approbations en attente',
    blocked: 'Exécution bloquée',
    executed: 'Compte désactivé',
  },
  errors: {
    missingUnnamed:
      'Cette demande de départ n’existe plus. Retour à la liste source.',
    missingReturned:
      '« {{name}} » n’est plus disponible. Retour à la liste source.',
    forbidden: 'Vous n’avez plus accès à cet enregistrement.',
    notFound: 'Cet enregistrement n’existe pas. Revenez à la liste.',
    conflict:
      'Cet enregistrement a changé. Chargez la dernière version avant de confirmer à nouveau.',
    invalid:
      'Les conditions de l’opération ne sont pas remplies. Vérifiez l’enregistrement actuel.',
    failed: 'La requête a échoué. Essayez de la recharger.',
  },
  form: {
    create: 'Nouvelle demande de départ',
    confirmSubmission: 'Confirmer la soumission du départ',
    submissionHelp:
      'Confirmez le dernier jour de travail prévu et le destinataire de la passation avant de soumettre pour approbation.',
    edit: 'Modifier la demande de départ',
    save: 'Enregistrer le brouillon',
    saved: '« {{name}} » enregistré',
    mode: 'Créer pour',
    self: 'Ma démission',
    manual: 'Demande déléguée des RH',
    employee: 'Employé',
    employeeSearch: 'Rechercher des employés',
    chooseEmployee: 'Choisir un employé actif',
    employeesDenied:
      'L’accès aux dossiers des employés est requis pour sélectionner une cible.',
    previous: 'Candidats précédents',
    next: 'Candidats suivants',
    chooseType: 'Choisir un type de départ',
    chooseHandover: 'Choisir un destinataire de passation',
    searchHandover: 'Rechercher des destinataires admissibles',
    handoverSearchMinimum:
      'Saisissez au moins deux caractères pour rechercher par nom ou code employé.',
    noHandoverCandidates:
      'Aucun destinataire admissible trouvé. Essayez un autre nom ou code employé, ou demandez aux RH de vérifier le statut de l’employé et du compte.',
    requiredOnSubmit:
      'Obligatoire pour soumettre ; facultatif pour enregistrer un brouillon.',
    handoverHelp:
      'Obligatoire pour soumettre ; facultatif pour un brouillon. Choisissez un autre employé en période d’essai ou confirmé disposant d’un compte actif. Recherchez par nom ou code employé.',
    refineHandoverSearch:
      'De nombreux destinataires correspondent. Saisissez un nom plus précis pour limiter la recherche.',
    required: 'Remplissez ce champ.',
    dateInvalid: 'Choisissez une date calendaire valide.',
    invalid: 'Vérifiez ce champ et réessayez.',
    dateHelp:
      'La date confirmée lors de l’entretien RH constitue le dernier jour de travail définitif.',
    manualHelp:
      'Les RH peuvent créer des demandes de licenciement ou de fin de contrat pour les employés.',
    unavailable:
      'Vous ne pouvez pas créer cette demande. Vérifiez votre statut d’employé et vos autorisations.',
    unknown:
      'Le résultat de l’enregistrement n’est pas confirmé. Vérifiez les brouillons existants avant de créer une autre demande.',
    checkDrafts: 'Vérifier les brouillons existants',
    noProof:
      'Aucun brouillon correspondant trouvé. Cela ne prouve pas que l’enregistrement a échoué. Gardez cette demande verrouillée et contactez les RH.',
    openDraft: 'Ouvrir ce brouillon pour vérification',
    confirmDraft: 'Il s’agit de la demande enregistrée',
    storageUnavailable:
      'Le stockage du navigateur est indisponible. L’enregistrement est désactivé pour éviter les doublons après une interruption.',
    unknownPersisted:
      'Une demande de création antérieure n’est toujours pas confirmée. Ce verrou persiste après actualisation.',
  },
  actionForm: {
    approveConsequence:
      'L’approbation proposée est enregistrée. L’approbation finale applique le résultat d’emploi approuvé.',

    uncertain:
      'Le résultat n’est pas confirmé. Conservez cette saisie et réessayez l’opération identique ; n’émettez pas une demande modifiée.',
    replay: 'Réessayer l’opération identique',
    unsupported:
      'Cette action nécessite un contrat de saisie que cette page ne prend pas en charge.',
    person: 'Destinataire',
    mode: 'Position de l’approbateur',
    place: 'Emplacement d’approbation',
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
      'La demande de départ a changé. Votre saisie est conservée. Lisez la dernière version, vérifiez-la, puis confirmez à nouveau.',
    completed: '{{action}} terminé pour « {{name}} »',
    committed:
      'L’opération est terminée. Actualisez la demande de départ avant toute autre action.',
    before: 'Avant',
    after: 'Après',
    alongside: 'En parallèle',
    revision: 'Correction du demandeur',
    required: 'Remplissez ce champ.',
    limit: 'Cette valeur est trop longue.',
    title: '{{action}} le départ « {{name}} »',
    comment: 'Commentaire / motif',
    confirm: 'Confirmer',
    saved: '« {{name}} » mis à jour',
    unavailable:
      'Cette action n’est plus disponible. Chargez le dernier enregistrement.',
    unknown:
      'Le résultat n’est pas confirmé. Chargez le dernier enregistrement avant de continuer.',
    to: 'Destinataire',
    returnTarget: 'Renvoyer à',
    confirmTitle: '{{action}} « {{name}} » ?',
    confirmDescription:
      'Cette action met à jour la décision de départ. Confirmez l’employé et l’enregistrement actuel.',
    lastWorkingDay: 'Dernier jour de travail confirmé',
    settlementDate: 'Date de règlement',
    settlementNote: 'Note de règlement',
    labels: {
      requestCancellation: 'Demander l’annulation du départ',
      submit: 'Soumettre',
      withdraw: 'Retirer',
      terminate: 'Clôturer',
      settle: 'Confirmer le règlement',
      approve: 'Approuver',
      reject: 'Rejeter',
      return: 'Renvoyer',
      returnTo: 'Renvoyer',
      comment: 'Commenter',
      read: 'Marquer comme lu',
      urge: 'Relancer',
      transfer: 'Transférer',
      addSigner: 'Ajouter un approbateur',
      cc: 'Mettre en copie',
      claim: 'Prendre en charge',
      release: 'Libérer',
      appoint: 'Désigner',
      reassign: 'Réattribuer',
    },
  },
  work: {
    labels: {
      requestCancellation: 'Demander l’annulation du départ',
      claim: 'Prendre en charge',
      confirmChecklist: 'Confirmer la liste de contrôle',
      acknowledgeReceipt: 'Accuser réception',
      complete: 'Terminer',
      forceComplete: 'Forcer la clôture',
    },
    title: '{{action}} {{kind}} pour « {{name}} »',
    reason: 'Motif de dispense',
    confirmChecklist: 'J’ai rempli la liste de contrôle.',
    acknowledgeReceipt: 'J’ai reçu la passation.',
    blocked:
      'La clôture est incomplète. Résolvez les éléments en attente répertoriés.',
    forceWarning:
      'La clôture forcée de la passation ne modifie pas les données des registres de biens ou financiers.',
    forceConfirm: 'Dispenser {{kind}} pour « {{name}} » ?',
    forceDescription:
      'Les justificatifs ordinaires de clôture seront ignorés. Le motif et l’acteur effectif seront audités.',
  },
  blockers: {
    generic:
      'Une condition n’est pas remplie. Actualisez et demandez au responsable de la résoudre.',
    DEPARTURE_ASSET_SERVICE_UNAVAILABLE:
      'La clôture ordinaire des biens n’est pas encore disponible.',
    DEPARTURE_REIMBURSEMENT_SERVICE_UNAVAILABLE:
      'La clôture des remboursements est indisponible.',
    DEPARTURE_LOANS_NOT_CLEARED:
      'Les avances ou remboursements réservés ne sont pas soldés.',
    REIMBURSEMENT_DEPARTURE_NOT_CLEARED:
      'Des demandes de remboursement sont encore ouvertes.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      'Choisissez la date prévue et le destinataire de la passation.',
    DEPARTURE_DATE_PAST: 'Le dernier jour de travail prévu est dans le passé.',
    DEPARTURE_REASSIGNMENT_UNAVAILABLE:
      'Le transfert des approbations est indisponible. Le compte reste actif.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      'Des approbations en attente restent attribuées à cet employé.',
    DEPARTURE_EXECUTION_FAILED:
      'L’exécution du départ a échoué et sera réessayée par la tâche quotidienne.',
  },
};
