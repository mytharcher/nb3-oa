export default {
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
    ASSET_PHOTO_SIZE: 'Chaque photo doit faire au maximum 5 Mio.',
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
      'Cette version prend uniquement en charge les délais d’approbation par défaut de 24/48 heures ouvrées.',
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
