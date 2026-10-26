export default {
  resourceTitle: 'Einschränkungsregeln',
  navigation: { title: 'Einschränkungsregeln' },
  restrictionRules: {
    noResources:
      'Es wurden keine Geschäftsressourcen mit Unterstützung für Datensatzbereiche definiert. Bitten Sie die KI, zuerst Geschäftsberechtigungen und Datensatzbereiche zu definieren, bevor Sie hier Regeln konfigurieren.',
    page: {
      title: 'Einschränkungsregeln',
      description:
        'Einschränkungsregeln begrenzen den Zugriff ausgewählter Benutzer auf Datensätze, ohne selbst Berechtigungen zu gewähren.',
    },
    notice:
      'Einschränkungsregeln begrenzen nur den bestehenden Zugriff. Sie gewähren niemals eigenständig Berechtigungen.',
    search: 'Nach Regelname, Schlüssel oder Ressource suchen',
    create: 'Neue Einschränkungsregel',
    ruleHeader: 'Regel',
    appliesToHeader: 'Gilt für',
    restrictedActionsHeader: 'Eingeschränkte Aktionen',
    allowedScopeHeader: 'Zulässiger Bereich',
    emptyNone:
      'Noch keine Einschränkungsregeln. Erstellen Sie eine Regel, um den Zugriff ausgewählter Benutzer zu begrenzen.',
    emptySearch: 'Keine Einschränkungsregeln entsprechen Ihrer Suche.',
    pagerLabel: 'Einschränkungsregeln',
    editTitle: 'Einschränkungsregel bearbeiten',
    newTitle: 'Neue Einschränkungsregel',
    editorDescription:
      'Den wirksamen Datensatzbereich einer Zielgruppe begrenzen.',
    ruleHeading: 'Grundinformationen',
    ruleDescription:
      'Benennen Sie die Regel und wählen Sie die einzuschränkende Ressource.',
    ruleName: 'Regelname',
    assignmentsHeading: 'Gilt für',
    assignmentsDescription: 'Wählen Sie, für wen diese Einschränkung gilt.',
    reason: 'Beschreibung',
    accessHeading: 'Aktionen und Datensatzbereich',
    accessDescription:
      'Legen Sie den maximalen Datensatzbereich für jede Aktion unabhängig fest.',
    deleteRule: 'Regel löschen',
    save: 'Einschränkungsregel speichern',
    confirmDeleteTitle: 'Regel „{{title}}“ löschen?',
    confirmDeleteBody:
      'Einschränkungsregel „{{title}}“ löschen. Die verbleibenden Berechtigungssätze und Regeln bestimmen den Zugriff.',
  },
};
