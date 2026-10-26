export default {
  vehicles: {
    authz: {
      requests: 'Demandes de véhicules',
      garage: 'Parc automobile',
      manage: 'Gérer la liste des véhicules',
      viewCost: 'Consulter les frais de carburant privés',
    },
    errors: {
      VEHICLE_SORT_LIMIT:
        'Affinez la recherche avant de trier autant d’enregistrements.',
      VEHICLE_ACCESS_DENIED:
        'La mise à jour du chauffeur est hors de sa politique autorisée.',
      VEHICLE_ALREADY_DISPATCHED:
        'Cette source possède déjà une donnée d’affectation immuable.',
      VEHICLE_APPROVAL_REFUSED:
        'L’opération de véhicule est indisponible ; actualisez la demande et vérifiez votre autorisation.',
      VEHICLE_CONTENT_CHANGED:
        'L’affectation nécessite un contenu approuvé inchangé et ses données d’action privées.',
      VEHICLE_COST_NOT_FOUND: 'Le coût d’utilisation n’est pas lisible.',
      VEHICLE_DISPATCH_NOT_OFFERED:
        'Une tâche d’affectation réelle autorisée est requise.',
      VEHICLE_DRIVER_INACTIVE:
        'Le chauffeur n’est pas actuellement admissible.',
      VEHICLE_DRIVER_REQUIRED:
        'La sélection du chauffeur doit correspondre à la demande approuvée.',
      VEHICLE_EMPLOYEE_INACTIVE: 'Un dossier d’employé actif est requis.',
      VEHICLE_FIELDS_RESTRICTED:
        'Les champs non financiers complets de la demande sont requis pour la façade d’approbation.',
      VEHICLE_GARAGE_DENIED:
        'Un membre actif de responsabilité administrative est requis.',
      VEHICLE_INTERVAL_CONFLICT:
        'Le véhicule ou le chauffeur est déjà affecté pendant cette plage.',
      VEHICLE_INVALID_COMMAND:
        'Une source et une clé de requête stable sont requises.',
      VEHICLE_INVALID_INPUT:
        'Fournissez l’identification du véhicule, une capacité positive et un statut valide.',
      VEHICLE_INVALID_INTERVAL:
        'Fournissez une plage horaire ordonnée et un nombre positif de passagers.',
      VEHICLE_INVALID_USAGE:
        'Le kilométrage et le carburant doivent être des entiers exacts positifs ou nuls.',
      VEHICLE_INVALID_VERSION: 'La version enregistrée ne peut pas avancer.',
      VEHICLE_NOT_DISPATCHED:
        'Aucune affectation réelle n’existe pour cette demande.',
      VEHICLE_NOT_FOUND: 'Véhicule ou chauffeur introuvable.',
      VEHICLE_NO_AVAILABLE_CAPACITY:
        'Aucun véhicule actuel ne dispose d’une capacité suffisante pendant cette plage. La soumission ne le réserve pas.',
      VEHICLE_OUTSTANDING_USE:
        'Terminez l’utilisation effective avant de désactiver ce chauffeur.',
      VEHICLE_PRIVATE_INPUT_REQUIRED:
        'Les données d’exécution métier doivent utiliser la façade privée.',
      VEHICLE_REQUEST_KEY_REQUIRED: 'Une clé de requête stable est requise.',
      VEHICLE_REQUEST_REUSED:
        'Cette clé de requête est liée à un autre acteur ou contenu.',
      VEHICLE_SLA_UNSUPPORTED:
        'Cette version nécessite les délais d’approbation par défaut en heures ouvrées.',
      VEHICLE_SOURCE_DENIED:
        'Une opération réelle d’approbation autorisée dans sa transaction est requise.',
      VEHICLE_SOURCE_MISMATCH:
        'La commande ne correspond pas à sa source d’approbation.',
      VEHICLE_SOURCE_UNAVAILABLE:
        'L’adaptateur réel de source d’approbation est indisponible.',
      VEHICLE_TARGET_MISMATCH:
        'La cible de l’action appartient à une autre demande.',
      VEHICLE_TYPE_INACTIVE: 'Choisissez un type de véhicule actif.',
      VEHICLE_UNAVAILABLE:
        'Choisissez un véhicule actif avec une capacité suffisante.',
      VEHICLE_USAGE_OWNER:
        'Seul le demandeur effectif peut enregistrer l’utilisation.',
      VEHICLE_VERSION_CONFLICT: 'Chargez la version actuelle du véhicule.',
    },
  },
};
