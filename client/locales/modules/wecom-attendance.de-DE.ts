export default {
  wecomAttendance: {
    title: 'WeCom-Anwesenheitsquelle',
    description:
      'Importieren Sie Zeitbuchungen zugeordneter Mitarbeiter und prüfen Sie die letzten 30 Synchronisierungsläufe.',
    sync: 'Synchronisieren',
    refresh: 'Aktualisieren',
    runs: 'Synchronisierungsläufe',
    retry: 'Erneut versuchen',
    counts: 'Gespeicherte Datensätze: {{records}} · Stapel: {{batches}}',
    runFailed:
      'Einige Datensätze konnten nicht importiert werden. Prüfen Sie vor einem erneuten Versuch die Mitarbeiterzuordnungen, Schichtzuweisungen und den Quellenzugriff. Abgeschlossene Stapel bleiben erhalten.',
    denied: 'Sie haben keinen Zugriff auf die Anwesenheitssynchronisierung.',
    disabled:
      'Die Quelle ist deaktiviert. Bitten Sie einen Administrator, die vorgesehene Anwesenheitsanwendung einzurichten.',
    unconfigured:
      'Vor der Synchronisierung benötigt die Quelle Zugangsdaten und ausdrückliche Mitarbeiterzuordnungen.',
    ready_one:
      'Bereit zur Synchronisierung von {{count}} zugeordnetem Mitarbeiter.',
    ready_other:
      'Bereit zur Synchronisierung von {{count}} zugeordneten Mitarbeitern.',
    startedAt: 'Gestartet {{time}}',
    empty: 'Noch keine Synchronisierungsläufe.',
    rangeHint:
      'Wählen Sie bis zu sieben abgeschlossene Kalendertage in der Unternehmenszeitzone. Bereits vorhandene Quelldatensätze werden nicht dupliziert.',
    start: 'Startdatum',
    end: 'Enddatum',
    reason: 'Begründung',
    cancel: 'Abbrechen',
    syncing: 'Wird synchronisiert…',
    states: {
      running: 'In Bearbeitung',
      completed: 'Abgeschlossen',
      failed: 'Handlungsbedarf',
    },
  },
};
