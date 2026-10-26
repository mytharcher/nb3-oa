export default {
  attendanceManagement: {
    savedSchedule: 'Planning de « {{department}} » au {{date}} enregistré',
    savedShift: 'Horaire « {{name}} » enregistré',

    editAction: 'Modifier',
    errors: {
      NOT_FOUND: 'Cet horaire n’existe plus.',
      ACCESS_DENIED: 'Vous n’avez pas accès à cette configuration de présence.',
      ATTENDANCE_ACCESS_DENIED:
        'L’autorisation actuelle sur l’enregistrement ou le champ ne permet pas cette modification.',
      ATTENDANCE_VERSION_CONFLICT:
        'La configuration a changé. Rechargez avant d’enregistrer.',
      ATTENDANCE_SHIFT_INVALID:
        'Saisissez une définition d’horaire explicite valide.',
      ATTENDANCE_SHIFT_NOT_FOUND: 'L’horaire est introuvable ou désactivé.',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE:
        'Un code d’horaire ne peut pas être modifié.',
      ATTENDANCE_SHIFT_CODE_CONFLICT: 'Ce code d’horaire existe déjà.',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED:
        'Utilisez une révision dans le fuseau horaire actuel de l’entreprise.',
      ATTENDANCE_SCHEDULE_INVALID:
        'Choisissez une date réelle et un horaire explicite ou un jour de repos.',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE: 'Ce service est indisponible.',
      ATTENDANCE_SCHEDULE_NOT_READABLE:
        'La révision actuelle du planning n’est pas lisible.',
      ATTENDANCE_LIST_INVALID: 'Les paramètres de la page sont invalides.',
      ATTENDANCE_LOCAL_TIME_INVALID:
        'L’heure locale est ignorée ou répétée par le changement d’heure. Choisissez des limites sans ambiguïté.',
    },
    authz: {
      resource: 'Configuration de présence',
      view: 'Consulter la configuration de présence',
      manage: 'Gérer la configuration de présence',
      attendanceShifts: 'Horaires de présence',
      attendanceShiftRevisions: 'Révisions des horaires',
      attendanceSchedules: 'Plannings des services',
      attendanceScheduleRevisions: 'Révisions des plannings',
    },
    nameTooLong: 'Utilisez au maximum 200 caractères.',
    reasonTooLong: 'Utilisez au maximum 2000 caractères.',
    title: 'Configuration de présence',
    description:
      'Configurez des horaires explicites et les plannings des services. Une configuration manquante bloque l’évaluation de la présence.',
    shifts: 'Horaires',
    schedules: 'Plannings des services',
    create: 'Ajouter un horaire',
    edit: 'Modifier l’horaire',
    view: 'Consulter la révision',
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    cancel: 'Annuler',
    refresh: 'Actualiser',
    retry: 'Réessayer',
    loading: 'Chargement de la configuration de présence',
    denied: 'Vous n’avez pas accès à cette configuration de présence.',
    notFound:
      'Cette configuration n’existe plus. Revenez à la liste des configurations.',
    failed:
      'Impossible de charger ou d’enregistrer la configuration de présence. Réessayez.',
    conflict:
      'La configuration a changé. Rechargez avant d’enregistrer. Votre saisie a été conservée.',
    code: 'Code d’horaire',
    name: 'Nom de l’horaire',
    enabled: 'Activé',
    disabled: 'Désactivée',
    status: 'Statut',
    version: 'Révision',
    revisionLabel: 'Révision {{revision}}',
    actions: 'Actions pour {{name}}',
    all: 'Tous les statuts',
    clearFilters: 'Effacer les filtres',
    search: 'Rechercher par code ou nom d’horaire',
    empty:
      'Aucun horaire configuré. Ajoutez un horaire explicite de l’entreprise pour commencer.',
    noMatches: 'Aucun horaire ne correspond aux filtres.',
    department: 'Service',
    date: 'Date du planning',
    chooseDepartmentDate:
      'Choisissez un service et une date pour vérifier son planning.',
    unconfigured:
      'Aucun planning n’est configuré pour ce service et cette date. L’évaluation de la présence reste bloquée.',
    restDay: 'Jour de repos explicite',
    workingDay: 'Jour de travail planifié',
    configure: 'Configurer le planning',
    history: 'Historique',
    shiftRevision: 'Révision exacte de l’horaire',
    reason: 'Motif de modification',
    createdBy: 'Modifié par',
    createdAt: 'Date de modification',
    timeZone: 'Fuseau horaire actuel de l’entreprise',
    basic: 'Informations générales',
    intervals: 'Plages de travail',
    rules: 'Règles de présence',
    addInterval: 'Ajouter une plage',
    removeInterval: 'Retirer la plage {{index}}',
    start: 'Heure de début (HH:mm)',
    end: 'Heure de fin (HH:mm)',
    startDayOffset: 'Jour de début',
    endDayOffset: 'Jour de fin',
    sameDay: 'Même jour',
    nextDay: 'Jour suivant',
    lateToleranceMinutes: 'Tolérance de retard (minutes)',
    earlyToleranceMinutes: 'Tolérance de départ anticipé (minutes)',
    absenceThresholdMinutes: 'Seuil d’absence (minutes)',
    required: 'Ce champ est obligatoire.',
    invalidShift:
      'Utilisez des plages HH:mm valides dans l’ordre croissant, sur 24 heures ; saisissez des tolérances entières inférieures à la durée de travail et un seuil d’absence compris dans cette durée.',
    invalidNumber: 'Saisissez un entier positif ou nul valide.',
    invalidCode:
      'Utilisez de 1 à 64 lettres, chiffres, traits de soulignement ou traits d’union.',
    saved: 'Configuration de présence enregistrée.',
    disableTitle: 'Désactiver l’horaire « {{name}} » ?',
    disableDescription:
      'L’historique des plannings existants est conservé. Les nouveaux plannings ne pourront plus sélectionner cet horaire.',
    disableConfirm: 'Désactiver et enregistrer',
    leaveTitle: 'Abandonner les modifications non enregistrées ?',
    leaveDescription:
      'Les modifications de ce formulaire n’ont pas été enregistrées.',
    discard: 'Abandonner les modifications',
    continueEditing: 'Continuer la modification',
    revisionReadonly:
      'Révision historique immuable. Les modifications créent une nouvelle révision.',
    noEnabledShifts:
      'Aucun horaire actif n’est disponible dans le fuseau horaire actuel de l’entreprise. Configurez d’abord un horaire ou sélectionnez explicitement un jour de repos.',
    shiftOptionsCap:
      'Seuls les 100 premiers horaires actifs sont affichés. Recherchez par code ou nom pour limiter les choix.',
    oldTimeZone:
      'Cette révision historique utilise un autre fuseau horaire d’entreprise. L’enregistrement publie une nouvelle révision dans le fuseau horaire actuel.',
    selectShift: 'Choisir un horaire actif',
    chooseRevision: 'Choisir une révision immuable',
    intervalHint:
      'Utilisez des plages distinctes pour les pauses. Précisez les décalages au jour suivant pour le travail de nuit. Aucun horaire de bureau n’est fourni par défaut.',
    restHint:
      'Un jour de repos est un fait explicite, distinct d’une configuration manquante.',
    reload: 'Recharger la dernière configuration',
    back: 'Retour à la configuration',
  },
};
