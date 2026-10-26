export default {
  actionForm: {
    uncertain:
      'Das Ergebnis ist unbestätigt. Behalten Sie diese Eingaben bei und wiederholen Sie denselben Vorgang; senden Sie keine geänderte Anfrage.',
    replay: 'Identischen Vorgang wiederholen',
    title: 'Zahlungsantrag „{{name}}“: {{action}}',
    unavailable:
      'Diese Aktion ist nicht mehr verfügbar. Lesen Sie den neuesten Zahlungsantrag.',
    unsupported:
      'Diese Aktion erfordert ein Eingabeformat, das diese Seite nicht unterstützt.',
    comment: 'Stellungnahme oder Begründung',
    person: 'Empfänger',
    mode: 'Position des Unterzeichners',
    place: 'Genehmigungsstelle',
    returnTarget: 'Rückgabeziel',
    voucher: 'Zahlungsbelegnummer',
    voucherHint:
      'Nur leer lassen, wenn eine Abrechnung ohne Beleg administrativ erfasst wird.',
    amount: 'Zahlungsbetrag',
    amountConfirm: 'Exakten Zahlungsbetrag bestätigen',
    voucherAttachments: 'Zahlungsbeleganhänge',
    exactAmount: 'Geben Sie den oben angezeigten exakten Betrag ein.',
    confirm: '{{action}} bestätigen',
    confirmDescription:
      'Bestätigen Sie diesen Vorgang für „{{name}}“. Zahlung {{amount}}. {{consequence}}',
    releaseConsequence:
      'Dadurch werden nicht abgerechnete Reservierungen freigegeben. Dies kann hier nicht rückgängig gemacht werden.',
    returnConsequence:
      'Der Antrag wird zur Korrektur zurückgegeben und aktuell ausstehende Arbeit wird geschlossen.',
    paymentConsequence:
      'Erfassen Sie eine tatsächlich abgeschlossene Zahlung anhand ihres Belegs.',
    forcedConsequence:
      'Administrative Abrechnung erfassen; dadurch wird keine Banküberweisung ausgelöst.',
    unableConsequence: 'Der Antrag erhält eine Bearbeitungsausnahme.',
    submitConsequence:
      'Der Antrag geht in die Genehmigung; seine eingereichten Daten werden festgeschrieben.',
    genericConsequence:
      'Der Server wendet den angebotenen Vorgang auf das ausgewählte Genehmigungsziel an.',
    latest: 'Neueste Version lesen',
    conflict:
      'Der Zahlungsantrag wurde geändert. Ihre Eingaben bleiben erhalten. Lesen und prüfen Sie die neueste Version und bestätigen Sie erneut.',
    completed: '{{action}} für „{{name}}“ abgeschlossen',
    committed:
      'Der Vorgang wurde abgeschlossen. Aktualisieren Sie den Zahlungsantrag, bevor Sie eine weitere Aktion ausführen.',
    before: 'Davor',
    after: 'Danach',
    alongside: 'Parallel',
    revision: 'Korrektur durch den Antragsteller',
    required: 'Füllen Sie dieses Feld aus.',
    labels: {
      approve: 'Genehmigen',
      reject: 'Ablehnen',
      return: 'Zur Korrektur zurückgeben',
      returnTo: 'Zur Korrektur zurückgeben',
      submit: 'Zur Genehmigung einreichen',
      withdraw: 'Zurückziehen',
      terminate: 'Beenden',
      retryCash: 'Kassenbearbeitung erneut versuchen',
      retryCashAsAdmin:
        'Administrativer Wiederholungsversuch der Kassenbearbeitung',
      forcePayException: 'Außerordentliche Abrechnung erfassen',
      forceComplete: 'Administrative Abrechnung',
      reviseBusiness: 'Für die Genehmigung überarbeiten',
      claim: 'Übernehmen',
      release: 'Freigeben',
      assign: 'Zuweisen',
      complete: 'Zahlung bestätigen',
      unable: 'Zahlung nicht möglich',
      transfer: 'Versetzen',
      addSigner: 'Unterzeichner hinzufügen',
      cc: 'Kopieren',
      appoint: 'Bestimmen',
      reassign: 'Neu zuweisen',
      comment: 'Kommentar',
      read: 'Als gelesen markieren',
      urge: 'Erinnern',
    },
  },
};
