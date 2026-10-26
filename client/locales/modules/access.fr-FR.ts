export default {
  access: {
    guide: {
      title: 'Fonctionnement des rôles et autorisations',
      roles:
        'Configurez ici les opérations par service, poste ou responsabilité. Les membres reçoivent ces autorisations en complément de leurs attributions directes.',
      setsTitle: 'Ensembles d’autorisations',
      sets: 'Autorisations enregistrées derrière les rôles, consultables et réutilisables. Utilisez la page des rôles pour les modifications courantes.',
      defaultTitle: 'Accès aux enregistrements par défaut',
      default:
        'Fournit le périmètre de base lorsqu’une opération n’a pas de périmètre précis. N’accorde pas l’opération elle-même.',
      sharingTitle: 'Règles de partage',
      sharing:
        'Étend les enregistrements accessibles aux personnes qui disposent déjà de l’autorisation d’opération.',
      restrictionTitle: 'Règles de restriction',
      restriction:
        'Limite davantage les enregistrements autorisés accessibles.',
      inspectTitle: 'Inspecteur des autorisations',
      inspect:
        'Vérifiez les autorisations effectives et leurs sources lorsqu’une page ou un enregistrement est inaccessible.',
    },
    permissionColumn: 'Autorisation',
    personalGranted: 'Accordé personnellement',
    personalTarget: 'Choisir la destination de l’autorisation personnelle',
    rowSaving: 'Enregistrement…',
    rowSaved: 'Enregistré',
    rowFailed:
      'Modification non enregistrée. La configuration actuelle a été restaurée ; vérifiez et réessayez.',
    rowUncertain:
      'Le résultat de l’enregistrement n’a pas pu être confirmé. Actualisez avant toute autre modification.',
    inlinePermissionsHelp:
      'Les modifications sont enregistrées immédiatement. Les autorisations personnelles complètent les accès hérités ; les désactiver ne retire pas les autorisations héritées.',
    configuredOnly: 'Autorisations configurées uniquement',

    personalGrantEnabled: 'Accorder personnellement cette opération',
    systemScope: 'Utiliser les règles système',
    systemScopeHelp:
      'Les périmètres non précisés suivent les règles d’accès par défaut et de partage. Cela ne signifie pas tous les enregistrements.',
    grantSources: 'Accordé par',
    scopeForAction: '{{action}} : périmètre {{scope}}',
    personalGrantAction: 'Accorder personnellement « {{action}} »',
    personalGrantScope:
      'Accorder personnellement « {{action}} ». Périmètre de données : {{scope}}',
    personalGrantOff:
      'Aucune autorisation personnelle ; les autorisations héritées restent applicables.',
    personalGrantPending:
      'Modification non enregistrée. Elle prendra effet après enregistrement.',
    editPersonalCard: 'Modifier les autorisations personnelles de {{name}}',
    userPermissions: 'Autorisations',
    inheritedPermissions: 'Autorisations héritées',
    inheritedUnavailable: 'Vous n’avez pas accès aux autorisations héritées.',
    personalOnly: 'Exceptions personnelles uniquement',
    notGranted: 'Non accordé',
    notSet: 'Non défini',
    adjustPersonalPermissions: 'Ajuster les autorisations personnelles',
    unifiedPermissionsHelp:
      'Autorisations configurées par source. Les modifications personnelles ne retirent pas les autorisations héritées ; l’accès effectif suit également les restrictions applicables.',
    sourceGroups: {
      baseline: 'Socle commun à tous',
      duties: 'Rôles fonctionnels',
      organization: 'Relations organisationnelles',
      direct: 'Autorisations personnelles',
      system: 'Administrateur système',
    },
    noPersonalExceptions: 'Aucune exception personnelle',
    membershipChanged:
      'L’appartenance a été modifiée par une autre opération. L’état actuel a été rechargé ; confirmez les modifications restantes.',
    username: 'Nom d’utilisateur',
    personalExceptions: 'Exceptions personnelles',
    adjustExceptions: 'Ajuster les exceptions personnelles',
    exceptionsHelp:
      'Seules les autorisations directement accordées à cette personne sont modifiées. Les autorisations de rôle ou d’organisation peuvent rester applicables après leur retrait.',
    editDenied:
      'Vous ne pouvez pas modifier cette configuration. La vue en lecture seule est affichée.',
    permissionSources: 'Sources des autorisations',
    frozenConfiguration:
      'Ce compte est gelé. La configuration des autorisations est conservée et s’appliquera selon les règles en vigueur lors de l’activation.',
    frozenRoles:
      'Ce compte est gelé. Activez-le avant d’ajouter des rôles fonctionnels ; les rôles existants peuvent être retirés.',
    roleInactive: 'Inactif',
    roleAdditionBlocked:
      'Le compte est gelé ou un rôle sélectionné est inactif ou indisponible. Annulez ces ajouts ou rechargez l’état avant de confirmer.',
    membershipUnverified:
      'Le résultat n’est pas vérifié. Rechargez les appartenances avant de continuer ; ne répétez pas l’envoi.',
    dutyRolesHelp:
      'Les rôles fonctionnels directement attribués à cette personne apparaissent ici.',
    noPrimaryDepartment: 'Aucun service principal actuel',
    primaryDepartment: 'Service principal',
    departmentPath: 'Chemin du service',
    organizationHelp:
      'Les appartenances organisationnelles sont gérées par les administrateurs de l’organisation.',
    roleFilterInvalid:
      'Ce rôle fonctionnel est indisponible. Le filtre de rôle a été effacé.',
    roleFilterTooLarge:
      'Ce rôle compte plus de 500 membres. Le filtrage par ce rôle n’est pas pris en charge ; effacez le filtre.',
    organizationState: {
      'inactive-chain':
        'Le service principal ou un service parent est inactif. Cette relation organisationnelle ne s’applique pas actuellement.',
      'invalid-chain':
        'Cette relation organisationnelle est invalide. Contactez un administrateur de l’organisation.',
    },

    scopeNumber: 'Périmètre d’enregistrements {{number}}',
    scopeLabels: {
      paymentRequests: 'Demandes de paiement',
      reimbursementRequests: 'Demandes de remboursement',
      leaveRequests: 'Demandes de congé',
      contractRequests: 'Demandes d’approbation de contrat',
      certificateRequests: 'Demandes de certificat',
      sealRequests: 'Demandes de sceau',
      printTemplates: 'Modèles',
      printTemplateRevisions: 'Versions de modèles',
      knowledgeDocuments: 'Documents',
      knowledgeVersions: 'Versions de documents',
      knowledgeFolders: 'Dossiers',
      sealLedger: 'Enregistrements de sceaux',
      sealReceipts: 'Réceptions de sceaux',
      contracts: 'Contrats',
      contractVersions: 'Versions de contrats',
      contractChanges: 'Modifications de contrats',
      contractPayments: 'Paiements de contrats',
    },
    sourceNumber: 'Source {{number}}',
    more: 'Plus',
    userRoles: 'Rôles',
    permissionOverview: 'Vue d’ensemble des autorisations',
    noRoles: 'Aucun',
    organization: 'Organisation',
    moreFor: 'Plus · {{name}}',
    addModules: 'Ajouter des modules',
    userDetails: 'Détails de l’utilisateur',
    information: 'Informations',
    email: 'E-mail',
    accountStatus: 'Statut du compte',
    enabled: 'Active',
    disabled: 'Gelé',
    organizationReadOnly:
      'Les services, postes et liens hiérarchiques sont gérés dans Organisation.',
    advancedExceptions: 'Avancé : autorisations exceptionnelles',
    partialSave:
      '{{count}} modifications enregistrées. Les autres modifications sont conservées ; réessayez pour continuer.',
    addedRoles: 'Ajouter : {{names}}',
    removedRoles: 'Retirer : {{names}}',
    compareRole: 'Comparer le rôle',
    copyRole: 'Copier depuis la comparaison',
    copyHelp:
      'Copiez les autorisations ordinaires dans ce brouillon. Les politiques spéciales restent inchangées. Vérifiez toutes les modifications avant d’enregistrer.',
    advanced: 'Avancé',
    addRoles: 'Ajouter des rôles à la comparaison',

    directAudience: 'Attributions individuelles',
    dutyAudience: 'Membres du rôle de responsabilité',

    targetSet: 'Ensemble d’autorisations de destination',
    chooseTarget: 'Choisir un ensemble d’autorisations pour cette opération',
    targetRequired:
      'Choisissez une destination pour cette nouvelle opération avant d’enregistrer.',
    roleGrantTitle:
      '{{module}} ({{role}} · autorisation indépendante {{number}})',

    assignmentSearch:
      'Rechercher des autorisations, actions ou périmètres d’enregistrements',
    assignmentOnlySelected: 'Sélection uniquement',
    assignmentCount:
      '{{visible}} sur {{total}} affichés · {{selected}} sélectionnés dans tous les modules',
    assignmentChoicesHelp:
      'Filtrez par module, puis comparez les actions et périmètres d’enregistrements. Les ensembles de même nom restent indépendants. Les filtres conservent les sélections des autres modules.',
    assignmentBusiness: 'Opérations métier',
    assignmentOther: 'Administration / autres',
    pageAccess: 'Accès aux pages',
    configuredGrant: 'Accordé',
    dutyMembershipTitle:
      '{{action}} le rôle de responsabilité « {{role}} » pour « {{name}} » ?',
    exceptionSummary: 'Autorisations exceptionnelles : {{names}}',
    noExceptions: 'Aucun',
    baseOnlyDepartment:
      'Les accès du service s’étendent aux membres des services descendants. Préférez les rôles de responsabilité pour les opérations spécialisées.',

    adminMembersHelp:
      'Gérez les administrateurs dans les comptes utilisateurs. Conservez au moins un administrateur actif.',
    openUsers: 'Consulter les comptes utilisateurs',
    ruleLinks: 'Règles d’accès',
    rulesHelp:
      'Les règles d’accès par défaut, de partage et de restriction affectent toujours l’accès effectif.',
    defaultRules: 'Accès par défaut',
    sharingRules: 'Règles de partage',
    restrictionRules: 'Règles de restriction',

    modules: 'Parcourir par module',
    onlyConfigured: 'Configurés uniquement',
    baselineValue: 'Tous disposent de l’accès de base : {{value}}',
    advancedEdit: 'Éditeur avancé',
    changedCount: '{{count}} modifications',
    roleImpact: 'Membres concernés de « {{name}} » : {{count}}',
    sharedObjects:
      'Les ensembles d’autorisations sont également attribués à : {{names}}',
    changeShared: 'Modifier tous ces sujets',
    splitDefault:
      'Par défaut, créez des copies indépendantes des ensembles partagés pour ce rôle.',
    userPermissionsTitle: 'Autorisations de {{name}}',
    unionHelp:
      'Les périmètres d’enregistrements de plusieurs sources sont combinés ; les règles d’accès restent applicables.',
    assignedRoles: 'Rôles attribués',
    preferRoles:
      'Préférez les rôles de responsabilité ; les autorisations directes sont réservées aux exceptions.',
    exceptionGrant: 'Gérer les autorisations exceptionnelles',
    configurationDenied:
      'L’autorisation de lecture des ensembles d’autorisations est requise pour consulter les détails de configuration. Contactez un administrateur.',
    checkOperation: 'Vérifier une opération',
    notConfigured: 'Non configuré',
    applicable: 'S’applique à',
    modulesCount: 'Modules configurés',
    personalAudience: 'Attribution directe · {{count}} personnes',
    maintainedAudience: 'Membres gérés · {{count}} personnes',
    automaticAudience: 'Calculé à partir des relations organisationnelles',
    departmentAudience: 'Membres du service et des services descendants',
    positionAudience: 'Personnes occupant ce poste',
    allAuthenticated: 'Toutes les personnes connectées',
    organizationMembersHelp:
      'Les membres sont gérés dans l’organisation et déterminés à partir des relations actives.',
    openOrganization: 'Consulter l’organisation',
    adjustDutyRoles: 'Ajuster les rôles de responsabilité',
    membersUnknown: 'Nombre de membres indisponible',

    labelValue: '{{label}} : {{value}}',
    clearModuleFilters: 'Effacer les filtres',
    noModuleMatches: 'Aucune autorisation correspondante dans ce module',

    businessModules: 'Modules métier',
    allModules: 'Tout',
    otherModules: 'Autre',
    noModulePermissions: 'Aucune autorisation configurée dans ce module',
    moduleCount:
      '{{module}} : {{configured}} configurées / {{total}} ressources',

    actionsFor: 'Actions pour « {{name}} »',
    configuredScopes: 'Périmètres configurés',

    lastAdmin:
      'Au moins un administrateur système actif doit être conservé. Attribuez d’abord ce rôle à un remplaçant.',
    subjectNotAllowed:
      'Cet accès ne peut pas être attribué à ce type de sujet. Choisissez un autre accès métier.',

    title: 'Gestion des accès',
    description:
      'Configurez les opérations métier et périmètres d’enregistrements par rôle.',
    roles: 'Accès des rôles',
    baseline: 'Accès de base des utilisateurs connectés',
    baselineHelp:
      'L’accès de base s’applique aux comptes connectés. Les appartenances aux responsabilités affectent également les candidats aux approbations.',
    name: 'Nom',
    type: 'Type',
    all: 'Tous les types',
    dutyRoles: 'Rôles fonctionnels',
    positions: 'Postes',
    departments: 'Services',
    automatic: 'Accès automatique',
    members: 'Membres',
    permissions: 'Autorisations métier',
    missingMembers: 'Aucun membre attribué',
    memberDenied: 'Accès aux membres indisponible',
    membersFailed: 'Impossible de charger les membres',
    byMembership: 'Appliqué par l’appartenance',
    none: 'Aucun accès métier attribué',
    noneHelp:
      'Attribuez un accès métier existant après confirmation des responsabilités. Les accès hérités restent applicables.',
    searchRoles: 'Rechercher des rôles, postes ou services…',
    clear: 'Effacer les filtres',
    noResults: 'Aucun résultat correspondant',
    clearHelp: 'Modifiez votre recherche ou effacez les filtres.',
    loading: 'Chargement',
    refresh: 'Actualiser',
    denied:
      'Vous n’avez pas accès à cette opération. Contactez un administrateur des accès.',
    missing: 'Cet élément n’existe plus. Revenez à la liste.',
    conflict:
      'La configuration des accès a changé. Rechargez et vérifiez avant d’enregistrer.',
    failed:
      'Impossible de terminer cette opération. Réessayez ou contactez un administrateur.',
    reload: 'Recharger',
    retry: 'Réessayer',
    roleHelp:
      'Examinez les membres, opérations métier et périmètres d’enregistrements de cette responsabilité.',
    rules:
      'Des règles d’accès supplémentaires peuvent s’appliquer. Vérifiez les accès de la personne et l’opération métier effective.',
    actions: 'Actions',
    addMember: 'Ajouter un membre',
    remove: 'Retirer',
    memberImpact:
      'L’appartenance à une responsabilité affecte les accès hérités et les candidats aux approbations. Les autres sources d’accès restent applicables après retrait.',
    assign: 'Attribuer un accès métier',
    usedBy:
      'Cet accès est attribué à {{count}} sujets. Toute modification les affecte tous.',
    edit: 'Modifier',
    special: 'Configuration personnalisée existante',
    specialReadOnly:
      'La configuration personnalisée est en lecture seule et sera conservée lors de l’enregistrement.',
    noScope: 'Aucun périmètre d’enregistrements configuré',
    systemAdmin: 'Administrateur système',
    unrestricted: 'Administrateur système : accès sans restriction',
    removeTitle: 'Retirer le membre « {{name}} » ?',
    cancel: 'Annuler',
    removed: '« {{name}} » retiré',
    added: '« {{name}} » ajouté',
    addMemberTitle: 'Ajouter un membre à {{name}}',
    add: 'Ajouter',
    person: 'Personne',
    selectPerson: 'Sélectionnez la personne qui assumera cette responsabilité.',
    userDenied:
      'Vous ne pouvez pas consulter l’annuaire des utilisateurs. Contactez un administrateur.',
    direct: 'Attribué directement',
    inherited: 'Accès hérité',
    personUnknown: 'Personne (nom indisponible)',
    back: 'Retour à la liste',
    pageActionHelp:
      'L’accès aux pages contrôle le menu et l’entrée. Accordez séparément chaque opération métier et ses périmètres d’enregistrements ; l’accès à une page n’autorise pas à lui seul ses actions.',
    emptyDirectory: 'Aucun sujet disponible',
    emptyHelp:
      'Aucun enregistrement n’est actuellement disponible dans cet annuaire.',
    deniedAction: 'Non autorisé',
    sensitive: 'Accès sensible',
    impactUnavailable:
      'L’impact complet ne peut pas être vérifié. Vérifiez les sujets concernés et leur visibilité avant de modifier cet accès partagé.',
    conditional: 'Accès conditionnel',
    permitted: 'Accès inconditionnel',
    assignTitle: 'Modifier l’accès de « {{name}} »',
    assignHelp:
      'Sélectionnez les accès métier directs de ce sujet. Les autres sources sont conservées.',
    noAssignable: 'Aucun accès métier attribuable',
    preserveInherited:
      'Seules les attributions directes sont modifiées ici. Les accès hérités des services, postes, responsabilités et du socle commun restent applicables.',
    save: 'Enregistrer',
    saved: 'Accès de « {{name}} » enregistré',
    confirmTitle: 'Enregistrer les modifications d’accès de « {{name}} » ?',
    assignmentImpact:
      'Vérifiez les accès ajoutés et retirés. Les autres sources restent applicables ; un administrateur système doit rester actif.',
    discardTitle: 'Abandonner les modifications non enregistrées ?',
    discard: 'Abandonner',
    discardHelp:
      'Vos modifications n’ont pas été enregistrées. Les abandonner les supprimera.',
    editTitle: 'Modifier les accès métier de « {{name}} »',
    editorHelp:
      'Sélectionnez les opérations et périmètres individuellement. Les opérations sensibles sont distinctes ; vérifiez l’impact avant d’enregistrer.',
    impact: 'Sujets concernés',
    searchActions: 'Rechercher des fonctionnalités ou opérations métier…',
    multipleScopes:
      'Configurez chacun des périmètres ci-dessous pour cette opération.',
    levelFor: 'Périmètre d’enregistrements de « {{name}} »',
    protected: 'Cet accès est protégé',
    protectedHelp:
      'La protection système reste en vigueur. Gérez les administrateurs via les comptes utilisateurs.',
    sharedHelp:
      'Cette modification affecte chaque sujet répertorié ci-dessus. Vérifiez les opérations et périmètres.',
    system: 'Responsabilités système',
  },
};
