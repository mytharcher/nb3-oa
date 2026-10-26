/**
 * English wording of the `org` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `org.zh-CN.ts` is checked against this shape.
 *
 * `authz`, `subjects`, `scopes` and `dutyRoleTitles` are rendered from `{ key, ns }` descriptors the server stores or
 * registers (settings items, subject types, record accesses, seeded duty-role titles), in the application namespace.
 */
const orgEnUS = {
  org: {
    navigation: {
      departments: 'Services',
      positions: 'Postes',
      grades: 'Grades',
      dutyRoles: 'Rôles de responsabilité',
    },
    authz: {
      section: 'Organisation et personnel',
      departments: 'Services',
      positions: 'Postes',
      grades: 'Grades',
      dutyRoles: 'Rôles de responsabilité',
      read: 'Consulter',
      update: 'Gérer',
    },
    subjects: {
      departments: 'Services',
      heads: 'Chefs de service',
      dutyRoles: 'Rôles de responsabilité',
      disabled: 'Désactivée',
    },
    scopes: {
      mine: 'Mes services',
      mineHint:
        'Enregistrements appartenant aux membres des services auxquels j’appartiens ou que je dirige.',
      mineAndBelow: 'Mes services et leurs descendants',
      mineAndBelowHint:
        'Enregistrements appartenant aux membres de mes services et de tous leurs services descendants.',
      headed: 'Services que je dirige et leurs descendants',
      headedHint:
        'Enregistrements appartenant aux membres des services que je dirige et de tous leurs services descendants.',
    },
    dutyRoleTitles: {
      gm: 'Directeur général',
      cfo: 'Directeur financier',
      hr: 'Spécialiste RH',
      hrbp: 'Partenaire RH',
      hrDirector: 'Directeur des ressources humaines',
      admin: 'Administration',
      sealKeeper: 'Dépositaire des sceaux',
      finance: 'Comptable',
      financeManager: 'Responsable financier',
      cashier: 'Caissier',
      legal: 'Juridique',
      purchasing: 'Achats',
      it: 'Informatique',
      committeeTech: 'Comité d’examen (siège technique)',
    },
    common: {
      active: 'Activé',
      inactive: 'Désactivée',
      allStatuses: 'Tous les statuts',
      noResults: 'Aucun élément ne correspond à vos filtres.',
      clearFilters: 'Effacer les filtres',
      clearSearch: 'Effacer la recherche',
      searchByTitleOrCode: 'Rechercher par nom ou code',
      askAdministrator:
        'Demandez à un administrateur de configurer cet élément.',
      fields: {
        title: 'Nom',
        code: 'Code',
        status: 'Statut',
        name: 'Nom',
        email: 'E-mail',
        user: 'Personne',
      },
      actions: {
        label: 'Actions',
        more: 'Actions pour {{name}}',
        edit: 'Modifier',
        enable: 'Activer',
        disable: 'Désactiver',
      },
      form: {
        titleRequired: 'Saisissez un nom.',
        titleTooLong: 'Utilisez au maximum {{max}} caractères.',
        codeRequired: 'Saisissez un code.',
        codeFormat:
          'Utilisez lettres, chiffres, « . », « _ » et « - », en commençant par une lettre ou un chiffre, jusqu’à 64 caractères.',
        codeHint:
          'Identifiant stable utilisé par les importations et autres systèmes.',
        integer: 'Saisissez un entier.',
        userRequired: 'Choisissez une personne.',
      },
    },
    errors: {
      executiveTopLevelOnly:
        'Seuls les services de premier niveau peuvent désigner un dirigeant ; les services enfants en héritent.',
      codeTaken: 'Ce code est déjà utilisé. Choisissez-en un autre.',
      parentCycle:
        'Un service ne peut pas être placé sous lui-même ou l’un de ses sous-services.',
      parentNotFound:
        'Le service parent n’existe plus. Choisissez-en un autre.',
      userNotFound: 'Cette personne n’existe pas ou est désactivée.',
      notFound: 'Cet enregistrement n’existe pas ou a été supprimé.',
      forbidden: 'Vous n’avez pas l’autorisation d’effectuer cette action.',
      requestFailed: 'La requête a échoué. Veuillez réessayer.',
    },
    departmentPicker: {
      placeholder: 'Rechercher des services',
      empty: 'Aucun service correspondant',
      loadFailed: 'Impossible de charger les services.',
      inactivePath: '{{path}} (désactivé)',
    },
    departments: {
      title: 'Services',
      description:
        'Gérez l’arborescence des services, leurs responsables et membres. Désactiver un service désactive tous ses descendants.',
      create: 'Nouveau service',
      createChild: 'Nouveau sous-service',
      editTitle: 'Modifier le service',
      formDescription:
        'Changer le parent déplace le service avec tous ses descendants.',
      created: 'Service « {{name}} » créé',
      saved: 'Service « {{name}} » enregistré',
      enabled: 'Service « {{name}} » activé',
      disabled: 'Service « {{name}} » désactivé',
      disableTitle: 'Désactiver le service « {{name}} » ?',
      disableDescription:
        'Ses sous-services cessent également d’être pris en compte et ses membres n’héritent plus de ses autorisations. Rien n’est supprimé ; vous pouvez le réactiver à tout moment.',
      loadFailed: 'Impossible de charger les services',
      emptyTitle: 'Aucun service pour le moment',
      emptyDescription:
        'Créez le sommet de votre organisation, puis ajoutez des services en dessous.',
      noResults: 'Aucun service ne correspond à votre recherche.',
      searchPlaceholder: 'Rechercher par nom ou code de service',
      treeLabel: 'Arborescence des services',
      choose: 'Choisissez un service à gauche pour voir ses détails.',
      notFound: 'Ce service n’existe pas ou a été supprimé.',
      backToTree: 'Retour à l’arborescence',
      topLevel: 'Service de premier niveau',
      inheritedFrom: '(hérité de « {{name}} »)',
      inactiveByAncestor: 'Désactivé avec « {{name}} »',
      fields: {
        parent: 'Service parent',
        manager: 'Chef de service',
        executive: 'Membre de la direction responsable',
        sortOrder: 'Ordre de tri',
      },
      form: {
        codeHint:
          'Facultatif. Les importations mettent à jour les services par code.',
        parentPlaceholder: 'Premier niveau (sans parent)',
        parentHint: 'Laissez vide pour un service de premier niveau.',
        managerHint:
          'Les approbations vont à cette personne ; elle n’a pas besoin d’être membre. Si vide : le responsable du service parent.',
        executiveHint:
          'Défini uniquement sur les services de premier niveau. Sélectionner un parent efface ce champ ; les services enfants en héritent.',
        sortOrderHint:
          'Les nombres inférieurs passent en premier parmi les services de même niveau.',
      },
      members: {
        title: 'Membres ({{count}})',
        description:
          'Membres directs. Chaque personne possède un service principal utilisé pour les approbations et budgets.',
        add: 'Ajouter un membre',
        addTitle: 'Ajouter un membre à « {{name}} »',
        added: '« {{name}} » ajouté à « {{department}} »',
        primary: 'Type de service',
        primaryBadge: 'Principal',
        secondaryBadge: 'Secondaire',
        makePrimary: 'Définir comme service principal',
        primarySet:
          '« {{name}} » a désormais ce service comme service principal',
        makePrimaryField: 'Définir comme son service principal',
        makePrimaryHint:
          'Remplace son service principal actuel. Si non coché, il devient principal uniquement si la personne n’en possède pas.',
        remove: 'Retirer du service',
        removeTitle: 'Retirer « {{name}} » de « {{department}} » ?',
        removeDescription:
          'Cette personne n’héritera plus des autorisations de ce service. S’il s’agissait de son service principal, elle n’en aura plus jusqu’à ce que vous en définissiez un autre.',
        removed: '« {{name}} » retiré de « {{department}} »',
        loadFailed: 'Impossible de charger les membres',
        emptyTitle: 'Aucun membre pour le moment',
        emptyDescription: 'Ajoutez les personnes travaillant dans ce service.',
      },
    },
    positions: {
      title: 'Postes',
      description:
        'Postes auxquels les dossiers d’employés font référence. Désactivez un poste plutôt que de le supprimer.',
      create: 'Nouveau poste',
      editTitle: 'Modifier le poste',
      formDescription: 'Le code reste stable lorsque le nom change.',
      created: 'Poste « {{name}} » créé',
      saved: 'Poste « {{name}} » enregistré',
      enabled: 'Poste « {{name}} » activé',
      disabled: 'Poste « {{name}} » désactivé',
      disableTitle: 'Désactiver le poste « {{name}} » ?',
      disableDescription:
        'Il ne sera plus proposé pour les nouvelles affectations. Les employés qui l’occupent le conservent.',
      loadFailed: 'Impossible de charger les postes',
      notFound: 'Ce poste n’existe pas ou a été supprimé.',
      emptyTitle: 'Aucun poste pour le moment',
      emptyDescription:
        'Ajoutez les postes pour lesquels les employés sont embauchés, par exemple « Acheteur ».',
      fields: { number: 'Ordre de tri' },
      form: {
        numberRequired: 'Saisissez un ordre de tri.',
        numberHint: 'Facultatif. Les nombres inférieurs passent en premier.',
      },
    },
    grades: {
      title: 'Grades',
      description:
        'Grades professionnels tels que P5 ou M2. Le rang détermine le niveau dans les barèmes de déplacement et les niveaux d’approbation.',
      create: 'Nouveau grade',
      editTitle: 'Modifier le grade',
      formDescription: 'Le code reste stable lorsque le nom change.',
      created: 'Grade « {{name}} » créé',
      saved: 'Grade « {{name}} » enregistré',
      enabled: 'Grade « {{name}} » activé',
      disabled: 'Grade « {{name}} » désactivé',
      disableTitle: 'Désactiver le grade « {{name}} » ?',
      disableDescription:
        'Il ne sera plus proposé pour les nouvelles affectations. Les employés qui l’occupent le conservent.',
      loadFailed: 'Impossible de charger les grades',
      notFound: 'Ce grade n’existe pas ou a été supprimé.',
      emptyTitle: 'Aucun grade pour le moment',
      emptyDescription:
        'Ajoutez vos grades avec un rang ; les rangs élevés sont plus seniors.',
      fields: { number: 'Rang' },
      form: {
        numberRequired: 'Saisissez un rang.',
        numberHint: 'Un entier ; plus il est élevé, plus le niveau est senior.',
      },
    },
    dutyRoles: {
      title: 'Rôles de responsabilité',
      description:
        'Les étapes d’approbation et de traitement trouvent les personnes via ces rôles. Définissez les droits de chaque rôle dans les paramètres d’autorisation.',
      viewMembers: 'Consulter les membres',
      drawerDescription:
        'Personnes détenant cette responsabilité. Les étapes d’approbation affectées au rôle leur sont adressées.',
      enabled: 'Rôle de responsabilité « {{name}} » activé',
      disabled: 'Rôle de responsabilité « {{name}} » désactivé',
      disableTitle: 'Désactiver le rôle de responsabilité « {{name}} » ?',
      disableDescription:
        'Ses membres ne détiennent plus le rôle : les étapes d’approbation n’y trouvent personne et les autorisations qui lui sont attribuées cessent de s’appliquer. Les membres sont conservés.',
      loadFailed: 'Impossible de charger les rôles de responsabilité',
      detailFailed: 'Impossible de charger le rôle de responsabilité',
      notFound:
        'Ce rôle de responsabilité n’existe pas. Fermez ce panneau pour revenir à la liste.',
      emptyTitle: 'Aucun rôle de responsabilité',
      emptyDescription:
        'Les rôles de responsabilité sont installés avec l’application. Demandez à un administrateur de vérifier l’installation.',
      fields: {
        code: 'Code',
        memberCount: 'Membres',
        description: 'Description',
      },
      members: {
        title: 'Membres ({{count}})',
        add: 'Ajouter un membre',
        addTitle: 'Ajouter un membre à « {{role}} »',
        added: '« {{name}} » ajouté à « {{role}} »',
        remove: 'Retirer',
        removeTitle: 'Retirer « {{name}} » de « {{role}} » ?',
        removeDescription:
          'Cette personne ne recevra plus les approbations de ce rôle ni les autorisations qui lui sont attribuées.',
        removed: '« {{name}} » retiré de « {{role}} »',
        alreadyRemoved: 'Cette personne avait déjà été retirée.',
        emptyTitle: 'Aucun membre pour le moment',
        emptyDescription:
          'Ajoutez les personnes détenant cette responsabilité. Les étapes d’approbation correspondantes attendent qu’une personne soit ajoutée.',
      },
    },
  },
};

export type OrgLocale = typeof orgEnUS;

export default orgEnUS;
