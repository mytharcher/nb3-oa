export default {
  processOperations: {
    title: 'Prozessbetrieb',
    hint: 'Eingereichte Anträge nach Unternehmensdatum und aktueller Hauptabteilung des Antragstellers.',
    refresh: 'Aktualisieren',
    range: 'Datum der ersten Einreichung',
    process: 'Prozess',
    department: 'Abteilung',
    all: 'Alle zulässigen Prozesse',
    clear: 'Filter zurücksetzen',
    back: 'Zurück zum Arbeitsplatz',
    retry: 'Erneut versuchen',
    summary: 'Prozessübersicht',
    naturalTime:
      'Die verstrichene Kalenderzeit umfasst Wartezeiten zwischen Rückgabe und Wiedereinreichung. Zurückgezogene und stornierte Anträge werden aus den Abschlussdurchschnitten ausgeschlossen.',
    stages: 'Stufendauer',
    stageHint:
      'Parallele Aufgaben teilen sich einen Stufenzeitraum; wiederholte Eintritte werden separat gezählt.',
    overdue: 'Überfällige Aufgaben',
    overdueHint:
      'Nur offene Aufgaben mit konfigurierter Frist werden eingeordnet.',
    empty: 'Keine eingereichten Anträge',
    emptyHint:
      'Versuchen Sie einen anderen Zeitraum, Prozess oder eine andere Abteilung.',
    noStages: 'Keine Genehmigungsstufen in diesem Zeitraum.',
    noOverdue: 'Keine überfälligen Aufgaben mit konfigurierter Frist.',
    generated: 'Aktualisiert {{at}}',
    submitted: 'Eingereicht',
    completed: 'Abgeschlossen',
    returned: 'Zurückgegebene Anträge',
    average: 'Durchschnittliche verstrichene Zeit',
    returnRate: 'Rückgabequote',
    stage: 'Stufe',
    endedStages: 'Abgeschlossene Stufeneintritte',
    averageStay: 'Durchschnittliche Dauer',
    waiting: 'Wartende Einträge',
    oldestWait: 'Längste aktuelle Wartezeit',
    number: 'Antragsnummer',
    noNumber: 'Antrag ohne Nummer',
    due: 'Frist',
    overdueTime: 'Dauer der Überfälligkeit',
    hours: '{{value}} Std.',
    errors: {
      denied:
        'Sie haben keinen Zugriff auf diesen Bericht und seine Geschäftsdaten.',
      broad:
        'Wählen Sie einen gültigen Zeitraum von höchstens 93 Tagen. Grenzen Sie den Prozess oder die Abteilung ein, falls es zu viele Anträge gibt.',
      failed:
        'Der Bericht konnte nicht geladen werden. Versuchen Sie es erneut.',
    },
  },
};
