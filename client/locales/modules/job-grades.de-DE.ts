export default {
  jobGrades: {
    authz: {
      resource: 'Gehaltsgruppentabellen',
      view: 'Veröffentlichungsverlauf anzeigen',
      viewSalary: 'Gehaltsbereiche lesen',
      manage: 'Gehaltsgruppentabelle veröffentlichen',
    },

    title: 'Gehaltsgruppentabellen',
    description:
      'Prüfen Sie den unveränderlichen Veröffentlichungsverlauf und veröffentlichen Sie vollständige Gehaltsintervalle.',
    publish: 'Neue Version veröffentlichen',
    publishing: 'Wird veröffentlicht…',
    search: 'Nach exakter Versionsnummer suchen',
    empty: 'Keine Gehaltstabelle veröffentlicht',
    emptyDescription:
      'Veröffentlichen Sie die erste vollständige Gehaltsgruppentabelle.',
    emptyReadonly:
      'Bitten Sie die Personalabteilung, die erste Gehaltsgruppentabelle zu veröffentlichen.',
    noMatches: 'Keine passende Version',
    noMatchesDescription:
      'Setzen Sie die Versionssuche zurück, um den Veröffentlichungsverlauf zu sehen.',
    replacement:
      'Die Veröffentlichung ersetzt die gesamte aktuelle Tabelle. Bereits eingereichte Dokumente behalten ihre Version.',
    privateDenied:
      'Sie können Gehaltsintervalle nicht lesen. Bitten Sie einen Administrator um Zugriff.',
    publishDenied:
      'Sie können keine Gehaltsgruppentabellen veröffentlichen. Bitten Sie einen Administrator um Zugriff.',
    unknown:
      'Das Veröffentlichungsergebnis ist unbestätigt. Wiederholen Sie die ursprüngliche Veröffentlichung.',
    conflict:
      'Die aktuelle Tabelle wurde geändert. Laden Sie vor der Veröffentlichung die neueste Tabelle.',
    inactive:
      'Diese Gehaltsgruppe ist nicht verfügbar. Entfernen Sie sie oder wählen Sie eine aktive Gruppe.',
    success: 'Gehaltstabelle „Version {{version}}“ veröffentlicht',
    version: 'Version {{version}}',
    versionColumn: 'Version',
    publisher: 'Veröffentlicht von',
    publishedAt: 'Veröffentlicht am',
    refresh: 'Aktualisieren',
    retry: 'Erneut versuchen',
    retryPublication: 'Ursprüngliche Veröffentlichung erneut versuchen',
    clear: 'Filter zurücksetzen',
    loading: 'Gehaltsgruppentabellen werden geladen',
    view: 'Version anzeigen',
    rowActions: 'Aktionen für Version {{version}}',
    grade: 'Gehaltsgruppe',
    gradeCode: 'Gehaltsgruppencode',
    gradeTitle: 'Gehaltsgruppenname',
    rank: 'Festgeschriebener Rang',
    minimum: 'Minimum',
    maximum: 'Maximum',
    reason: 'Veröffentlichungsbegründung',
    addGrade: 'Gehaltsgruppe hinzufügen',
    remove: 'Gehaltsgruppe {{index}} entfernen',
    selectGrade: 'Aktive Gehaltsgruppe auswählen',
    removeDescription:
      'Das Entfernen einer Zeile ändert nur die vorgeschlagene neue Tabelle. Frühere Versionen bleiben unverändert.',
    cancel: 'Abbrechen',
    loadLatest: 'Neueste Tabelle laden',
    currentVersion: 'Quellversion: {{version}}',
    notFound:
      'Diese Gehaltsgruppentabelle ist nicht verfügbar. Kehren Sie zum Veröffentlichungsverlauf zurück.',
    failed:
      'Gehaltsgruppentabellen konnten nicht geladen werden. Versuchen Sie es erneut.',
    writeFailed:
      'Die Veröffentlichung wurde verweigert. Prüfen Sie die Felder und versuchen Sie es erneut.',
    storageFailure:
      'Die ursprüngliche Veröffentlichung kann in diesem Tab nicht sicher gespeichert werden. Die Veröffentlichung ist gesperrt; prüfen Sie den Browserspeicher und laden Sie neu.',
    unsavedTitle: 'Änderungen an der Gehaltstabelle verwerfen?',
    unsavedDescription: 'Ihre unveröffentlichten Änderungen gehen verloren.',
    discard: 'Änderungen verwerfen',
    stay: 'Weiter bearbeiten',
    replaceTitle: 'Vorgeschlagene Tabelle ersetzen?',
    replaceDescription:
      'Das Laden der neuesten Tabelle verwirft diesen Vorschlag und beginnt mit der vollständigen aktuellen Tabelle.',
    confirmReplace: 'Ersetzen und neueste Version laden',
    noGrades:
      'Keine aktiven Gehaltsgruppen verfügbar. Bitten Sie einen Organisationsadministrator, Gehaltsgruppen zu konfigurieren.',
    reasonHint:
      'Begründen Sie die Veröffentlichung der vollständigen Tabelle (bis zu 2.000 Zeichen).',
    immutable:
      'Diese veröffentlichte Version ist unveränderlich. Ihre Gehaltsgruppenidentitäten und Intervalle sind festgeschrieben.',
    validation: {
      required: 'Dieses Feld ist erforderlich.',
      amount:
        'Geben Sie einen nicht negativen Betrag mit höchstens zwei Nachkommastellen innerhalb des unterstützten Bereichs ein.',
      range: 'Das Maximum muss größer oder gleich dem Minimum sein.',
      duplicate: 'Jede Gehaltsgruppe darf nur einmal vorkommen.',
      inactive:
        'Diese Gehaltsgruppe ist nicht verfügbar. Entfernen Sie sie oder wählen Sie eine aktive Gruppe.',
      nonempty: 'Nehmen Sie mindestens eine aktive Gehaltsgruppe auf.',
      reasonLength: 'Verwenden Sie höchstens 2.000 Zeichen.',
      server: 'Prüfen Sie dieses Feld und versuchen Sie es erneut.',
    },
  },
};
