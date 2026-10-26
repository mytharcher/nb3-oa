export default {
  contracts: {
    title: 'Vertragsanträge',
    ledgerTitle: 'Verträge',
    description: 'Vertragsprüfung starten und ihren Fortschritt verfolgen',
    ledgerDescription:
      'Genehmigte Verträge und unveränderliche Versionen lesen',
    source: 'Ursprungsseite',
    detail: 'Vertragsdetails',
    new: 'Neuer Vertrag',
    edit: 'Bearbeiten',
    save: 'Speichern',
    saveDraft: 'Entwurf speichern',
    cancel: 'Abbrechen',
    submit: 'Zur Genehmigung einreichen',
    appendText: 'Text hinzufügen',
    rebase: 'Basis aktualisieren',
    historicalEntry: 'Historischen Vertrag erfassen',
    number: 'Nummer',
    contractType: 'Vertragsart',
    operation: 'Vorgang',
    counterparty: 'Gegenpartei',
    counterpartyKind: 'Art der Gegenpartei',
    customer: 'Kunde',
    vendor: 'Qualifizierter Lieferant',
    amountCents: 'Vertragsbetrag (Yuan)',
    startsOn: 'Startdatum',
    endsOn: 'Enddatum',
    paymentTerms: 'Zahlungsbedingungen',
    standardTemplate: 'Standardvorlage',
    reason: 'Begründung',
    textVersionId: 'Vertragstext',
    attachments: 'Anhänge',
    versions: 'Unveränderliche Versionen',
    version: 'Version',
    baseVersion: 'Basisversion',
    nonStandard: 'Rechtsstellungnahme für Nichtstandardvertrag',
    selectOpinion: 'Rechtsstellungnahme auswählen',
    yes: 'Ja',
    no: 'Nein',
    search: 'Nach Nummer oder Gegenpartei suchen',
    ledgerSearch: 'Nach Vertragsnummer suchen',
    empty: 'Keine Vertragsanträge',
    emptyDescription: 'Erstellen Sie einen Antrag, um die Prüfung zu starten',
    emptyReadOnly:
      'Wenden Sie sich für den Zugriff auf Vertragseinreichungen an einen Administrator',
    ledgerEmpty: 'Keine Verträge',
    ledgerEmptyDescription: 'Genehmigte Verträge erscheinen hier',
    noResults: 'Keine Treffer',
    clear: 'Filter zurücksetzen',
    retry: 'Erneut versuchen',
    refresh: 'Aktualisieren',
    allStatuses: 'Alle Status',
    status: 'Status',
    createdAt: 'Erstellungsdatum',
    updatedAt: 'Aktualisierungsdatum',
    view: 'Anzeigen',
    noAccess:
      'Kein Zugriff auf diesen Vertrag. Wenden Sie sich an einen Administrator.',
    fieldsRestricted:
      'Vollständige Vertragsfelder sind nicht lesbar. Wenden Sie sich an einen Administrator.',
    missing:
      'Der Vertrag ist nicht mehr vorhanden. Kehren Sie zur Ursprungsseite zurück.',
    failed:
      'Vertragsdaten konnten nicht geladen werden. Versuchen Sie es erneut.',
    invalid:
      'Prüfen Sie Vertragsdetails und Anforderungen der aktuellen Aktion.',
    conflict:
      'Der Vertrag wurde geändert. Laden und prüfen Sie die neueste Version.',
    loadLatest: 'Neueste Version laden',
    textDenied: 'Vertragstext ist nicht lesbar',
    unknown:
      'Das Ergebnis muss geprüft werden. Eingaben sind gesperrt; wiederholen Sie den ursprünglichen Vorgang.',
    retryExact: 'Ursprünglichen Vorgang wiederholen',
    required: 'Dieses Feld ausfüllen',
    amountInvalid:
      'Geben Sie einen nicht negativen Betrag mit bis zu zwei Nachkommastellen ein',
    dateInvalid: 'Das Enddatum darf nicht vor dem Startdatum liegen',
    tooLong: 'Dieser Wert ist zu lang',
    textRequired:
      'Laden und verknüpfen Sie vor der Einreichung einen Vertragstext',
    actionsFor: 'Aktionen für „{{name}}“',
    rebaseTitle: 'Basis von Vertrag „{{name}}“ aktualisieren?',
    rebaseDescription:
      'Diesen Vorschlag beibehalten, die Basisversion aktualisieren und die vollständige Prüfung wiederholen.',
    saved: '„{{name}}“ gespeichert',
    submitted: '„{{name}}“ eingereicht',
    completed: 'Aktion für „{{name}}“ abgeschlossen',
    draftName: 'Vertragsentwurf',
    confirmation: 'Vertrag „{{name}}“: {{action}}?',
    dangerConsequence:
      'Dies beendet die aktuelle Antragsprüfung und schließt ihre ausstehenden Aufgaben.',
    historicalConsequence:
      'Veröffentlicht eine protokollierte historische Version. Prüfen Sie Text und Vorschlag.',
    notAvailable:
      'Diese Aktion ist nicht verfügbar. Aktualisieren Sie die Ansicht zur Prüfung.',
    comment: 'Kommentar oder Begründung',
    recipient: 'Empfänger',
    recipientSearch: 'Geeignete Empfänger suchen',
    moreCandidates: 'Weitere Kandidaten',
    noCandidates: 'Keine geeigneten Empfänger',
    place: 'Genehmigungsstelle',
    returnTarget: 'Zurück an',
    signerMode: 'Modus für hinzugefügten Unterzeichner',
    sourceContract: 'Genehmigter Vertrag',
    proposal: 'Vertragsvorschlag',
    paidCents: 'Bezahlter Betrag',
    heldCents: 'Reservierte Zahlungen',
    availableCents: 'Für Zahlung verfügbar',
    actor: 'Bearbeiter',
    request: 'Antrag',
    openRequest: 'Antrag anzeigen',
    privateTextHint:
      'Der Vertragstext erfordert Zugriff auf den zugehörigen Antrag.',
    selectExisting: 'Hochgeladene Datei auswählen',
    removeFile: 'Auswahl „{{name}}“ entfernen',
    uploadHint:
      'Text: PDF. Nachweise: PDF, JPEG, PNG oder WebP; höchstens 5 MB pro Datei.',
    fileInvalid:
      'Wählen Sie eine passende unterstützte Datei mit höchstens 5 MB.',
    uploadUnknown:
      'Das Upload-Ergebnis muss geprüft werden. Wählen Sie eine hochgeladene Datei; laden Sie nicht erneut hoch.',
    fileMissing:
      'Die ausgewählte Datei ist nicht verfügbar. Prüfen Sie Zugriff und Textversion.',
    noFiles: 'Keine hochgeladenen Dateien',
    uploaded: '„{{name}}“ hochgeladen',
    bindText: 'Angefügten Text weiter verknüpfen',
    boundText: 'Textversion {{version}} verknüpft',
    currentVersion: 'Aktuelle Version',
    selectSource:
      'Wählen Sie einen genehmigten Vertrag, um seine vollständige Version zu laden',
    discard: 'Nicht gespeicherte Änderungen verwerfen?',
    discardDescription:
      'Ihre Eingaben werden verworfen; hochgeladene Nachweise bleiben gespeichert.',
    discardConfirm: 'Änderungen verwerfen',
    progress: 'Prüfungsfortschritt',
    timeline: 'Prüfungsverlauf',
    selectFile: 'Datei auswählen',
    sourceVersion: 'Quellversion',
    operations: {
      new: 'Neuer Vertrag',
      change: 'Änderung',
      renew: 'Verlängerung',
      terminate: 'Beendigung',
    },
    statuses: {
      draft: 'Entwurf',
      revision: 'Revision',
      head: 'Abteilungsprüfung',
      legalFinance: 'Prüfung durch Rechts- und Finanzabteilung',
      standardFinance: 'Prüfung durch die Finanzabteilung',
      executive: 'Prüfung durch die Bereichsleitung',
      gm: 'Prüfung durch die Geschäftsführung',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
      terminated: 'Beendet',
      activePendingSeal: 'Genehmigt, Siegelung ausstehend',
      active: 'Aktiv',
    },
    views: {
      mine: 'Meine',
      pending: 'Ausstehend',
      done: 'Fertig',
      copied: 'Kopiert',
    },
    actions: {
      edit: 'Bearbeiten',
      submit: 'Zur Genehmigung einreichen',
      withdraw: 'Zurückziehen',
      terminate: 'Beenden',
      approve: 'Genehmigen',
      reject: 'Ablehnen',
      return: 'Zurückgeben',
      claim: 'Übernehmen',
      comment: 'Kommentar',
      read: 'Als gelesen markieren',
      transfer: 'Versetzen',
      addSigner: 'Unterzeichner hinzufügen',
      urge: 'Dringende Erinnerung senden',
      appoint: 'Genehmiger bestimmen',
      reassign: 'Neu zuweisen',
      historicalEntry: 'Historischen Vertrag erfassen',
      rebase: 'Basis aktualisieren',
    },
    modes: { before: 'Davor', after: 'Danach', alongside: 'Parallel' },

    errors: {
      CONTRACT_ACCESS_DENIED:
        'Dieser Vertrag liegt außerhalb Ihrer Zugriffsberechtigung.',
      CONTRACT_ACTION_NOT_ALLOWED:
        'Diese Aktion ist für den Vertrag nicht verfügbar.',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        'Der Vertragsbetrag darf nicht niedriger als die Summe aus bezahlten und reservierten Zahlungen sein.',
      CONTRACT_ATTACHMENT_DENIED:
        'Das Vertragsanhangsfeld oder der Datensatz liegt außerhalb Ihrer Zugriffsberechtigung.',
      CONTRACT_ATTACHMENT_INVALID:
        'Wählen Sie gültige Anhänge, die zu diesem Vertragsantrag gehören.',
      CONTRACT_CANDIDATE_REMOVED:
        'Dieser unveröffentlichte Vertragsentwurf wurde entfernt. Erstellen Sie einen neuen Antrag.',
      CONTRACT_CATEGORY_INACTIVE: 'Wählen Sie eine aktive Vertragsart.',
      CONTRACT_CORRUPT_BALANCE:
        'Die Zahlungssummen des Vertrags sind inkonsistent. Wenden Sie sich an einen Administrator.',
      CONTRACT_EMPLOYEE_REQUIRED:
        'Ein aktiver Mitarbeiter mit einer Hauptabteilung ist erforderlich.',
      CONTRACT_FIELDS_RESTRICTED:
        'Die erforderlichen Vertragsfelder liegen außerhalb Ihrer Zugriffsberechtigung.',
      CONTRACT_FILE_SIZE:
        'Wählen Sie eine nicht leere Vertragsdatei mit höchstens 5 MB.',
      CONTRACT_FILE_TYPE:
        'Der Vertragstext muss eine PDF sein; Nachweise können PDF, JPEG, PNG oder WebP mit passendem Dateiinhalt sein.',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        'Dieser Anfrageschlüssel wurde bereits mit anderen Details verwendet. Aktualisieren Sie die Ansicht vor einer erneuten Einreichung.',
      CONTRACT_INACTIVE_SOURCE:
        'Wählen Sie eine wirksame genehmigte Vertragsquelle.',
      CONTRACT_INCOMPLETE_PROPOSAL:
        'Vervollständigen Sie die Vertragsbegründung, die Zahlungsbedingungen und die unveränderliche Textversion.',
      CONTRACT_INPUT_INVALID:
        'Prüfen Sie die deklarierten Vertragseingabefelder.',
      CONTRACT_INVALID_AMOUNT:
        'Geben Sie einen nicht negativen Betrag in exakten ganzzahligen Cent innerhalb des unterstützten Bereichs ein.',
      CONTRACT_INVALID_ID:
        'Eine gültige Identität innerhalb der zulässigen Grenzen ist erforderlich.',
      CONTRACT_INVALID_TIME: 'Der Vertragszeitstempel ist ungültig.',
      CONTRACT_LIMIT_EXCEEDED:
        'Die ausstehenden und bezahlten Beträge überschreiten die Vertragsgrenze.',
      CONTRACT_NOT_CANDIDATE:
        'Nur der unveröffentlichte Vertragsentwurf dieses Antrags darf entfernt werden.',
      CONTRACT_NOT_FOUND: 'Die Vertragsquelle wurde nicht gefunden.',
      CONTRACT_OUTSTANDING_PAYMENTS:
        'Geben Sie ausstehende Zahlungen frei, bevor Sie den Vertrag beenden.',
      CONTRACT_REASON_REQUIRED:
        'Geben Sie eine Begründung innerhalb der unterstützten Länge ein.',
      CONTRACT_REBASE_NOT_ALLOWED:
        'Nur der Antragsteller darf die Basisversion einer zurückgegebenen Änderung ausdrücklich aktualisieren.',
      CONTRACT_REQUEST_KEY_REQUIRED:
        'Ein beständiger Anfrageschlüssel ist erforderlich.',
      CONTRACT_RESERVATION_CLOSED:
        'Die Zahlungsreservierung wurde bereits geschlossen.',
      CONTRACT_RULE_INVALID:
        'Die Vertragsgenehmigungsrichtlinie fehlt oder ist ungültig. Wenden Sie sich an einen Administrator.',
      CONTRACT_SLA_UNSUPPORTED:
        'Der installierte Genehmigungsadapter unterstützt nur die konfigurierte Frist von 24/48 Stunden.',
      CONTRACT_SOURCE_CONFLICT:
        'Diese Referenz gehört zu einer anderen Vertragsquelle.',
      CONTRACT_STORED_ID_INVALID:
        'Eine gespeicherte Vertragsidentität ist ungültig. Wenden Sie sich an einen Administrator.',
      CONTRACT_SUPPLIER_INVALID:
        'Der Lieferant muss aktiv sein und eine genehmigte Qualifizierung haben. Aktualisieren Sie seine Qualifizierung vor der Genehmigung.',
      CONTRACT_TARGET_MISMATCH:
        'Das Genehmigungsziel gehört zu einem anderen Vertragsantrag.',
      CONTRACT_TEXT_INVALID:
        'Wählen Sie eine unveränderliche PDF-Textversion, die zu diesem Antrag gehört.',
      CONTRACT_TEXT_NOT_EDITABLE:
        'Vertragstextversionen dürfen nur an eigene Entwürfe oder zurückgegebene Revisionen angehängt werden.',
      CONTRACT_TEXT_REQUIRED:
        'Wählen Sie eine gültige unveränderliche Vertragstextversion.',
      CONTRACT_TRANSITION_NOT_ALLOWED:
        'Verwenden Sie den vorgesehenen geschützten Vertragsvorgang.',
      CONTRACT_VERSION_CONFLICT:
        'Der genehmigte Vertrag wurde geändert. Geben Sie den Antrag zurück, aktualisieren Sie seine Basisversion ausdrücklich und reichen Sie ihn erneut zur Prüfung ein.',
    },
    authz: {
      resource: 'Verträge und Änderungen',
      view: 'Vertragsanträge anzeigen',
      submit: 'Eigene Vertragsanträge erstellen und bearbeiten',
      ledger:
        'Genehmigtes Vertragsverzeichnis und unveränderliche Versionen lesen',
      historicalEntry:
        'Historischen Vertrag mit geprüftem Rechtsnachweis erfassen',
    },
  },
};
