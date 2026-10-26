export default {
  knowledge: {
    notifications: {
      title: 'Document de politique mis à jour',
      body: 'Un document de politique lié possède une nouvelle version. Ouvrez-le pour lire la version actuelle.',
    },
    authz: {
      knowledgeDocuments: 'Documents de connaissances',
      knowledgeFolders: 'Dossiers de connaissances',
      knowledgeVersions: 'Versions de documents',
      view: 'Consulter',
      manage: 'Gérer',
    },
    errors: {
      ACCESS_DENIED:
        'Vous ne pouvez pas accéder à ce document ou à cette opération.',
      DOCUMENT_NOT_FOUND: 'Le document n’existe pas ou est inaccessible.',
      FOLDER_NOT_FOUND: 'Le dossier n’existe pas ou est inaccessible.',
      INVALID_INPUT: 'Saisie du document invalide.',
      INVALID_CONTENT: 'Contenu du document invalide.',
      INVALID_AUDIENCE:
        'Le public contient un service ou un rôle indisponible.',
      INVALID_FILE: 'Le fichier est invalide ou indisponible.',
      VERSION_CONFLICT:
        'Le document a été mis à jour. Actualisez et réessayez.',
      COMMAND_CONFLICT:
        'La clé de requête a déjà été utilisée pour un contenu différent.',
      FOLDER_CYCLE: 'Un dossier ne peut pas être déplacé sous lui-même.',
      TREE_UNINITIALIZED: 'L’annuaire des documents n’a pas été initialisé.',
      BODY_TOO_LARGE: 'Le fichier téléversé dépasse la taille autorisée.',
    },
  },
};
