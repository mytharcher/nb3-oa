export default {
  headcounts: {
    technicalDetails: 'Technische Details',
    copyId: 'Interne ID kopieren',
    copyFailed: 'Die interne ID konnte nicht kopiert werden.',

    name: '{{department}} / {{position}} / {{year}}',
    createSubmit: 'Erstellen',
    idCopied: 'Konto-ID kopiert',
    title: 'Personalstellenverzeichnis',
    description:
      'Jährliche Kapazität und tatsächliche Mitarbeiterbelegung. Initialisieren Sie vor der Personalbeschaffung ein Konto.',
    account: 'Jährliche Personalstellenkapazität',
    state: 'Initialisierungsstatus',
    create: 'Neue jährliche Personalstellenkapazität',
    adjust: 'Grenze anpassen',
    alreadyInitialized:
      'Dieses Konto ist bereits initialisiert. Seine tatsächliche Belegung kann hier nicht erneut gezählt werden.',
    reconcile: 'Prüfen und initialisieren',
    confirmInitialize: 'Initialisierung bestätigen',
    initialized: 'Initialisiert',
    uninitialized: 'Nicht initialisiert',
    view: 'Personalstellen anzeigen',
    refresh: 'Aktualisieren',
    cancel: 'Abbrechen',
    save: 'Speichern',
    clearFilters: 'Filter zurücksetzen',
    allPositions: 'Alle Positionen',
    rowActions: 'Aktionen für „{{name}}“',
    empty: 'Keine jährliche Personalstellenkapazität',
    noResults: 'Keine passende jährliche Personalstellenkapazität',
    filterHelp: 'Ändern Sie die Filter.',
    emptyManage:
      'Erstellen Sie ein Konto und prüfen Sie seine Mitarbeiterliste.',
    emptyRead:
      'Bitten Sie die Personalabteilung, die jährliche Personalstellenkapazität einzutragen.',
    journal: 'Quellenjournal',
    noJournal: 'Noch keine Quellereignisse',
    noJournalPermission:
      'Sie sind nicht berechtigt, das Quellenjournal zu lesen.',
    uninitializedHelp:
      'Dieses Konto ist nicht initialisiert und kann nicht für die Personalbeschaffung verwendet werden. Prüfen Sie die vollständige Mitarbeiterliste.',
    rosterHelp:
      'Prüfen Sie die vollständige Mitarbeiterliste einschließlich Probezeit-, festangestellter und austretender Mitarbeiter.',
    rosterEmpty:
      'Aktuell belegen keine passenden Mitarbeiter dieses Konto. Bestätigen Sie, dass die tatsächliche Liste leer ist.',
    rosterCount: '{{count}} Mitarbeiter',
    confirmRoster: 'Ich habe die vollständige Mitarbeiterliste geprüft',
    created:
      '„{{name}}“ erstellt. Prüfen und initialisieren Sie es als Nächstes.',
    adjusted: 'Grenze für „{{name}}“ aktualisiert.',
    reconciled: '„{{name}}“ für die Personalbeschaffung initialisiert.',
    invalidYear: 'Geben Sie ein ganzzahliges Jahr von 1900 bis 9999 ein.',
    invalidLimit: 'Geben Sie eine ganze Zahl von 0 bis 1.000.000 ein.',
    reasonRequired: 'Geben Sie eine Begründung mit 1 bis 5.000 Zeichen ein.',
    selectRequired:
      'Wählen Sie eine aktuell autorisierte Abteilung und Position.',
    rosterConfirmationRequired:
      'Bestätigen Sie, dass Sie die vollständige Mitarbeiterliste geprüft haben.',
    noAccess:
      'Sie sind nicht berechtigt, diese Personalstellenkapazität zu lesen.',
    missing:
      'Dieses Personalstellenkonto ist nicht vorhanden oder nicht zugänglich.',
    failed:
      'Die Anfrage konnte nicht abgeschlossen werden. Versuchen Sie es erneut.',
    loadLatest: 'Neueste Daten laden',
    unknownOutcome:
      'Das Ergebnis ist nicht bestätigt. Behalten Sie diesen Befehl bei und versuchen Sie es erneut.',
    retryCommand: 'Diesen Vorgang wiederholen',
    reduceTitle: 'Personalstellengrenze für „{{account}}“ verringern?',
    reduceDescription:
      'Die Grenze ändert sich von {{previous}} auf {{next}}. Bestehende Belegungen und Reservierungen müssen weiter abgedeckt sein.',
    reduceConfirm: 'Verringerung bestätigen',
    minimumLimit:
      'Aktuelle Belegungen und Reservierungen summieren sich auf {{count}}. Die neue Grenze darf nicht niedriger sein.',
    discard: 'Nicht gespeicherte Änderungen verwerfen?',
    discardDescription:
      'Beim Schließen werden diese nicht gespeicherten Änderungen verworfen.',
    discardConfirm: 'Änderungen verwerfen',
    noTargets:
      'Keine autorisierten Abteilungs- und Positionsziele. Bitten Sie einen Administrator, die Personalstellenverwaltungsberechtigungen zu prüfen.',
    recruitmentSource: 'Personalbeschaffungsantrag anzeigen',
    transferSource: 'Versetzungsantrag anzeigen',
    fields: {
      department: 'Abteilung',
      position: 'Position',
      year: 'Personalstellenjahr',
      limit: 'Autorisierte Grenze',
      used: 'Mitarbeiterbelegung',
      pending: 'Ausstehende Reservierungen',
      allocated: 'Genehmigt, noch nicht eingetreten',
      available: 'Verfügbare Kapazität',
      id: 'Interne ID',
      version: 'Version',
      updatedAt: 'Aktualisiert am',
      reason: 'Begründung',
      replacementPending: 'Ausstehende zukünftige Ersatzstellen',
      replacementAllocated: 'Genehmigte zukünftige Ersatzstellen',
      replacementBlocked: 'Blockierte Ersatzstellen',
    },
    journalActions: {
      create: 'Konto erstellen',
      reconcile: 'Prüfen und initialisieren',
      adjustLimit: 'Grenze anpassen',
      hold: 'Kapazität reservieren',
      reviseHold: 'Reservierung überarbeiten',
      allocate: 'Genehmigte Kapazität zuteilen',
      close: 'Quelle schließen',
      consume: 'Für Eintritt verbrauchen',
      releaseEmployee: 'Mitarbeiterbelegung freigeben',
      invalidateReplacement: 'Ersatz ungültig machen',
      rebindOut: 'Ausgehend neu verknüpfen',
      rebindIn: 'Eingehend neu verknüpfen',
      transferOut: 'Ausgehend versetzen',
      transferIn: 'Eingehend versetzen',
      claimReplacement: 'Ersatz beanspruchen',
      cancelReplacement: 'Ersatz stornieren',
      fulfillReplacement: 'Ersatz erfüllen',
      other: 'Personalstellenänderung',
    },
    journalColumns: {
      time: 'Zeit',
      actor: 'Bearbeiter',
      action: 'Aktion',
      source: 'Geschäftsquelle',
    },
    employeeStatus: {
      probation: 'Probezeit',
      regular: 'Festangestellt',
      leaving: 'Austretend',
    },
    authz: {
      title: 'Personalstellenkapazität',
      view: 'Kapazität anzeigen',
      manage: 'Jährliche Kapazität verwalten',
      viewJournal: 'Quellenjournal anzeigen',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        'Die vollständige Mitarbeiterliste ist nicht lesbar. Bitten Sie einen Administrator, die Leseberechtigungen für Mitarbeiter zu prüfen.',
      HEADCOUNT_ACCESS_DENIED:
        'Sie sind nicht berechtigt, diesen Personalstellenvorgang auszuführen.',
      HEADCOUNT_FIELD_ACCESS_DENIED:
        'Die Felder der Kapazitätsübersicht liegen außerhalb Ihrer Berechtigung.',
      HEADCOUNT_NOT_FOUND: 'Das Personalstellenkonto ist nicht verfügbar.',
      HEADCOUNT_ALREADY_EXISTS:
        'Für diese Abteilung, Position und dieses Jahr besteht bereits ein Konto.',
      HEADCOUNT_NOT_INITIALIZED:
        'Gleichen Sie die vollständige Mitarbeiterliste ab, bevor Sie Kapazität reservieren.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        'Wählen Sie die vollständige tatsächliche Liste der Mitarbeiter in Probezeit, der regulär Beschäftigten und der austretenden Mitarbeiter.',
      HEADCOUNT_ROSTER_DRIFT:
        'Die tatsächliche Mitarbeiterliste wurde geändert. Gleichen Sie die Quelldaten ab, bevor Sie fortfahren.',
      HEADCOUNT_VERSION_CONFLICT:
        'Das Konto wurde geändert. Aktualisieren Sie es vor dem Speichern.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT:
        'Diese Anfragekennung gehört bereits zu einem anderen Vorgang.',
      HEADCOUNT_INSUFFICIENT:
        'Die Jahresgrenze deckt die tatsächlich besetzten und reservierten Personalstellen nicht ab.',
      HEADCOUNT_INVALID_NUMBER:
        'Geben Sie eine ganzzahlige Personenzahl innerhalb der zulässigen Grenzen ein.',
      HEADCOUNT_INVALID_ACCOUNT:
        'Wählen Sie eine tatsächliche Abteilung, Position und ein Jahr.',
      HEADCOUNT_INVALID_IDENTITY:
        'Wählen Sie eine aktive Organisationsabteilung und Position.',
      HEADCOUNT_INVALID_COMMAND:
        'Ein Bearbeiter, eine Anfragekennung und eine Begründung sind erforderlich.',
      HEADCOUNT_INVALID_SOURCE:
        'Ein tatsächlicher Quelltyp und eine Kennung sind erforderlich.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        'Jede Ersatzstelle benötigt einen anderen austretenden Mitarbeiter.',
      HEADCOUNT_INVALID_REPLACEMENT:
        'Die Ersatzquelle muss einer tatsächlichen bevorstehenden oder abgeschlossenen Austrittsbelegung entsprechen.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'Diese Ersatzbelegung fehlt oder wurde bereits beansprucht.',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        'Der wiederhergestellte Quellmitarbeiter blockiert diesen Ersatz.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND:
        'Der Mitarbeiterdatensatz ist nicht verfügbar.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        'Der tatsächliche Mitarbeiter entspricht nicht der zugeteilten Abteilung und Position.',
      HEADCOUNT_ALREADY_OCCUPIED:
        'Dieser Mitarbeiter belegt dieses Jahreskonto bereits.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        'Verknüpfen Sie vor der Nutzung ausdrücklich mit dem aktuellen Unternehmensjahr neu.',
      HEADCOUNT_SOURCE_NOT_FOUND: 'Die Kapazitätsquelle ist nicht verfügbar.',
      HEADCOUNT_SOURCE_EXISTS:
        'Für diese Quelle besteht bereits eine Reservierung.',
      HEADCOUNT_SOURCE_STATE: 'Der Quellstatus erlaubt diesen Vorgang nicht.',
      HEADCOUNT_SOURCE_CLOSED: 'Die Kapazitätsquelle ist bereits geschlossen.',
      HEADCOUNT_SEAT_STATE: 'Die reservierte Stelle ist nicht ausstehend.',
      HEADCOUNT_STATE_CONFLICT: 'Die reservierte Stelle wurde geändert.',
      HEADCOUNT_NO_ALLOCATION:
        'Es ist keine genehmigte verfügbare Stelle mehr vorhanden.',
      HEADCOUNT_NOT_LEFT:
        'Vor der Freigabe besetzter Kapazität muss der tatsächliche Austritt erfolgt sein.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        'Eine tatsächliche nicht freigegebene Mitarbeiterbelegung ist erforderlich.',
      HEADCOUNT_NOT_RESTORED:
        'Vor der Sperrung künftiger Ersatzbelegungen ist eine tatsächliche Wiederherstellung erforderlich.',
      HEADCOUNT_INVALID_REBIND:
        'Bei der jährlichen Neuverknüpfung müssen Abteilung und Position erhalten bleiben und das Jahr muss voranschreiten.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        'Ersatzgutschriften erfordern ausdrückliche Quellen im Zieljahr.',
      HEADCOUNT_INVALID_TRANSFER:
        'Eine gesonderte genehmigte Zielreservierung ist erforderlich.',
      HEADCOUNT_INVALID_PAGE: 'Wählen Sie eine Seitengröße zwischen 1 und 100.',
      HEADCOUNT_GUARD_UNAVAILABLE:
        'Der Transaktionsschutz für die Kapazität ist nicht verfügbar.',
    },
  },
};
