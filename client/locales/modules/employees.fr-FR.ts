/**
 * English wording of the `employees` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `employees.zh-CN.ts` is checked against this shape.
 */
const employeesEnUS = {
  employees: {
    refresh: 'Actualiser',
    personal: {
      title: 'Dossier personnel',
      description:
        'Consultez vos informations d’employé ; contactez les RH pour corriger toute erreur.',
      identity: '{{name}} · {{code}}',
      basic: 'Informations générales',
      profile: 'Informations personnelles',
      bank: 'Compte de paiement',
      emptyTitle: 'Aucun dossier d’employé',
      emptyDescription:
        'Contactez les RH pour créer un dossier d’employé pour votre compte.',
      profileMissing:
        'Informations personnelles introuvables ; contactez les RH pour vérifier votre dossier.',
      forbidden:
        'Impossible d’accéder à votre dossier ; contactez un administrateur pour vérifier les accès.',
      refresh: 'Actualiser',
    },
    authz: {
      section: 'Employés',
      settings: 'Page du dossier d’employé',
      settingsRead: 'Ouvrir',
      collections: {
        employees: 'Dossiers des employés',
        employeeProfiles: 'Informations contrôlées des employés',
        employeeCompensation: 'Rémunération des employés',
      },
      archive: {
        title: 'Dossier d’employé',
        view: 'Consulter',
        manage: 'Créer et modifier',
        correctStatus: 'Corriger le statut',
      },
      profile: {
        title: 'Informations contrôlées des employés',
        view: 'Tout consulter',
        viewBank: 'Consulter le compte bancaire',
        update: 'Modifier',
      },
      compensation: {
        title: 'Rémunération des employés',
        view: 'Consulter',
      },
      directory: {
        title: 'Annuaire',
        view: 'Consulter les personnes',
        viewContact: 'Consulter le téléphone et l’e-mail',
      },
      scopes: {
        reports: 'Mes subordonnés (tous niveaux)',
        selfAndReports: 'Moi et mes subordonnés',
        reportsHint:
          'Personnes situées sous l’utilisateur dans la hiérarchie, à tout niveau ; un responsable inactif intermédiaire n’interrompt pas le lien.',
      },
      subjects: {
        position: 'Postes',
        reportingManager: 'Responsables directs',
      },
    },
    permissionSets: {
      hr: 'RH : dossiers des employés',
      compensation:
        'Rémunération des employés (direction générale, direction financière)',
      bank: 'Comptes bancaires des employés (finances)',
      manager: 'Responsable direct : dossiers des subordonnés',
      head: 'Chef de service : dossiers du service',
      admin: 'Correction des données du dossier d’employé',
      directory: 'Annuaire',
    },
    navigation: {
      archive: 'Employés',
      directory: 'Annuaire',
    },
    title: 'Employés',
    description:
      'Gérez le compte, la hiérarchie, le poste et les informations contrôlées de chaque employé.',
    fields: {
      name: 'Nom',
      code: 'Code employé',
      user: 'Compte',
      primaryDepartment: 'Service principal',
      position: 'Poste',
      grade: 'Grade',
      manager: 'Responsable direct',
      status: 'Statut',
      careerStartDate: 'Date de première embauche',
      hireDate: 'Date d’embauche',
      probationEndDate: 'Fin de période d’essai',
      lastWorkingDay: 'Dernier jour de travail',
      phone: 'Téléphone',
      email: 'E-mail',
      workLocation: 'Lieu de travail',
      emergencyContact: 'Contact d’urgence',
      active: 'Active',
      updatedAt: 'Mis à jour',
      idType: 'Type de pièce d’identité',
      idNumber: 'Numéro de pièce d’identité',
      birthDate: 'Date de naissance',
      address: 'Adresse',
      education: 'Niveau d’études',
      school: 'Établissement',
      major: 'Spécialité',
      bankName: 'Banque',
      bankAccount: 'Compte bancaire',
      bankAccountName: 'Titulaire du compte',
      effectiveFrom: 'En vigueur à partir du',
      baseSalary: 'Salaire de base',
      sourceApplication: 'Demande source',
      note: 'Note',
      kind: 'Modification',
      effectiveAt: 'Date d’effet',
      changes: 'Modifications',
    },
    status: {
      probation: 'En période d’essai',
      regular: 'Confirmé',
      leaving: 'En cours de départ',
      left: 'Parti',
    },
    historyKind: {
      hire: 'Embauche',
      regularization: 'Confirmation d’emploi',
      transfer: 'Transférer',
      salaryChange: 'Modification salariale',
      departure: 'Départ',
      correction: 'Correction de données',
    },
    boolean: {
      yes: 'Oui',
      no: 'Non',
    },
    search: {
      placeholder: 'Rechercher par nom ou code employé',
      label: 'Rechercher des employés',
    },
    filters: {
      department: 'Service',
      allDepartments: 'Tous les services',
      status: 'Statut',
      allStatuses: 'Tous les statuts',
      clear: 'Effacer les filtres',
    },
    empty: {
      title: 'Aucun dossier d’employé',
      description:
        'Créez un dossier pour lier un compte, une hiérarchie et un poste.',
      descriptionReadOnly:
        'Aucun dossier n’est encore visible pour vous. Contactez les RH si vous en attendiez ici.',
      noResults: 'Aucun employé ne correspond aux filtres.',
    },
    error: {
      title: 'Impossible de charger les employés',
      requestFailed: 'La requête a échoué. Vérifiez la connexion et réessayez.',
      forbidden: 'Vous n’avez pas l’autorisation de consulter cet élément.',
      notFound: 'Ce dossier d’employé n’existe pas ou a été supprimé.',
      tabForbidden:
        'Vous n’avez pas l’autorisation de consulter cette section.',
    },
    actions: {
      label: 'Actions',
      more: 'Actions pour {{name}}',
      edit: 'Modifier',
      correctStatus: 'Corriger le statut',
      editProfile: 'Modifier',
      moreActions: 'Autres actions',
    },
    create: {
      action: 'Nouvel employé',
      title: 'Nouvel employé',
      description: 'Liez un compte et complétez le dossier.',
      submit: 'Créer',
      success: 'Employé « {{name}} » créé',
    },
    edit: {
      title: 'Modifier l’employé',
      success: 'Employé « {{name}} » enregistré',
    },
    form: {
      basicSection: 'Informations générales',
      contactSection: 'Contact',
      nameRequired: 'Saisissez un nom.',
      codeRequired: 'Saisissez un code employé.',
      userRequired: 'Choisissez le compte à lier.',
      careerStartInvalid: 'Choisissez une date de première embauche valide.',
      careerStartFuture:
        'La date de première embauche ne peut pas être future.',
      careerStartAfterHire:
        'La date de première embauche ne peut pas être postérieure à la date d’embauche.',
      hireDateRequired: 'Choisissez la date d’embauche.',
      tooLong: 'Utilisez au maximum {{max}} caractères.',
      emailInvalid: 'Le format de l’adresse e-mail est invalide.',
      userTaken: 'Ce compte possède déjà un dossier.',
      codeTaken: 'Ce code employé est déjà utilisé.',
      userInvalid: 'Ce compte n’existe pas ou est désactivé.',
      managerInvalid:
        'Choisissez un employé actif qui n’est pas subordonné à celui-ci.',
      positionInvalid: 'Ce poste n’existe pas ou est désactivé.',
      gradeInvalid: 'Ce grade n’existe pas ou est désactivé.',
      initialStatus: 'Statut initial',
      managerPlaceholder: 'Rechercher par nom ou code employé',
      managerEmpty: 'Aucun employé correspondant',
      none: 'Aucun',
      positionPlaceholder: 'Choisir un poste',
      gradePlaceholder: 'Choisir un grade',
      optionsFailed: 'Impossible de charger les options.',
      userPlaceholder: 'Rechercher des comptes par nom ou e-mail',
    },
    page: {
      title: 'Employé',
      tabsLabel: 'Sections du dossier d’employé',
    },
    tabs: {
      basic: 'Informations générales',
      profile: 'Informations contrôlées',
      compensation: 'Rémunération',
      history: 'Historique des modifications',
    },
    profile: {
      title: 'Informations contrôlées',
      description:
        'Identité, adresse, études et compte bancaire ; visibles uniquement par les rôles autorisés.',
      bankOnly: 'Vous pouvez uniquement consulter le compte bancaire.',
      editTitle: 'Modifier les informations contrôlées',
      success: 'Informations contrôlées de « {{name}} » enregistrées',
      identitySection: 'Identité',
      educationSection: 'Niveau d’études',
      bankSection: 'Compte bancaire',
    },
    compensation: {
      title: 'Rémunération',
      description:
        'Chaque confirmation d’emploi et modification salariale ajoute une ligne ; les lignes ne sont jamais modifiées.',
      empty: 'Aucun enregistrement de rémunération.',
    },
    history: {
      referenceNotice:
        'Les noms de référence utilisent l’annuaire actuel ; les noms au moment de la modification n’ont pas été conservés.',
      sources: {
        onboarding: 'Intégration',
        departure: 'Départ',
        transfer: 'Changement de personnel',
        probation: 'Confirmation d’emploi',
        other: 'Autre opération métier',
      },
      referenceUnavailable: 'Référence historique indisponible',
      personUnavailable: 'Personne historique indisponible',
      otherField: 'Autre modification',
      title: 'Historique des modifications',
      description:
        'Embauches, confirmations d’emploi, mutations, départs et corrections de données.',
      empty: 'Aucune modification enregistrée.',
    },
    correction: {
      title: 'Corriger le statut',
      description:
        'Une correction de données hors des circuits d’approbation. Elle est auditée avec votre motif.',
      reason: 'Motif',
      reasonPlaceholder: 'Pourquoi le statut enregistré est incorrect',
      reasonRequired: 'Saisissez le motif de la correction.',
      submit: 'Corriger',
      unchanged: 'La correction ne modifie rien.',
      success: 'Statut de « {{name}} » corrigé',
    },
    directory: {
      title: 'Annuaire',
      description:
        'Trouvez vos collègues par service ou nom, avec leurs coordonnées.',
      searchPlaceholder: 'Rechercher par nom ou code employé',
      searchLabel: 'Rechercher dans l’annuaire',
      contactHidden: 'Non visible',
      emptyTitle: 'L’annuaire est vide',
      emptyDescription:
        'Les personnes apparaissent ici une fois leur dossier créé par les RH.',
      noResults: 'Aucun collègue ne correspond aux filtres.',
      errorTitle: 'Impossible de charger l’annuaire',
    },
  },
};

export type EmployeesLocale = typeof employeesEnUS;

export default employeesEnUS;
