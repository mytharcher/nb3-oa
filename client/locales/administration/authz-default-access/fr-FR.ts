export default {
  resourceTitle: 'Périmètre de données par défaut',
  navigation: { title: 'Périmètre de données par défaut' },
  defaultAccess: {
    supportedScope:
      'Seuls les types de ressources prenant en charge les périmètres de données sont affichés. Configurez ici le périmètre d’enregistrements par défaut de chaque action.',
    groupFilter: 'Groupe de ressources',
    allGroups: 'Tous les groupes',
    inlineHint:
      'Les modifications simples sont enregistrées immédiatement. Configurez et enregistrez les périmètres spécifiques dans le panneau latéral.',
    saved: 'Enregistré',
    editScope: 'Modifier le périmètre',
    back: 'Retour à l’accès par défaut',

    configureResource: 'Configurer la ressource',
    configure: 'Configurer',
    chooseResource:
      'Choisissez une ressource pour configurer ses périmètres d’enregistrements par défaut.',
    configured: 'Configuré',
    noDefault: 'Aucun périmètre par défaut',
    customScope: 'Périmètre spécifique',

    page: {
      title: 'Périmètre de données par défaut',
      description:
        'Le périmètre de données par défaut étend le périmètre de base des enregistrements pour les utilisateurs disposant de l’autorisation d’action concernée. Il n’accorde aucune autorisation d’action ou de champ ; les règles de partage et de restriction s’appliquent également.',
    },
    search: 'Rechercher par nom ou clé de ressource',
    create: 'Définir l’accès par défaut',
    recordAccessHeader: 'Accès aux enregistrements par défaut',
    allowedActions: 'Actions autorisées',
    emptyNone:
      'Aucun accès par défaut configuré. Les ensembles d’autorisations et autres règles déterminent l’accès.',
    emptySearch:
      'Aucune règle d’accès par défaut ne correspond à votre recherche.',
    pagerLabel: 'Règles de périmètre de données par défaut',
    editTitle: 'Modifier l’accès par défaut',
    newTitle: 'Définir l’accès par défaut',
    editorDescription:
      'Définissez la visibilité de base des enregistrements avant l’application des partages et restrictions.',
    resourceHeading: 'Ressource',
    resourceDescription:
      'Choisissez la collection dont vous définissez l’accès de base.',
    accessHeading: 'Accès par action',
    accessDescription:
      'Définissez indépendamment le périmètre des enregistrements de chaque action.',
    deleteRule: 'Supprimer la règle',
    save: 'Enregistrer l’accès par défaut',
    confirmDeleteTitle:
      'Retirer les paramètres par défaut de « {{resource}} » ?',
    confirmDeleteBody:
      'Supprimer la règle d’accès par défaut de « {{resource}} ». Les ensembles d’autorisations et règles restants détermineront l’accès.',
  },
};
