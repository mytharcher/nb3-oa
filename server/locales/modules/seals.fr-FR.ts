export default {
  seals: {
    authz: {
      requests: 'Demandes de sceau',
      view: 'Consulter',
      create: 'Créer',
      edit: 'Modifier',
      operate: 'Exécuter',
      actualReturn: 'Retour exceptionnel effectif',
      ledger: 'Registre des sceaux',
      instances: 'Instances de sceaux',
      manage: 'Gérer les métadonnées des sceaux',
      owned: 'Mes enregistrements',
      readable: 'Enregistrements personnels et auxquels je participe',
    },
    errors: {
      REVIEWER_REQUIRED:
        'L’examinateur effectivement attribué doit conserver le rôle de responsabilité actif requis.',
      APPROVAL_REFUSED:
        'Les règles actuelles d’approbation ou de traitement refusent cette opération.',
      ACCESS_DENIED:
        'Vous ne pouvez pas accéder à ces enregistrements ou champs de sceaux.',
      ACTIVE_EMPLOYEE_REQUIRED: 'Un compte d’employé actif est requis.',
      ADMIN_KEEPER_REQUIRED:
        'Les retours exceptionnels effectifs nécessitent à la fois les rôles d’administrateur et de dépositaire des sceaux.',
      ADMIN_REQUIRED:
        'Un rôle de responsabilité administrative actif est requis.',
      BODY_TOO_LARGE:
        'La pièce jointe dépasse la limite de taille de téléversement.',
      COMMAND_CONFLICT:
        'Cette clé de requête a déjà été utilisée pour un contenu différent.',
      CONTRACT_ACCESS_DENIED: 'Vous ne pouvez pas consulter le contrat lié.',
      CONTRACT_NOT_EFFECTIVE: 'Le contrat lié n’est pas en vigueur.',
      CONTRACT_VERSION_CONFLICT: 'Le contrat lié a changé après approbation.',
      DEPARTMENT_REQUIRED: 'Le demandeur doit avoir un service principal.',
      INVALID_COMMAND: 'Une clé de requête valide est requise.',
      INVALID_COPIES:
        'Le nombre d’exemplaires réellement scellés doit être positif et ne pas dépasser la quantité approuvée.',
      INVALID_FILE:
        'La pièce jointe est absente, non sûre ou extérieure à cette demande.',
      INVALID_INPUT: 'Les champs de la demande de sceau sont invalides.',
      INVALID_OUTPUT: 'Le résultat du traitement physique est invalide.',
      INVALID_RETURN:
        'Un retour effectif nécessite un prêt externe clôturé administrativement et un motif.',
      INVALID_SEAL_TYPE:
        'Le type de sceau est inactif ou ne correspond pas à la demande approuvée.',
      INVALID_TIME:
        'Les horaires physiques ou la date limite de retour sont invalides.',
      KEEPER_REQUIRED: 'Un rôle actif de dépositaire des sceaux est requis.',
      OUTSTANDING_CUSTODY: 'Ce sceau est encore sous garde physique.',
      PHYSICAL_ALREADY_REGISTERED:
        'L’utilisation physique ou le retour a déjà été enregistré.',
      REQUEST_NOT_FOUND: 'La demande est indisponible.',
      SEAL_EVIDENCE_REQUIRED:
        'Un justificatif immuable d’apposition réelle du sceau est requis.',
      SEAL_NOT_FOUND: 'Le sceau est indisponible.',
      SEAL_UNAVAILABLE: 'Ce sceau est actuellement prêté.',
      SLA_UNSUPPORTED:
        'La planification de rappel configurée n’est pas prise en charge.',
      TARGET_MISMATCH: 'La tâche proposée n’appartient pas à cette demande.',
      VERSION_CONFLICT:
        'L’enregistrement a changé. Actualisez avant de réessayer.',
    },
    schedule: {
      title: 'Rappels de restitution des sceaux',
      description:
        'Relancer quotidiennement les gardes de sceau en cours selon l’heure de l’entreprise.',
    },
    notifications: {
      overdue: 'Un sceau emprunté est en retard de retour.',
    },
  },
};
