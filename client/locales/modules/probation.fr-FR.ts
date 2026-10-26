export default {
  probationRequests: {
    businessErrors: {
      PROBATION_SELF_EVALUATION_REQUIRED:
        'Saisissez l’autoévaluation de l’employé avant de soumettre.',
      PROBATION_CONCLUSION_REQUIRED:
        'Saisissez la conclusion du responsable avant d’approuver.',
      PROBATION_COMPENSATION_REQUIRED:
        'Complétez les informations protégées de grade et de salaire dans le formulaire d’approbation RH.',
      PROBATION_INVALID_GRADE: 'Sélectionnez un grade actif.',
      PROBATION_ALREADY_ACTIVE:
        'Cet employé possède déjà une demande de période d’essai active. Ouvrez la demande existante.',
      PROBATION_STALE_EMPLOYEE:
        'Les informations de période d’essai de l’employé ont changé. Actualisez avant d’agir à nouveau.',
      PROBATION_DEPARTMENT_REQUIRED:
        'L’employé doit avoir un service principal actif. Demandez aux RH de mettre à jour le dossier.',
    },

    title: 'Demandes de période d’essai',
    description:
      'Examinez les évaluations de période d’essai et suivez la décision de confirmation d’emploi.',
    new: 'Nouvelle demande de période d’essai',
    edit: 'Modifier',
    details: 'Consulter les détails',
    number: 'Nombre',
    employee: 'Employé',
    probationEndDate: 'Fin de période d’essai',
    conclusion: 'Conclusion',
    search: 'Rechercher par numéro, nom d’employé ou autoévaluation',
    view: 'Vue de l’enregistrement',
    allStatuses: 'Tous les statuts',
    refresh: 'Actualiser',
    clearFilters: 'Effacer les filtres',
    emptyTitle: 'Aucune demande de période d’essai',
    emptyDescription:
      'Les employés reçoivent des brouillons système à l’approche de l’échéance. Les RH peuvent créer une évaluation pour un employé en période d’essai.',
    noResults: 'Aucune demande correspondante',
    rowActions: 'Actions pour {{name}}',
    views: {
      mine: 'Les miens',
      pending: 'En attente',
      done: 'Terminé',
      copied: 'Copié',
    },
    conclusions: {
      regular: 'Confirmer l’emploi',
      deferred: 'Prolonger la période d’essai',
      declined: 'Refuser la confirmation d’emploi',
    },
    statuses: {
      draft: 'Brouillon',
      revision: 'Révision',
      manager: 'Examen du responsable',
      head: 'Examen du service',
      hr: 'Examen des RH',
      gm: 'Examen de la direction générale',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
      terminated: 'Clôturé',
    },
    errors: {
      forbidden:
        'Vous n’avez pas accès. Demandez à un administrateur de vérifier votre autorisation.',
      notFound:
        'Cet enregistrement n’existe plus ou est indisponible. Revenez à la page source.',
      conflict:
        'Cette évaluation a changé. Lisez le dernier enregistrement avant d’agir à nouveau.',
      invalid:
        'Vérifiez le contenu de l’évaluation et les champs obligatoires.',
      failed: 'La requête n’a pas abouti. Réessayez.',
      departureUnavailable:
        'Le circuit de départ est indisponible ; cette action n’a pas été effectuée. L’examen du directeur général reste en attente.',
    },
    detail: {
      creator: 'Créé par',
      selfEvaluation: 'Autoévaluation',
      evaluation: 'Évaluation du responsable',
      deferredTo: 'Fin de période d’essai prolongée',
      grade: 'Grade',
      manager: 'Examinateur responsable',
      head: 'Examinateur du service',
      hr: 'Examinateur RH',
      gm: 'Examinateur de direction générale',
      rules: 'Règles figées',
      unsubmitted: 'Les règles sont figées à la soumission.',
    },
    rules: {
      grade_managerRank: 'Seuil de grade du responsable',
      sla_remindHours: 'Heures ouvrées avant rappel',
      sla_escalateHours: 'Heures ouvrées avant escalade',
      sla_urgeCooldownHours: 'Délai entre rappels en heures',
    },
    compensation: {
      title: 'Proposition de rémunération privée',
      denied: 'Vous ne pouvez pas consulter la rémunération.',
      missing: 'Aucune proposition de rémunération n’a été enregistrée.',
      grade: 'Grade proposé',
      salary: 'Salaire de base (yuans)',
    },
    authz: {
      resource: 'Évaluations de période d’essai',
      submit: 'Modifier et soumettre l’évaluation de période d’essai',
      delegate: 'Les RH créent les évaluations de période d’essai',
      view: 'Lire les évaluations de période d’essai autorisées',
      compensation: 'Accéder à la rémunération privée de période d’essai',
    },
    schedule: {
      title: 'Rappels de fin de période d’essai',
      description:
        'Rapprocher les dates de période d’essai selon l’heure de l’entreprise, créer des brouillons d’autoévaluation 14 jours avant l’échéance et notifier les employés.',
    },
  },
};
