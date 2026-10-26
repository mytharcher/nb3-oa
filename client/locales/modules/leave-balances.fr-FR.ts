export default {
  leaveBalances: {
    navigationDiscardDescription:
      'Abandonnez ces modifications et revenez à la liste des soldes. La navigation d’origine ne se poursuivra pas.',
    navigationDiscard: 'Abandonner et revenir aux soldes',
    clearFilters: 'Effacer les filtres',
    clearSearch: 'Effacer la recherche',
    title: 'Soldes de congés',
    adminTitle: 'Administration des soldes de congés',
    description:
      'Consultez les congés disponibles, les jours réservés et l’historique des soldes.',
    adminDescription:
      'Examinez les soldes de congés des employés et enregistrez des ajustements motivés.',
    employee: 'Employé',
    employeePlaceholder: 'Rechercher des employés par nom ou code',
    type: 'Type de congé',
    selectType: 'Sélectionner un type de congé',
    availableUnits: 'Jours disponibles',
    heldUnits: 'Jours réservés',
    availableDelta: 'Variation disponible (jours)',
    heldDelta: 'Variation réservée (jours)',
    at: 'Heure',
    kind: 'Type',
    reference: 'Source',
    actor: 'Acteur',
    reason: 'Motif',
    days: 'Jours d’ajustement',
    actions: 'Actions pour « {{name}} »',
    adjust: 'Ajuster',
    adjustBalance: 'Ajuster le solde',
    refresh: 'Actualiser',
    retry: 'Réessayer',
    loading: 'Chargement',
    noResults: 'Aucun employé correspondant. Modifiez votre recherche.',
    searchCap:
      'Seuls les 20 premiers employés sont affichés. Affinez votre recherche.',
    noTypes:
      'Aucun type de congé avec solde n’est disponible. Demandez à un administrateur de les configurer.',
    unopened:
      '« {{type}} » ne possède pas encore de compte : {{available}} jours disponibles et {{held}} jours réservés. Ajoutez un solde pour l’ouvrir.',
    ledgerTitle: '{{type}} · Historique du solde',
    adjustTitle: 'Ajuster le solde de congés',
    adjustDescription: 'Ajuster le solde {{type}} de « {{name}} ».',
    currentBalance:
      'Actuellement {{available}} jours disponibles et {{held}} jours réservés.',
    afterBalance:
      'Disponible après ajustement : {{amount}} jours, sous réserve de validation du serveur.',
    noExpiry:
      'Les soldes ajoutés n’expirent pas. Les réductions conservent les règles d’expiration existantes.',
    daysInvalid:
      'Saisissez un nombre de jours non nul par incréments d’une demi-journée.',
    reasonRequired: 'Saisissez un motif d’ajustement.',
    reasonLong: 'Limitez le motif à 2 000 caractères.',
    adjusted: 'Solde de « {{name}} » ajusté.',
    cancel: 'Annuler',
    uncertain:
      'Le résultat est incertain. Réessayez le même ajustement ; ses valeurs sont verrouillées pour éviter les doublons.',
    retryAdjustment: 'Réessayer l’ajustement',
    discardTitle: 'Abandonner l’ajustement du solde',
    discardDescription: 'Votre ajustement non enregistré sera perdu.',
    keepEditing: 'Continuer la modification',
    discard: 'Abandonner',
    kinds: {
      grant: 'Accorder',
      hold: 'Réserver',
      deduct: 'Déduire',
      release: 'Libérer',
      expire: 'Faire expirer',
      refund: 'Restituer',
    },
    error: {
      insufficient:
        'Le solde disponible est insuffisant. Réduisez la déduction.',
      forbidden:
        'Vous n’avez pas l’autorisation de consulter ou d’ajuster ces données. Contactez un administrateur ; la recherche d’employés exige aussi l’accès aux dossiers.',
      notFound:
        'Le dossier de l’employé est absent ou non lié. Contactez les RH ou sélectionnez un autre employé.',
      invalid:
        'L’ajustement est invalide. Vérifiez les jours, le type de congé et le motif.',
      failed: 'La requête n’a pas pu être terminée. Réessayez.',
    },
    empty: {
      readonlyAccountsTitle: 'Aucun solde de congés',
      readonlyAccountsDescription:
        'Demandez à un administrateur RH autorisé d’accorder les soldes de congés.',
      employeeTitle: 'Sélectionner un employé',
      employeeDescription:
        'Recherchez par nom ou code pour consulter les soldes de congés.',
      accountsTitle: 'Aucun solde de congés',
      accountsDescription:
        'Sélectionnez un type de congé et ajoutez un solde par un ajustement.',
      mineTitle: 'Aucun solde de congés',
      mineDescription:
        'Les RH accordent vos soldes de congés. Contactez-les pour les vérifier.',
      ledgerTitle: 'Aucun historique de solde',
      ledgerDescription:
        'Les attributions, réservations et déductions apparaîtront ici.',
    },
    authz: {
      section: 'Gestion des congés',
      title: 'Soldes de congés',
      read: 'Lire les soldes de congés des employés',
      update: 'Ajuster les soldes de congés des employés',
      permissionSet: 'Administration RH des soldes de congés',
    },
  },
};
