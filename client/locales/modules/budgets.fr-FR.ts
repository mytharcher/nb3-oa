export default {
  budgets: {
    create: 'Créer',

    title: 'Gestion budgétaire',
    description:
      'Les finances enregistrent les budgets annuels et modifications manuelles auditées ; les fonds réservés et utilisés proviennent des documents métier.',
    new: 'Nouveau budget annuel',
    newDescription:
      'Créez un compte budgétaire pour un service, une année et un poste.',
    adjustTitle: 'Ajuster le budget',
    adjustDescription:
      'Enregistrez une modification manuelle d’allocation avec un motif. Les réservations et dépenses existantes restent dans le registre.',
    detail: 'Compte budgétaire',
    detailDescription:
      'Consultez les soldes et modifications budgétaires immuables.',
    accountTitle: '{{department}} · {{year}} · {{subject}}',
    department: 'Service',
    year: 'Année',
    subject: 'Sujet',
    allocatedCents: 'Alloué',
    heldCents: 'Réservé',
    usedCents: 'Utilisé',
    availableCents: 'Disponible',
    amount: 'Allocation annuelle',
    changeAmount: 'Modification d’allocation',
    amountHint: 'Unités monétaires positives, avec au maximum deux décimales.',
    deltaHint:
      'Un montant positif ajoute des fonds ; un montant négatif les réduit. Les fonds réservés et utilisés ne peuvent pas être retirés.',
    reason: 'Motif',
    ledger: 'Modifications budgétaires',
    kind: 'Type de modification',
    at: 'Heure',
    reference: 'Source',
    actor: 'Opérateur',
    allocatedDelta: 'Modification d’allocation',
    heldDelta: 'Modification de réservation',
    usedDelta: 'Modification d’utilisation',
    allSubjects: 'Tous les postes',
    selectSubject: 'Sélectionner un sujet',
    yearPlaceholder: 'Filtrer par année',
    refresh: 'Actualiser',
    clear: 'Effacer les filtres',
    cancel: 'Annuler',
    save: 'Enregistrer',
    adjust: 'Ajuster',
    view: 'Consulter',
    retry: 'Réessayer',
    loading: 'Chargement',
    rowActions: 'Actions pour {{name}}',
    saved: 'Budget de « {{name}} » enregistré',
    currentAccount:
      '{{department}} · {{year}} · {{subject}} · allocation {{amount}}',
    openExisting: 'Ouvrir le compte existant',
    required: 'Remplissez ce champ obligatoire.',
    invalidYear: 'Saisissez une année comprise entre 1900 et 9999.',
    invalidAmount:
      'Saisissez un montant non nul avec au maximum deux décimales, dans la limite des centimes entiers sûrs.',
    positiveAmount:
      'Saisissez un montant positif avec au maximum deux décimales, dans la limite des centimes entiers sûrs.',
    longReason: 'Limitez le motif à 4 000 caractères.',
    invalidField: 'Vérifiez ce champ et réessayez.',
    kinds: {
      consume: 'Règlement partiel',
      allocate: 'Allocation',
      hold: 'Réservation',
      release: 'Libéré',
      settle: 'Règlement',
      transferOut: 'Transfert sortant',
      transferIn: 'Transfert entrant',
    },
    empty: {
      accountsTitle: 'Aucun budget',
      accountsDescription:
        'Créez des allocations annuelles pour activer le contrôle budgétaire.',
      readonlyTitle: 'Aucun budget',
      readonlyDescription:
        'Demandez aux finances de saisir les budgets annuels.',
      filteredTitle: 'Aucun budget correspondant',
      filteredDescription:
        'Effacez ou modifiez les filtres pour trouver un compte.',
      ledgerTitle: 'Aucune modification pour le moment',
      ledgerDescription:
        'Les modifications budgétaires apparaîtront ici après leur enregistrement.',
    },
    error: {
      failed:
        'Impossible de charger ou d’enregistrer le budget. Réessayez avec la même saisie.',
      forbidden:
        'Vous n’avez pas d’autorisation budgétaire. Contactez un administrateur.',
      missing: 'Ce budget n’existe plus. Revenez à la liste.',
      BUDGET_NOT_FOUND: 'Ce budget n’existe plus. Revenez à la liste.',
      BUDGET_ALREADY_EXISTS:
        'Un budget existe pour ce compte. Ouvrez-le et utilisez Ajuster.',
      BUDGET_IDEMPOTENCY_CONFLICT:
        'Cette clé de requête identifie déjà une autre modification. Vérifiez votre saisie et enregistrez à nouveau.',
      BUDGET_INSUFFICIENT:
        'Cet ajustement laisserait un budget disponible insuffisant. Réduisez la diminution.',
      BUDGET_INVALID_DEPARTMENT: 'Sélectionnez un service actif.',
      BUDGET_INVALID_SUBJECT: 'Sélectionnez un poste budgétaire actif.',
      BUDGET_INVALID_AMOUNT:
        'Vérifiez le montant et utilisez au maximum deux décimales.',
      BUDGET_INVALID_COMMAND:
        'Vérifiez le motif obligatoire et les détails de la demande.',
      BUDGET_INVALID_ACCOUNT: 'Vérifiez le service, l’année et le poste.',
      BUDGET_INVALID_PAGE: 'Vérifiez la page et sa taille.',
      invalid:
        'Vérifiez les champs obligatoires et corrigez les valeurs signalées.',
    },
    authz: {
      title: 'Gestion budgétaire',
      read: 'Lire les comptes et modifications budgétaires',
      update: 'Créer des budgets et enregistrer les ajustements manuels',
      permissionSet: 'Gestion financière des budgets',
    },
  },
};
