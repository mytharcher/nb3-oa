export default {
  businessErrors: {
    DEPARTURE_CHECKLIST_REQUIRED:
      'Vervollständigen Sie die Austrittscheckliste, bevor Sie fortfahren.',
    DEPARTURE_LAST_WORKING_DAY_REQUIRED:
      'Bestätigen Sie den letzten Arbeitstag des Mitarbeiters.',
    DEPARTURE_DATE_PAST:
      'Der letzte Arbeitstag darf in der Unternehmenszeitzone nicht vor heute liegen.',
    DEPARTURE_HANDOVER_INVALID:
      'Wählen Sie einen geeigneten Übergabeempfänger außer dem austretenden Mitarbeiter.',
    DEPARTURE_HANDOVER_INCOMPLETE:
      'Schließen Sie die Übergabepunkte ab, bevor Sie fortfahren.',
    DEPARTURE_ORDINARY_WORK_INCOMPLETE:
      'Schließen Sie die reguläre Übergabe ab, bevor Sie den Austritt abrechnen.',
    DEPARTURE_LOAN_UNCLEARED:
      'Gleichen Sie ausstehende Vorschüsse des Mitarbeiters aus, bevor Sie den Austritt abrechnen.',
    DEPARTURE_RECEIPT_REQUIRED:
      'Geben Sie den Empfangs- oder Freigabenachweis für diesen Übergabepunkt ein.',
    DEPARTURE_SETTLEMENT_NOTE_REQUIRED:
      'Geben Sie die Austrittsabrechnungsnotiz ein.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      'Schließen Sie ausstehende Aufgabenneuzuweisungen ab, bevor Sie fortfahren.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      'Wählen Sie den voraussichtlichen letzten Arbeitstag und den Übergabeempfänger.',
    DEPARTURE_TYPE_INVALID: 'Wählen Sie eine aktivierte Austrittsart.',
    DEPARTURE_ALREADY_ACTIVE:
      'Für diesen Mitarbeiter besteht bereits ein aktiver Austrittsantrag. Öffnen Sie den vorhandenen Antrag.',
    DEPARTURE_CANCELLATION_PENDING:
      'Eine Austrittsstornierung ist ausstehend. Klären Sie sie, bevor Sie fortfahren.',
    DEPARTURE_EXECUTION_BASELINE_CHANGED:
      'Die Mitarbeiter- oder Austrittsdaten wurden geändert. Aktualisieren und prüfen Sie diese vor der Ausführung.',
  },

  authz: {
    cancel: 'Austritt stornieren',
    resource: 'Austritt und Übergabe',
    view: 'Austrittsanträge anzeigen',
    submit: 'Austrittsanträge einreichen',
    delegate: 'Austrittsanträge für Mitarbeiter erstellen',
    work: 'Austrittsübergabe bearbeiten',
    settle: 'Austrittsabrechnung bestätigen',
  },
  schedule: {
    title: 'Austritt durchführen',
    description:
      'Fällige Austritte durchführen und unvollständige Konto- und Mitgliedschaftsänderungen erneut versuchen.',
  },

  title: 'Austritt und Übergabe',
  description:
    'Prüfen Sie Austritte, Übergaben und die Ausführung zum Wirksamkeitsdatum.',
  new: 'Neuer Austrittsantrag',
  edit: 'Bearbeiten',
  number: 'Antragsnummer',
  refresh: 'Aktualisieren',
  search: 'Nach Antragsnummer, Mitarbeiter oder Begründung suchen',
  view: 'Anzeigen',
  allTypes: 'Alle Austrittsarten',
  allStatuses: 'Alle Status',
  clearFilters: 'Filter zurücksetzen',
  emptyTitle: 'Keine Austrittsanträge',
  emptyDescription: 'Austrittsanträge und Übergabefortschritt erscheinen hier.',
  noResults: 'Keine passenden Austrittsanträge',
  departureType: 'Austrittsart',
  reason: 'Begründung',
  expectedLastWorkingDay: 'Voraussichtlicher letzter Arbeitstag',
  lastWorkingDay: 'Bestätigter letzter Arbeitstag',
  handoverUser: 'Übergabeempfänger',
  createdBy: 'Erstellt von',
  application: 'Antrag',
  settlement: 'Personalabrechnung',
  settlementDate: 'Abrechnungsdatum',
  settlementNote: 'Abrechnungsnotiz',
  execution: 'Austritt durchführen',
  notSettled: 'Die Abrechnung ist nicht abgeschlossen.',
  notExecuted:
    'Die Austrittsausführung ist unvollständig. Das Konto wurde nicht deaktiviert.',
  executionComplete:
    'Das Konto und die Organisationsmitgliedschaften wurden deaktiviert.',
  cancellationReason: 'Stornierungsgrund',
  cancellationGuidance:
    'Nach dem Personalgespräch kann die Personalabteilung vor dem tatsächlichen Austritt eine Stornierung beantragen. Ein anderer Personalprüfer muss bestätigen, bevor die Beschäftigung wiederhergestellt wird.',
  handover: 'Übergabearbeit',
  claimant: 'Übernommen von',
  receiver: 'Empfänger',
  manager: 'Verantwortliche Führungskraft',
  forcedBy: 'Befreit durch',
  forceReason: 'Befreiungsgrund',
  checklistConfirmed: 'Checkliste bestätigt',
  receiverAcknowledged: 'Empfang quittiert',
  yes: 'Ja',
  no: 'Nein',
  notReady: 'Die Einreichungsanforderungen sind unvollständig.',
  views: {
    mine: 'Meine',
    pending: 'Ausstehend',
    done: 'Fertig',
    copied: 'Kopiert',
  },
  statuses: {
    cancellationReview: 'Stornierungsbestätigung',
    cancelled: 'Abgebrochen',
    draft: 'Entwurf',
    revision: 'Zur Überarbeitung zurückgegeben',
    manager: 'Prüfung durch die Führungskraft',
    head: 'Prüfung durch die Abteilungsleitung',
    hr: 'Personalgespräch',
    gm: 'Prüfung durch die Geschäftsführung',
    handover: 'Übergabe',
    completed: 'Abrechnung abgeschlossen',
    withdrawn: 'Zurückgezogen',
    rejected: 'Abgelehnt',
    terminated: 'Beendet',
  },
  workKinds: {
    work: 'Arbeitsübergabe',
    it: 'IT und Konten',
    admin: 'Anlagen und Arbeitsplatz',
    finance: 'Vorschüsse und Kostenerstattungen',
  },
  workStates: {
    cancelled: 'Abgebrochen',
    open: 'Zur Übernahme verfügbar',
    claimed: 'In Bearbeitung',
    completed: 'Abgeschlossen',
  },
  executionStates: {
    cancelled: 'Abgebrochen',
    ready: 'Warten auf Wirksamkeitsdatum',
    transferring: 'Ausstehende Genehmigungen werden übertragen',
    blocked: 'Ausführung blockiert',
    executed: 'Konto deaktiviert',
  },
  errors: {
    missingUnnamed:
      'Dieser Austrittsantrag ist nicht mehr vorhanden. Zur Ursprungsliste zurückgekehrt.',
    missingReturned:
      '„{{name}}“ ist nicht mehr verfügbar. Zur Ursprungsliste zurückgekehrt.',
    forbidden: 'Sie haben keinen Zugriff mehr auf diesen Datensatz.',
    notFound:
      'Dieser Datensatz ist nicht vorhanden. Kehren Sie zur Liste zurück.',
    conflict:
      'Dieser Datensatz wurde geändert. Laden Sie den neuesten Datensatz, bevor Sie erneut bestätigen.',
    invalid:
      'Die Vorgangsanforderungen sind nicht erfüllt. Prüfen Sie den aktuellen Datensatz.',
    failed: 'Die Anfrage ist fehlgeschlagen. Versuchen Sie erneut zu laden.',
  },
  form: {
    create: 'Neuer Austrittsantrag',
    confirmSubmission: 'Austrittseinreichung bestätigen',
    submissionHelp:
      'Bestätigen Sie den voraussichtlichen letzten Arbeitstag und den Übergabeempfänger vor der Einreichung zur Genehmigung.',
    edit: 'Austrittsantrag bearbeiten',
    save: 'Entwurf speichern',
    saved: '„{{name}}“ gespeichert',
    mode: 'Erstellen für',
    self: 'Meine Kündigung',
    manual: 'Delegierter Antrag der Personalabteilung',
    employee: 'Mitarbeiter',
    employeeSearch: 'Mitarbeiter suchen',
    chooseEmployee: 'Aktiven Mitarbeiter auswählen',
    employeesDenied:
      'Zur Zielauswahl ist der Zugriff auf Mitarbeiterakten erforderlich.',
    previous: 'Vorherige Kandidaten',
    next: 'Nächste Kandidaten',
    chooseType: 'Austrittsart auswählen',
    chooseHandover: 'Übergabeempfänger auswählen',
    searchHandover: 'Geeignete Empfänger suchen',
    handoverSearchMinimum:
      'Geben Sie mindestens zwei Zeichen ein, um nach Name oder Mitarbeitercode zu suchen.',
    noHandoverCandidates:
      'Keine geeigneten Empfänger gefunden. Versuchen Sie einen anderen Namen oder Mitarbeitercode oder bitten Sie die Personalabteilung, Mitarbeiter- und Kontostatus zu prüfen.',
    requiredOnSubmit:
      'Für die Einreichung erforderlich; beim Speichern eines Entwurfs optional.',
    handoverHelp:
      'Für die Einreichung erforderlich; für einen Entwurf optional. Wählen Sie einen anderen Mitarbeiter in Probezeit oder Festanstellung mit aktiviertem Konto. Suchen Sie nach Name oder Mitarbeitercode.',
    refineHandoverSearch:
      'Viele passende Empfänger. Geben Sie einen genaueren Namen ein, um die Suche einzugrenzen.',
    required: 'Füllen Sie dieses Feld aus.',
    dateInvalid: 'Wählen Sie ein gültiges Kalenderdatum.',
    invalid: 'Prüfen Sie dieses Feld und versuchen Sie es erneut.',
    dateHelp:
      'Das im Personalgespräch bestätigte Datum ist der endgültige letzte Arbeitstag.',
    manualHelp:
      'Die Personalabteilung kann Entlassungs- oder Vertragsablaufanträge für Mitarbeiter erstellen.',
    unavailable:
      'Sie können diesen Antrag nicht erstellen. Prüfen Sie Ihren Mitarbeiterstatus und Ihre Berechtigungen.',
    unknown:
      'Das Speicherergebnis ist unbestätigt. Prüfen Sie vorhandene Entwürfe, bevor Sie einen weiteren Antrag erstellen.',
    checkDrafts: 'Vorhandene Entwürfe prüfen',
    noProof:
      'Kein passender Entwurf gefunden. Dies beweist keinen Speicherfehler. Lassen Sie diesen Antrag gesperrt und wenden Sie sich an die Personalabteilung.',
    openDraft: 'Diesen Entwurf zur Prüfung öffnen',
    confirmDraft: 'Dies ist der gespeicherte Antrag',
    storageUnavailable:
      'Browserspeicher ist nicht verfügbar. Das Speichern ist deaktiviert, um doppelte Anträge nach einem unterbrochenen Speichervorgang zu verhindern.',
    unknownPersisted:
      'Eine frühere Erstellungsanfrage ist noch unbestätigt. Diese Sperre bleibt nach der Aktualisierung bestehen.',
  },
  actionForm: {
    approveConsequence:
      'Die angebotene Genehmigung wird erfasst. Die endgültige Genehmigung setzt das genehmigte Beschäftigungsergebnis um.',

    uncertain:
      'Das Ergebnis ist unbestätigt. Behalten Sie diese Eingaben bei und wiederholen Sie denselben Vorgang; senden Sie keine geänderte Anfrage.',
    replay: 'Identischen Vorgang wiederholen',
    unsupported:
      'Diese Aktion erfordert ein Eingabeformat, das diese Seite nicht unterstützt.',
    person: 'Empfänger',
    mode: 'Position des Unterzeichners',
    place: 'Genehmigungsstelle',
    releaseConsequence:
      'Dadurch werden ausstehende Genehmigungsaufgaben freigegeben. Dies kann hier nicht rückgängig gemacht werden.',
    returnConsequence:
      'Der Antrag wird zur Korrektur zurückgegeben und aktuell ausstehende Arbeit wird geschlossen.',
    submitConsequence:
      'Der Antrag geht in die Genehmigung; seine eingereichten Daten werden festgeschrieben.',
    genericConsequence:
      'Der Server wendet den angebotenen Vorgang auf das ausgewählte Genehmigungsziel an.',
    latest: 'Neueste Version lesen',
    conflict:
      'Der Austrittsantrag wurde geändert. Ihre Eingaben bleiben erhalten. Lesen und prüfen Sie die neueste Version und bestätigen Sie erneut.',
    completed: '{{action}} für „{{name}}“ abgeschlossen',
    committed:
      'Der Vorgang wurde abgeschlossen. Aktualisieren Sie den Austrittsantrag, bevor Sie eine weitere Aktion ausführen.',
    before: 'Davor',
    after: 'Danach',
    alongside: 'Parallel',
    revision: 'Korrektur durch den Antragsteller',
    required: 'Füllen Sie dieses Feld aus.',
    limit: 'Dieser Wert ist zu lang.',
    title: 'Austritt „{{name}}“: {{action}}',
    comment: 'Kommentar / Begründung',
    confirm: 'Bestätigen',
    saved: '„{{name}}“ aktualisiert',
    unavailable:
      'Diese Aktion ist nicht mehr verfügbar. Laden Sie den neuesten Datensatz.',
    unknown:
      'Das Ergebnis ist unbestätigt. Laden Sie den neuesten Datensatz, bevor Sie fortfahren.',
    to: 'Empfänger',
    returnTarget: 'Zurück an',
    confirmTitle: '„{{name}}“: {{action}}?',
    confirmDescription:
      'Dies aktualisiert die Austrittsentscheidung. Bestätigen Sie den Mitarbeiter und den aktuellen Datensatz.',
    lastWorkingDay: 'Bestätigter letzter Arbeitstag',
    settlementDate: 'Abrechnungsdatum',
    settlementNote: 'Abrechnungsnotiz',
    labels: {
      requestCancellation: 'Austrittsstornierung beantragen',
      submit: 'Einreichen',
      withdraw: 'Zurückziehen',
      terminate: 'Beenden',
      settle: 'Abrechnung bestätigen',
      approve: 'Genehmigen',
      reject: 'Ablehnen',
      return: 'Zurückgeben',
      returnTo: 'Zurückgeben',
      comment: 'Kommentar',
      read: 'Als gelesen markieren',
      urge: 'Dringende Erinnerung senden',
      transfer: 'Versetzen',
      addSigner: 'Unterzeichner hinzufügen',
      cc: 'Kopieren',
      claim: 'Übernehmen',
      release: 'Freigeben',
      appoint: 'Bestimmen',
      reassign: 'Neu zuweisen',
    },
  },
  work: {
    labels: {
      requestCancellation: 'Austrittsstornierung beantragen',
      claim: 'Übernehmen',
      confirmChecklist: 'Checkliste bestätigen',
      acknowledgeReceipt: 'Empfang quittieren',
      complete: 'Abschließen',
      forceComplete: 'Abschluss erzwingen',
    },
    title: '{{kind}} für „{{name}}“: {{action}}',
    reason: 'Befreiungsgrund',
    confirmChecklist: 'Ich habe die Checkliste abgeschlossen.',
    acknowledgeReceipt: 'Ich habe die Übergabe erhalten.',
    blocked:
      'Die Freigabe ist unvollständig. Klären Sie die aufgelisteten ausstehenden Punkte.',
    forceWarning:
      'Ein erzwungener Übergabeabschluss ändert keine Anlagen- oder Finanzverzeichnisdaten.',
    forceConfirm: 'Befreiung von {{kind}} für „{{name}}“?',
    forceDescription:
      'Reguläre Freigabenachweise werden umgangen. Begründung und tatsächlicher Bearbeiter werden protokolliert.',
  },
  blockers: {
    generic:
      'Eine Anforderung ist nicht erfüllt. Aktualisieren Sie die Ansicht und bitten Sie die zuständige Person um Klärung.',
    DEPARTURE_ASSET_SERVICE_UNAVAILABLE:
      'Die reguläre Anlagenfreigabe ist noch nicht verfügbar.',
    DEPARTURE_REIMBURSEMENT_SERVICE_UNAVAILABLE:
      'Die Erstattungsfreigabe ist nicht verfügbar.',
    DEPARTURE_LOANS_NOT_CLEARED:
      'Vorschüsse oder reservierte Rückzahlungen sind nicht ausgeglichen.',
    REIMBURSEMENT_DEPARTURE_NOT_CLEARED:
      'Kostenerstattungsanträge sind noch offen.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      'Wählen Sie das voraussichtliche Datum und den Übergabeempfänger.',
    DEPARTURE_DATE_PAST:
      'Der voraussichtliche letzte Arbeitstag liegt in der Vergangenheit.',
    DEPARTURE_REASSIGNMENT_UNAVAILABLE:
      'Die Genehmigungsübertragung ist nicht verfügbar. Das Konto bleibt aktiviert.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      'Ausstehende Genehmigungen bleiben diesem Mitarbeiter zugewiesen.',
    DEPARTURE_EXECUTION_FAILED:
      'Die Austrittsausführung ist fehlgeschlagen und wird vom täglichen Auftrag erneut versucht.',
  },
};
