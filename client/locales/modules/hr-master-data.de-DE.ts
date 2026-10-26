export default {
  hrMasterData: {
    mappingSearch:
      'Zugeordneten Datensatz anhand der exakten externen ID suchen (ohne Filter werden die letzten 100 angezeigt)',
    title: 'Personaldatensynchronisierung',
    description:
      'Organisations- und Mitarbeiterstammdaten über ein freigegebenes Integrationsgateway empfangen. Bestehende Kontoverknüpfungen sind erforderlich; die Synchronisierung ermöglicht keine Anmeldung.',
    read: 'Synchronisierung anzeigen',
    sync: 'Synchronisieren und erneut ausführen',
    manage: 'Quellen und Datenhoheit verwalten',
    addSource: 'Quelle hinzufügen',
    editSource: 'Quelle bearbeiten',
    sourceCode: 'Quellcode (Kleinbuchstaben, Ziffern und Bindestriche)',
    sourceName: 'Quellenname',
    principal: 'Autorisiertes Integrationskonto',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
    noSources: 'Für Ihr Konto ist keine Personaldatenquelle eingerichtet.',
    recent: 'Letzte Synchronisierungen',
    latest: 'Die letzten 50 Stapel dieser Quelle werden angezeigt.',
    items_one: '{{count}} Datensatz',
    items_other: '{{count}} Datensätze',
    actions: 'Aktionen',
    replay: 'Ursprünglichen Stapel erneut ausführen',
    refresh: 'Aktualisieren',
    noRuns: 'Noch keine Stapel empfangen.',
    mappings: 'Zugeordnete Datensätze',
    revision: 'Revision {{revision}}',
    reclaim: 'Externe Datenhoheit wiederherstellen',
    reclaimHelp:
      'Lokale Änderungen sind geschützt. Durch die Wiederherstellung der Datenhoheit darf die externe Quelle diese Felder bei der nächsten gültigen Aktualisierung ersetzen. Prüfen Sie zuerst den lokalen Datensatz und begründen Sie Ihre Entscheidung.',
    confirmReclaim: 'Externe Datenhoheit bestätigen',
    reason: 'Begründung',
    cancel: 'Abbrechen',
    save: 'Speichern',
    failed:
      'Der Vorgang ist fehlgeschlagen. Prüfen Sie Ihre Berechtigungen und die Quelleinstellungen und versuchen Sie es erneut.',
    localConflict:
      'Dieser Datensatz wurde lokal geändert. Die Personalabteilung muss ihn prüfen und die externe Datenhoheit ausdrücklich wiederherstellen, bevor der Vorgang erneut versucht wird.',
    businessConflict:
      'Ein Datensatz konnte nicht übernommen werden. Korrigieren Sie die Quelldaten oder beheben Sie die fachliche Einschränkung und führen Sie dann den ursprünglichen Stapel erneut aus.',
    states: {
      pending: 'Ausstehend',
      completed: 'Abgeschlossen',
      failed: 'Fehlgeschlagen',
    },
    entities: {
      department: 'Abteilung',
      grade: 'Gehaltsgruppe',
      employee: 'Mitarbeiter',
    },
  },
};
