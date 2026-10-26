export default {
  personalSchedules: {
    authz: {
      title: 'Agendas personnels',
      owned: 'Mes agendas',
      view: 'Consulter',
      create: 'Créer',
      edit: 'Modifier',
      delete: 'Supprimer',
    },
    errors: {
      SOURCE_MANAGED:
        'Gérez cette réunion depuis sa réservation, et non depuis votre agenda personnel.',
      ACCESS_DENIED: 'Vous n’avez pas l’autorisation d’accéder à cet agenda.',
      NOT_FOUND: 'Rendez-vous introuvable.',
      INVALID_INPUT:
        'Saisissez un titre et des horaires de début et de fin valides.',
      VERSION_CONFLICT: 'Ce rendez-vous a changé. Actualisez et réessayez.',
    },
  },
};
