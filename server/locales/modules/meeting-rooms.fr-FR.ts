export default {
  meetingRooms: {
    authz: {
      title: 'Salles de réunion',
      bookings: 'Réservations de réunions',
      view: 'Consulter',
      manage: 'Gérer les salles de réunion',
      create: 'Réserver une salle',
      edit: 'Modifier les réservations',
      cancel: 'Annuler les réservations',
      confirm: 'Confirmer les demandes administratives',
      reject: 'Rejeter les demandes administratives',
      checkIn: 'Confirmer la présence',
      owned: 'Organisées par moi',
      participating: 'Réunions auxquelles je participe',
      readable: 'Réunions que j’organise ou auxquelles je participe',
    },
    notifications: {
      title: 'Mise à jour de réservation de réunion',
      body: 'Une réservation de réunion vous concernant a changé. Ouvrez vos réservations de réunions pour consulter les détails auxquels vous avez accès.',
    },
    errors: {
      SORT_LIMIT_EXCEEDED:
        'Trop d’enregistrements correspondent. Affinez la recherche avant de trier par nom.',
      ACCESS_DENIED:
        'Cette opération ou ses champs sont hors de vos autorisations.',
      ACTIVE_EMPLOYEE_REQUIRED: 'Un dossier d’employé actif est requis.',
      BOOKING_NOT_FOUND: 'La réservation est indisponible.',
      CAPACITY_EXCEEDED:
        'L’organisateur et les participants dépassent la capacité de la salle.',
      COMMAND_CONFLICT:
        'Cet identifiant de requête appartient à une autre opération ou à un autre acteur.',
      INVALID_BOOKING:
        'Saisissez un titre et des participants actifs distincts.',
      INVALID_INTERVAL:
        'Choisissez une plage future dont la fin suit le début.',
      INVALID_PARTICIPANT:
        'Tous les participants doivent être des employés actifs.',
      INVALID_RECURRENCE:
        'Choisissez une série quotidienne ou hebdomadaire de 1 à 52 occurrences.',
      INVALID_REQUEST_ID: 'Un identifiant de requête est requis.',
      INVALID_ROOM:
        'Saisissez un nom de salle, une capacité et un motif de modification.',
      INVALID_SERIES: 'Choisissez une série existante.',
      INVALID_STATE:
        'Cette réservation ne peut pas effectuer cette opération dans son état ou sa plage horaire actuels.',
      REASON_REQUIRED: 'Saisissez un motif pour cette décision administrative.',
      ROOM_INACTIVE: 'Cette salle est inactive.',
      ROOM_NOT_FOUND: 'Cette salle est indisponible.',
      TIME_CONFLICT:
        'Une ou plusieurs plages demandées chevauchent une plage occupée.',
      VERSION_CONFLICT:
        'La réservation ou la salle a changé. Actualisez avant de réessayer.',
      INVALID_LOCAL_TIME:
        'Saisissez une date et une heure locales de l’entreprise valides.',
      NONEXISTENT_LOCAL_TIME:
        'Cette heure locale n’existe pas en raison d’un changement de fuseau horaire. Choisissez une autre heure.',
      AMBIGUOUS_LOCAL_TIME:
        'Cette heure locale se produit deux fois en raison d’un changement de fuseau horaire. Choisissez une heure sans ambiguïté.',
    },
  },
};
