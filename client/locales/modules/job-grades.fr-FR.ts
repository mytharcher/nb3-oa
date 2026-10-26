export default {
  jobGrades: {
    authz: {
      resource: 'Grilles salariales',
      view: 'Consulter l’historique des publications',
      viewSalary: 'Lire les fourchettes salariales',
      manage: 'Publier la grille salariale',
    },

    title: 'Grilles salariales',
    description:
      'Consultez l’historique immuable des publications et publiez des fourchettes salariales complètes.',
    publish: 'Publier une nouvelle version',
    publishing: 'Publication…',
    search: 'Rechercher un numéro de version exact',
    empty: 'Aucune grille salariale publiée',
    emptyDescription: 'Publiez la première grille salariale complète.',
    emptyReadonly: 'Demandez aux RH de publier la première grille salariale.',
    noMatches: 'Aucune version correspondante',
    noMatchesDescription:
      'Effacez la recherche de version pour voir l’historique des publications.',
    replacement:
      'La publication remplace toute la grille actuelle. Les documents soumis précédemment conservent leur version.',
    privateDenied:
      'Vous ne pouvez pas lire les fourchettes salariales. Demandez un accès à un administrateur.',
    publishDenied:
      'Vous ne pouvez pas publier de grilles salariales. Demandez un accès à un administrateur.',
    unknown:
      'Le résultat de la publication n’est pas confirmé. Réessayez la publication d’origine.',
    conflict:
      'La grille actuelle a changé. Chargez la dernière grille avant de publier.',
    inactive:
      'Ce grade est indisponible. Retirez-le ou choisissez un grade actif.',
    success: 'Grille salariale « Version {{version}} » publiée',
    version: 'Version {{version}}',
    versionColumn: 'Version',
    publisher: 'Publié par',
    publishedAt: 'Date de publication',
    refresh: 'Actualiser',
    retry: 'Réessayer',
    retryPublication: 'Réessayer la publication d’origine',
    clear: 'Effacer les filtres',
    loading: 'Chargement des grilles salariales',
    view: 'Consulter la version',
    rowActions: 'Actions pour la version {{version}}',
    grade: 'Grade',
    gradeCode: 'Code du grade',
    gradeTitle: 'Nom du grade',
    rank: 'Rang figé',
    minimum: 'Minimum',
    maximum: 'Maximum',
    reason: 'Motif de publication',
    addGrade: 'Ajouter un grade',
    remove: 'Retirer le grade {{index}}',
    selectGrade: 'Sélectionner un grade actif',
    removeDescription:
      'Retirer une ligne ne modifie que la nouvelle grille proposée. Les versions historiques restent inchangées.',
    cancel: 'Annuler',
    loadLatest: 'Charger la dernière grille',
    currentVersion: 'Version source : {{version}}',
    notFound:
      'Cette grille salariale est indisponible. Revenez à l’historique des publications.',
    failed: 'Impossible de charger les grilles salariales. Veuillez réessayer.',
    writeFailed:
      'La publication a été refusée. Vérifiez les champs et réessayez.',
    storageFailure:
      'La publication d’origine ne peut pas être enregistrée en toute sécurité dans cet onglet. La publication est bloquée ; vérifiez le stockage du navigateur et rechargez.',
    unsavedTitle: 'Abandonner les modifications de la grille salariale ?',
    unsavedDescription: 'Vos modifications non publiées seront perdues.',
    discard: 'Abandonner les modifications',
    stay: 'Continuer la modification',
    replaceTitle: 'Remplacer la grille proposée ?',
    replaceDescription:
      'Le chargement de la dernière grille abandonne cette proposition et repart de la grille actuelle complète.',
    confirmReplace: 'Remplacer et charger la dernière version',
    noGrades:
      'Aucun grade actif disponible. Demandez à un administrateur de l’organisation de configurer les grades.',
    reasonHint:
      'Expliquez la publication de la grille complète (2 000 caractères maximum).',
    immutable:
      'Cette version publiée est immuable. Les identités et fourchettes des grades sont figées.',
    validation: {
      required: 'Ce champ est obligatoire.',
      amount:
        'Saisissez un montant positif ou nul avec au maximum deux décimales, dans la plage prise en charge.',
      range: 'Le maximum doit être supérieur ou égal au minimum.',
      duplicate: 'Chaque grade ne peut apparaître qu’une seule fois.',
      inactive:
        'Ce grade est indisponible. Retirez-le ou choisissez un grade actif.',
      nonempty: 'Incluez au moins un grade actif.',
      reasonLength: 'Utilisez au maximum 2 000 caractères.',
      server: 'Vérifiez ce champ et réessayez.',
    },
  },
};
