export default {
  discardTitle: 'Abandonner les modifications de « {{name}} » ?',
  discardDescription:
    'Les modifications non enregistrées seront perdues. Les justificatifs du brouillon enregistré sont conservés.',
  discard: 'Abandonner les modifications',
  title: 'Demandes de biens',
  description:
    'Demandez l’utilisation, l’emprunt ou la mise au rebut de biens ; confirmez leur traitement effectif.',
  new: 'Nouvelle demande de bien',
  draft: 'Brouillon de demande de bien',
  source: 'Vue source',
  detail: 'Consulter',
  detailDescription:
    'Données de la demande et actions d’approbation effectivement disponibles.',
  edit: 'Modifier',
  editTitle: 'Modifier la demande de bien',
  number: 'Nombre',
  operationLabel: 'Opération',
  statusLabel: 'Statut',
  quantity: 'Quantité',
  purpose: 'Objet',
  category: 'Catégorie',
  asset: 'Bien',
  borrowDueDate: 'Date de retour',
  updatedAt: 'Mis à jour',
  scrapReason: 'Motif de mise au rebut',
  appraisalOpinion: 'Avis d’inspection',
  handlingReason: 'Motif de réception',
  exceptionReason: 'Motif d’exception',
  allocation: 'Attribution effective',
  photos: 'Photos justificatives',
  originalValue: 'Valeur d’origine du bien',
  companyTimeZone: 'Fuseau horaire de l’entreprise : {{timeZone}}',
  search: 'Rechercher',
  searchPlaceholder: 'Rechercher par numéro ou objet',
  all: 'Tout',
  clearFilters: 'Effacer les filtres',
  refresh: 'Actualiser',
  rowActions: 'Actions pour {{name}}',
  empty: 'Aucune demande de bien',
  emptyDescription:
    'Créez une demande pour obtenir un bien ou le mettre au rebut.',
  emptyReadonly: 'Demandez à un administrateur l’accès aux demandes.',
  noResults: 'Aucune demande correspondante',
  noResultsDescription:
    'Modifiez ou effacez les filtres pour trouver des demandes.',
  noAccess: 'Vous n’avez plus accès. Contactez un administrateur.',
  missing:
    'Cette demande n’existe pas ou a été supprimée. Revenez à la vue source.',
  missingNamed: 'La demande « {{name}} » n’existe pas ou a été supprimée.',
  conflict:
    'La demande a changé. Chargez les dernières données avant de continuer.',
  invalid:
    'Cette opération a été refusée. Vérifiez les champs obligatoires et les actions actuellement proposées.',
  loadFailed:
    'Impossible de charger. Réessayez lorsque la connexion sera disponible.',
  retry: 'Réessayer',
  loadLatest: 'Charger la dernière version',
  missingFields:
    'Certains champs obligatoires ne sont pas lisibles. La modification complète ou la confirmation physique est désactivée.',
  unknownResult:
    'Le résultat est inconnu. La commande d’origine complète est figée ; réessayez exactement cette opération pour en vérifier le résultat.',
  retryExact: 'Réessayer l’opération d’origine',
  cancel: 'Annuler',
  save: 'Enregistrer',
  saveDraft: 'Enregistrer le brouillon',
  submit: 'Soumettre pour approbation',
  saving: 'Enregistrement…',
  saved: '« {{name}} » enregistré',
  submitted: '« {{name}} » soumis',
  completed: '{{action}} terminé pour « {{name}} »',
  required: 'Remplissez ce champ obligatoire.',
  quantityInvalid: 'Saisissez une quantité entière comprise entre 1 et 100.',
  textLimit: 'Utilisez au maximum 2 000 caractères.',
  reasonLimit: 'Utilisez au maximum 5 000 caractères.',
  futureDate:
    'Choisissez une date future dans le calendrier local de l’entreprise.',
  photoRequired: 'Sélectionnez au moins une photo justificative.',
  photoLimit: 'Jusqu’à 10 photos JPEG, PNG ou WebP de 5 Mo maximum chacune.',
  removeSelection: 'Retirer la sélection',
  selectPhoto: 'Sélectionner un justificatif existant',
  uploadUnknown:
    'Le téléversement de « {{name}} » nécessite une vérification. Consultez les justificatifs enregistrés et sélectionnez-le ; ne téléversez aucun autre fichier avant résolution.',
  noEligibleEmployee:
    'Un dossier d’employé actif en période d’essai ou confirmé est requis pour soumettre.',
  noDepartment: 'Un service principal actif est requis pour soumettre.',
  noActiveHead: 'Un chef de service actif est requis pour soumettre.',
  searchCandidates: 'Rechercher des candidats admissibles',
  selectAsset: 'Sélectionner un bien admissible',
  noEligibleAssets: 'Aucun bien admissible n’est disponible.',
  previous: 'Page précédente',
  next: 'Page suivante',
  comment: 'Avis / motif',
  person: 'Destinataire',
  signerMode: 'Position de l’approbateur supplémentaire',
  place: 'Emplacement d’approbation',
  fullBatch:
    'Confirmez chaque unité réservée et son numéro de série réel. Les réceptions physiques partielles ne peuvent pas terminer ce lot.',
  serialFor: 'Numéro de série réel de {{code}}',
  serialLimit: 'Utilisez au maximum 200 caractères.',
  serialMismatch: 'Le numéro de série réel doit correspondre au bien attribué.',
  actionUnavailable:
    'Cette action n’est plus proposée. Actualisez la demande actuelle.',
  actionTitle: '{{action}} la demande de bien « {{name}} »',
  confirmDanger:
    'Cette opération modifie la demande ou enregistre une remise physique. Confirmez les faits et le motif avant de continuer.',
  operations: {
    use: 'Utilisation permanente',
    borrow: 'Emprunt',
    scrap: 'Mise au rebut',
  },
  statuses: {
    draft: 'Brouillon',
    revision: 'Renvoyé pour correction',
    head: 'Examen du chef de service',
    appraisal: 'Inspection',
    finance: 'Examen des finances',
    gm: 'Examen de la direction générale',
    issuing: 'En attente de remise',
    borrowed: 'Emprunté',
    returning: 'En attente de retour physique',
    issued: 'Remis',
    returned: 'Retourné',
    scrapped: 'Mis au rebut',
    unable: 'Impossible à traiter',
    rejected: 'Rejeté',
    withdrawn: 'Retiré',
    terminated: 'Clôturé',
    exception: 'Exception de traitement',
  },
  actions: {
    submit: 'Soumettre pour approbation',
    withdraw: 'Retirer',
    terminate: 'Clôturer',
    approve: 'Approuver',
    reject: 'Rejeter',
    return: 'Renvoyer pour correction',
    complete: 'Confirmer le traitement physique',
    unable: 'Impossible à traiter',
    returnIssued: 'Confirmer le retour du bien remis',
    transfer: 'Transférer',
    addSigner: 'Ajouter un approbateur',
    cc: 'Mettre en copie',
    assign: 'Attribuer',
    appoint: 'Désigner',
    reassign: 'Réattribuer',
    urge: 'Relancer',
    read: 'Marquer comme lu',
    comment: 'Commenter',
    claim: 'Prendre en charge',
    release: 'Libérer',
  },
  tabs: {
    mine: 'Les miens',
    pending: 'En attente',
    done: 'Traité',
    copied: 'Copié',
  },
  modes: {
    before: 'Avant',
    alongside: 'En parallèle',
    after: 'Après',
  },
  authz: {
    ownedScope: 'Ses propres demandes de biens',
    resource: 'Demandes de biens',
    view: 'Lire les demandes de biens',
    viewValue: 'Lire les valeurs d’origine des biens',
    create: 'Créer ses propres demandes de biens',
    edit: 'Modifier ses propres demandes de biens',
    operate:
      'Exécuter les actions autorisées d’approbation et de traitement des biens',
    returnIssued:
      'Confirmer le retour physique des biens remis pour utilisation',
  },
  errors: {
    ASSET_RETURN_REASON_REQUIRED: 'Saisissez le motif de réception physique.',
    ASSET_ACCESS_DENIED: 'Vous ne pouvez pas accéder à cette demande de bien.',
    ASSET_ACTION_INVALID: 'Cette action n’est pas disponible pour la demande.',
    ASSET_REQUEST_NOT_FOUND: 'Demande de bien introuvable.',
    ASSET_INVALID_COMMAND:
      'Saisissez un identifiant de requête stable et le motif requis.',
    ASSET_REQUEST_REUSED:
      'Cet identifiant de requête est lié à une autre opération.',
    ASSET_REQUIRED_FIELDS:
      'Complétez l’objet, la quantité et la sélection du bien.',
    ASSET_CATEGORY_INACTIVE: 'Choisissez une catégorie de biens active.',
    ASSET_EMPLOYEE_INACTIVE:
      'Le demandeur doit posséder un dossier d’employé actif.',
    ASSET_DEPARTMENT_MISSING:
      'Le demandeur doit avoir un service principal actif.',
    ASSET_HEAD_MISSING: 'Le service doit disposer d’un chef approbateur actif.',
    ASSET_BORROW_DATE_INVALID:
      'Choisissez une date de retour future valide selon la date locale de l’entreprise.',
    ASSET_SCRAP_REQUIRED:
      'Sélectionnez un bien, saisissez le motif de mise au rebut et joignez une photo.',
    ASSET_SCRAP_INELIGIBLE:
      'Seul un bien détenu admissible ou un article en stock sous contrôle administratif peut être mis au rebut.',
    ASSET_PHOTO_DENIED: 'La demande ou son champ photo n’est pas accessible.',
    ASSET_PHOTO_INVALID:
      'Choisissez au maximum dix photos valides liées à cette demande.',
    ASSET_PHOTO_SIZE: 'Chaque photo doit faire au maximum 5 Mo.',
    ASSET_PHOTO_TYPE: 'Téléversez une image JPEG, PNG ou WebP valide.',
    ASSET_STOCK_SHORTAGE:
      'Le nombre d’unités disponibles est insuffisant pour satisfaire toute la demande.',
    ASSET_INVALID_QUANTITY: 'Confirmez une quantité entière entre 1 et 100.',
    ASSET_INVALID_AMOUNT:
      'La valeur enregistrée du bien dépasse la plage exacte prise en charge.',
    ASSET_NOT_FOUND: 'Un bien de cette demande est introuvable.',
    ASSET_INVALID_VERSION: 'Chargez la version actuelle du bien.',
    ASSET_VERSION_CONFLICT:
      'Le bien a changé. Rechargez-le avant de confirmer.',
    ASSET_ALREADY_RESERVED: 'Un bien est réservé par une autre demande.',
    ASSET_EXISTING_HOLD:
      'Résolvez la réservation existante avant de modifier le stock.',
    ASSET_HOLD_MISMATCH:
      'La réservation effective ne correspond pas à cette demande.',
    ASSET_BASELINE_CONFLICT:
      'Les données du bien ont changé après approbation. Renvoyez la demande pour examen avant exécution.',
    ASSET_UNITS_INCOMPLETE:
      'Confirmez chaque unité attribuée et son numéro de série réel.',
    ASSET_SERIAL_MISMATCH: 'Le numéro de série diffère de celui du bien réel.',
    ASSET_RETURN_MISMATCH:
      'Les articles retournés ne correspondent pas à la garde effective des biens remis.',
    ASSET_ALREADY_RETURNED: 'Ce bien a déjà été retourné.',
    ASSET_RETURN_FORBIDDEN:
      'Un administrateur de biens actif doit confirmer le retour physique.',
    ASSET_RETURN_INELIGIBLE:
      'Cette demande n’est pas une demande admissible d’utilisation de bien remis.',
    ASSET_ALLOCATION_MISSING: 'L’attribution réelle complète est manquante.',
    ASSET_SOURCE_UNAVAILABLE:
      'La source de la demande de bien est indisponible.',
    ASSET_SOURCE_MISSING: 'La demande de bien propriétaire n’existe plus.',
    ASSET_SOURCE_FORBIDDEN:
      'La source n’a pas autorisé cette opération de stock.',
    ASSET_SOURCE_MISMATCH:
      'La source de stock ne correspond pas à la demande effective.',
    ASSET_TARGET_MISMATCH:
      'La cible d’approbation appartient à une autre demande.',
    ASSET_DIRECTORY_UNAVAILABLE: 'Un annuaire d’approbation à jour est requis.',
    ASSET_SLA_UNSUPPORTED:
      'Impossible de soumettre l’approbation. Demandez à un administrateur de définir les délais sur 24/48 heures ouvrées.',
  },
  schedule: {
    title: 'Rappels de retour des biens empruntés',
    description:
      'Rappels quotidiens à la date d’échéance locale de l’entreprise et rappels hebdomadaires de retard. Une distribution en attente est signalée comme une occurrence en échec.',
  },
  reminders: {
    before:
      'Demande de bien {{number}} : {{quantity}} article(s) emprunté(s) sont à rendre le {{date}}. Veuillez organiser leur retour physique.',
    overdue:
      'Demande de bien {{number}} : {{quantity}} article(s) emprunté(s) étaient à rendre le {{date}} et n’ont pas encore été retournés.',
  },
};
