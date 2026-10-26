export default {
  resourceTitle: 'Standarddatenbereich',
  navigation: { title: 'Standarddatenbereich' },
  defaultAccess: {
    supportedScope:
      'Es werden nur Ressourcentypen angezeigt, die Datenbereiche unterstützen. Konfigurieren Sie hier den standardmäßigen Datensatzbereich für jede Aktion.',
    groupFilter: 'Ressourcengruppe',
    allGroups: 'Alle Gruppen',
    inlineHint:
      'Einfache Änderungen werden sofort gespeichert. Konfigurieren und speichern Sie bestimmte Bereiche in der Seitenleiste.',
    saved: 'Gespeichert',
    editScope: 'Bereich bearbeiten',
    back: 'Zurück zum Standardzugriff',

    configureResource: 'Ressource konfigurieren',
    configure: 'Konfigurieren',
    chooseResource:
      'Wählen Sie eine Ressource, um ihre standardmäßigen Datensatzbereiche zu konfigurieren.',
    configured: 'Konfiguriert',
    noDefault: 'Kein Standardbereich',
    customScope: 'Bestimmter Bereich',

    page: {
      title: 'Standarddatenbereich',
      description:
        'Der Standarddatenbereich erweitert den grundlegenden Datensatzbereich für Benutzer mit der entsprechenden Aktionsberechtigung. Er gewährt keine Aktions- oder Feldberechtigungen; Freigabe- und Einschränkungsregeln gelten ebenfalls.',
    },
    search: 'Nach Ressourcenname oder Schlüssel suchen',
    create: 'Standardzugriff festlegen',
    recordAccessHeader: 'Standardmäßiger Datensatzzugriff',
    allowedActions: 'Zulässige Aktionen',
    emptyNone:
      'Kein Standardzugriff konfiguriert. Berechtigungssätze und andere Regeln bestimmen den Zugriff.',
    emptySearch: 'Keine Standardzugriffsregeln entsprechen Ihrer Suche.',
    pagerLabel: 'Regeln für Standarddatenbereiche',
    editTitle: 'Standardzugriff bearbeiten',
    newTitle: 'Standardzugriff festlegen',
    editorDescription:
      'Legen Sie die grundlegende Datensatzsichtbarkeit fest, bevor Freigaben und Einschränkungen angewendet werden.',
    resourceHeading: 'Ressource',
    resourceDescription:
      'Wählen Sie die Sammlung, für die der grundlegende Zugriff festgelegt wird.',
    accessHeading: 'Zugriff nach Aktion',
    accessDescription:
      'Legen Sie den Datensatzbereich für jede Aktion unabhängig fest.',
    deleteRule: 'Regel löschen',
    save: 'Standardzugriff speichern',
    confirmDeleteTitle: 'Standardeinstellungen für „{{resource}}“ entfernen?',
    confirmDeleteBody:
      'Standardzugriffsregel für „{{resource}}“ löschen. Verbleibende Berechtigungssätze und Regeln bestimmen den Zugriff.',
  },
};
