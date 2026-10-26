export default {
  contracts: {
    title: 'Demandes de contrat',
    ledgerTitle: 'Contrats',
    description: 'Lancez l’examen d’un contrat et suivez sa progression',
    ledgerDescription:
      'Lire les contrats approuvés et leurs versions immuables',
    source: 'Page source',
    detail: 'Détails du contrat',
    new: 'Nouveau contrat',
    edit: 'Modifier',
    save: 'Enregistrer',
    saveDraft: 'Enregistrer le brouillon',
    cancel: 'Annuler',
    submit: 'Soumettre pour approbation',
    appendText: 'Ajouter du texte',
    rebase: 'Rebaser',
    historicalEntry: 'Enregistrer un contrat historique',
    number: 'Nombre',
    contractType: 'Type de contrat',
    operation: 'Opération',
    counterparty: 'Cocontractant',
    counterpartyKind: 'Type de cocontractant',
    customer: 'Client',
    vendor: 'Fournisseur qualifié',
    amountCents: 'Montant du contrat (yuans)',
    startsOn: 'Date de début',
    endsOn: 'Date de fin',
    paymentTerms: 'Conditions de paiement',
    standardTemplate: 'Modèle standard',
    reason: 'Motif',
    textVersionId: 'Texte du contrat',
    attachments: 'Pièces jointes',
    versions: 'Versions immuables',
    version: 'Version',
    baseVersion: 'Version de base',
    nonStandard: 'Avis juridique non standard',
    selectOpinion: 'Sélectionner un avis juridique',
    yes: 'Oui',
    no: 'Non',
    search: 'Rechercher par numéro ou cocontractant',
    ledgerSearch: 'Rechercher un numéro de contrat',
    empty: 'Aucune demande de contrat',
    emptyDescription: 'Créez une demande pour lancer l’examen',
    emptyReadOnly:
      'Contactez un administrateur pour obtenir le droit de soumettre des contrats',
    ledgerEmpty: 'Aucun contrat',
    ledgerEmptyDescription: 'Les contrats approuvés apparaîtront ici',
    noResults: 'Aucune correspondance',
    clear: 'Effacer les filtres',
    retry: 'Réessayer',
    refresh: 'Actualiser',
    allStatuses: 'Tous les statuts',
    status: 'Statut',
    createdAt: 'Date de création',
    updatedAt: 'Date de mise à jour',
    view: 'Consulter',
    noAccess: 'Aucun accès à ce contrat. Contactez un administrateur.',
    fieldsRestricted:
      'Les champs complets du contrat ne sont pas lisibles. Contactez un administrateur.',
    missing: 'Le contrat n’existe plus. Revenez à la page source.',
    failed: 'Impossible de charger les données du contrat. Réessayez.',
    invalid:
      'Vérifiez les détails du contrat et les exigences de l’action actuelle.',
    conflict: 'Le contrat a changé. Chargez et vérifiez la dernière version.',
    loadLatest: 'Charger la dernière version',
    textDenied: 'Le texte du contrat n’est pas lisible',
    unknown:
      'Le résultat doit être vérifié. La saisie est verrouillée ; réessayez l’opération d’origine.',
    retryExact: 'Réessayer l’opération d’origine',
    required: 'Remplissez ce champ',
    amountInvalid:
      'Saisissez un montant positif ou nul avec au maximum deux décimales',
    dateInvalid: 'La date de fin ne doit pas précéder la date de début',
    tooLong: 'Cette valeur est trop longue',
    textRequired: 'Téléversez et liez le texte du contrat avant de soumettre',
    actionsFor: 'Actions pour « {{name}} »',
    rebaseTitle: 'Rebaser le contrat « {{name}} » ?',
    rebaseDescription:
      'Conserver cette proposition, actualiser la version de base et reprendre l’examen complet.',
    saved: '« {{name}} » enregistré',
    submitted: '« {{name}} » soumis',
    completed: 'Action terminée pour « {{name}} »',
    draftName: 'Brouillon de contrat',
    confirmation: '{{action}} le contrat « {{name}} » ?',
    dangerConsequence:
      'Cette action termine l’examen de la demande actuelle et clôt ses tâches en attente.',
    historicalConsequence:
      'Publie une version historique auditée. Vérifiez le texte et la proposition.',
    notAvailable: 'Cette action est indisponible. Actualisez pour vérifier.',
    comment: 'Commentaire ou motif',
    recipient: 'Destinataire',
    recipientSearch: 'Rechercher des destinataires admissibles',
    moreCandidates: 'Plus de candidats',
    noCandidates: 'Aucun destinataire admissible',
    place: 'Emplacement d’approbation',
    returnTarget: 'Renvoyer à',
    signerMode: 'Mode d’ajout d’approbateur',
    sourceContract: 'Contrat approuvé',
    proposal: 'Proposition de contrat',
    paidCents: 'Montant payé',
    heldCents: 'Paiements réservés',
    availableCents: 'Disponible pour paiement',
    actor: 'Acteur',
    request: 'Demande',
    openRequest: 'Consulter la demande',
    privateTextHint:
      'L’accès au texte du contrat nécessite l’accès à la demande propriétaire.',
    selectExisting: 'Choisir un fichier téléversé',
    removeFile: 'Retirer la sélection « {{name}} »',
    uploadHint:
      'Texte : PDF. Justificatifs : PDF, JPEG, PNG ou WebP ; 5 Mo maximum par fichier.',
    fileInvalid:
      'Choisissez un fichier pris en charge de 5 Mo maximum dont le format correspond.',
    uploadUnknown:
      'Le résultat du téléversement doit être vérifié. Choisissez un fichier téléversé ; ne le téléversez pas à nouveau.',
    fileMissing:
      'Le fichier sélectionné est indisponible. Vérifiez l’accès et la version du texte.',
    noFiles: 'Aucun fichier téléversé',
    uploaded: '« {{name}} » téléversé',
    bindText: 'Poursuivre la liaison du texte ajouté',
    boundText: 'Version du texte {{version}} liée',
    currentVersion: 'Version actuelle',
    selectSource:
      'Choisissez un contrat approuvé pour charger sa version complète',
    discard: 'Abandonner les modifications non enregistrées ?',
    discardDescription:
      'Votre saisie sera abandonnée ; les justificatifs téléversés resteront enregistrés.',
    discardConfirm: 'Abandonner les modifications',
    progress: 'Progression de l’examen',
    timeline: 'Historique des examens',
    selectFile: 'Choisir un fichier',
    sourceVersion: 'Version source',
    operations: {
      new: 'Nouveau contrat',
      change: 'Modification',
      renew: 'Renouvellement',
      terminate: 'Résiliation',
    },
    statuses: {
      draft: 'Brouillon',
      revision: 'Révision',
      head: 'Examen du service',
      legalFinance: 'Examen juridique et financier',
      standardFinance: 'Examen des finances',
      executive: 'Examen de la direction',
      gm: 'Examen de la direction générale',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
      terminated: 'Clôturé',
      activePendingSeal: 'Approuvé, en attente de sceau',
      active: 'Active',
    },
    views: {
      mine: 'Les miens',
      pending: 'En attente',
      done: 'Terminé',
      copied: 'Copié',
    },
    actions: {
      edit: 'Modifier',
      submit: 'Soumettre pour approbation',
      withdraw: 'Retirer',
      terminate: 'Clôturer',
      approve: 'Approuver',
      reject: 'Rejeter',
      return: 'Renvoyer',
      claim: 'Prendre en charge',
      comment: 'Commenter',
      read: 'Marquer comme lu',
      transfer: 'Transférer',
      addSigner: 'Ajouter un approbateur',
      urge: 'Relancer',
      appoint: 'Désigner un approbateur',
      reassign: 'Réattribuer',
      historicalEntry: 'Enregistrer un contrat historique',
      rebase: 'Rebaser',
    },
    modes: { before: 'Avant', after: 'Après', alongside: 'En parallèle' },

    errors: {
      CONTRACT_ACCESS_DENIED:
        'Ce contrat se trouve hors de vos droits d’accès.',
      CONTRACT_ACTION_NOT_ALLOWED:
        'Cette action est indisponible pour le contrat.',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        'Le montant du contrat ne peut pas être inférieur au total des paiements effectués et réservés.',
      CONTRACT_ATTACHMENT_DENIED:
        'Le champ de pièce jointe ou l’enregistrement du contrat se trouve hors de vos droits d’accès.',
      CONTRACT_ATTACHMENT_INVALID:
        'Choisissez des pièces jointes valides appartenant à cette demande de contrat.',
      CONTRACT_CANDIDATE_REMOVED:
        'Cette proposition de contrat non publiée a été supprimée. Créez une nouvelle demande.',
      CONTRACT_CATEGORY_INACTIVE: 'Choisissez un type de contrat actif.',
      CONTRACT_CORRUPT_BALANCE:
        'Les totaux de paiement du contrat sont incohérents. Contactez un administrateur.',
      CONTRACT_EMPLOYEE_REQUIRED:
        'Un employé actif disposant d’un service principal est requis.',
      CONTRACT_FIELDS_RESTRICTED:
        'Les champs requis du contrat se trouvent hors de vos droits d’accès.',
      CONTRACT_FILE_SIZE:
        'Choisissez un fichier de contrat non vide de 5 Mo maximum.',
      CONTRACT_FILE_TYPE:
        'Le texte du contrat doit être au format PDF ; les justificatifs peuvent être des PDF, JPEG, PNG ou WebP dont le contenu correspond au format.',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        'Cette clé de requête a déjà été utilisée avec des détails différents. Actualisez avant de soumettre à nouveau.',
      CONTRACT_INACTIVE_SOURCE:
        'Choisissez une source de contrat approuvé en vigueur.',
      CONTRACT_INCOMPLETE_PROPOSAL:
        'Complétez le motif du contrat, les conditions de paiement et la version immuable du texte.',
      CONTRACT_INPUT_INVALID:
        'Vérifiez les champs de saisie déclarés du contrat.',
      CONTRACT_INVALID_AMOUNT:
        'Saisissez un montant positif ou nul en centimes entiers exacts, dans la plage prise en charge.',
      CONTRACT_INVALID_ID: 'Une identité valide de taille limitée est requise.',
      CONTRACT_INVALID_TIME: 'L’horodatage du contrat est invalide.',
      CONTRACT_LIMIT_EXCEEDED:
        'Les montants en attente et payés dépassent le plafond du contrat.',
      CONTRACT_NOT_CANDIDATE:
        'Seule la proposition de contrat non publiée de cette demande peut être supprimée.',
      CONTRACT_NOT_FOUND: 'La source du contrat est introuvable.',
      CONTRACT_OUTSTANDING_PAYMENTS:
        'Libérez les paiements en attente avant de résilier le contrat.',
      CONTRACT_REASON_REQUIRED:
        'Saisissez un motif respectant la longueur prise en charge.',
      CONTRACT_REBASE_NOT_ALLOWED:
        'Seul le demandeur peut actualiser explicitement la version de base d’une modification renvoyée.',
      CONTRACT_REQUEST_KEY_REQUIRED: 'Une clé de requête stable est requise.',
      CONTRACT_RESERVATION_CLOSED:
        'La réservation de paiement a déjà été clôturée.',
      CONTRACT_RULE_INVALID:
        'La politique d’approbation du contrat est absente ou invalide. Contactez un administrateur.',
      CONTRACT_SLA_UNSUPPORTED:
        'L’adaptateur d’approbation installé prend uniquement en charge les délais configurés de 24/48 heures.',
      CONTRACT_SOURCE_CONFLICT:
        'Cette référence appartient à une autre source de contrat.',
      CONTRACT_STORED_ID_INVALID:
        'Une identité de contrat enregistrée est invalide. Contactez un administrateur.',
      CONTRACT_SUPPLIER_INVALID:
        'Le fournisseur doit être actif et sa qualification approuvée. Actualisez sa qualification avant l’approbation.',
      CONTRACT_TARGET_MISMATCH:
        'La cible d’approbation appartient à une autre demande de contrat.',
      CONTRACT_TEXT_INVALID:
        'Choisissez une version immuable du texte PDF appartenant à cette demande.',
      CONTRACT_TEXT_NOT_EDITABLE:
        'Des versions du texte du contrat ne peuvent être ajoutées qu’à un brouillon personnel ou une révision renvoyée.',
      CONTRACT_TEXT_REQUIRED:
        'Sélectionnez une version immuable valide du texte du contrat.',
      CONTRACT_TRANSITION_NOT_ALLOWED:
        'Utilisez l’opération de contrat dédiée et protégée.',
      CONTRACT_VERSION_CONFLICT:
        'Le contrat approuvé a changé. Renvoyez la demande, actualisez explicitement sa version de base et soumettez-la à nouveau pour examen.',
    },
    authz: {
      resource: 'Contrats et modifications',
      view: 'Consulter les demandes de contrat',
      submit: 'Créer et modifier ses propres demandes de contrat',
      ledger:
        'Lire le registre des contrats approuvés et leurs versions immuables',
      historicalEntry:
        'Enregistrer un contrat historique avec un dossier juridique audité',
    },
  },
};
