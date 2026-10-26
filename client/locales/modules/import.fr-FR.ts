/**
 * English wording of the `import` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `import.zh-CN.ts` is checked against this shape.
 */
const importEnUS = {
  import: {
    navigation: { title: 'Importation de données' },
    // Titles the server registers in the permission workspace (`server/providers/import/index.ts`).
    authz: {
      settings: 'Importation de données',
      read: 'Consulter l’historique et les modèles',
      update: 'Importer',
    },
    title: 'Importation de données',
    description:
      'Importez les services, postes, grades, dossiers d’employés et membres des rôles de responsabilité depuis des modèles Excel.',
    kinds: {
      departments: 'Services',
      positions: 'Postes',
      grades: 'Grades',
      employees: 'Dossiers des employés',
      dutyRoleMembers: 'Membres des rôles de responsabilité',
    },
    kindHints: {
      departments:
        'Correspondance par code de service. Les parents peuvent être définis plus bas dans la feuille.',
      positions: 'Correspondance par code de poste.',
      grades: 'Correspondance par code de grade.',
      employees:
        'Correspondance par numéro d’employé. Importez d’abord les services, postes et grades ; les responsables peuvent être définis dans la même feuille.',
      dutyRoleMembers:
        'Correspondance par code de rôle et compte. « Non » dans la colonne active retire le membre.',
    },
    actions: {
      new: 'Nouvelle importation',
      templates: 'Télécharger le modèle',
      templateFor: 'Télécharger le modèle {{kind}}',
      check: 'Vérifier',
      checking: 'Vérification…',
      confirm: 'Importer',
      importing: 'Importation…',
      chooseAgain: 'Choisir un autre fichier',
      back: 'Retour',
      chooseFile: 'Choisir un fichier',
      downloadFile: 'Télécharger le fichier d’origine',
      refresh: 'Actualiser',
      clearFilters: 'Effacer les filtres',
    },
    fields: {
      kind: 'Nature',
      file: 'Fichier',
      createdAt: 'Début',
      finishedAt: 'Fin',
      status: 'Résultat',
      summary: 'Synthèse',
      actor: 'Par',
      rowCount: 'Lignes lues',
      createdCount: 'Créé',
      updatedCount: 'Mis à jour',
      unchangedCount: 'Inchangé',
      errorCount: 'Problèmes',
      row: 'Ligne',
      column: 'Colonne',
      problem: 'Problème',
    },
    filters: { allKinds: 'Toutes les natures' },
    status: { succeeded: 'Réussi', failed: 'Échec' },
    summary: {
      succeeded:
        '{{created}} créés · {{updated}} mis à jour · {{unchanged}} inchangés',
      failed: 'Problèmes : {{count}}',
    },
    noFile: 'Aucun fichier sélectionné',
    templateFile: 'modèle d’importation {{kind}}.xlsx',
    fileHint: 'Un classeur .xlsx de 5 Mo maximum, structuré comme le modèle.',
    notice: {
      title: 'Avant l’importation',
      accounts:
        'Les importations ne créent jamais de comptes : chaque compte nommé dans le fichier (identifiant ou e-mail) doit déjà exister et être actif, sinon sa ligne est signalée.',
      atomic:
        'Le fichier entier est d’abord vérifié puis enregistré en une seule fois : si une ligne présente un problème, aucune donnée n’est enregistrée.',
    },
    validation: {
      kindRequired: 'Choisissez ce que contient le fichier.',
      fileRequired: 'Choisissez un fichier .xlsx.',
      fileType: 'Seuls les classeurs .xlsx peuvent être importés.',
      fileSize: 'Le fichier dépasse 5 Mo. Divisez-le en plusieurs fichiers.',
    },
    report: {
      invalidTitle:
        'Problèmes détectés : {{count}}. Aucune donnée n’a été importée.',
      invalidDescription:
        'Corrigez les lignes ci-dessous dans le fichier, puis vérifiez-le à nouveau.',
      truncated:
        'Seuls les {{shown}} premiers problèmes sur {{count}} sont affichés.',
      okTitle: 'Le fichier a passé la vérification',
      okDescription:
        '{{rows}} lignes lues : {{created}} seront créées, {{updated}} mises à jour et {{unchanged}} laissées inchangées.',
      wholeFile: 'Fichier',
    },
    toast: {
      imported: '« {{name}} » importé',
      templateFailed: 'Impossible de télécharger le modèle. Réessayez.',
    },
    failure: {
      forbidden: 'Vous n’avez pas l’autorisation d’importer.',
      tooLarge: 'Le fichier dépasse 5 Mo. Divisez-le en plusieurs fichiers.',
      invalidFile:
        'Le fichier n’a pas pu être envoyé. Choisissez un classeur .xlsx.',
      generic: 'La requête a échoué. Vérifiez votre connexion et réessayez.',
    },
    empty: {
      title: 'Aucune importation',
      description:
        'Téléchargez un modèle, remplissez-le et importez-le pour ajouter les services, personnes et rôles.',
      readOnly:
        'Aucune importation. Demandez à un administrateur d’importer les données de l’organisation.',
    },
    noResults: 'Aucune importation ne correspond au filtre.',
    loadFailedTitle: 'Impossible de charger l’historique d’importation',
    detail: {
      title: 'Détails de l’importation · {{name}}',
      titleLoading: 'Détails de l’importation',
      notFound: 'Cette importation n’existe pas ou a été supprimée.',
      problems: 'Problèmes',
    },
    common: {
      forbidden: 'Vous n’avez pas l’autorisation de consulter cet élément.',
      notFound: 'Cet enregistrement n’existe pas ou a été supprimé.',
      loadFailed:
        'Impossible de charger les données. Vérifiez votre connexion et réessayez.',
    },
    // One sentence per problem code the server reports; {{value}} is the cell, {{header}} its column.
    errors: {
      FILE_UNREADABLE:
        'Le fichier n’est pas un classeur .xlsx lisible. Enregistrez-le comme classeur Excel et réessayez.',
      SHEET_EMPTY:
        'La première feuille ne contient aucune ligne de données. Remplissez les lignes sous l’en-tête.',
      TOO_MANY_ROWS:
        'Le fichier contient plus de {{max}} lignes. Divisez-le en plusieurs fichiers.',
      HEADER_MISSING:
        'La colonne obligatoire « {{header}} » est absente de la ligne d’en-tête.',
      HEADER_DUPLICATE: 'La colonne « {{header}} » apparaît plusieurs fois.',
      REQUIRED: 'Obligatoire.',
      INVALID_CODE:
        '« {{value}} » n’est pas un code valide : utilisez lettres, chiffres, « . », « _ » et « - », jusqu’à 64 caractères.',
      TOO_LONG: 'Dépasse {{max}} caractères.',
      INVALID_INTEGER: '« {{value}} » n’est pas un entier.',
      INVALID_BOOLEAN: '« {{value}} » ne correspond pas à 是 / 否 (oui / non).',
      CAREER_START_FUTURE:
        'La date de première embauche ne peut pas être postérieure à aujourd’hui dans le fuseau horaire du calendrier de travail.',
      CAREER_START_AFTER_HIRE:
        'La date de première embauche ne peut pas être postérieure à la date d’embauche.',
      INVALID_DATE:
        '« {{value}} » n’est pas une date valide. Utilisez une cellule de date ou YYYY-MM-DD.',
      INVALID_STATUS:
        '« {{value}} » n’est pas un statut : utilisez 试用, 正式, 离职中 ou 已离职.',
      INVALID_EMAIL: '« {{value}} » n’est pas une adresse e-mail.',
      DUPLICATE_IN_FILE: '« {{value}} » apparaît déjà à la ligne {{firstRow}}.',
      USER_NOT_FOUND:
        'Aucun compte « {{value}} ». Les importations ne créent jamais de comptes : créez-le d’abord sur la page Utilisateurs.',
      USER_DISABLED:
        'Le compte « {{value}} » est désactivé. Activez-le d’abord sur la page Utilisateurs.',
      USER_TAKEN:
        'Le compte « {{value}} » appartient déjà à l’employé {{code}}.',
      USER_MISMATCH:
        'Ce numéro d’employé est lié à un autre compte ; un dossier conserve son compte.',
      PARENT_NOT_FOUND:
        'Aucun service de code « {{value}} » dans le fichier ou le système.',
      EXECUTIVE_TOP_LEVEL_ONLY:
        'Seuls les services de premier niveau peuvent désigner un dirigeant ; les services enfants en héritent.',
      PARENT_CYCLE: 'Les services parents forment une boucle.',
      DEPARTMENT_NOT_FOUND:
        'Aucun service de code « {{value}} ». Importez d’abord les services.',
      DEPARTMENT_INACTIVE: 'Le service « {{value}} » est désactivé.',
      POSITION_NOT_FOUND: 'Aucun poste de code « {{value}} ».',
      POSITION_INACTIVE: 'Le poste « {{value}} » est désactivé.',
      GRADE_NOT_FOUND: 'Aucun grade de code « {{value}} ».',
      GRADE_INACTIVE: 'Le grade « {{value}} » est désactivé.',
      MANAGER_NOT_FOUND:
        'Aucun numéro d’employé « {{value}} » dans le fichier ou le système.',
      MANAGER_SELF: 'Un employé ne peut pas être son propre responsable.',
      MANAGER_INACTIVE: 'Le responsable « {{value}} » a quitté l’entreprise.',
      MANAGER_CYCLE: 'Les responsables forment une boucle.',
      DUTY_ROLE_INACTIVE:
        'Ce rôle est inactif ; aucun nouveau membre ne peut être ajouté.',
      DUTY_ROLE_NOT_FOUND:
        'Aucun rôle de responsabilité de code « {{value}} ».',
      WRITE_FAILED:
        'Cette ligne n’a pas pu être enregistrée ({{reason}}) ; aucune donnée n’a donc été importée. Vérifiez la ligne et réessayez.',
      unknown: 'Cette ligne ne peut pas être importée.',
    },
  },
};

export type ImportLocale = typeof importEnUS;

export default importEnUS;
