export default {
  invoiceRecognition: {
    currentValues: 'Aktuelle ungespeicherte Werte',
    reload: 'Gespeichertes Ergebnis aktualisieren',
    receivedAt: 'Ergebnis empfangen: {{time}}',
    notConfigured:
      'Das Rechnungsgateway ist nicht verbunden. Sie können Rechnungsdetails weiterhin manuell eingeben.',
    title: 'Rechnungserkennung und -prüfung',
    readPermission: 'Rechnungsergebnisse lesen',
    recognizePermission: 'Bearbeitbare Rechnungsanhänge erkennen',
    verifyPermission: 'Autorisierte Rechnungspositionen prüfen',
    recognizeAttachment: 'Anhang {{index}} erkennen',
    verifyAttachment: 'Rechnung prüfen · Anhang {{index}}',
    processing: 'Rechnung wird verarbeitet…',
    failed:
      'Dieser Vorgang konnte nicht abgeschlossen werden. Prüfen Sie Ihre Zugriffsrechte und die Gateway-Konfiguration und versuchen Sie es erneut. Ihre eingegebenen Werte bleiben unverändert.',
    changed:
      'Diese Position wurde geändert. Führen Sie den Vorgang erneut aus, bevor Sie dieses Ergebnis übernehmen oder verwenden.',
    unconfirmed: 'Das Ergebnis wurde noch nicht bestätigt.',
    recover: 'Externes Ergebnis prüfen',
    reference: 'Prüfreferenz: {{reference}}',
    confirmTitle: 'Erkannte Rechnung prüfen',
    confirmDescription:
      'Vergleichen Sie diese Vorschläge mit dem Originalanhang. Die Übernahme ändert nur diese ungespeicherte Position; die Rechnung wird weder gespeichert noch eingereicht oder geprüft.',
    number: 'Rechnungsnummer',
    date: 'Rechnungsdatum',
    amount: 'Gesamtbetrag einschließlich Steuer',
    cancel: 'Abbrechen',
    apply: 'Für diese Position übernehmen',
    states: {
      not_checked: 'Nicht geprüft',
      pending: 'Verarbeitung ausstehend',
      running: 'In Verarbeitung',
      recognized: 'Erkannt; vor der Übernahme prüfen',
      multiple:
        'Mehrere Rechnungen gefunden. Teilen Sie den Anhang auf oder geben Sie diese Position manuell ein.',
      unreadable:
        'Diese Rechnung konnte nicht erkannt werden. Geben Sie die Details manuell ein.',
      rejected: 'Der externe Dienst konnte diese Rechnung nicht verarbeiten.',
      valid:
        'Die externe Prüfung stimmt mit den aktuellen Rechnungsdaten überein.',
      mismatch:
        'Die Rechnungsdaten stimmen nicht mit der externen Prüfung überein.',
      not_found:
        'Keine passende Rechnung gefunden. Bitten Sie die Finanzabteilung um Prüfung.',
      unknown:
        'Ergebnis nicht bestätigt. Fragen Sie vor einem erneuten Versuch das externe Ergebnis ab.',
    },
  },
};
