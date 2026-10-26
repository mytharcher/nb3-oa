export default {
  announcements: {
    authz: {
      title: 'Annonces',
      owned: 'Publié par moi',
      readable: 'Mes publications et annonces reçues',
      view: 'Lire les annonces',
      create: 'Créer des brouillons d’annonces',
      edit: 'Modifier son propre brouillon',
      publish: 'Publier sa propre annonce',
      revoke: 'Retirer sa propre annonce',
      remind: 'Relancer les destinataires non confirmés',
      receipts: 'Consulter la liste de ses propres destinataires',
      confirm: 'Confirmer sa propre réception',
    },
    notifications: {
      title: 'Annonce de l’entreprise',
      body: 'Une annonce est disponible. Ouvrez l’application pour la lire.',
    },
    errors: {
      ACCESS_DENIED: 'Cette annonce ou opération n’est pas accessible.',
      NOT_FOUND: 'Annonce introuvable.',
      INVALID_INPUT: 'Saisie d’annonce ou période de validité invalide.',
      INVALID_AUDIENCE:
        'Le public contient un service ou un rôle de responsabilité indisponible.',
      EMPTY_AUDIENCE: 'L’annonce n’a aucun destinataire actif.',
      INVALID_ATTACHMENT: 'Pièce jointe invalide ou indisponible.',
      INVALID_STATE: 'Cette opération est indisponible dans l’état actuel.',
      VERSION_CONFLICT: 'L’annonce a changé. Rechargez et réessayez.',
      COMMAND_CONFLICT:
        'Cet identifiant de requête a déjà été utilisé avec une saisie différente.',
      KNOWLEDGE_UNAVAILABLE: 'Le document lié est indisponible ou non lisible.',
    },
  },
};
