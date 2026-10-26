export default {
  onboarding: {
    authz: {
      resource: 'Eintritt',
      readable: 'Eintrittsbeteiligte',
      view: 'Eintritt anzeigen',
      create: 'Eintritt anlegen',
      cancel: 'Eintritt abbrechen',
      claim: 'Aufgabe übernehmen',
      reassignMentor: 'Abteilungsleitung neu zuweisen',
      transfer: 'Versetzen',
      release: 'Aufgabe freigeben',
      complete: 'Aufgabe abschließen',
      forceComplete: 'Abschluss erzwingen',
      viewSalary: 'Eintrittsgehalt anzeigen',
      viewBank: 'Bankverbindung beim Eintritt anzeigen',
    },
    noPeople: 'Keine Mitarbeiter entsprechen Ihrer Suche',
    loadLatest: 'Neueste Version laden',
    actionChanged:
      'Diese Aktion ist nicht mehr verfügbar. Ihre Eingaben bleiben erhalten; schließen Sie dieses Formular und prüfen Sie den aktualisierten Datensatz.',

    confirmAction: 'Bestätigen',
    noMatches: 'Keine Eintrittsdatensätze entsprechen Ihren Filtern',

    directoryCap:
      'Die ersten 100 Treffer werden angezeigt. Präzisieren Sie Ihre Suche.',
    organizationLabel: '{{department}} / {{position}} / {{grade}}',
    historicalPersonUnavailable: 'Historische Person nicht verfügbar',
    allocationLabel:
      '{{department}} / {{position}} / {{grade}} / {{year}} · {{count}} verbleibend',
    namedAction: '{{action}} für „{{name}}“?',
    completedAction: '{{action}} für „{{name}}“ abgeschlossen',
    createAction: 'Erstellen',
    created: 'Eintritt für „{{name}}“ erstellt',

    businessErrors: {
      ONBOARDING_SOURCE_INVALID:
        'Die Eintrittsquelle oder Mitarbeiterdaten sind nicht mehr gültig. Aktualisieren und prüfen Sie Quelle, Identität und erforderliche Angaben.',
      ONBOARDING_IDEMPOTENCY_CONFLICT:
        'Dieser Vorgang hat bereits andere Inhalte verwendet. Aktualisieren Sie zur Ergebnisprüfung, bevor Sie fortfahren.',
    },

    clear: 'Filter zurücksetzen',
    timeline: {
      unknownActor: 'Historischer Bearbeiter nicht verfügbar',
      parentCompleted: 'Eintritt abgeschlossen',
      accountEnabled: 'Mitarbeiterkonto aktiviert',
      title: 'Zeitleiste',
      empty: 'Keine erfassten Ereignisse',
      historyNotice:
        'Es werden nur erfasste Tatsachen angezeigt. Bei älteren Ereignissen können Details fehlen. Die Annahme einer Benachrichtigung beweist keine Zustellung.',
      system: 'System',
      from: 'Vorheriger Bearbeiter',
      to: 'Neuer Bearbeiter',
      create: 'Eintritt erstellt',
      cancel:
        'Eintritt abgebrochen; Rückabwicklungsaufgaben für abgeschlossene Aufgaben erstellt',
      claim: 'Aufgabe übernommen',
      release: 'Aufgabe freigegeben',
      transfer: 'Aufgabe übertragen',
      reassignMentor: 'Abteilungsleitung neu zugewiesen',
      complete: 'Aufgabe abgeschlossen',
      forceComplete: 'Aufgabenabschluss erzwungen',
      queued: 'Überfälligkeitserinnerung eingereiht',
      sent: 'Überfälligkeitsbenachrichtigung angenommen',
    },
    reassignMentorNotice:
      'Weisen Sie diese ausstehende Aufgabe der aktuellen aktiven Abteilungsleitung zu. Frist und gespeicherte Daten bleiben unverändert; dies schließt die Aufgabe nicht ab.',
    transferTarget: 'Neuer Bearbeiter in derselben Bearbeitungsgruppe',
    attachments: 'Anhänge',
    fileLimit: 'PDF, PNG, JPEG oder TXT; bis zu 10 Dateien mit jeweils 20 MB.',
    upload: 'Anhang hochladen',
    uploading: 'Wird hochgeladen…',
    removeFile: 'Datei {{number}} entfernen',
    fileMissing: 'Anhang nicht verfügbar',
    assetUnits: 'Tatsächliche Anlagen',
    assetUnitsHelp:
      'Geben Sie für jede tatsächliche Anlage Code und Seriennummer ein. Die Rückabwicklung erfordert alle ursprünglich ausgegebenen Gegenstände. Eine leere Liste erfasst keine Anlagenausgabe.',
    assetCode: 'Anlagencode',
    assetSerial: 'Seriennummer',
    removeAsset: 'Entfernen',
    addAsset: 'Anlage hinzufügen',

    employeeSearch: 'Nach Name oder Mitarbeitercode suchen',
    mentorDenied:
      'Zur Mitarbeiterauswahl ist die Verzeichnisberechtigung erforderlich',
    loading: 'Wird eingereicht…',
    requiredField: 'Geben Sie {{field}} ein.',
    chooseSource:
      'Wählen Sie eine Personalbeschaffungszuteilung mit verbleibender Kapazität.',
    invalidEmail: 'Geben Sie eine gültige Konto-E-Mail-Adresse ein.',
    invalidPassword:
      'Verwenden Sie mindestens 8 Zeichen für das Anfangspasswort.',
    invalidSalary:
      'Geben Sie ein Grundgehalt mit genau zwei Nachkommastellen ein.',
    title: 'Eintritt',
    description:
      'Mitarbeitereintritt erstellen und parallele Aufgaben bearbeiten',
    employee: 'Mitarbeiter',
    creator: 'Erstellt von',
    status: 'Status',
    refresh: 'Aktualisieren',
    new: 'Neuer Eintritt',
    detail: 'Eintrittsdetails',
    empty: 'Keine Eintrittsdatensätze',
    forced: 'Erzwungener Abschluss',
    dueDate: 'Fälligkeitsdatum',
    assignee: 'Bearbeitet von',
    bank: 'Gehaltskonto und Sozialversicherung',
    salary: 'Gehalt',
    privateEmpty: {
      bank: 'Gehaltskonto- und Sozialversicherungsdaten wurden nicht erfasst. Prüfen Sie den Fortschritt der Finanzaufgabe.',
      salary:
        'Gehaltsdetails wurden nicht erfasst. Bitten Sie die Personalabteilung um Prüfung.',
    },
    save: 'Einreichen',
    saved: 'Gespeichert',
    unknown:
      'Das Ergebnis ist unbekannt. Wiederholen Sie denselben Befehl zur Bestätigung; erstellen Sie keine neue Anfrage.',
    retryExact: 'Denselben Befehl wiederholen',
    discard: 'Änderungen verwerfen',
    discardDescription: 'Ihre nicht gespeicherten Änderungen gehen verloren.',
    stay: 'Weiter bearbeiten',
    unavailable: 'Vorgang nicht verfügbar',
    invalid:
      'Prüfen Sie Pflichtfelder und Gehaltsformat (zwei Nachkommastellen).',
    reason: 'Begründung',
    forceNotice:
      'Ein erzwungener Abschluss erfasst die Begründung und kann das Konto aktivieren. Er belegt keine Geräteausgabe.',
    cancelNotice:
      'Der Abbruch gibt tatsächliche Kapazität frei und lässt abgeschlossene Arbeit zur Rückabwicklung bestehen. Er markiert keine Gegenstände als zurückgegeben.',
    createNotice:
      'Dies erstellt einen tatsächlichen Mitarbeiter mit deaktiviertem Konto und verbraucht eine Personalbeschaffungszuteilung. Abteilung, Position und Gehaltsgruppe sind durch die Zuteilung festgelegt.',
    remaining: '{{count}} verbleibend',
    noSources:
      'Keine lesbare Personalbeschaffungszuteilung mit verbleibender Kapazität',
    userPickerDenied:
      'Zur Auswahl einer Führungskraft ist die Benutzersuchberechtigung erforderlich.',
    states: {
      all: 'Alle Status',
      handling: 'In Bearbeitung',
      completed: 'Abgeschlossen',
      cancelled: 'Abgebrochen',
      open: 'Öffnen',
      claimed: 'Übernommen',
    },
    actions: {
      claim: 'Übernehmen',
      reassignMentor: 'Mentor neu zuweisen',
      transfer: 'Versetzen',
      release: 'Freigeben',
      complete: 'Abschließen',
      forceComplete: 'Abschluss erzwingen',
      cancel: 'Eintritt abbrechen',
    },
    kinds: {
      it: 'Konto und Geräte',
      administration: 'Arbeitsplatz und Ausweis',
      finance: 'Zahlungskonto und Sozialversicherung',
      mentor: 'Mentor und 30-Tage-Plan',
      recovery: 'Rückabwicklungsaufgabe',
    },
    fields: {
      name: 'Mitarbeitername',
      email: 'Konto-E-Mail',
      password: 'Anfangspasswort',
      code: 'Mitarbeitercode',
      hireDate: 'Eintrittsdatum',
      careerStartDate: 'Berufseinstiegsdatum',
      probationEndDate: 'Probezeitende',
      baseSalary: 'Grundgehalt',
      reason: 'Erstellungsgrund',
      requisitionId: 'Personalbeschaffungszuteilung',
      managerId: 'Vorgesetzter',
      accountId: 'Erstelltes Konto',
      deviceReference: 'Gerätereferenz',
      workstationRequirement: 'Arbeitsplatzanforderungen',
      workstation: 'Arbeitsplatz',
      badgeReference: 'Zugangsausweisreferenz',
      bankName: 'Bank',
      bankAccount: 'Bankkonto',
      bankAccountName: 'Kontoinhaber',
      socialInsuranceReference: 'Sozialversicherungsreferenz',
      mentorEmployeeId: 'Mentor',
      plan: '30-Tage-Einarbeitungsplan',
      assetReceiptId: 'Anlagenempfangsnachweis',
      returnReceipt: 'Rückabwicklungsnachweis',
      compensationId: 'Vergütungsreferenz',
      gradeId: 'Gehaltsgruppe',
      effectiveFrom: 'Gültig ab',
    },
  },
};
