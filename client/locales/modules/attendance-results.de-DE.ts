export default {
  attendanceResults: {
    title: 'Anwesenheitsergebnisse',
    description:
      'Prüfen Sie die tägliche Anwesenheit, klären Sie fehlende Zeitbuchungen und sehen Sie Ihre Monatsübersicht ein.',
    month: 'Monat',
    employee: 'Mitarbeiter',
    department: 'Abteilung',
    date: 'Datum',
    status: 'Status',
    dailyResult: 'Tägliche Anwesenheit',
    normalDays: 'Reguläre Tage',
    exceptionDays: 'Tage mit Abweichungen',
    blockedDays: 'Zu prüfende Tage',
    restDays: 'Ruhetage',
    lateMinutes: 'Verspätung (Min.)',
    earlyMinutes: 'Vorzeitiges Gehen (Min.)',
    missingPunches: 'Fehlende Zeitbuchungen',
    absentMinutes: 'Nicht abgedeckte Abwesenheit (Min.)',
    approvedOvertimeMinutes: 'Genehmigte Überstunden (Min.)',
    statuses: {
      normal: 'Regulär',
      exception: 'Abweichung',
      blocked: 'Prüfung erforderlich',
      rest: 'Ruhetag',
    },
    timeZone:
      'Anwesenheitsdaten richten sich nach der Unternehmenszeitzone: {{zone}}.',
    refresh: 'Aktualisieren',
    clear: 'Filter zurücksetzen',
    empty: 'Noch keine Anwesenheitsergebnisse',
    noResults: 'Keine passenden Ergebnisse',
    emptyDescription:
      'Ergebnisse erscheinen nach der täglichen Berechnung. Sie können einen abgeschlossenen Tag berechnen oder die Personalabteilung bitten, den Dienstplan zu prüfen.',
    unnamed: 'Mitarbeitername nicht verfügbar',
    denied: 'Sie haben keinen Zugriff auf diesen Anwesenheitsvorgang.',
    calculate: 'Meine Anwesenheit berechnen',
    recalculate: 'Neu berechnen',
    calculateDescription:
      'Wählen Sie einen abgeschlossenen Tag und geben Sie eine Begründung an. Bestehende Ergebnisse bleiben im Berechnungsverlauf erhalten.',
    reason: 'Begründung',
    cancel: 'Abbrechen',
    confirmCalculate: 'Berechnen',
    calculating: 'Wird berechnet…',
    calculated: 'Anwesenheitsberechnung abgeschlossen.',
    calculateFailed:
      'Die Anwesenheit konnte nicht berechnet werden. Prüfen Sie, ob die Schicht beendet ist und ein gültiger Dienstplan vorliegt, und versuchen Sie es erneut.',
    correctIn: 'Korrektur der Kommen-Buchung beantragen',
    correctOut: 'Korrektur der Gehen-Buchung beantragen',
    export: 'Monat exportieren',
    exporting: 'Wird exportiert…',
    exported: 'Anwesenheitsexport heruntergeladen.',
    needsReview:
      'Bitten Sie die Personalabteilung, den Dienstplan und die Anwesenheitseinträge zu prüfen.',
    prefillUnavailable:
      'Diese fehlende Zeitbuchung kann nicht mehr korrigiert werden. Wählen Sie einen anderen zulässigen Eintrag oder bitten Sie die Personalabteilung um Hilfe.',
    reasons: {
      missingPrimaryDepartment: 'Ihre Hauptabteilung muss festgelegt werden.',
      missingSchedule: 'Für diesen Tag ist kein Dienstplan vorhanden.',
      missingShiftRevision: 'Die Schicht muss geprüft werden.',
      calendarTimeZoneChanged:
        'Die Zeiteinstellungen für die Anwesenheit wurden geändert. Bitten Sie die Personalabteilung, diese zu bestätigen.',
      unresolvableLocalTime: 'Die Uhrzeit muss geprüft werden.',
      missingCorrectionFact:
        'Eine genehmigte Korrektur muss abgeglichen werden.',
      invalidActivityTime:
        'Eine genehmigte Abwesenheit hat einen ungültigen Zeitraum.',
      unverifiedActivitySource:
        'Eine Abwesenheit muss geprüft werden, bevor sie verwendet werden kann.',
    },
  },
};
