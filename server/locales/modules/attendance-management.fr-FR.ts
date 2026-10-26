export default {
  attendanceManagement: {
    errors: {
      ATTENDANCE_INVALID_INPUT: 'Justificatif brut de présence invalide.',
      ATTENDANCE_INVALID_TIME:
        'Le pointage doit appartenir à la date de présence de l’entreprise.',
      ATTENDANCE_INVALID_BATCH:
        'Fournissez de 1 à 1000 lignes dans la limite de taille des justificatifs.',
      ATTENDANCE_SOURCE_CONFLICT:
        'La clé source identifie un justificatif immuable différent.',
      ATTENDANCE_IDENTITY_UNAVAILABLE:
        'Chaque ligne nécessite une personne réelle possédant un dossier d’employé.',

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
      importResource: 'Importation de présence brute',
      ingest: 'Importer des justificatifs immuables',
      attendanceRecords: 'Enregistrements bruts de présence',

      resource: 'Configuration de présence',
      view: 'Consulter la configuration de présence',
      manage: 'Gérer la configuration de présence',
      attendanceShifts: 'Horaires de présence',
      attendanceShiftRevisions: 'Révisions des horaires',
      attendanceSchedules: 'Plannings des services',
      attendanceScheduleRevisions: 'Révisions des plannings',
    },
  },
};
