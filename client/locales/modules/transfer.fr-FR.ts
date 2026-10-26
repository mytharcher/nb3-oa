export default {
  recordName: 'Changement de personnel pour « {{name}} »',
  namedAction: '{{action}} pour « {{name}} » ?',
  savedRecord: 'Changement de personnel de « {{name}} » enregistré',

  businessErrors: {
    TRANSFER_INVALID_DATE:
      'Sélectionnez une date d’effet valide pour le changement de personnel.',
    TRANSFER_NO_CHANGE:
      'Aucun détail métier n’a changé. Modifiez au moins un champ autorisé.',
    TRANSFER_SALARY_INVALID:
      'Saisissez un salaire valide dans la plage prise en charge.',
    TRANSFER_RATIO_INVALID:
      'Vérifiez le taux d’ajustement salarial par rapport à la limite configurée.',
    TRANSFER_INVALID_PROMOTION:
      'Le grade sélectionné ne constitue pas une promotion. Vérifiez les grades actuel et cible.',
    TRANSFER_TARGET_DEPARTMENT_UNAVAILABLE:
      'Sélectionnez un service cible actif.',
    TRANSFER_TARGET_POSITION_UNAVAILABLE:
      'Sélectionnez un poste actif dans le service cible.',
    TRANSFER_ACCOUNT_UNAVAILABLE:
      'Sélectionnez un compte d’effectif initialisé correspondant avec une capacité suffisante.',
    TRANSFER_YEAR_REBIND_REQUIRED:
      'L’année a changé. Réaffectez la demande au compte annuel d’effectif correspondant.',
    TRANSFER_SOURCE_CHANGED:
      'L’affectation actuelle de l’employé a changé. Actualisez et révisez la proposition.',
    TRANSFER_COMPENSATION_CHANGED:
      'Le salaire de l’employé a changé. Actualisez avant de réviser la rémunération.',
    TRANSFER_NOT_DUE:
      'La date d’effet n’est pas arrivée. Attendez la date planifiée.',
    TRANSFER_INVALID_KINDS:
      'Choisissez les types de changement de personnel correspondant aux champs modifiés.',
  },

  moreActions: 'Autres actions',
  return: 'Renvoyer',
  destructiveConsequence:
    'Cette action termine ou modifie l’approbation actuelle. Vérifiez les conséquences avant de confirmer.',
  searchPeople: 'Rechercher un nom de candidat',
  title: 'Changements de personnel',
  description:
    'Suivez l’approbation et la prise d’effet des changements de personnel.',
  create: 'Nouvelle demande',
  search: 'Rechercher par motif ou identifiant de demande',
  searchEmployees: 'Rechercher par nom ou code employé',
  empty: 'Aucune demande de changement de personnel',
  noResults: 'Aucune demande correspondante',
  refresh: 'Actualiser',
  clear: 'Effacer les filtres',
  allStatuses: 'Tous les statuts',
  employeeInDetail: 'Voir les détails',
  salary: 'Salaire privé',
  currentSalary: 'Salaire actuel',
  salaryDenied: 'Vous ne pouvez pas consulter le salaire de cette demande',
  failedToExecute:
    'La prise d’effet a échoué. Résolvez les données de l’employé ou les comptes de capacité avant de réessayer.',
  loading: 'Chargement…',
  saved: 'Opération terminée',
  saving: 'Enregistrement…',
  save: 'Enregistrer',
  cancel: 'Annuler',
  confirm: 'Confirmer l’action',
  retry: 'Réessayer',
  loadLatest: 'Charger la dernière version',
  reviewEditWarning:
    'Les modifications relancent l’approbation et clôturent les tâches existantes.',
  cancelConsequence:
    'La capacité reste allouée jusqu’à confirmation de l’annulation par une personne RH indépendante.',
  rebindConsequence:
    'Réaffectez les comptes réels de l’année actuelle. La prise d’effet reste en attente de maintenance.',
  confirmAction:
    'Vérifiez la demande et l’action actuelles, puis indiquez un motif.',
  unavailable:
    'La tâche ou l’autorisation a changé. Revenez aux détails et actualisez.',
  recipient: 'Destinataire',
  select: 'Sélectionnez une option',
  none: 'Aucun',
  required: 'Ce champ est obligatoire',
  tooLong: 'Le contenu est trop long',
  noChanges: 'Modifiez au moins un champ autorisé',
  capacityResolved:
    'Identités des comptes de capacité résolues. La réservation est validée dans la transaction d’approbation.',
  capacityRequired:
    'Sélectionnez l’employé, le service cible, le poste et la date d’effet pour déterminer les comptes réels de capacité.',
  previous: 'Précédent',
  next: 'Suivant',
  discardTitle: 'Abandonner les modifications non enregistrées ?',
  discardDescription: 'Quitter abandonnera votre saisie actuelle.',
  keepEditing: 'Continuer la modification',
  discard: 'Abandonner les modifications',

  fields: {
    id: 'Identifiant de demande',
    employeeId: 'Employé',
    kinds: 'Types de changement',
    targetDepartmentId: 'Service cible',
    targetPositionId: 'Poste cible',
    targetGradeId: 'Grade cible',
    targetManagerId: 'Responsable cible',
    effectiveDate: 'Date d’effet',
    targetSalary: 'Salaire cible (CNY)',
    reason: 'Motif',
    status: 'Statut',
    applicantId: 'Demandeur',
    createdAt: 'Créé le',
  },
  factFields: {
    employee: 'Employé',
    department: 'Service cible',
    position: 'Poste cible',
    grade: 'Grade cible',
    manager: 'Responsable cible',
  },
  status: {
    completed: 'En vigueur',
    draft: 'Brouillon',
    revision: 'Renvoyé pour correction',
    manager: 'Examen du responsable',
    sourceHead: 'Examen du service source',
    targetHead: 'Examen du service cible',
    hr: 'Examen des RH',
    executive: 'Examen de la direction',
    gm: 'Examen de la direction générale',
    pendingEffective: 'En attente de prise d’effet',
    cancellationReview: 'Annulation en attente de confirmation',
    executed: 'En vigueur',
    cancelled: 'Annulé',
    rejected: 'Rejeté',
    withdrawn: 'Retiré',
    terminated: 'Clôturé',
  },
  operations: {
    submit: 'Soumettre',
    edit: 'Modifier la demande',
    reviewEdit: 'Réviser les champs d’examen',
    withdraw: 'Retirer',
    terminate: 'Clôturer',
    requestCancellation: 'Demander l’annulation',
    rebind: 'Réaffecter la capacité de l’année actuelle',
  },
  kinds: {
    transfer: 'Transférer',
    salaryChange: 'Modification salariale',
    promotion: 'Promotion',
  },
  authz: {
    rebind: 'Réaffecter la capacité pour l’année actuelle',
    resource: 'Changements de personnel',
    view: 'Consulter les demandes',
    operate: 'Exécuter les actions d’approbation',
    viewSalary: 'Consulter le salaire',
    submit: 'Soumettre et modifier les demandes',
    reviewEdit: 'Réviser les champs d’examen autorisés',
    cancel: 'Demander l’annulation avant la prise d’effet',
    readable: 'Demandes personnelles et auxquelles je participe',
  },
  errors: {
    missing:
      'Cette demande est indisponible. Revenez à la liste et actualisez.',
    conflict: 'La demande a changé. Chargez les derniers détails et réessayez.',
    precondition:
      'Les conditions métier sont indisponibles. Vérifiez les données de l’employé et les comptes de capacité.',
    salary:
      'Saisissez un salaire dans la plage autorisée avec au maximum deux décimales.',

    denied:
      'Vous n’avez pas l’autorisation d’effectuer ce changement de personnel.',
    failed:
      'Le changement de personnel n’a pas pu être effectué. Actualisez et réessayez.',
  },
};
