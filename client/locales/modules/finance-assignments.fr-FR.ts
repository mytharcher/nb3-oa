export default {
  financeAssignments: {
    create: 'Créer',

    saved: 'Affectation comptable de « {{name}} » enregistrée',
    saveFailed:
      'L’affectation n’a pas pu être enregistrée. Vérifiez la saisie et réessayez.',
    disableTitle: 'Désactiver l’affectation de « {{name}} » ?',

    loadLatest: 'Charger la dernière affectation',
    latestSummary:
      'Dernière version : {{name}} / {{status}}. Les valeurs de votre formulaire restent inchangées.',
    adoptVersion: 'Utiliser cette version avec mes modifications',
    uncertain:
      'Le résultat de la création est incertain. Vérifiez ce service avant de réessayer.',
    checkExisting: 'Vérifier l’affectation du service',
    viewExisting: 'Ouvrir l’affectation existante',
    required: 'Ce champ est obligatoire.',
    title: 'Comptables des services',
    description:
      'Attribuez l’examinateur financier de chaque service. En cas d’affectation absente ou inactive, le premier service parent actif est utilisé, puis le responsable financier.',
    new: 'Affecter un comptable',
    edit: 'Modifier l’affectation',
    view: 'Détails de l’affectation',
    department: 'Service',
    accountant: 'Comptable',
    status: 'Statut',
    active: 'Active',
    inactive: 'Désactivée',
    updatedAt: 'Mis à jour',
    refresh: 'Actualiser',
    clear: 'Effacer les filtres',
    rowActions: 'Actions pour {{name}}',
    save: 'Enregistrer',
    cancel: 'Annuler',
    loading: 'Chargement des affectations',
    retry: 'Réessayer',
    accountantPlaceholder: 'Rechercher des comptables admissibles',
    noAccountants: 'Aucun membre actif du rôle de responsabilité financière',
    reason: 'Motif',
    formDescription:
      'Seuls les membres actifs du rôle de responsabilité financière peuvent être affectés. Les modifications sont auditées.',
    departmentPermission:
      'L’autorisation de lecture des services est requise pour choisir un service. Demandez-la à un administrateur.',
    conflictAdvice:
      'Conservez vos modifications pour référence. Fermez et rouvrez ce formulaire pour consulter la dernière affectation avant de réessayer.',
    disable: 'Désactiver l’affectation',
    disableDescription:
      'Les prochaines approbations utiliseront l’affectation du premier service parent actif, puis le responsable financier. Les tâches d’approbation existantes conservent leurs examinateurs enregistrés.',
    authz: {
      title: 'Comptables des services',
      read: 'Lire les affectations',
      update: 'Gérer les attributions',
      permissionSet:
        'Configuration des comptables par le responsable financier',
    },
    empty: {
      accountsTitle: 'Aucun comptable affecté',
      accountsDescription:
        'Affectez un comptable à un service pour acheminer les examens financiers.',
      readonlyTitle: 'Aucune affectation',
      readonlyDescription:
        'Un responsable financier peut configurer les comptables des services.',
      filteredTitle: 'Aucune affectation correspondante',
      filteredDescription:
        'Effacez le filtre de service pour voir toutes les affectations.',
    },
    error: {
      forbidden: 'Vous n’avez pas l’autorisation d’accéder à ces affectations.',
      missing: 'Cette affectation n’existe plus.',
      invalid: 'Vérifiez les valeurs du formulaire.',
      failed: 'Impossible de charger les affectations. Réessayez.',
      FINANCE_ASSIGNMENT_NOT_FOUND: 'Cette affectation n’existe plus.',
      FINANCE_ASSIGNMENT_VERSION_CONFLICT:
        'Cette affectation a changé. Rouvrez le formulaire pour consulter la dernière version.',
      FINANCE_ASSIGNMENT_ALREADY_EXISTS:
        'Ce service possède déjà une affectation. Modifiez celle-ci.',
      FINANCE_ASSIGNMENT_INVALID_DEPARTMENT: 'Choisissez un service actif.',
      FINANCE_ASSIGNMENT_INVALID_ACCOUNTANT:
        'Choisissez un membre actif du rôle de responsabilité financière.',
      FINANCE_ASSIGNMENT_INVALID_COMMAND: 'Un acteur et un motif sont requis.',
    },
  },
};
