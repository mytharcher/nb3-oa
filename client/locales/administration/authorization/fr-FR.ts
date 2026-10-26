import optionMessages from './options/fr-FR.js';
import type { LocaleResource } from '@nocobase/i18n';

const messages = {
  navigation: {
    authorization: 'Autorisations',
    permissionSets: 'Ensembles d’autorisations',
    inspector: 'Inspecteur des autorisations',
  },
  feedback: {
    saved: '« {{name}} » enregistré',
    deleted: '« {{name}} » supprimé',
    assigned: 'Autorisations de « {{name}} » attribuées',
    revoked: 'Autorisations de « {{name}} » révoquées',
  },
  common: {
    actionsFor: 'Actions pour « {{name}} »',
    clearFilters: 'Effacer les filtres',
    all: 'Tout',
    allFields: 'Tous les champs',
    cancel: 'Annuler',
    close: 'Fermer',
    delete: 'Supprimer',
    edit: 'Modifier',
    key: 'Clé',
    keyHint: 'Identifiant stable utilisé par les API.',
    loading: 'Chargement…',
    noFields: 'Aucun champ',
    remove: 'Retirer',
    removeNamed: 'Retirer {{label}}',
    resource: 'Ressource',
    retry: 'Réessayer',
    ruleSections: 'Sections de règle',
    search: 'Rechercher',
    selectNamed: 'Sélectionner {{label}}',
    signedInUsers: 'Tous les utilisateurs connectés',
    type: 'Type',
    view: 'Consulter',
  },
  page: {
    loadFailed: 'Impossible de charger cette page.',
  },
  pagination: {
    navLabel: 'Pagination de {{label}}',
    next: 'Page suivante',
    page: 'Page {{number}}',
    previous: 'Page précédente',
    range: '{{first}}–{{last}} sur {{total}}',
    empty: '0 sur 0',
  },
  filters: {
    clear: 'Effacer le filtre',
    clearSearch: 'Effacer {{label}}',
  },
  errors: {
    requestFailed: 'La demande d’autorisation a échoué.',
    lastAssignment:
      'Cet ensemble d’autorisations doit conserver un bénéficiaire actif. Attribuez-le à un autre compte activé avant de retirer cette attribution.',
    protectedSet:
      'Cet ensemble d’autorisations est géré par l’application et ne peut pas être modifié ici.',
    subjectNotAllowed:
      'Cet ensemble d’autorisations ne prend pas en charge le type de sujet sélectionné. Choisissez un type autorisé par l’application.',
    completePermissions: 'Complétez chaque autorisation avant d’enregistrer.',
    completeRule: 'Complétez la règle avant d’enregistrer.',
    selectAnAction: 'Sélectionnez au moins une action.',
  },
  marks: {
    labels: {
      all: 'Accès complet',
      scoped: 'Accès limité',
      none: 'Aucun accès',
      bypass: 'Sans restriction',
    },
    descriptions: {
      all: 'Accès complet',
      scoped: 'Accès limité',
      none: 'Aucun accès',
      bypass:
        'Sans restriction : les autorisations accordées ne sont pas consultées',
    },
  },
  filterEditor: {
    logic: 'Logique du groupe',
    all: 'Toutes les conditions (ET)',
    any: 'Au moins une condition (OU)',
    addGroup: 'Ajouter un groupe',
    removeGroup: 'Retirer le groupe',
    valueType: 'Type de valeur',
    text: 'Texte',
    number: 'Nombre',
    boolean: 'Booléen',
    unsupported:
      'Cette condition est conservée mais ne peut pas être modifiée visuellement.',
    invalid:
      'Aucun élément de filtre modifiable trouvé. Recommencer remplace le filtre existant.',
    start: 'Configurer les conditions',
  },
  filterOperators: {
    $includes: 'Contient',
    $notIncludes: 'Ne contient pas',
    $startsWith: 'Commence par',
    $endsWith: 'Se termine par',
    $empty: 'Est vide',
    $notEmpty: 'N’est pas vide',
    $isTruly: 'Est vrai',
    $isFalsy: 'Est faux',

    $eq: 'Est égal à',
    $ne: 'Est différent de',
    $in: 'Dans',
    $notIn: 'Pas dans',
    $gt: 'Supérieur à',
    $gte: 'Au moins',
    $lt: 'Inférieur à',
    $lte: 'Au plus',
  },
  labels: {
    allRecords: 'Tous les enregistrements',
    selectedRecords: '{{count}} enregistrements sélectionnés',
    unknownScope: 'Périmètre inconnu',
    actionScope: '{{action}} : {{scope}}',
  },
  subjects: {
    matchAny: 'S’applique lorsqu’au moins un sujet sélectionné correspond.',
    search: 'Rechercher des sujets',
    empty: 'Aucun sujet correspondant',
    previous: 'Précédent',
    next: 'Suivant',
    selected: 'Sujets sélectionnés · {{count}}',
    unresolved: '{{id}} (non résolu)',
    none: 'Aucun sujet sélectionné',
  },
  editors: {
    resourceGroup: 'Groupe de ressources',
    actions: 'Actions',
    addCondition: 'Ajouter une condition',
    assignments: 'Attributions',
    assignmentsSelected: {
      one: '{{count}} attribution sélectionnée',
      other: '{{count}} attributions sélectionnées',
    },
    audienceHint:
      'S’applique à chaque utilisateur disposant d’une session de connexion valide.',
    filterConditions: 'Conditions de filtrage',
    records: 'Enregistrements',
    recordsSelected: {
      one: '{{count}} enregistrement sélectionné',
      other: '{{count}} enregistrements sélectionnés',
    },
    recordAccessPolicy: 'Politique d’accès aux enregistrements',
    recordScope: 'Périmètre des enregistrements',
    resource: 'Ressource',
    resourceType: 'Type de ressource',
    searchPeople: 'Rechercher des personnes',
    searchPeoplePlaceholder:
      'Rechercher par nom, identifiant ou adresse e-mail',
    searchRecords: 'Rechercher des enregistrements',
    selectUser: 'Sélectionner un utilisateur',
    specificRecordIds: 'Identifiants d’enregistrements précis',
    specificUser: 'Utilisateur précis',
    user: 'Utilisateur',
    who: 'Qui',
  },
  permissionWorkspace: {
    businessModules: 'Modules métier',
    allModules: 'Tout',
    otherModules: 'Autre',
    clearFilters: 'Effacer les filtres',
    noModuleMatches: 'Aucune autorisation correspondante dans ce module',
    moduleCount:
      '{{module}} : {{configured}} configurées / {{total}} ressources',

    pageAccessHint:
      'L’accès aux pages contrôle leur ouverture. Les autorisations métier contrôlent les opérations sur les données.',
    specifyScope: 'Définir le périmètre : {{scope}}',
    inheritScope:
      'Sans précision, les périmètres par défaut configurés et les règles de partage et de restriction restent applicables.',
    configurePermission: 'Configurer l’autorisation',
    noOperationGrant:
      'Cet ensemble d’autorisations n’accorde pas cette opération. Choisissez Configurer l’autorisation pour définir son périmètre de données.',
    features: 'Autorisations fonctionnelles',
    dataScope: 'Périmètre de données',
    dataScopeHelp:
      'Filtre les autorisations de cet ensemble, y compris les enregistrements partagés. L’absence de restriction n’ajoute aucun filtre et n’accorde aucun enregistrement.',
    appliesTo: 'S’applique à',
    moduleGranted: 'Accès complet',
    modulePartial: 'Accès limité',
    moduleNotGranted: 'Aucun accès',

    selectAll: 'Tout sélectionner',
    selectFiltered: 'Sélectionner les ressources correspondantes',
    selectGroup: 'Tout sélectionner dans {{group}}',

    expandSets: 'Développer les ensembles d’autorisations',
    collapseSets: 'Réduire les ensembles d’autorisations',
    userAssignments: 'Bénéficiaires',
    chooseSet: 'Choisissez un ensemble d’autorisations ou créez-en un.',
    clickScope: 'Cliquez sur une icône de périmètre pour modifier l’accès.',
    mode: {
      none: 'Aucun accès',
      all: 'Accès complet',
      custom: 'Périmètre personnalisé',
    },
    unavailableSet:
      'Cet ensemble d’autorisations est introuvable ou ne peut pas être modifié.',
    description:
      'Configurez les ressources de cet ensemble d’autorisations. Les modifications s’appliquent après enregistrement.',
    sections: 'Sections de l’ensemble d’autorisations',
    permissions: 'Autorisations',
    details: 'Informations générales',
    unsaved: 'Modifications non enregistrées',
    showMore: 'Afficher plus',
    development: {
      pages:
        'Aucune page nécessitant une autorisation n’a été définie. Demandez à l’IA d’ajouter des autorisations d’accès à vos pages métier, puis configurez-les ici.',
      business:
        'Aucune autorisation métier n’a été définie. Demandez à l’IA de concevoir les opérations, champs et périmètres d’enregistrements de votre activité, puis configurez-les ici.',
    },
    configuredOnly: 'Ressources configurées uniquement',
    configured: 'Configuré dans cet ensemble',
    backResources: 'Retour aux ressources',
    discardTitle: 'Abandonner les modifications non enregistrées ?',
    discard: 'Abandonner les modifications',
    discardBody:
      'Vos modifications d’autorisations n’ont pas été enregistrées.',
    configureScope: 'Configurer le périmètre des enregistrements',
  },
  databasePolicy: {
    addCondition: 'Ajouter une condition',
    filterField: 'Champ du filtre',
    filterOperator: 'Opérateur du filtre',
    filterValue: 'Valeur du filtre',
    removeCondition: 'Retirer la condition',
    conditionRequired: 'Ajoutez au moins une condition.',
  },
  inspector: {
    summary: {
      all: 'Cette opération est autorisée.',
      scoped:
        'Cette opération est autorisée uniquement dans les limites des enregistrements et des champs applicables.',
      none: 'Cette opération n’est pas autorisée. Accorder des enregistrements ne suffit pas à autoriser l’opération.',
      error:
        'La vérification n’a pas pu être effectuée. Il ne s’agit pas d’un refus d’autorisation.',
      context: 'Sélectionnez un utilisateur précis pour évaluer ce périmètre.',
    },
    dataAccess: 'Données accessibles',
    subjectHint:
      '« Moi » désigne la personne dont les autorisations sont inspectées.',
    scopeAndFields: 'Voir les conditions et champs effectifs',
    technicalHint:
      'Résultat brut de l’autorisation pour le diagnostic, y compris les vérifications des pages et tables sous-jacentes.',
    selectedRecords: '{{count}} enregistrements sélectionnés',
    databaseActions: {
      read: 'Lire',
      create: 'Créer',
      update: 'Mettre à jour',
      delete: 'Supprimer',
    },

    subjectType: 'Type de sujet',
    subject: 'Sujet',
    selectSubject: 'Sélectionner un sujet',
    searchSubjects: 'Rechercher des sujets',
    inheritsFrom: 'Hérite de :',
    grantedVia: 'via {{label}}',
    grantedDirectly: 'attribué directement',
    inheritedSubject: '{{name}} ({{type}})',
    listSeparator: ', ',
    noRegisteredResources:
      'Aucune ressource n’est encore enregistrée pour ce type.',
    status: {
      context: 'Contexte utilisateur requis',
      all: 'Autorisé',
      scoped: 'Autorisé avec limites',
      none: 'Non autorisé',
      error: 'Échec de l’inspection',
    },
    reasonCodes: {
      NO_MATCHING_GRANT: 'Aucun élément n’accorde cette opération',
      RESOURCE_ACTION_NOT_SUPPORTED:
        'Cette ressource ne propose pas cette opération',
      USER_CONTEXT_REQUIRED:
        'Ce périmètre dépend d’un utilisateur précis et ne peut pas être déterminé à partir de ce seul sujet.',
      GRANT_MATCHED: 'Cette opération est accordée',
      SELECTION_EXPANDED: 'Étend les enregistrements accessibles',
      SELECTION_RESTRICTED: 'Restreint les enregistrements accessibles',
      NO_OBJECT_PERMISSION: 'Cette opération n’a pas été accordée',
      NO_RECORD_ACCESS: 'Aucun périmètre d’enregistrements accessible',
      EMPTY_RECORD_ACCESS: 'Le périmètre ne correspond à aucun enregistrement',
      UNRESTRICTED_ACCESS: 'Accès sans restriction',
    },
    inputFields: 'Champs modifiables',
    outputFields: 'Champs retournés',
    allFields: 'Tous les champs',

    refresh: 'Actualiser',
    failed: 'Échec de l’inspection',
    noResources: 'Aucune ressource correspondante',
    recordScope: 'Périmètre effectif des enregistrements',
    fields: 'Champs autorisés',
    fieldSearch: 'Rechercher des champs',
    technicalDetails: 'Détails techniques',
    allConditions: 'Toutes les conditions doivent être remplies',
    anyCondition: 'Au moins une condition doit être remplie',

    page: {
      title: 'Inspecteur des autorisations',
      description:
        'Consultez les accès accordés à un sujet d’autorisation et examinez leurs motifs.',
    },
    person: 'Personne',
    selectPerson: 'Sélectionner une personne',
    searchPeople: 'Rechercher des personnes',
    searchPeoplePlaceholder:
      'Rechercher par nom, identifiant ou adresse e-mail',
    action: 'Action',
    selectAction: 'Sélectionner une action',
    inspect: 'Inspecter',
    inspecting: 'Inspection…',
    empty:
      'Sélectionnez un sujet d’autorisation pour consulter ses autorisations sur les ressources.',
    decision: 'Décision',
    effects: {
      permit: 'Autorisé',
      deny: 'Refusé',
      conditional: 'Autorisé sous conditions',
    },
    reasons: 'Motifs',
    noReasons: 'La décision ne comporte aucun motif.',
    reasonFrom: 'Depuis {{plugin}}',
    reasonFromCore: 'Depuis le noyau des autorisations',
    conditions: 'Conditions',
    conditionsHint:
      'La décision s’applique uniquement aux éléments sélectionnés par ces conditions, affichées telles que retournées par le noyau.',
  },
  permissionSets: {
    builtIn: { root: 'Administrateur système', member: 'Membre' },
    page: {
      title: 'Ensembles d’autorisations',
      description:
        'Les ensembles d’autorisations accordent l’accès : regroupez les ressources et actions nécessaires aux personnes, puis attribuez-leur cet ensemble.',
    },
    unknownPage: 'Page inconnue',
    assignmentCount: {
      one: '{{count}} attribution',
      other: '{{count}} attributions',
    },
    list: {
      search: 'Rechercher par nom ou clé d’ensemble d’autorisations',
      create: 'Nouvel ensemble d’autorisations',
      nameHeader: 'Ensemble d’autorisations',
      system: 'Système',
      custom: 'Personnalisé',
      emptyNone:
        'Aucun ensemble d’autorisations. Créez-en un pour regrouper les ressources et actions nécessaires.',
      emptySearch:
        'Aucun ensemble d’autorisations ne correspond à votre recherche.',
      pagerLabel: 'Ensembles d’autorisations',
    },
    detail: {
      untitled: 'Nouvel ensemble d’autorisations',
      unrestrictedTitle:
        'Cet ensemble d’autorisations accorde un accès sans restriction.',
      unrestrictedBody:
        'Cet ensemble accorde un accès sans restriction, indépendant des autres ensembles d’autorisations et des règles de partage ou de restriction. Aucune autorisation individuelle ne doit être configurée. Gérez ses attributions dans Bénéficiaires.',
      confirmDeleteTitle:
        'Supprimer l’ensemble d’autorisations « {{title}} » ?',
      confirmDeleteBody:
        'Supprimer « {{title}} » et ses attributions. Les autres ensembles d’autorisations et règles restent en vigueur.',
      confirmDelete: 'Supprimer',
    },
    assignments: {
      search: 'Rechercher des attributions',
      searchPlaceholder: 'Rechercher par nom ou identifiant de sujet',
      kindLabel: 'Type d’attribution',
      kindAll: 'Toutes les attributions',
      kindUsers: 'Utilisateurs',
      kindAudiences: 'Publics',
      revokeSelected: 'Révoquer la sélection ({{count}})',
      add: 'Ajouter des attributions',
      assignedTo: 'Attribué à',
      subjectType: 'Type de sujet',
      selectAllVisible: 'Sélectionner toutes les attributions visibles',
      audience: 'Public',
      user: 'Utilisateur',
      revoke: 'Révoquer',
      emptyNone:
        'Aucune attribution. Ajoutez-en une pour accorder cet ensemble d’autorisations à une personne.',
      emptyFiltered: 'Aucune attribution ne correspond à ces filtres.',
      pagerLabel: 'Attributions',
      confirmRevokeTitleOne: 'Révoquer l’attribution de « {{name}} » ?',
      confirmRevokeTitleMany: 'Révoquer les attributions de « {{name}} » ?',
      confirmRevokeBody:
        '{{label}} ne disposera plus de cet ensemble d’autorisations. Les autres attributions restent en vigueur et cet ensemble pourra être attribué à nouveau.',
      confirmRevoke: 'Révoquer',
      pickerDescription:
        'Sélectionnez les sujets auxquels attribuer cet ensemble d’autorisations.',
      audienceDescription:
        'Toute personne disposant d’une session valide. Ce public est géré séparément des utilisateurs individuels.',
      usersHeading: 'Utilisateurs',
      usersHint: 'Les utilisateurs déjà bénéficiaires sont masqués.',
      selectedCount: '{{count}} sélectionnés',
      selectAllResults: 'Sélectionner tous les résultats',
      userCount: '{{count}} utilisateurs',
      noAvailableUsers:
        'Aucun utilisateur disponible ne correspond à votre recherche.',
      assigning: 'Attribution…',
    },
    editor: {
      nameRequired: 'Saisissez un nom d’ensemble d’autorisations.',
      keyRequired: 'Saisissez une clé d’ensemble d’autorisations.',
      resourceRequired: 'Choisissez une ressource pour cette autorisation.',
      actionsRequired: 'Choisissez au moins une action pour cette ressource.',
      editTitle: 'Modifier l’ensemble d’autorisations',
      newTitle: 'Nouvel ensemble d’autorisations',
      description: 'Regroupez les accès dans un ensemble réutilisable.',
      name: 'Nom',
      permissions: 'Autorisations',
      permissionsHint:
        'Choisissez les ressources et les actions accordées par cet ensemble.',
      addPermission: 'Ajouter une autorisation',
      searchResources: 'Rechercher des ressources ou des actions',
      resourceTypeLabel: 'Type de ressource de l’autorisation',
      allResourceTypes: 'Tous les types de ressources',
      visibleCount: '{{visible}} ressources sur {{total}}',
      noActions: 'Aucune action',
      unknownPageNotice:
        'Aucune route ne déclare plus cette page : cette autorisation n’accorde donc aucun accès. La page a été renommée ou supprimée. Retirez l’autorisation ou ajoutez-en une pour la page qui la remplace.',
      emptyFiltered: 'Aucune autorisation ne correspond à ces filtres.',
      addFirst: 'Ajouter la première autorisation',
      addFirstHint:
        'Sélectionnez les ressources par type, puis configurez leurs actions.',
      saving: 'Enregistrement…',
      save: 'Enregistrer l’ensemble d’autorisations',
      confirmRemoveTitle: 'Retirer cette autorisation ?',
      confirmRemoveBody:
        '{{resource}} et toutes ses actions configurées seront retirées de cet ensemble d’autorisations. Cette action est irréversible après enregistrement de l’ensemble.',
      confirmRemove: 'Retirer l’autorisation',
      thisResource: 'Cette ressource',
    },
    picker: {
      title: 'Ajouter des autorisations',
      description:
        'Sélectionnez les ressources et configurez leurs accès dans un même espace.',
      resourceTypes: 'Types de ressources',
      resources: 'Ressources',
      selectResourceHint: 'Sélectionnez une ressource pour la configurer.',
      searchResources: 'Rechercher des ressources',
      added: 'Ajouté',
      noResources: 'Aucune ressource ne correspond à votre recherche.',
      emptyTitle: 'Sélectionner une ressource à configurer',
      emptyHint: 'Ses actions et paramètres d’accès propres apparaîtront ici.',
      readyCount: {
        one: '{{count}} ressource prête à ajouter',
        other: '{{count}} ressources prêtes à ajouter',
      },
      incomplete: ' · Sélectionnez au moins une action par ressource',
      add: 'Ajouter des autorisations',
    },
  },
  ruleWorkspace: {
    unset: 'Non défini',
    unsetHint:
      'Aucun périmètre d’enregistrements supplémentaire n’est fourni pour cette action.',
    clearDefaults: 'Retirer la configuration par défaut',
    setDefault: 'Définir le périmètre par défaut',
  },
};

const enUS: typeof messages & typeof optionMessages = {
  ...messages,
  ...optionMessages,
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type AuthorizationResource = LocaleResource<typeof enUS>;

export default enUS;
