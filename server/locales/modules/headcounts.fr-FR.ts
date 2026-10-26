export default {
  headcounts: {
    authz: {
      title: 'Capacité d’effectif',
      view: 'Consulter la capacité',
      manage: 'Gérer la capacité annuelle',
      viewJournal: 'Consulter le journal des sources',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        'La liste complète des employés n’est pas lisible. Demandez à un administrateur de vérifier les autorisations de lecture des employés.',
      HEADCOUNT_ACCESS_DENIED:
        'Vous n’avez pas l’autorisation d’effectuer cette opération sur les effectifs.',
      HEADCOUNT_FIELD_ACCESS_DENIED:
        'Les champs de synthèse de capacité sont hors de vos autorisations.',
      HEADCOUNT_NOT_FOUND: 'Le compte d’effectif est indisponible.',
      HEADCOUNT_ALREADY_EXISTS:
        'Un compte existe déjà pour ce service, ce poste et cette année.',
      HEADCOUNT_NOT_INITIALIZED:
        'Rapprochez la liste complète des employés avant de réserver la capacité.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        'Sélectionnez la liste réelle complète des employés en période d’essai, confirmés et en cours de départ.',
      HEADCOUNT_ROSTER_DRIFT:
        'La liste réelle des employés a changé. Rapprochez ses données sources avant de poursuivre.',
      HEADCOUNT_VERSION_CONFLICT:
        'Le compte a changé. Actualisez-le avant d’enregistrer.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT:
        'Cet identifiant de requête appartient déjà à une autre opération.',
      HEADCOUNT_INSUFFICIENT:
        'Le plafond annuel ne couvre pas l’effectif réellement occupé et réservé.',
      HEADCOUNT_INVALID_NUMBER:
        'Saisissez un nombre entier de personnes dans les limites autorisées.',
      HEADCOUNT_INVALID_ACCOUNT:
        'Sélectionnez un service, un poste et une année réels.',
      HEADCOUNT_INVALID_IDENTITY:
        'Sélectionnez un service et un poste actifs de l’organisation.',
      HEADCOUNT_INVALID_COMMAND:
        'Un acteur, un identifiant de requête et un motif sont requis.',
      HEADCOUNT_INVALID_SOURCE:
        'Un type de source réel et un identifiant sont requis.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        'Chaque place de remplacement nécessite un employé partant distinct.',
      HEADCOUNT_INVALID_REPLACEMENT:
        'La source du remplacement doit correspondre à une occupation réelle en cours de départ ou terminée.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'Cette occupation de remplacement est absente ou déjà prise.',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        'L’employé source rétabli bloque ce remplacement.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND: 'Le dossier de l’employé est indisponible.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        'L’employé réel ne correspond pas au service et au poste alloués.',
      HEADCOUNT_ALREADY_OCCUPIED: 'Cet employé occupe déjà ce compte annuel.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        'Réaffectez explicitement à l’année actuelle de l’entreprise avant consommation.',
      HEADCOUNT_SOURCE_NOT_FOUND: 'La source de capacité est indisponible.',
      HEADCOUNT_SOURCE_EXISTS: 'Cette source possède déjà une réservation.',
      HEADCOUNT_SOURCE_STATE:
        'L’état de la source ne permet pas cette opération.',
      HEADCOUNT_SOURCE_CLOSED: 'La source de capacité est déjà close.',
      HEADCOUNT_SEAT_STATE: 'La place réservée n’est pas en attente.',
      HEADCOUNT_STATE_CONFLICT: 'La place réservée a changé.',
      HEADCOUNT_NO_ALLOCATION: 'Il ne reste aucune place approuvée disponible.',
      HEADCOUNT_NOT_LEFT:
        'Un départ effectif est requis pour libérer la capacité occupée.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        'Une occupation réelle non libérée d’un employé est requise.',
      HEADCOUNT_NOT_RESTORED:
        'Un rétablissement effectif est requis pour bloquer les remplacements futurs.',
      HEADCOUNT_INVALID_REBIND:
        'La réaffectation annuelle doit conserver le service et le poste et avancer dans le temps.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        'Les crédits de remplacement nécessitent des sources explicites pour l’année cible.',
      HEADCOUNT_INVALID_TRANSFER:
        'Une réservation cible approuvée distincte est requise.',
      HEADCOUNT_INVALID_PAGE:
        'Sélectionnez une taille de page comprise entre 1 et 100.',
      HEADCOUNT_GUARD_UNAVAILABLE:
        'Le garde de transaction de capacité est indisponible.',
    },
  },
};
