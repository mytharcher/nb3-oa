export default {
  jobGrades: {
    errors: {
      VERSION_CONFLICT:
        'La grille salariale actuelle a changé. Rechargez-la avant de publier.',
      IDEMPOTENCY_CONFLICT:
        'La clé de publication a déjà été utilisée avec un contenu différent.',
      TABLE_UNAVAILABLE: 'La grille salariale n’est pas initialisée.',
      GRADE_UNAVAILABLE: 'Un grade requis est indisponible ou inactif.',
      INVALID_PUBLICATION: 'La saisie de publication est invalide.',
      STORED_DATA_INVALID:
        'Les données enregistrées de la grille salariale sont invalides.',
      INVALID_RANGE:
        'Les fourchettes salariales doivent contenir des montants entiers valides.',
      DUPLICATE_GRADE: 'Chaque grade doit apparaître une seule fois.',
      OUTSIDE_RANGE: 'Le salaire proposé est hors de la fourchette publiée.',

      ACCESS_DENIED:
        'Cette opération de grade salarial est hors de votre périmètre autorisé.',
      NOT_FOUND: 'La révision du grade salarial est indisponible.',
    },
    authz: {
      resource: 'Grilles salariales',
      view: 'Consulter l’historique des publications',
      viewSalary: 'Lire les fourchettes salariales',
      manage: 'Publier la grille salariale',
    },
  },
};
