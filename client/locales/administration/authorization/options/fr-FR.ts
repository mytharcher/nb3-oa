import type { LocaleResource } from '@nocobase/i18n';

/**
 * Display vocabulary shared by the client and server locale catalogues.
 */
const enUS = {
  // Workspace sections this plugin registers through `authz.ui`.
  sections: {
    pages: 'Autorisations des pages',
    page: 'Pages',
    business: 'Autorisations métier',
    administration: 'Administration',
    other: 'Autre',
  },
  options: {
    defaultAndSharing: 'Utiliser le périmètre de données par défaut',
    actions: {
      assign: 'Gérer les attributions',
      configure: 'Configurer',
      inspect: 'Inspecter les autorisations',

      read: 'Lire',
      create: 'Créer',
      update: 'Mettre à jour',
      delete: 'Supprimer',
      access: 'Accès',
    },
    settingsModules: { authorization: 'Autorisations' },
    pages: {
      all: 'Toutes les pages',
      allDescription:
        'Autoriser l’accès à toutes les pages, y compris celles ajoutées ultérieurement.',
    },
    settings: {
      inspector: 'Inspecteur des autorisations',
      'permission-sets': 'Ensembles d’autorisations',
    },
    subjectTypes: {
      authenticated: 'Tous les utilisateurs connectés',
      authenticatedDescription:
        'S’applique à chaque utilisateur disposant d’une session de connexion valide.',
      user: 'Utilisateurs',
    },
    recordAccessPolicies: {
      allRecords: 'Tous les enregistrements',
      recordsIOwn: 'Enregistrements dont je suis propriétaire',
      recordsICreated: 'Enregistrements que j’ai créés',
      customFilter: 'Filtre personnalisé',
      customFilterHint:
        'Sélectionnez les enregistrements à l’aide d’une condition de filtrage personnalisée.',
    },
  },
};

/** English is the source of truth for this catalogue's shape. */
export type AuthorizationServerResource = LocaleResource<typeof enUS>;

export default enUS;
