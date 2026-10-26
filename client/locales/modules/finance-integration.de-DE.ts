export default {
  financeIntegration: {
    title: 'Finanzsystem',
    readPermission: 'Finanzsynchronisierung anzeigen',
    sendPermission: 'Finanzbuchungen senden und abgleichen',
    send: 'An das Finanzsystem senden',
    resend: 'Erneut senden',
    lookup: 'Externes Ergebnis prüfen',
    reload: 'Gespeicherten Status aktualisieren',
    retry: 'Erneut versuchen',
    cancel: 'Abbrechen',
    confirmSend: 'Senden',
    confirmTitle: 'Diesen bezahlten Antrag an das Finanzsystem senden?',
    confirmDescription:
      'Die genehmigten Buchungsdaten werden an das verbundene Finanzsystem gesendet. Dabei wird keine weitere Zahlung ausgelöst. Bei einem erneuten Versuch wird dieselbe Geschäftsreferenz verwendet.',
    notConfigured:
      'Es ist kein Finanzgateway verbunden. Bitten Sie Ihren Administrator, die Verbindung einzurichten.',
    loadFailed:
      'Der Finanzstatus konnte nicht geladen werden. Prüfen Sie Ihre Zugriffsrechte oder versuchen Sie es erneut.',
    actionFailed:
      'Der Vorgang konnte nicht bestätigt werden. Aktualisieren Sie den Status, bevor Sie es erneut versuchen.',
    conflict:
      'Die Buchungsdaten oder das Ziel wurden nach dem ersten Versand geändert. Gleichen Sie den vorhandenen Eintrag mit der Finanzabteilung ab, bevor Sie fortfahren.',
    confirmBeforeRetry:
      'Eine Empfangsbestätigung ist kein Buchungsnachweis. Prüfen Sie das externe Ergebnis und senden Sie bei Bedarf denselben Antrag erneut.',
    voucher: 'Externer Beleg: {{number}}',
    states: {
      not_sent: 'Nicht gesendet',
      sending: 'Wird gesendet oder Ergebnis wird geprüft',
      accepted: 'Vom Finanzsystem empfangen; Buchung nicht bestätigt',
      posted: 'Beleg erstellt',
      rejected: 'Vom Finanzsystem abgelehnt',
      unknown: 'Ergebnis muss bestätigt werden',
    },
    results: {
      transport:
        'Die Verbindung wurde beendet, bevor ein Ergebnis bestätigt werden konnte.',
      unconfirmed:
        'Das Finanzsystem hat kein bestätigtes Ergebnis zurückgegeben.',
      invalid_receipt:
        'Die Empfangsbestätigung konnte diesem Antrag nicht zugeordnet werden.',
      not_found:
        'Bei dieser Prüfung wurde kein externer Datensatz gefunden. Eine frühere Empfangsbestätigung bleibt gültig.',
      invalid_mapping:
        'Die Zuordnung von Finanzkonto oder Lieferant muss geprüft werden.',
      invalid_document: 'Das Finanzsystem hat die Belegdaten abgelehnt.',
      duplicate_source:
        'Ein externer Eintrag verwendet diese Geschäftsreferenz bereits.',
      accounting_period_closed: 'Die Buchungsperiode ist geschlossen.',
      other: 'Bitten Sie die Finanzabteilung, das externe Ergebnis zu prüfen.',
    },
  },
};
