export default {
  access: {
    guide: {
      title: 'So funktionieren Rollen und Berechtigungen',
      roles:
        'Konfigurieren Sie hier Vorgänge nach Abteilung, Position oder Zuständigkeit. Mitglieder erhalten diese Berechtigungen zusätzlich zu ihren direkten Zuweisungen.',
      setsTitle: 'Berechtigungssätze',
      sets: 'Die gespeicherten Berechtigungen hinter Rollen zur Prüfung und Wiederverwendung. Verwenden Sie für alltägliche Änderungen die Rollenseite.',
      defaultTitle: 'Standardmäßiger Datensatzzugriff',
      default:
        'Bietet den grundlegenden Bereich, wenn ein Vorgang keinen bestimmten Bereich hat. Gewährt nicht den Vorgang selbst.',
      sharingTitle: 'Freigaberegeln',
      sharing:
        'Erweitert die verfügbaren Datensätze für Personen, die bereits die Vorgangsberechtigung haben.',
      restrictionTitle: 'Einschränkungsregeln',
      restriction:
        'Begrenzt weiter, welche autorisierten Datensätze zugänglich sind.',
      inspectTitle: 'Berechtigungsprüfung',
      inspect:
        'Prüfen Sie wirksame Berechtigungen und ihre Quellen, wenn eine Seite oder ein Datensatz nicht verfügbar ist.',
    },
    permissionColumn: 'Berechtigung',
    personalGranted: 'Persönlich gewährt',
    personalTarget: 'Ziel der persönlichen Gewährung auswählen',
    rowSaving: 'Wird gespeichert…',
    rowSaved: 'Gespeichert',
    rowFailed:
      'Änderung nicht gespeichert. Die aktuelle Konfiguration wurde wiederhergestellt; prüfen Sie diese und versuchen Sie es erneut.',
    rowUncertain:
      'Das Speicherergebnis konnte nicht bestätigt werden. Aktualisieren Sie die Ansicht vor weiteren Änderungen.',
    inlinePermissionsHelp:
      'Änderungen werden sofort gespeichert. Persönliche Gewährungen ergänzen den geerbten Zugriff; ihr Ausschalten entfernt keine geerbten Berechtigungen.',
    configuredOnly: 'Nur konfigurierte Berechtigungen',

    personalGrantEnabled: 'Diesen Vorgang persönlich gewähren',
    systemScope: 'Systemregeln verwenden',
    systemScopeHelp:
      'Nicht festgelegte Bereiche folgen Standardzugriff und Freigaberegeln. Dies bedeutet nicht alle Datensätze.',
    grantSources: 'Gewährt durch',
    scopeForAction: '{{action}}: Bereich {{scope}}',
    personalGrantAction: '„{{action}}“ persönlich gewähren',
    personalGrantScope:
      '„{{action}}“ persönlich gewähren. Datenbereich: {{scope}}',
    personalGrantOff:
      'Keine persönliche Gewährung; geerbte Berechtigungen bleiben bestehen.',
    personalGrantPending:
      'Nicht gespeicherte Änderung. Wird nach dem Speichern wirksam.',
    editPersonalCard: 'Persönliche Berechtigungen für {{name}} bearbeiten',
    userPermissions: 'Berechtigungen',
    inheritedPermissions: 'Geerbte Berechtigungen',
    inheritedUnavailable:
      'Sie haben keinen Zugriff auf geerbte Berechtigungen.',
    personalOnly: 'Nur persönliche Ausnahmen',
    notGranted: 'Nicht gewährt',
    notSet: 'Nicht festgelegt',
    adjustPersonalPermissions: 'Persönliche Berechtigungen anpassen',
    unifiedPermissionsHelp:
      'Konfigurierte Berechtigungen nach Quelle. Persönliche Änderungen entfernen keine geerbten Gewährungen; der tatsächliche Zugriff folgt auch geltenden Einschränkungen.',
    sourceGroups: {
      baseline: 'Grundzugriff für alle',
      duties: 'Funktionsrollen',
      organization: 'Organisationsbeziehungen',
      direct: 'Persönliche Gewährungen',
      system: 'Systemadministrator',
    },
    noPersonalExceptions: 'Keine persönlichen Ausnahmen',
    membershipChanged:
      'Die Mitgliedschaft wurde in einem anderen Vorgang geändert. Der aktuelle Status wurde neu geladen; bestätigen Sie die verbleibenden Änderungen.',
    username: 'Benutzername',
    personalExceptions: 'Persönliche Ausnahmen',
    adjustExceptions: 'Persönliche Ausnahmen anpassen',
    exceptionsHelp:
      'Nur dieser Person direkt gewährte Berechtigungen werden geändert. Rollen- oder Organisationsberechtigungen können nach dem Entfernen weiterhin gelten.',
    editDenied:
      'Sie können diese Konfiguration nicht bearbeiten. Die schreibgeschützte Ansicht wird angezeigt.',
    permissionSources: 'Berechtigungsquellen',
    frozenConfiguration:
      'Dieses Konto ist gesperrt. Die Autorisierungskonfiguration bleibt erhalten und gilt nach den bei Aktivierung wirksamen Regeln.',
    frozenRoles:
      'Dieses Konto ist gesperrt. Aktivieren Sie es, bevor Sie Funktionsrollen hinzufügen; bestehende Rollen können entfernt werden.',
    roleInactive: 'Inaktiv',
    roleAdditionBlocked:
      'Das Konto ist gesperrt oder eine ausgewählte Rolle ist inaktiv oder nicht verfügbar. Brechen Sie diese Ergänzungen ab oder laden Sie den Status vor der Bestätigung neu.',
    membershipUnverified:
      'Das Ergebnis ist ungeprüft. Laden Sie Mitgliedschaften neu, bevor Sie fortfahren; wiederholen Sie die Einreichung nicht.',
    dutyRolesHelp:
      'Hier erscheinen dieser Person direkt zugewiesene Funktionsrollen.',
    noPrimaryDepartment: 'Keine aktuelle Hauptabteilung',
    primaryDepartment: 'Hauptabteilung',
    departmentPath: 'Abteilungspfad',
    organizationHelp:
      'Organisationsmitgliedschaften werden von Organisationsadministratoren gepflegt.',
    roleFilterInvalid:
      'Diese Funktionsrolle ist nicht verfügbar. Der Rollenfilter wurde zurückgesetzt.',
    roleFilterTooLarge:
      'Diese Rolle hat mehr als 500 Mitglieder. Filtern nach dieser Rolle wird nicht unterstützt; setzen Sie den Rollenfilter zurück.',
    organizationState: {
      'inactive-chain':
        'Die Hauptabteilung oder eine übergeordnete Abteilung ist inaktiv. Diese Organisationsbeziehung gilt derzeit nicht.',
      'invalid-chain':
        'Diese Organisationsbeziehung ist ungültig. Wenden Sie sich an einen Organisationsadministrator.',
    },

    scopeNumber: 'Datensatzbereich {{number}}',
    scopeLabels: {
      paymentRequests: 'Zahlungsanträge',
      reimbursementRequests: 'Kostenerstattungsanträge',
      leaveRequests: 'Urlaubsanträge',
      contractRequests: 'Vertragsgenehmigungsanträge',
      certificateRequests: 'Bescheinigungsanträge',
      sealRequests: 'Siegelanträge',
      printTemplates: 'Vorlagen',
      printTemplateRevisions: 'Vorlagenversionen',
      knowledgeDocuments: 'Dokumente',
      knowledgeVersions: 'Dokumentversionen',
      knowledgeFolders: 'Ordner',
      sealLedger: 'Siegelregistrierungen',
      sealReceipts: 'Siegelrückgabebelege',
      contracts: 'Verträge',
      contractVersions: 'Vertragsversionen',
      contractChanges: 'Vertragsänderungen',
      contractPayments: 'Vertragszahlungen',
    },
    sourceNumber: 'Quelle {{number}}',
    more: 'Mehr',
    userRoles: 'Rollen',
    permissionOverview: 'Berechtigungsübersicht',
    noRoles: 'Keine',
    organization: 'Organisation',
    moreFor: 'Mehr · {{name}}',
    addModules: 'Module hinzufügen',
    userDetails: 'Benutzerdetails',
    information: 'Informationen',
    email: 'E-Mail',
    accountStatus: 'Kontostatus',
    enabled: 'Aktiv',
    disabled: 'Gesperrt',
    organizationReadOnly:
      'Abteilungen, Positionen und Führungsbeziehungen werden in der Organisation gepflegt.',
    advancedExceptions: 'Erweitert: Ausnahmegewährungen',
    partialSave:
      '{{count}} Änderungen gespeichert. Verbleibende Änderungen bleiben erhalten; versuchen Sie es erneut, um fortzufahren.',
    addedRoles: 'Hinzufügen: {{names}}',
    removedRoles: 'Entfernen: {{names}}',
    compareRole: 'Rolle vergleichen',
    copyRole: 'Aus Vergleich kopieren',
    copyHelp:
      'Gewöhnliche Gewährungen in diesen Entwurf kopieren. Besondere Richtlinien bleiben unverändert. Prüfen Sie alle Änderungen vor dem Speichern.',
    advanced: 'Erweitert',
    addRoles: 'Rollen zum Vergleich hinzufügen',

    directAudience: 'Individuelle Zuweisungen',
    dutyAudience: 'Funktionsrollenmitglieder',

    targetSet: 'Zielberechtigungssatz',
    chooseTarget: 'Wählen Sie einen Berechtigungssatz für diesen Vorgang',
    targetRequired:
      'Wählen Sie vor dem Speichern ein Ziel für diesen neuen Vorgang.',
    roleGrantTitle: '{{module}} ({{role}} · unabhängige Gewährung {{number}})',

    assignmentSearch: 'Berechtigungen, Aktionen oder Datensatzbereiche suchen',
    assignmentOnlySelected: 'Nur ausgewählte',
    assignmentCount:
      '{{visible}} von {{total}} angezeigt · {{selected}} über alle Module ausgewählt',
    assignmentChoicesHelp:
      'Filtern Sie nach Modul und vergleichen Sie dann Aktionen und Datensatzbereiche. Gleichnamige Sätze bleiben unabhängig. Filter behalten Auswahlen in anderen Modulen bei.',
    assignmentBusiness: 'Geschäftsvorgänge',
    assignmentOther: 'Verwaltung / Sonstiges',
    pageAccess: 'Seitenzugriff',
    configuredGrant: 'Gewährt',
    dutyMembershipTitle:
      'Funktionsrolle „{{role}}“ für „{{name}}“: {{action}}?',
    exceptionSummary: 'Ausnahmegewährungen: {{names}}',
    noExceptions: 'Keine',
    baseOnlyDepartment:
      'Abteilungszugriff umfasst Mitglieder untergeordneter Abteilungen. Bevorzugen Sie Funktionsrollen für Fachvorgänge.',

    adminMembersHelp:
      'Verwalten Sie Administratoren in den Benutzerkonten. Behalten Sie mindestens einen aktiven Administrator bei.',
    openUsers: 'Benutzerkonten anzeigen',
    ruleLinks: 'Zugriffsregeln',
    rulesHelp:
      'Standardzugriff sowie Freigabe- und Einschränkungsregeln beeinflussen weiterhin den wirksamen Zugriff.',
    defaultRules: 'Standardzugriff',
    sharingRules: 'Freigaberegeln',
    restrictionRules: 'Einschränkungsregeln',

    modules: 'Nach Modul durchsuchen',
    onlyConfigured: 'Nur konfigurierte',
    baselineValue: 'Alle haben Grundzugriff: {{value}}',
    advancedEdit: 'Erweiterter Editor',
    changedCount: '{{count}} Änderungen',
    roleImpact: 'Betroffene Mitglieder von „{{name}}“: {{count}}',
    sharedObjects: 'Berechtigungssätze sind außerdem zugewiesen an: {{names}}',
    changeShared: 'Alle diese Subjekte ändern',
    splitDefault:
      'Standardmäßig werden gemeinsame Sätze in unabhängige Kopien für diese Rolle aufgeteilt.',
    userPermissionsTitle: 'Berechtigungen für {{name}}',
    unionHelp:
      'Datensatzbereiche aus mehreren Quellen werden zusammengeführt; Zugriffsregeln gelten weiterhin.',
    assignedRoles: 'Zugewiesene Rollen',
    preferRoles:
      'Bevorzugen Sie Funktionsrollen; direkte Gewährungen sind für Ausnahmen vorgesehen.',
    exceptionGrant: 'Ausnahmegewährungen verwalten',
    configurationDenied:
      'Zum Anzeigen der Konfigurationsdetails ist Lesezugriff auf Berechtigungssätze erforderlich. Wenden Sie sich an einen Administrator.',
    checkOperation: 'Vorgang prüfen',
    notConfigured: 'Nicht konfiguriert',
    applicable: 'Gilt für',
    modulesCount: 'Konfigurierte Module',
    personalAudience: 'Direkte Zuweisung · {{count}} Personen',
    maintainedAudience: 'Verwaltete Mitglieder · {{count}} Personen',
    automaticAudience: 'Aus Organisationsbeziehungen berechnet',
    departmentAudience:
      'Abteilungsmitglieder und Mitglieder von Unterabteilungen',
    positionAudience: 'Personen mit dieser Position',
    allAuthenticated: 'Alle angemeldeten Personen',
    organizationMembersHelp:
      'Mitglieder werden in der Organisation gepflegt und aus aktiven Beziehungen berechnet.',
    openOrganization: 'Organisation anzeigen',
    adjustDutyRoles: 'Funktionsrollen anpassen',
    membersUnknown: 'Mitgliederzahl nicht verfügbar',

    labelValue: '{{label}}: {{value}}',
    clearModuleFilters: 'Filter zurücksetzen',
    noModuleMatches: 'Keine passenden Berechtigungen in diesem Modul',

    businessModules: 'Geschäftsmodule',
    allModules: 'Alle',
    otherModules: 'Sonstige',
    noModulePermissions: 'Keine Berechtigungen in diesem Modul konfiguriert',
    moduleCount:
      '{{module}}: {{configured}} konfiguriert / {{total}} Ressourcen',

    actionsFor: 'Aktionen für „{{name}}“',
    configuredScopes: 'Konfigurierte Bereiche',

    lastAdmin:
      'Mindestens ein aktiver Systemadministrator muss verbleiben. Weisen Sie zuerst einen Ersatz zu.',
    subjectNotAllowed:
      'Dieser Zugriff kann diesem Subjekttyp nicht zugewiesen werden. Wählen Sie einen anderen Geschäftszugriff.',

    title: 'Zugriffsverwaltung',
    description:
      'Geschäftsvorgänge und Datensatzbereiche nach Rolle konfigurieren.',
    roles: 'Rollenzugriff',
    baseline: 'Grundzugriff für angemeldete Benutzer',
    baselineHelp:
      'Grundzugriff gilt für angemeldete Konten. Funktionsmitgliedschaft beeinflusst auch Genehmigungskandidaten.',
    name: 'Name',
    type: 'Typ',
    all: 'Alle Arten',
    dutyRoles: 'Funktionsrollen',
    positions: 'Positionen',
    departments: 'Abteilungen',
    automatic: 'Automatischer Zugriff',
    members: 'Mitglieder',
    permissions: 'Geschäftsberechtigungen',
    missingMembers: 'Keine Mitglieder zugewiesen',
    memberDenied: 'Mitgliederzugriff nicht verfügbar',
    membersFailed: 'Mitglieder konnten nicht geladen werden',
    byMembership: 'Durch Mitgliedschaft angewendet',
    none: 'Kein Geschäftszugriff zugewiesen',
    noneHelp:
      'Weisen Sie nach Bestätigung der Zuständigkeiten vorhandenen Geschäftszugriff zu. Geerbter Zugriff bleibt wirksam.',
    searchRoles: 'Rollen, Positionen oder Abteilungen suchen…',
    clear: 'Filter zurücksetzen',
    noResults: 'Keine passenden Ergebnisse',
    clearHelp: 'Ändern Sie Ihre Suche oder setzen Sie die Filter zurück.',
    loading: 'Wird geladen',
    refresh: 'Aktualisieren',
    denied:
      'Sie haben keinen Zugriff auf diesen Vorgang. Wenden Sie sich an einen Zugriffsadministrator.',
    missing:
      'Dieser Eintrag ist nicht mehr vorhanden. Kehren Sie zur Liste zurück.',
    conflict:
      'Die Zugriffskonfiguration wurde geändert. Laden und prüfen Sie sie vor dem Speichern.',
    failed:
      'Dieser Vorgang konnte nicht abgeschlossen werden. Versuchen Sie es erneut oder wenden Sie sich an einen Administrator.',
    reload: 'Neu laden',
    retry: 'Erneut versuchen',
    roleHelp:
      'Prüfen Sie Mitglieder, Geschäftsvorgänge und Datensatzbereiche dieser Zuständigkeit.',
    rules:
      'Zusätzliche Zugriffsregeln können gelten. Prüfen Sie den Zugriff der Person und den tatsächlichen Geschäftsvorgang.',
    actions: 'Aktionen',
    addMember: 'Mitglied hinzufügen',
    remove: 'Entfernen',
    memberImpact:
      'Funktionsmitgliedschaft beeinflusst geerbten Zugriff und Genehmigungskandidaten. Andere Zugriffsquellen bleiben nach dem Entfernen bestehen.',
    assign: 'Geschäftszugriff zuweisen',
    usedBy:
      'Dieser Zugriff ist {{count}} Subjekten zugewiesen. Eine Bearbeitung betrifft alle.',
    edit: 'Bearbeiten',
    special: 'Vorhandene benutzerdefinierte Konfiguration',
    specialReadOnly:
      'Die benutzerdefinierte Konfiguration ist schreibgeschützt und bleibt beim Speichern erhalten.',
    noScope: 'Kein Datensatzbereich konfiguriert',
    systemAdmin: 'Systemadministrator',
    unrestricted: 'Systemadministrator: uneingeschränkter Zugriff',
    removeTitle: 'Mitglied „{{name}}“ entfernen?',
    cancel: 'Abbrechen',
    removed: '„{{name}}“ entfernt',
    added: '„{{name}}“ hinzugefügt',
    addMemberTitle: 'Mitglied für {{name}} hinzufügen',
    add: 'Hinzufügen',
    person: 'Person',
    selectPerson:
      'Wählen Sie die Person, die diese Zuständigkeit übernehmen soll.',
    userDenied:
      'Sie können das Benutzerverzeichnis nicht anzeigen. Wenden Sie sich an einen Administrator.',
    direct: 'Direkt zugewiesen',
    inherited: 'Geerbter Zugriff',
    personUnknown: 'Person (Name nicht verfügbar)',
    back: 'Zur Liste zurückkehren',
    pageActionHelp:
      'Seitenzugriff steuert Menü und Einstieg. Gewähren Sie jeden Geschäftsvorgang und seine Datensatzbereiche separat; allein das Öffnen einer Seite gewährt keine Aktionen.',
    emptyDirectory: 'Keine Subjekte verfügbar',
    emptyHelp: 'In diesem Verzeichnis sind derzeit keine Datensätze verfügbar.',
    deniedAction: 'Nicht autorisiert',
    sensitive: 'Sensibler Zugriff',
    impactUnavailable:
      'Die vollständige Auswirkung kann nicht geprüft werden. Prüfen Sie die betroffenen Subjekte und ihre Sichtbarkeit, bevor Sie diesen gemeinsamen Zugriff ändern.',
    conditional: 'Bedingter Zugriff',
    permitted: 'Unbedingter Zugriff',
    assignTitle: 'Zugriff für „{{name}}“ ändern',
    assignHelp:
      'Wählen Sie den direkten Geschäftszugriff dieses Subjekts. Andere Quellen bleiben erhalten.',
    noAssignable: 'Kein zuweisbarer Geschäftszugriff',
    preserveInherited:
      'Hier ändern sich nur direkte Zuweisungen. Von Abteilungen, Positionen, Funktionen und dem Grundzugriff geerbter Zugriff bleibt bestehen.',
    save: 'Speichern',
    saved: 'Zugriff für „{{name}}“ gespeichert',
    confirmTitle: 'Zugriffsänderungen für „{{name}}“ speichern?',
    assignmentImpact:
      'Prüfen Sie hinzugefügten und entfernten Zugriff. Andere Quellen bleiben bestehen; ein Systemadministrator muss aktiv bleiben.',
    discardTitle: 'Nicht gespeicherte Änderungen verwerfen?',
    discard: 'Verwerfen',
    discardHelp:
      'Ihre Änderungen wurden nicht gespeichert. Beim Verwerfen werden sie entfernt.',
    editTitle: 'Geschäftszugriff für „{{name}}“ bearbeiten',
    editorHelp:
      'Wählen Sie Vorgänge und Bereiche einzeln. Sensible Vorgänge sind getrennt; prüfen Sie die Auswirkungen vor dem Speichern.',
    impact: 'Betroffene Subjekte',
    searchActions: 'Geschäftsfunktionen oder Vorgänge suchen…',
    multipleScopes:
      'Konfigurieren Sie für diesen Vorgang jeden der folgenden Bereiche.',
    levelFor: 'Datensatzbereich für „{{name}}“',
    protected: 'Dieser Zugriff ist geschützt',
    protectedHelp:
      'Der Systemschutz bleibt bestehen. Verwalten Sie Administratormitgliedschaften über Benutzerkonten.',
    sharedHelp:
      'Diese Änderung betrifft alle oben aufgeführten Subjekte. Prüfen Sie Vorgänge und Bereiche.',
    system: 'Systemzuständigkeiten',
  },
};
