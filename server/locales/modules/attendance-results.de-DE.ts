export default {
  attendanceResults: {
    failed:
      'Die Anwesenheitsergebnisse konnten nicht verarbeitet werden. Prüfen Sie Ihre Zugriffsrechte, den Dienstplan und die Datumsangaben und versuchen Sie es erneut.',
    scheduleTitle: 'Tägliche Anwesenheitsberechnung',
    scheduleDescription:
      'Abgeschlossene Schichten der letzten sieben Tage in der Unternehmenszeitzone einschließlich Korrekturen und genehmigter Abwesenheiten abgleichen. Ergebnisse mit Prüfbedarf kennzeichnen den Lauf als fehlgeschlagen.',
    authz: {
      resource: 'Anwesenheitsergebnisse',
      calculateSelf: 'Meine Anwesenheit berechnen',
      self: 'Meine Anwesenheit',
      view: 'Ergebnisse anzeigen',
      recalculate: 'Neu berechnen',
      export: 'Ergebnisse exportieren',
      attendanceEvaluations: 'Tägliche Anwesenheit',
      attendanceEvaluationRevisions: 'Verlauf der Anwesenheitsberechnung',
    },
  },
};
