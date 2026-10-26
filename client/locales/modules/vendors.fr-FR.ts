export default {
  vendors: {
    saved: 'Fournisseur « {{name}} » enregistré',

    title: 'Fournisseurs',
    description:
      'Les achats gèrent les fournisseurs manuels. Les commandes approuvées conservent les données fournisseur enregistrées.',
    new: 'Nouveau fournisseur',
    edit: 'Modifier le fournisseur',
    view: 'Détails du fournisseur',
    refresh: 'Actualiser',
    search: 'Rechercher par nom, code ou catégorie',
    clear: 'Effacer les filtres',
    rowActions: 'Actions pour {{name}}',
    save: 'Enregistrer',
    cancel: 'Annuler',
    loading: 'Chargement des fournisseurs',
    retry: 'Réessayer',
    active: 'Active',
    status: 'Statut',
    statuses: {
      manual: 'Fournisseur manuel',
      qualified: 'Qualifié',
      disabled: 'Désactivée',
    },
    updatedAt: 'Mis à jour',
    reason: 'Motif de cette modification',
    formDescription:
      'Les modifications et coordonnées bancaires des fournisseurs sont auditées. La désactivation empêche les nouveaux achats et paiements.',
    disableHint:
      'Les nouveaux achats et les coordonnées de paiement seront bloqués.',
    required: 'Ce champ est obligatoire.',
    invalidCode:
      'Utilisez lettres, chiffres, points, traits d’union ou traits de soulignement.',
    invalidEmail: 'Saisissez une adresse e-mail valide.',
    noChanges: 'Modifiez au moins un champ avant d’enregistrer.',
    unknownCreate:
      'Le résultat de la création est inconnu. Vérifiez la liste des fournisseurs et son code avant de créer un autre fournisseur.',
    unknownEdit:
      'Le résultat est inconnu. Chargez le dernier fournisseur avant de réessayer ; vos modifications non validées seront conservées.',
    loadLatest: 'Charger le dernier fournisseur',
    fields: {
      code: 'Code',
      name: 'Nom',
      category: 'Catégorie',
      contactName: 'Contact',
      contactPhone: 'Téléphone',
      contactEmail: 'E-mail',
      bankName: 'Banque',
      bankAccount: 'Compte bancaire',
      bankAccountName: 'Nom du compte',
    },
    authz: {
      resource: 'Fournisseurs',
      view: 'Lire les détails fournisseur',
      manage: 'Gérer les fournisseurs',
      bankRead: 'Lire les informations bancaires',
      createdScope: 'Fournisseurs créés par l’utilisateur actuel',
    },
    empty: {
      accountsTitle: 'Aucun fournisseur',
      accountsDescription: 'Ajoutez un fournisseur manuel pour les achats.',
      readonlyTitle: 'Aucun fournisseur lisible',
      readonlyDescription:
        'Aucun fournisseur dans votre périmètre autorisé. Demandez aux achats d’ajouter un fournisseur ou à un administrateur l’autorisation Gérer les fournisseurs.',
      filteredTitle: 'Aucun fournisseur correspondant',
      filteredDescription: 'Modifiez ou effacez la recherche.',
    },
    error: {
      forbidden: 'Vous n’avez pas l’autorisation d’accéder à ces fournisseurs.',
      missing: 'Ce fournisseur est indisponible. Actualisez sa liste parente.',
      invalid: 'Vérifiez les champs du fournisseur.',
      failed:
        'Impossible de charger ou d’enregistrer les fournisseurs. Réessayez.',
      VENDOR_INVALID_INPUT:
        'Vérifiez les champs de contact et bancaires du fournisseur.',
      VENDOR_INVALID_COMMAND:
        'Un acteur et un motif de modification sont requis.',
      VENDOR_CODE_EXISTS: 'Ce code appartient déjà à un fournisseur.',
      VENDOR_VERSION_CONFLICT:
        'Ce fournisseur a changé. Chargez la dernière version avant de réessayer.',
      VENDOR_NOT_FOUND: 'Ce fournisseur est indisponible.',
      VENDOR_INACTIVE: 'Choisissez un fournisseur actif.',
      VENDOR_FIELDS_RESTRICTED:
        'Les champs du fournisseur sont hors de vos droits.',
      VENDOR_ACCESS_DENIED:
        'Vous n’avez pas l’autorisation d’effectuer cette action fournisseur.',
      VENDOR_PAYMENT_ACCOUNT_REQUIRED:
        'Complétez les coordonnées bancaires du fournisseur avant le paiement.',
    },
  },
};
