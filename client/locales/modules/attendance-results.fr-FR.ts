export default {
  attendanceResults: {
    title: 'Résultats de présence',
    description:
      'Examinez la présence quotidienne, résolvez les pointages manquants et consultez votre synthèse mensuelle.',
    month: 'Mois',
    employee: 'Employé',
    department: 'Service',
    date: 'Date',
    status: 'Statut',
    dailyResult: 'Présence quotidienne',
    normalDays: 'Jours normaux',
    exceptionDays: 'Jours avec anomalies',
    blockedDays: 'Jours à vérifier',
    restDays: 'Jours de repos',
    lateMinutes: 'Retard (min)',
    earlyMinutes: 'Départ anticipé (min)',
    missingPunches: 'Pointages manquants',
    absentMinutes: 'Absence non couverte (min)',
    approvedOvertimeMinutes: 'Heures supplémentaires approuvées (min)',
    statuses: {
      normal: 'Normal',
      exception: 'Anomalie',
      blocked: 'À vérifier',
      rest: 'Jour de repos',
    },
    timeZone:
      'Les dates de présence suivent le fuseau horaire de l’entreprise : {{zone}}.',
    refresh: 'Actualiser',
    clear: 'Effacer les filtres',
    empty: 'Aucun résultat de présence',
    noResults: 'Aucun résultat correspondant',
    emptyDescription:
      'Les résultats apparaissent après le calcul quotidien. Vous pouvez calculer un jour terminé ou demander aux RH de vérifier le planning.',
    unnamed: 'Nom d’employé indisponible',
    denied: 'Vous n’avez pas accès à cette opération de présence.',
    calculate: 'Calculer ma présence',
    recalculate: 'Recalculer',
    calculateDescription:
      'Sélectionnez un jour terminé et expliquez le motif. Les résultats existants restent dans l’historique des calculs.',
    reason: 'Motif',
    cancel: 'Annuler',
    confirmCalculate: 'Calculer',
    calculating: 'Calcul…',
    calculated: 'Calcul de présence terminé.',
    calculateFailed:
      'Impossible de calculer la présence. Vérifiez que l’horaire est terminé et qu’un planning valide est disponible, puis réessayez.',
    correctIn: 'Demander une correction du pointage d’arrivée',
    correctOut: 'Demander une correction du pointage de départ',
    export: 'Exporter le mois',
    exporting: 'Exportation…',
    exported: 'Export de présence téléchargé.',
    needsReview:
      'Demandez aux RH de vérifier le planning et les enregistrements de présence.',
    prefillUnavailable:
      'Ce pointage manquant n’est plus disponible pour correction. Sélectionnez un autre enregistrement admissible ou demandez de l’aide aux RH.',
    reasons: {
      missingPrimaryDepartment: 'Votre service principal doit être défini.',
      missingSchedule: 'Aucun planning n’est disponible pour ce jour.',
      missingShiftRevision: 'L’horaire doit être vérifié.',
      calendarTimeZoneChanged:
        'Les paramètres horaires de présence ont changé. Demandez aux RH de les confirmer.',
      unresolvableLocalTime: 'L’heure de pointage doit être vérifiée.',
      missingCorrectionFact: 'Une correction approuvée doit être rapprochée.',
      invalidActivityTime:
        'Une absence approuvée comporte une plage horaire invalide.',
      unverifiedActivitySource:
        'Une absence doit être vérifiée avant de pouvoir être utilisée.',
    },
  },
};
