export default {
  supplies: {
    namedRowActions: 'Aktionen für {{name}}',

    businessErrors: {
      SUPPLY_REQUIRED_FIELDS:
        'Fügen Sie mindestens einen Artikel hinzu und geben Sie seinen Zweck an.',
      SUPPLY_ITEM_UNAVAILABLE:
        'Ein ausgewählter Artikel ist nicht verfügbar. Wählen Sie erneut einen aktivierten Artikel.',
      SUPPLY_CONTENT_CHANGED:
        'Die genehmigten Artikel wurden geändert. Aktualisieren Sie den Antrag, bevor Sie die Ausgabe erfassen.',
    },

    rowActions: 'Erfassungsaktionen',
    number: 'Anforderungsnummer',
    unknownEdit:
      'Das Speicherergebnis ist ungewiss. Laden Sie den neuesten Antrag, bevor Sie ihn erneut bearbeiten.',
    emptyCatalog:
      'Es sind keine aktiven Büroartikel konfiguriert. Wenden Sie sich an die Verwaltung.',
    ledgerDetail: 'Ausgabenachweis',
    ledgerDescription:
      'Erfasste Mengen und administrative Abschlüsse. Unbestätigte Mengen belegen keine Lieferung.',
    entryMissing: 'Dieser Ausgabenachweis ist nicht verfügbar.',
    authz: {
      resource: 'Büromaterialanforderungen',
      ledger: 'Büromaterialausgabeverzeichnis lesen',
    },
    navigation: 'Büromaterialverzeichnis',
    new: 'Neue Büromaterialanforderung',
    edit: 'Büromaterialanforderung bearbeiten',
    formDescription:
      'Wählen Sie Artikel und Mengen. Ihre Führungskraft genehmigt den Antrag, bevor die Verwaltung die Artikel ausgibt.',
    purpose: 'Zweck',
    item: 'Artikel',
    items: 'Angeforderte Artikel',
    quantity: 'Menge',
    quantityValue: 'Menge: {{quantity}}',
    chooseItem: 'Artikel auswählen',
    line: 'Artikel {{number}}',
    remove: 'Artikel {{number}} entfernen',
    addItem: 'Artikel hinzufügen',
    quantityInvalid: 'Geben Sie eine ganzzahlige Menge von 1 bis 100.000 ein.',
    duplicate: 'Wählen Sie jeden Artikel nur einmal.',
    emailInvalid: 'Geben Sie eine gültige E-Mail-Adresse ein.',
    printRequired:
      'Vervollständigen Sie die erforderlichen Angaben für den Visitenkartendruck.',
    print: {
      name: 'Name',
      title: 'Stellenbezeichnung',
      phone: 'Telefon',
      email: 'E-Mail',
      address: 'Adresse',
      department: 'Abteilung (optional)',
    },
    approvedAt: 'Genehmigungszeitpunkt der Führungskraft',
    issuingStage: 'Administrative Ausgabe',
    resubmitHint:
      'Eine erneute Einreichung unveränderter Artikel und Zwecke geht zurück an die Verwaltung. Änderungen erfordern erneut die Genehmigung der Führungskraft. Die vorherige Genehmigung bleibt im Verlauf erhalten.',
    forcedHint:
      'Ein Genehmigungsadministrator hat diesen Antrag ohne Bestätigung der tatsächlichen Ausgabe geschlossen. Die tatsächlichen Mengen sind unbestätigt.',
    uncertainCreate:
      'Das Speicherergebnis ist ungewiss. Schließen Sie die Ansicht und prüfen Sie „Meine Anträge“, bevor Sie einen weiteren Entwurf erstellen.',
    invalid: 'Prüfen Sie Zweck, Artikelauswahl und ganzzahlige Mengen.',
    itemUnavailable:
      'Ein Artikel ist deaktiviert oder fehlt. Aktualisieren Sie die Ansicht, bevor Sie geänderte Inhalte einreichen.',
    inactive: 'Ein aktiver Mitarbeiterdatensatz ist erforderlich.',
    configuration:
      'Der Genehmigungsantrag kann nicht eingereicht werden. Wenden Sie sich an einen Administrator, um die Genehmigungsfristen zu prüfen.',
    contentChanged:
      'Die Inhalte stimmen nicht mehr mit dem genehmigten Antrag überein. Laden Sie die neueste Version.',
    reasonRequired: 'Geben Sie eine Begründung an.',
    actions: {
      claim: 'Ausgabe übernehmen',
      release: 'Übernahme freigeben',
      assign: 'Bearbeiter zuweisen',
      complete: 'Ausgabe bestätigen',
      unable: 'Ausgabe nicht möglich',
      forceComplete: 'Schließen erzwingen',
    },
    actionHints: {
      complete:
        'Bestätigen Sie, dass jeder angeforderte Artikel tatsächlich in der vollen angeforderten Menge ausgegeben wurde. Dadurch wird das Ausgabeverzeichnis geschrieben.',
      unable:
        'Erläutern Sie den Bestandsmangel oder einen anderen Grund, weshalb die Ausgabe nicht abgeschlossen werden kann. Die Genehmigung der Führungskraft bleibt erhalten.',
      release:
        'Geben Sie diese Übernahme frei, damit ein anderer Verwaltungsbearbeiter sie übernehmen kann.',
      forceComplete:
        'Auf Verwaltungsentscheidung ohne Lieferbestätigung schließen. Tatsächliche Mengen werden als unbestätigt erfasst. Eine Begründung ist erforderlich.',
    },
    states: {
      issuing: 'Ausgabe ausstehend',
      exception: 'Ausgabeausnahme',
      issued: 'Ausgegeben',
      forcedClosed: 'Administrativ geschlossen',
    },
    ledgerTitle: 'Büromaterialausgabeverzeichnis',
    requestedQuantity: 'Angeforderte Menge',
    actualQuantity: 'Tatsächliche Menge',
    outcome: 'Ergebnis',
    recipient: 'Empfänger',
    issuer: 'Bearbeiter',
    unconfirmed: 'Unbestätigt',
    reason: 'Begründung',
    emptyLedger: 'Keine Ausgabenachweise',
    viewRequest: 'Anforderung anzeigen',
  },
};
