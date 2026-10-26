export default {
  purchases: {
    businessErrors: {
      PURCHASE_INVALID_ITEMS:
        'Jeder Beschaffungsartikel benötigt einen Namen, eine Einheit und eine positive Menge. Prüfen Sie auf doppelte Artikel.',
      PURCHASE_INVALID_DATE:
        'Wählen Sie ein gültiges voraussichtliches Empfangsdatum.',
      PURCHASE_INVALID_PRICE:
        'Geben Sie einen positiven tatsächlichen Preis ein, wählen Sie einen Lieferanten und fügen Sie dessen Angebotsnachweis hinzu.',
      PURCHASE_INVALID_QUOTES:
        'Eine Angebotsdatei kann nicht für verschiedene Lieferanten wiederverwendet werden. Wählen Sie separate Nachweise.',
      PURCHASE_QUOTES_REQUIRED:
        'Dieser Betrag erfordert Angebote von drei verschiedenen Lieferanten mit jeweils einem Anhang.',
      PURCHASE_PRICE_CONFIRMATION_REQUIRED:
        'Passen Sie das geschätzte Budget vor erneuter Einreichung an den bestätigten Angebotspreis an.',
      PURCHASE_INVALID_INPUT:
        'Fügen Sie Beschaffungsartikel und einen Zweck hinzu und geben Sie einen positiven Schätzbetrag ein.',
      PURCHASE_DEPARTMENT_REQUIRED:
        'Der Antragsteller benötigt eine aktive Hauptabteilung. Bitten Sie die Personalabteilung, den Mitarbeiterdatensatz zu aktualisieren.',
      INVALID_RECEIPT:
        'Wählen Sie das tatsächliche Empfangsdatum und geben Sie eine Begründung der Empfangsbestätigung ein.',
    },

    discardThenNavigate:
      'Diese ungespeicherten Änderungen verwerfen? Wählen Sie nach der Bestätigung Ihr Ziel erneut aus.',
    localInputsRetained:
      'Neueste Version geladen. Ihre Eingaben bleiben erhalten; prüfen Sie diese vor erneutem Speichern.',
    chooseForceMode: 'Bearbeitungsmethode auswählen',
    confirmForceClose: 'Beschaffung {{name}} schließen?',
    confirmPricing: 'Angebot für {{name}} bestätigen?',
    confirmCancelOrder: 'Bestellung {{name}} stornieren?',
    priceWillReturn:
      'Der Preis überschreitet die Schätzung um mehr als 20 %. Dadurch geht der Antrag vor der Finanzprüfung zur Bestätigung an den Antragsteller zurück.',
    pricingSubmitConsequence:
      'Die Einreichung schreibt dieses Angebot für die nächste Genehmigungsstufe fest und passt die Budgetreservierung an.',

    new: 'Neue Beschaffung',
    edit: 'Beschaffung bearbeiten',
    saved: 'Beschaffung gespeichert',
    formDescription:
      'Beschreiben Sie Artikel, Zweck und Schätzung. Die Einreichung reserviert das Budget der Hauptabteilung für das aktuelle Jahr des Unternehmenskalenders.',
    primaryDepartment: 'Hauptabteilung: {{department}}',
    yearHint:
      'Das Einreichungsjahr richtet sich nach dem Unternehmenskalender ({{timeZone}}).',
    departmentMissing: 'Keine Hauptabteilung',
    department: 'Abteilung',
    departmentPending: 'Wird bei Einreichung bestimmt',
    departmentUnavailable: 'Abteilung nicht verfügbar',
    budgetYear: 'Budgetjahr',
    purpose: 'Zweck',
    subject: 'Budgetposition',
    selectSubject: 'Budgetposition auswählen',
    estimated: 'Geschätzter Betrag',
    actual: 'Tatsächlicher Preis',
    actualAmount: 'Tatsächlicher Preis (Yuan)',
    yuan: 'Yuan',
    expectedDate: 'Voraussichtliches Lieferdatum',
    suggestedVendor: 'Vorgeschlagener Lieferant',
    selectedVendor: 'Ausgewählter Lieferant',
    vendor: 'Lieferant',
    vendorUnavailable: 'Lieferant nicht verfügbar',
    noSuggestedVendor: 'Kein vorgeschlagener Lieferant',
    vendorInactive: 'Aktiven Lieferanten auswählen',
    subjectInactive: 'Aktive Budgetposition auswählen',
    disabled: 'Deaktiviert',
    inactive: 'Inaktiv',
    fieldInvalid: 'Prüfen Sie dieses Feld',
    amountInvalid:
      'Geben Sie einen positiven Betrag mit höchstens zwei Nachkommastellen ein',
    amountHint: 'Verwenden Sie höchstens zwei Nachkommastellen.',
    dateInvalid: 'Gültiges Datum auswählen',
    items: 'Beschaffungsartikel',
    itemName: 'Artikelname',
    itemNumber: 'Artikel {{number}}',
    specification: 'Spezifikation',
    quantity: 'Menge',
    unit: 'Einheit',
    quantityInvalid:
      'Geben Sie eine positive Menge ein; Dezimalwerte werden unterstützt',
    quantityHint: 'Dezimale Mengen werden unterstützt, zum Beispiel 1,5 kg.',
    addItem: 'Artikel hinzufügen',
    removeItem: 'Artikel entfernen',
    reserveHint:
      'Entwürfe reservieren kein Budget. Die Einreichung erstellt die Reservierung.',
    loadLatest: 'Neuesten Antrag laden',
    unknownCreate:
      'Das Speicherergebnis ist ungewiss. Eine weitere Erstellung ist gesperrt. Prüfen Sie den Entwurf in der Aufgabenzentrale.',
    unknownEdit:
      'Das Speicherergebnis ist ungewiss. Laden Sie den neuesten Antrag, bevor Sie fortfahren.',
    unknownPricing:
      'Das Ergebnis ist ungewiss und das Formular gesperrt. Ein erneuter Versuch sendet identische Daten und dieselbe Anfrage-ID.',
    quotes: 'Angebotsnachweise',
    quoteEvidence: 'Lieferantenangebotsnachweise',
    quoteEvidenceDescription:
      'Laden Sie für jeden Lieferanten Nachweise hoch. Bestehende Nachweise können bei unveränderten Anforderungen wiederverwendet werden. Oberhalb des festgeschriebenen Angebotsschwellenwerts sind Nachweise von drei verschiedenen Lieferanten erforderlich.',
    addQuote: 'Lieferantenangebot hinzufügen',
    removeQuote: 'Angebotsauswahl entfernen',
    threeQuotesRequired:
      'Stellen Sie oberhalb des Angebotsschwellenwerts Angebotsanhänge von drei verschiedenen Lieferanten bereit.',
    selectExistingQuote: 'Vorhandenes Angebot auswählen: {{filename}}',
    refreshQuotes: 'Vorhandene Angebote aktualisieren',
    completePricing: 'Preisermittlung abschließen',
    forcePricing: 'Administrative Beschaffungsaktion',
    forceMode: 'Aktionsmodus',
    forcePriced: 'Vollständige Ergebnisse zur Finanzgenehmigung einreichen',
    forceClose: 'Schließung ohne Bestellung erzwingen',
    forceCloseDescription:
      'Die erzwungene Schließung gibt die Budgetreservierung frei und erfasst die Administratorbegründung. Sie erklärt weder Beschaffung noch Empfang als abgeschlossen und erstellt keine Bestellung.',
    priceConfirmationDescription:
      'Preise über 120 % der Schätzung gehen zur Bestätigung an den Antragsteller zurück. Andere Ergebnisse gehen in die Finanzgenehmigung.',
    confirmPriceHint:
      'Der Preis überschreitet 120 % der Schätzung. Prüfen Sie ihn und reichen Sie zur Bestätigung erneut ein.',
    handler: 'Beschaffungsbearbeiter',
    forcedClosedHint:
      'Ein Administrator hat diesen Antrag zwangsweise geschlossen. Die Reservierung ist freigegeben; es wurden weder Bestellung noch Empfang erstellt.',
    actualHold: 'Aktuelle Budgetreservierung',
    holdHint:
      'Die Genehmigung behält die Budgetreservierung bei. Das Budget wird abgerechnet, wenn der Antragsteller den Empfang bestätigt.',
    order: 'Bestellung',
    orderHint:
      'Die Bestellung schreibt genehmigten Preis, Lieferant und Artikel fest. Empfang und Zahlung werden separat verfolgt.',
    openOrder: 'Bestellung öffnen',
    mergedTitle: 'Benachbarte Genehmigungen zusammengeführt',
    merged:
      '{{name}} hat die benachbarte Stufe persönlich abgeschlossen; die Genehmigung durch dieselbe Person wurde zusammengeführt.',
    authz: {
      orderScope:
        'Bestellungen von Beschaffungen, die dieser Benutzer lesen darf',
      resource: 'Beschaffungen',
      submit: 'Beschaffungen einreichen',
      view: 'Beschaffungen anzeigen',
      orders: 'Bestellungen anzeigen',
      accept: 'Empfang bestätigen',
    },
    errors: {
      insufficient:
        'Das verfügbare Budget reicht nicht aus. Wenden Sie sich an den Budgetverantwortlichen.',
      inactive: 'Der Antragsteller ist inaktiv.',
      configuration:
        'Die Genehmigungskonfiguration wird nicht unterstützt. Wenden Sie sich an einen Administrator.',
      invalid: 'Prüfen Sie die hervorgehobenen Felder.',
    },
    states: {
      draft: 'Entwurf',
      revision: 'Revision',
      head: 'Abteilungsgenehmigung',
      purchasing: 'Beschaffungsbearbeitung',
      exception: 'Beschaffungsausnahme',
      finance: 'Finanzgenehmigung',
      executive: 'Genehmigung der Bereichsleitung',
      gm: 'Genehmigung der Geschäftsführung',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
      terminated: 'Beendet',
      forcedClosed: 'Zwangsweise geschlossen',
    },
    stages: {
      draft: 'Entwurf',
      revision: 'Revision',
      head: 'Abteilungsgenehmigung',
      purchasing: 'Beschaffungsbearbeitung',
      exception: 'Beschaffungsausnahme',
      finance: 'Finanzgenehmigung',
      executive: 'Genehmigung der Bereichsleitung',
      gm: 'Genehmigung der Geschäftsführung',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
      terminated: 'Beendet',
      forcedClosed: 'Zwangsweise geschlossen',
    },
    actions: {
      claim: 'Übernehmen',
      release: 'Übernahme freigeben',
      complete: 'Preisermittlung abschließen',
      unable: 'Beschaffung nicht möglich',
      forceComplete: 'Administratoraktion',
      cc: 'Kopieren',
    },
    ledgerTitle: 'Bestellverzeichnis',
    ledgerDescription:
      'Prüfen Sie genehmigte Bestellungen, Empfangsstatus und Zahlungsnachweise. Der Empfang rechnet das Budget ab; Zahlungen werden unabhängig erfasst.',
    orderNumber: 'Bestellnummer',
    emptyOrders: 'Keine Bestellungen in Ihrem Bereich',
    pendingPayments: 'Ausstehende Zahlungen (Yuan)',
    paidPayments: 'Bezahlter Betrag (Yuan)',
    receiptDate: 'Empfangsdatum',
    acceptedBy: 'Empfang bestätigt von',
    receiptReason: 'Empfangsnotizen',
    confirmReceipt: 'Empfang bestätigen',
    cancelOrder: 'Bestellung stornieren',
    orderSaved: 'Bestellung aktualisiert',
    unknownOrderAction:
      'Das Ergebnis ist ungewiss. Das Formular ist gesperrt; ein erneuter Versuch sendet identische Daten und dieselbe Anfrage-ID.',
    receiptSettlementHint:
      'Die Bestätigung rechnet die Budgetreservierung der Bestellung ab. Sie bedeutet nicht, dass der Lieferant bezahlt wurde. Der bestätigte Empfang ist unveränderlich.',
    cancelOrderHint:
      'Nur Genehmigungsadministratoren können eine noch nicht empfangene Bestellung ohne ausstehende oder bezahlte Beträge stornieren. Die Stornierung gibt die Budgetreservierung frei und erfasst die Begründung.',
    orderStates: {
      awaitingReceipt: 'Empfang ausstehend',
      accepted: 'Empfangen',
      cancelled: 'Abgebrochen',
    },
    actionTitle: 'Beschaffung „{{name}}“: {{action}}',
    completed: '{{action}} für Beschaffung „{{name}}“ abgeschlossen',
    quoteBasisChanged:
      'Die Beschaffungsanforderungen wurden geändert. Ihre Entwurfseingaben bleiben erhalten, aber Angebotsnachweise müssen den neuesten Anforderungen entsprechen.',
    frozenRules: 'Bei Einreichung angewandte Regeln',
    frozenRulesHint:
      'Nur Beträge strikt oberhalb dieser Schwellenwerte erfordern die entsprechenden Angebotsnachweise oder Genehmigungsstufen. Spätere Regeländerungen ändern diese Einreichung nicht.',
    ruleLabels: {
      purchase_quotes: 'Schwellenwert für drei Lieferantenangebote',
      spend_vp: 'Genehmigungsschwellenwert der Bereichsleitung',
      spend_gm: 'Genehmigungsschwellenwert der Geschäftsführung',
    },
    staleQuoteUpload:
      'Die Bearbeitungsversion wurde geändert. Aktualisieren Sie den Antrag vor dem Hochladen von Angebotsnachweisen.',
    ordersTitle: 'Bestellungen',
  },
};
