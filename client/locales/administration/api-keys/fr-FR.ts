import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Fermer',
  nav: { apiKeys: 'Clés API' },
  page: {
    search: 'Rechercher par nom de clé',
    retry: 'Réessayer',
    clear: 'Effacer les filtres',
    noResults: 'Aucune clé ne correspond à votre recherche.',
    loading: 'Chargement',
    title: 'Clés API',
    description:
      'Créez des clés permettant aux scripts et aux intégrations d’appeler cette application en votre nom.',
    add: 'Créer une clé',
    empty: 'Vous n’avez pas encore de clé API.',
    unnamed: 'Clé sans nom',
    never: 'Jamais',
    unused: 'Jamais utilisée',
    active: 'Active',
    expired: 'Expirée',
    disabled: 'Désactivée',
    columns: {
      name: 'Nom',
      key: 'Clé',
      status: 'Statut',
      lastUsed: 'Dernière utilisation',
      expires: 'Expiration',
      actions: 'Actions',
    },
    actions: { revoke: 'Révoquer', menu: 'Actions pour « {{name}} »' },
  },
  form: {
    title: 'Créer une clé API',
    description:
      'La clé agit en votre nom et dispose exactement des autorisations de votre compte.',
    name: 'Nom',
    namePlaceholder: 'Tâche d’export nocturne',
    expiry: 'Expiration',
    expiryChoices: {
      never: 'Jamais',
      '7': 'Dans 7 jours',
      '30': 'Dans 30 jours',
      '90': 'Dans 90 jours',
      '365': 'Dans 1 an',
    },
    cancel: 'Annuler',
    create: 'Créer',
  },
  reveal: {
    title: 'Copiez votre clé maintenant',
    description:
      '« {{name}} » a été créée. La clé n’est affichée qu’une seule fois.',
    usage: 'Transmettez-la dans l’en-tête de requête x-api-key.',
    copy: 'Copier la clé',
    done: 'Terminé',
  },
  revoke: {
    success: 'Clé « {{name}} » révoquée',
    title: 'Révoquer la clé « {{name}} » ?',
    description:
      'Les requêtes utilisant « {{name}} » échoueront immédiatement. Cette action est irréversible.',
    cancel: 'Annuler',
    confirm: 'Révoquer',
  },
  errors: {
    forbidden:
      'Vous ne pouvez plus consulter les clés. Contactez un administrateur.',
    notFound:
      'La gestion des clés API est indisponible. Revenez à votre espace de travail.',
    nameRequired: 'Saisissez un nom de clé.',
    copyFailed:
      'Impossible de copier la clé. Sélectionnez-la et copiez-la manuellement.',
    loadFailed: 'Impossible de charger vos clés API.',
    createFailed: 'Impossible de créer la clé API.',
    revokeFailed: 'Impossible de révoquer la clé API.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type ApiKeysResource = LocaleResource<typeof enUS>;

export default enUS;
