export default {
  discardTitle: 'Änderungen an „{{name}}“ verwerfen?',
  discardDescription:
    'Nicht gespeicherte Änderungen gehen verloren. Gespeicherte Entwurfsnachweise bleiben erhalten.',
  discard: 'Änderungen verwerfen',
  title: 'Anlagenanträge',
  description:
    'Anlagennutzung, Ausleihe und Entsorgung beantragen; tatsächliche Bearbeitung bestätigen.',
  new: 'Neuer Anlagenantrag',
  draft: 'Anlagenantragsentwurf',
  source: 'Ursprungsansicht',
  detail: 'Anzeigen',
  detailDescription:
    'Antragsdaten und tatsächlich angebotene Genehmigungsaktionen.',
  edit: 'Bearbeiten',
  editTitle: 'Anlagenantrag bearbeiten',
  number: 'Nummer',
  operationLabel: 'Vorgang',
  statusLabel: 'Status',
  quantity: 'Menge',
  purpose: 'Zweck',
  category: 'Kategorie',
  asset: 'Anlage',
  borrowDueDate: 'Rückgabedatum',
  updatedAt: 'Aktualisiert',
  scrapReason: 'Entsorgungsgrund',
  appraisalOpinion: 'Prüfungsstellungnahme',
  handlingReason: 'Empfangsbegründung',
  exceptionReason: 'Ausnahmebegründung',
  allocation: 'Tatsächliche Zuteilung',
  photos: 'Nachweisfotos',
  originalValue: 'Anschaffungswert der Anlage',
  companyTimeZone: 'Unternehmenszeitzone: {{timeZone}}',
  search: 'Suchen',
  searchPlaceholder: 'Nach Nummer oder Zweck suchen',
  all: 'Alle',
  clearFilters: 'Filter zurücksetzen',
  refresh: 'Aktualisieren',
  rowActions: 'Aktionen für {{name}}',
  empty: 'Noch keine Anlagenanträge',
  emptyDescription:
    'Erstellen Sie einen Antrag, um Anlagen anzufordern oder zu entsorgen.',
  emptyReadonly: 'Bitten Sie einen Administrator um Antragszugriff.',
  noResults: 'Keine passenden Anträge',
  noResultsDescription: 'Ändern oder löschen Sie Filter, um Anträge zu finden.',
  noAccess:
    'Sie haben keinen Zugriff mehr. Wenden Sie sich an einen Administrator.',
  missing:
    'Dieser Antrag ist nicht vorhanden oder wurde gelöscht. Kehren Sie zur Ursprungsansicht zurück.',
  missingNamed: 'Antrag „{{name}}“ ist nicht vorhanden oder wurde gelöscht.',
  conflict:
    'Der Antrag wurde geändert. Laden Sie die neuesten Daten, bevor Sie fortfahren.',
  invalid:
    'Dieser Vorgang wurde abgelehnt. Prüfen Sie Pflichtfelder und aktuell angebotene Aktionen.',
  loadFailed:
    'Laden nicht möglich. Versuchen Sie es bei verfügbarer Verbindung erneut.',
  retry: 'Erneut versuchen',
  loadLatest: 'Neueste Version laden',
  missingFields:
    'Einige Pflichtfelder sind nicht lesbar. Vollständige Bearbeitung oder physische Bestätigung ist deaktiviert.',
  unknownResult:
    'Das Ergebnis ist unbekannt. Der vollständige ursprüngliche Befehl ist festgeschrieben; wiederholen Sie genau diesen Vorgang zum Abgleich.',
  retryExact: 'Ursprünglichen Vorgang wiederholen',
  cancel: 'Abbrechen',
  save: 'Speichern',
  saveDraft: 'Entwurf speichern',
  submit: 'Zur Genehmigung einreichen',
  saving: 'Wird gespeichert…',
  saved: '„{{name}}“ gespeichert',
  submitted: '„{{name}}“ eingereicht',
  completed: '{{action}} für „{{name}}“ abgeschlossen',
  required: 'Füllen Sie dieses Pflichtfeld aus.',
  quantityInvalid: 'Geben Sie eine ganzzahlige Menge von 1 bis 100 ein.',
  textLimit: 'Verwenden Sie höchstens 2.000 Zeichen.',
  reasonLimit: 'Verwenden Sie höchstens 5.000 Zeichen.',
  futureDate: 'Wählen Sie ein zukünftiges Datum in der Unternehmenszeitzone.',
  photoRequired: 'Wählen Sie mindestens ein Nachweisfoto.',
  photoLimit:
    'Bis zu 10 JPEG-, PNG- oder WebP-Fotos mit jeweils höchstens 5 MB.',
  removeSelection: 'Auswahl entfernen',
  selectPhoto: 'Vorhandene Nachweise auswählen',
  uploadUnknown:
    'Der Upload „{{name}}“ muss abgeglichen werden. Prüfen und wählen Sie die gespeicherten Nachweise; laden Sie bis zum Abgleich keine weitere Datei hoch.',
  noEligibleEmployee:
    'Die Einreichung erfordert einen aktiven Mitarbeiterdatensatz in Probezeit oder Festanstellung.',
  noDepartment: 'Die Einreichung erfordert eine aktive Hauptabteilung.',
  noActiveHead: 'Die Einreichung erfordert eine aktive Abteilungsleitung.',
  searchCandidates: 'Geeignete Kandidaten suchen',
  selectAsset: 'Geeignete Anlage auswählen',
  noEligibleAssets: 'Keine geeigneten Anlagen verfügbar.',
  previous: 'Vorherige Seite',
  next: 'Nächste Seite',
  comment: 'Stellungnahme / Begründung',
  person: 'Empfänger',
  signerMode: 'Position des zusätzlichen Unterzeichners',
  place: 'Genehmigungsstelle',
  fullBatch:
    'Bestätigen Sie jede reservierte Einheit und ihre tatsächliche Seriennummer. Ein teilweiser physischer Empfang kann diesen Stapel nicht abschließen.',
  serialFor: 'Tatsächliche Seriennummer für {{code}}',
  serialLimit: 'Verwenden Sie höchstens 200 Zeichen.',
  serialMismatch:
    'Die tatsächliche Seriennummer muss mit der zugeteilten Anlage übereinstimmen.',
  actionUnavailable:
    'Diese Aktion wird nicht mehr angeboten. Aktualisieren Sie den aktuellen Antrag.',
  actionTitle: 'Anlagenantrag „{{name}}“: {{action}}',
  confirmDanger:
    'Dies ändert den Antrag oder erfasst eine physische Übergabe. Bestätigen Sie Daten und Begründung, bevor Sie fortfahren.',
  operations: {
    use: 'Dauerhafte Nutzung',
    borrow: 'Ausleihe',
    scrap: 'Entsorgung',
  },
  statuses: {
    draft: 'Entwurf',
    revision: 'Zur Überarbeitung zurückgegeben',
    head: 'Prüfung durch die Abteilungsleitung',
    appraisal: 'Prüfung',
    finance: 'Prüfung durch die Finanzabteilung',
    gm: 'Prüfung durch die Geschäftsführung',
    issuing: 'Ausgabe ausstehend',
    borrowed: 'Ausgeliehen',
    returning: 'Tatsächliche Rückgabe ausstehend',
    issued: 'Ausgegeben',
    returned: 'Zurückgegeben',
    scrapped: 'Entsorgt',
    unable: 'Bearbeitung nicht möglich',
    rejected: 'Abgelehnt',
    withdrawn: 'Zurückgezogen',
    terminated: 'Beendet',
    exception: 'Bearbeitungsausnahme',
  },
  actions: {
    submit: 'Zur Genehmigung einreichen',
    withdraw: 'Zurückziehen',
    terminate: 'Beenden',
    approve: 'Genehmigen',
    reject: 'Ablehnen',
    return: 'Zur Überarbeitung zurückgeben',
    complete: 'Physische Bearbeitung bestätigen',
    unable: 'Bearbeitung nicht möglich',
    returnIssued: 'Rückgabe ausgegebener Anlage bestätigen',
    transfer: 'Versetzen',
    addSigner: 'Unterzeichner hinzufügen',
    cc: 'Kopieren',
    assign: 'Zuweisen',
    appoint: 'Bestimmen',
    reassign: 'Neu zuweisen',
    urge: 'Dringende Erinnerung senden',
    read: 'Als gelesen markieren',
    comment: 'Kommentar',
    claim: 'Übernehmen',
    release: 'Freigeben',
  },
  tabs: {
    mine: 'Meine',
    pending: 'Ausstehend',
    done: 'Bearbeitet',
    copied: 'Kopiert',
  },
  modes: {
    before: 'Davor',
    alongside: 'Parallel',
    after: 'Danach',
  },
  authz: {
    ownedScope: 'Eigene Anlagenanträge',
    resource: 'Anlagenanträge',
    view: 'Anlagenanträge lesen',
    viewValue: 'Anschaffungswerte von Anlagen lesen',
    create: 'Eigene Anlagenanträge erstellen',
    edit: 'Eigene Anlagenanträge bearbeiten',
    operate:
      'Autorisierte Genehmigungs- und Bearbeitungsaktionen für Anlagen ausführen',
    returnIssued:
      'Tatsächliche Rückgabe ausgegebener Nutzungsanlagen bestätigen',
  },
  errors: {
    ASSET_RETURN_REASON_REQUIRED:
      'Geben Sie die Begründung für den tatsächlichen Empfang ein.',
    ASSET_ACCESS_DENIED: 'Sie können auf diesen Anlagenantrag nicht zugreifen.',
    ASSET_ACTION_INVALID: 'Diese Aktion ist für den Antrag nicht verfügbar.',
    ASSET_REQUEST_NOT_FOUND: 'Anlagenantrag nicht gefunden.',
    ASSET_INVALID_COMMAND:
      'Geben Sie eine beständige Anfragekennung und die erforderliche Begründung ein.',
    ASSET_REQUEST_REUSED:
      'Diese Anfragekennung ist mit einem anderen Vorgang verknüpft.',
    ASSET_REQUIRED_FIELDS:
      'Vervollständigen Sie den Zweck, die Menge und die Anlagenauswahl.',
    ASSET_CATEGORY_INACTIVE: 'Wählen Sie eine aktive Anlagenkategorie.',
    ASSET_EMPLOYEE_INACTIVE:
      'Der Antragsteller muss einen aktiven Mitarbeiterdatensatz haben.',
    ASSET_DEPARTMENT_MISSING:
      'Der Antragsteller benötigt eine aktive Hauptabteilung.',
    ASSET_HEAD_MISSING:
      'Die Abteilung benötigt eine aktive Abteilungsleitung als Genehmiger.',
    ASSET_BORROW_DATE_INVALID:
      'Wählen Sie ein gültiges zukünftiges Rückgabedatum in der Unternehmenszeitzone.',
    ASSET_SCRAP_REQUIRED:
      'Wählen Sie eine Anlage, geben Sie den Verschrottungsgrund ein und fügen Sie ein Foto hinzu.',
    ASSET_SCRAP_INELIGIBLE:
      'Nur eine geeignete zugewiesene Anlage oder ein vom Administrator verwalteter Lagerartikel kann verschrottet werden.',
    ASSET_PHOTO_DENIED: 'Der Antrag oder sein Fotofeld ist nicht zugänglich.',
    ASSET_PHOTO_INVALID:
      'Wählen Sie höchstens zehn gültige Fotos, die mit diesem Antrag verknüpft sind.',
    ASSET_PHOTO_SIZE: 'Jedes Foto darf höchstens 5 MB groß sein.',
    ASSET_PHOTO_TYPE: 'Laden Sie ein gültiges JPEG-, PNG- oder WebP-Bild hoch.',
    ASSET_STOCK_SHORTAGE:
      'Für diesen vollständigen Antrag sind nicht genügend Einheiten verfügbar.',
    ASSET_INVALID_QUANTITY:
      'Bestätigen Sie eine ganzzahlige Menge zwischen 1 und 100.',
    ASSET_INVALID_AMOUNT:
      'Der gespeicherte Anlagenwert liegt außerhalb des unterstützten exakten Wertebereichs.',
    ASSET_NOT_FOUND: 'Eine Anlage in diesem Antrag wurde nicht gefunden.',
    ASSET_INVALID_VERSION: 'Laden Sie die aktuelle Anlagenversion.',
    ASSET_VERSION_CONFLICT:
      'Die Anlage wurde geändert. Laden Sie sie vor der Bestätigung neu.',
    ASSET_ALREADY_RESERVED:
      'Eine Anlage ist durch einen anderen Antrag reserviert.',
    ASSET_EXISTING_HOLD:
      'Klären Sie die bestehende Reservierung, bevor Sie den Bestand ändern.',
    ASSET_HOLD_MISMATCH:
      'Die tatsächliche Reservierung stimmt nicht mit diesem Antrag überein.',
    ASSET_BASELINE_CONFLICT:
      'Die Anlagendaten wurden nach der Genehmigung geändert. Geben Sie den Antrag vor der Ausführung zur Prüfung zurück.',
    ASSET_UNITS_INCOMPLETE:
      'Bestätigen Sie jede zugeteilte Einheit und ihre tatsächliche Seriennummer.',
    ASSET_SERIAL_MISMATCH:
      'Die Seriennummer weicht von der tatsächlichen Anlage ab.',
    ASSET_RETURN_MISMATCH:
      'Die zurückgegebenen Gegenstände stimmen nicht mit der tatsächlich ausgegebenen Zuordnung überein.',
    ASSET_ALREADY_RETURNED: 'Diese Anlage wurde bereits zurückgegeben.',
    ASSET_RETURN_FORBIDDEN:
      'Ein aktiver Anlagenverwalter muss die tatsächliche Rückgabe bestätigen.',
    ASSET_RETURN_INELIGIBLE:
      'Dieser Antrag ist kein geeigneter ausgeführter Nutzungsantrag.',
    ASSET_ALLOCATION_MISSING: 'Die vollständige tatsächliche Zuteilung fehlt.',
    ASSET_SOURCE_UNAVAILABLE:
      'Die Quelle des Anlagenantrags ist nicht verfügbar.',
    ASSET_SOURCE_MISSING:
      'Der zugehörige Anlagenantrag ist nicht mehr vorhanden.',
    ASSET_SOURCE_FORBIDDEN:
      'Die Quelle hat diesen Bestandsvorgang nicht autorisiert.',
    ASSET_SOURCE_MISMATCH:
      'Die Bestandsquelle stimmt nicht mit dem tatsächlichen Antrag überein.',
    ASSET_TARGET_MISMATCH:
      'Das Genehmigungsziel gehört zu einem anderen Antrag.',
    ASSET_DIRECTORY_UNAVAILABLE:
      'Ein aktuelles Genehmigungsverzeichnis ist erforderlich.',
    ASSET_SLA_UNSUPPORTED:
      'Die Genehmigung kann nicht eingereicht werden. Bitten Sie einen Administrator, die Fristen auf 24/48 Arbeitsstunden festzulegen.',
  },
  schedule: {
    title: 'Erinnerungen an die Rückgabe ausgeliehener Anlagen',
    description:
      'Tägliche Fälligkeitserinnerungen in der Unternehmenszeitzone und wöchentliche Erinnerungen bei Überfälligkeit. Eine ausstehende Zustellung wird als fehlgeschlagene Ausführung gemeldet.',
  },
  reminders: {
    before:
      'Anlagenantrag {{number}}: {{quantity}} ausgeliehene Gegenstände sind am {{date}} zurückzugeben. Veranlassen Sie bitte die tatsächliche Rückgabe.',
    overdue:
      'Anlagenantrag {{number}}: {{quantity}} ausgeliehene Gegenstände waren am {{date}} fällig und wurden noch nicht zurückgegeben.',
  },
};
