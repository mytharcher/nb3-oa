export default {
  vendors: {
    saved: 'Lieferant „{{name}}“ gespeichert',

    title: 'Lieferanten',
    description:
      'Der Einkauf pflegt manuelle Lieferanten. Genehmigte Bestellungen behalten ihre erfassten Lieferantendaten.',
    new: 'Neuer Lieferant',
    edit: 'Lieferant bearbeiten',
    view: 'Lieferantendetails',
    refresh: 'Aktualisieren',
    search: 'Nach Name, Code oder Kategorie suchen',
    clear: 'Filter zurücksetzen',
    rowActions: 'Aktionen für {{name}}',
    save: 'Speichern',
    cancel: 'Abbrechen',
    loading: 'Lieferanten werden geladen',
    retry: 'Erneut versuchen',
    active: 'Aktiv',
    status: 'Status',
    statuses: {
      manual: 'Manueller Lieferant',
      qualified: 'Qualifiziert',
      disabled: 'Deaktiviert',
    },
    updatedAt: 'Aktualisiert',
    reason: 'Begründung dieser Änderung',
    formDescription:
      'Lieferantenänderungen und Bankdaten werden protokolliert. Die Deaktivierung verhindert neue Einkäufe und Zahlungen.',
    disableHint: 'Neue Einkäufe und Zahlungskontodaten werden gesperrt.',
    required: 'Dieses Feld ist erforderlich.',
    invalidCode:
      'Verwenden Sie Buchstaben, Ziffern, Punkte, Bindestriche oder Unterstriche.',
    invalidEmail: 'Geben Sie eine gültige E-Mail-Adresse ein.',
    noChanges: 'Ändern Sie vor dem Speichern mindestens ein Feld.',
    unknownCreate:
      'Das Erstellungsergebnis ist unbekannt. Prüfen Sie die Lieferantenliste und den Code, bevor Sie einen weiteren Lieferanten erstellen.',
    unknownEdit:
      'Das Ergebnis ist unbekannt. Laden Sie vor einem erneuten Versuch den neuesten Lieferanten; Ihre nicht gespeicherten Änderungen bleiben erhalten.',
    loadLatest: 'Neuesten Lieferanten laden',
    fields: {
      code: 'Code',
      name: 'Name',
      category: 'Kategorie',
      contactName: 'Kontakt',
      contactPhone: 'Telefon',
      contactEmail: 'E-Mail',
      bankName: 'Bank',
      bankAccount: 'Bankkonto',
      bankAccountName: 'Kontoname',
    },
    authz: {
      resource: 'Lieferanten',
      view: 'Lieferantendetails lesen',
      manage: 'Lieferanten pflegen',
      bankRead: 'Bankinformationen lesen',
      createdScope: 'Vom aktuellen Benutzer erstellte Lieferanten',
    },
    empty: {
      accountsTitle: 'Keine Lieferanten',
      accountsDescription:
        'Fügen Sie einen manuellen Lieferanten für den Einkauf hinzu.',
      readonlyTitle: 'Keine lesbaren Lieferanten',
      readonlyDescription:
        'In Ihrem gewährten Bereich gibt es keine Lieferanten. Bitten Sie den Einkauf, einen Lieferanten hinzuzufügen, oder einen Administrator um die Berechtigung zur Lieferantenpflege.',
      filteredTitle: 'Keine passenden Lieferanten',
      filteredDescription: 'Ändern oder löschen Sie die Suche.',
    },
    error: {
      forbidden:
        'Sie sind nicht berechtigt, auf diese Lieferanten zuzugreifen.',
      missing:
        'Dieser Lieferant ist nicht verfügbar. Aktualisieren Sie die übergeordnete Liste.',
      invalid: 'Prüfen Sie die Lieferantenfelder.',
      failed:
        'Lieferanten konnten nicht geladen oder gespeichert werden. Versuchen Sie es erneut.',
      VENDOR_INVALID_INPUT:
        'Prüfen Sie die Kontakt- und Bankfelder des Lieferanten.',
      VENDOR_INVALID_COMMAND:
        'Ein Bearbeiter und eine Änderungsbegründung sind erforderlich.',
      VENDOR_CODE_EXISTS: 'Dieser Code gehört bereits zu einem Lieferanten.',
      VENDOR_VERSION_CONFLICT:
        'Dieser Lieferant wurde geändert. Laden Sie die neueste Version vor einem erneuten Versuch.',
      VENDOR_NOT_FOUND: 'Dieser Lieferant ist nicht verfügbar.',
      VENDOR_INACTIVE: 'Wählen Sie einen aktiven Lieferanten.',
      VENDOR_FIELDS_RESTRICTED:
        'Die Lieferantenfelder liegen außerhalb Ihrer Berechtigung.',
      VENDOR_ACCESS_DENIED:
        'Sie sind für diese Lieferantenaktion nicht berechtigt.',
      VENDOR_PAYMENT_ACCOUNT_REQUIRED:
        'Vervollständigen Sie vor der Zahlung die Bankdaten des Lieferanten.',
    },
  },
};
