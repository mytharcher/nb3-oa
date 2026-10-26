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
    registrationSource: 'Enregistrement pour la demande {{number}}',
    relatedUnavailable: 'Enregistrement associé indisponible',
    copiesRange: 'Saisissez un entier de 1 à {{max}}.',
    actionSaved: '{{action}} terminé pour la demande de sceau « {{name}} »',
    requestSaved: 'Demande de sceau « {{name}} » enregistrée',

    noLongerEditable:
      'Cette demande ne peut plus être modifiée. Fermez-la et actualisez la liste.',

    businessErrors: {
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

    disableInstance: 'Désactiver le sceau « {{name}} » ?',
    disableInstanceDescription:
      'Les sceaux désactivés ne peuvent pas être sélectionnés pour un nouveau traitement physique. Les preuves immuables d’enregistrement et de garde existantes sont conservées.',
    disable: 'Désactiver le sceau',
    instanceSaved: 'Sceau « {{name}} » enregistré',

    reloadInstance: 'Recharger les métadonnées du sceau ?',
    reloadInstanceDescription:
      'Le rechargement abandonne votre saisie non enregistrée et utilise la version actuelle. Vous devrez saisir à nouveau le motif de modification.',

    save: 'Enregistrer le sceau',
    forbidden: 'Accès refusé. Contactez un administrateur',
    missing: 'Ce sceau est indisponible',

    instances: 'Gestion des sceaux',
    instanceNotice:
      'Gérez les métadonnées des sceaux. La garde physique et l’enregistrement résultent uniquement du traitement effectif.',
    instanceCode: 'Code du sceau',
    instanceName: 'Nom du sceau',
    instanceActive: 'Active',
    instanceVersion: 'Version',
    newInstance: 'Nouveau sceau',
    editInstance: 'Modifier le sceau',
    emptyInstances: 'Aucun sceau pour le moment',

    returnTarget: 'Cible du retour',
    title: 'Demandes de sceau',
    description:
      'Demandez l’utilisation d’un sceau et consultez les données actuelles d’approbation et de traitement physique.',
    confirmations: {
      confirmed: 'Confirmé',
      notApplicable: 'Sans objet',
      unconfirmed: 'Non confirmé',
    },
    confirmedBy: 'Retour confirmé par',
    contractConfirmation: 'Confirmation des justificatifs du contrat',
    ledger: 'Registre des sceaux',
    number: 'Numéro de demande',
    purpose: 'Objet',
    applicant: 'Demandeur',
    sealType: 'Type de sceau',
    copies: 'Exemplaires approuvés',
    status: 'Statut',
    refresh: 'Actualiser',
    new: 'Nouvelle demande de sceau',
    edit: 'Modifier la demande',
    search: 'Rechercher par numéro, objet ou demandeur',
    all: 'Tous les statuts',
    clear: 'Effacer les filtres',
    oldest: 'Création : du plus ancien au plus récent',
    newest: 'Création : du plus récent au plus ancien',
    draft: 'Brouillon',
    noMatch: 'Aucune demande correspondante',
    empty: 'Aucune demande de sceau',
    emptyLedger: 'Aucun enregistrement physique',
    sealId: 'Sceau réel',
    actualCopies: 'Exemplaires réels',
    borrowedAt: 'Heure de prêt effective',
    sealedAt: 'Heure d’apposition effective',
    returnedAt: 'Heure de retour effective',
    registeredBy: 'Enregistré par',
    physicalNotice:
      'L’approbation ou la clôture administrative ne prouve ni apposition physique ni retour. Le prêt enregistre uniquement la garde physique.',
    detail: 'Détails de la demande de sceau',
    moreActions: 'Autres actions',
    contractId: 'Contrat lié',
    contractVersion: 'Version du contrat figée',
    contact: 'Contact et notes',
    external: 'Prêt externe',
    returnDueAt: 'Heure de retour prévue',
    ledgerId: 'Identifiant d’enregistrement immuable',
    exceptionReason: 'Exception de traitement',
    administrativeReason: 'Motif de clôture administrative',
    yes: 'Oui',
    no: 'Non',
    files: 'Fichiers de la demande',
    history: 'Historique des actions',
    download: 'Télécharger',
    cancel: 'Annuler',
    saveDraft: 'Enregistrer le brouillon',
    submit: 'Enregistrer et soumettre',
    confirm: 'Confirmer l’action',
    saved: 'Demande de sceau enregistrée',
    required: 'Ce champ est obligatoire',
    futureReturn: 'Le retour prévu doit être postérieur à maintenant',
    sourceRequired:
      'Choisissez un contrat ou téléversez un fichier avant de soumettre',
    fileSource: 'Utiliser les fichiers de la demande',
    uploadNotice:
      'Complétez d’abord les champs obligatoires. Le téléversement enregistre un brouillon ; l’enregistrement ou la soumission associe les fichiers téléversés.',
    remove: 'Retirer',
    discard: 'Abandonner les modifications',
    discardDescription:
      'Les modifications non enregistrées seront perdues. Les fichiers téléversés et brouillons enregistrés restent conservés.',
    unavailable:
      'Cet enregistrement ou cette action est indisponible. Revenez à la liste et actualisez.',
    failed:
      'L’opération a échoué. Vérifiez la saisie ou actualisez et réessayez.',
    retry: 'Réessayer',
    backToList: 'Retour à la liste',
    loading: 'Chargement',
    invalidInput:
      'Complétez les champs obligatoires et vérifiez les quantités et horaires réels.',
    checkoutNotice:
      'Confirmez le prêt effectif du sceau. Le prêt n’enregistre ni l’heure d’apposition ni le nombre réel d’exemplaires.',
    exceptionalNotice:
      'La clôture administrative conserve la garde en cours. Le retour exceptionnel conserve la version d’origine du contrat et ne l’active pas.',
    recipient: 'Destinataire',
    reason: 'Motif ou commentaire',
    mode: 'Mode de signature',
    confirmDescription:
      'Cette action modifie le résultat de la demande. Confirmez la demande et l’action sélectionnée.',
    states: {
      draft: 'Brouillon',
      revision: 'Révision',
      head: 'Approbation du service',
      legal: 'Approbation juridique',
      financeManager: 'Approbation des finances',
      gm: 'Approbation de la direction générale',
      stamping: 'Enregistrement d’apposition du sceau',
      returning: 'Confirmation du retour',
      exception: 'Exception de traitement',
      returnException: 'Exception de retour',
      completed: 'Terminé',
      administrativelyClosed: 'Clôturé administrativement',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
      terminated: 'Clôturé',
    },
    actions: {
      edit: 'Modifier',
      submit: 'Soumettre',
      withdraw: 'Retirer',
      terminate: 'Clôturer',
      retry: 'Réessayer le traitement',
      forceComplete: 'Clôturer administrativement',
      actualReturn: 'Confirmer le retour physique exceptionnel',
      approve: 'Approuver',
      reject: 'Rejeter',
      return: 'Renvoyer pour correction',
      comment: 'Commenter',
      read: 'Marquer comme lu',
      claim: 'Prendre en charge',
      release: 'Libérer',
      complete: 'Terminer le traitement effectif',
      unable: 'Impossible à traiter',
      transfer: 'Transférer',
      assign: 'Attribuer',
      cc: 'Ajouter des destinataires',
      addSigner: 'Ajouter un approbateur',
      urge: 'Relancer',
      appoint: 'Désignation administrative',
      reassign: 'Réattribution administrative',
    },
    types: {
      official: 'Officiel',
      contract: 'Contrat',
      legalRepresentative: 'Représentant légal',
      finance: 'Finances',
    },
    modes: {
      before: 'Avant',
      parallel: 'Parallèle',
    },
  },
};
