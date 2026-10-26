export default {
  loanRequests: {
    relatedUnavailable: 'Verknüpfter Datensatz nicht verfügbar',
    rowActions: 'Aktionen für {{name}}',
    description: 'Vorschussanträge, Zahlungen und Rückzahlungen verwalten.',

    saved: 'Vorschussantrag „{{name}}“ gespeichert',
    submitted: 'Vorschussantrag „{{name}}“ eingereicht',
    cashRecorded: 'Barrückzahlung für „{{name}}“ erfasst',
    repaymentConfirmed: 'Rückzahlung „{{receipt}}“ bestätigt',
    repaymentCancelled: 'Rückzahlung „{{receipt}}“ storniert',
    confirmRepaymentTitle: 'Rückzahlung „{{receipt}}“ bestätigen?',
    cancelRepaymentTitle: 'Rückzahlung „{{receipt}}“ stornieren?',

    businessErrors: {
      LOAN_REQUEST_DEPARTMENT_REQUIRED:
        'Der Antragsteller benötigt eine aktive Hauptabteilung. Bitten Sie die Personalabteilung, den Mitarbeiterdatensatz zu aktualisieren.',
      LOAN_REQUEST_INVALID_DATE:
        'Das Rückzahlungsdatum muss in der Unternehmenszeitzone heute oder später sein.',
      LOAN_REQUEST_INVALID_TRAVEL:
        'Wählen Sie Ihre eigene wirksame genehmigte Dienstreise.',
      LOAN_REQUEST_INVALID_INPUT:
        'Geben Sie einen Vorschussgrund und einen positiven Betrag ein.',
      LOAN_REQUEST_NOT_PAID:
        'Dieser Vorschuss wurde nicht ausgezahlt. Rückzahlungen können erst nach der Auszahlung erfasst werden.',
      LOAN_REQUEST_REPAYMENT_INPUT_INVALID:
        'Geben Sie den Rückzahlungsbeleg und eine Begründung ein.',
    },

    loadLatest: 'Neueste Daten laden',
    latestFacts:
      'Version {{version}} · {{amount}} Yuan · fällig {{date}} · Zweck: {{reason}}',
    adoptVersion: 'Meine Eingaben beibehalten und diese Version verwenden',
    noLongerEditable: 'Dieser Antrag kann nicht mehr bearbeitet werden.',
    invalidDate:
      'Wählen Sie ein aktuelles oder zukünftiges Datum im Unternehmenskalender.',
    number: 'Referenz',
    more: 'Weitere Aktionen',
    confirm: 'Bestätigen',
    operationLabels: {
      complete: 'Zahlung abschließen',
      unable: 'Zahlung fehlgeschlagen',
      retryCash: 'Zahlung erneut versuchen',
      claim: 'Bearbeitung übernehmen',
      release: 'Bearbeitung freigeben',
      assign: 'Bearbeiter zuweisen',
    },
    confirmRetry:
      'Aktualisieren Sie Ihre Bankkontodaten und geben Sie diesen genehmigten Antrag an die Kassenbearbeitung zurück.',
    confirmPayment:
      'Bestätigen Sie, dass die Zahlung mit diesem Beleg tatsächlich abgeschlossen wurde. Dadurch entsteht die Schuld des Vorschussempfängers.',
    confirmUnable:
      'Erfassen Sie die Zahlungsausnahme und eine Begründung. Der genehmigte Betrag bleibt reserviert.',
    receipt: 'Belegreferenz',
    actions: 'Aktionen',
    bank: 'Geschütztes Zahlungskonto',
    hideBank: 'Zahlungskonto ausblenden',
    showBank: 'Zahlungskonto anzeigen',
    bankRestricted:
      'Nur der Vorschussempfänger und ausdrücklich autorisierte Finanzrollen können das Zahlungskonto lesen.',
    bankName: 'Bank',
    bankHolder: 'Kontoinhaber',
    bankAccount: 'Bankkontonummer',
    loadingBank: 'Zahlungskonto wird geladen…',
    bankNotSnapshot: 'Noch kein Zahlungskonto erfasst.',
    recordCash: 'Barrückzahlung erfassen',
    invalidRepaymentAmount:
      'Rückzahlungsbeträge konnten nicht gelesen werden. Bitten Sie die Finanzabteilung, diesen Datensatz zu prüfen.',
    noRepayments: 'Keine Rückzahlungsnachweise',
    loading: 'Wird geladen…',
    confirmRepayment: 'Rückzahlung bestätigen',
    cancelRepayment: 'Ausstehenden Beleg stornieren',
    confirmReason: 'Vorschussempfänger hat Barrückzahlung bestätigt',
    cancelReason:
      'Kassenbearbeiter hat ausstehenden Barzahlungsbeleg storniert',
    confirmCashWarning:
      'Bestätigen Sie Beleg {{receipt}} über {{amount}} Yuan. Dies verringert Ihre Schuld und kann nicht rückgängig gemacht werden.',
    cancelCashWarning:
      'Stornieren Sie Beleg {{receipt}} über {{amount}} Yuan. Ihre ausstehende Schuld bleibt unverändert.',
    cashRestricted:
      'Nur Kassenbearbeiter können Rückzahlungen für einen ausgezahlten Vorschuss erfassen.',
    repaymentStates: {
      pending: 'Bestätigung ausstehend',
      settled: 'Bestätigt',
      cancelled: 'Abgebrochen',
    },
    department: 'Abteilung',
    yuan: 'Yuan',
    inflight: 'Gegen die Vorschussgrenze reserviert: {{amount}} Yuan',
    quotaFact:
      'Einreichungsdaten: Schuld {{debt}}, andere Anträge {{inflight}}, Gesamtsumme einschließlich dieses Antrags {{total}} Yuan.',
    principal: 'Ursprünglicher Hauptbetrag',
    repaid: 'Zurückgezahlt',
    outstanding: 'Ausstehende Schuld',
    pendingRepayment: 'Ausstehende Rückzahlungsreservierungen',
    pendingHint:
      'Ausstehende Barzahlungsbestätigungen und Erstattungsverrechnungen verringern die ausstehende Schuld nicht.',
    edit: 'Vorschussentwurf bearbeiten',
    invalidAmount:
      'Geben Sie einen positiven Betrag mit bis zu zwei Nachkommastellen ein.',
    invalidTravel:
      'Wählen Sie Ihren eigenen genehmigten aktiven Dienstreiseantrag.',
    readOnly: 'Sie sind nicht berechtigt, diesen Entwurf zu bearbeiten.',
    bankMissing:
      'Ihr Zahlungskonto ist unvollständig. Aktualisieren Sie es, bevor die Kassenbearbeitung die Zahlung abschließen kann.',
    conflict:
      'Der Antrag wurde geändert. Öffnen Sie vor erneuter Bearbeitung die aktuellen Details.',
    amountHint:
      'Beträge verwenden exakte Cent; höchstens zwei Nachkommastellen.',
    companyDate: 'Kalenderdatum in der Unternehmenszeitzone: {{zone}}',
    noTravel: 'Keine Reiseverknüpfung',
    search: 'Nummer, Zweck oder Antragsteller',
    allStatuses: 'Alle Status',
    view: 'Arbeitsliste',
    filteredEmpty: 'Keine passenden Vorschussanträge',
    empty: 'Keine Vorschussanträge',
    emptyHint:
      'Erstellen Sie einen Vorschussantrag zur Finanzierung genehmigter geschäftlicher Erfordernisse.',
    clear: 'Filter zurücksetzen',
    states: {
      draft: 'Entwurf',
      revision: 'Zur Überarbeitung zurückgegeben',
      manager: 'Prüfung durch die Führungskraft',
      head: 'Prüfung durch die Abteilungsleitung',
      finance: 'Prüfung durch die Finanzabteilung',
      executive: 'Prüfung durch die stellvertretende Geschäftsführung',
      gm: 'Prüfung durch die Geschäftsführung',
      cashier: 'Zahlung ausstehend',
      exception: 'Zahlungsausnahme',
      paid: 'Bezahlt',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
      terminated: 'Beendet',
    },
    stages: {
      draft: 'Entwurf',
      revision: 'Zur Überarbeitung zurückgegeben',
      manager: 'Prüfung durch die Führungskraft',
      head: 'Prüfung durch die Abteilungsleitung',
      finance: 'Prüfung durch die Finanzabteilung',
      executive: 'Prüfung durch die stellvertretende Geschäftsführung',
      gm: 'Prüfung durch die Geschäftsführung',
      cashier: 'Zahlung ausstehend',
      exception: 'Zahlungsausnahme',
      paid: 'Bezahlt',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
      terminated: 'Beendet',
    },
    errors: {
      inactive: 'Ein aktiver Mitarbeiterdatensatz ist erforderlich.',
      configuration:
        'Der Genehmigungsantrag kann nicht eingereicht werden. Wenden Sie sich an einen Administrator, um die Genehmigungsfristen zu prüfen.',
      invalid: 'Prüfen Sie die Eingabefelder und versuchen Sie es erneut.',
      quota: 'Die persönliche Vorschussgrenze würde überschritten.',
      overdue:
        'Zahlen Sie Ihre überfälligen Schulden zurück, bevor Sie einen weiteren Vorschuss beantragen.',
    },
    authz: {
      ownedScope: 'Von mir beantragte oder erstellte Anträge',
      resource: 'Vorschussanträge',
      submit: 'Eigene Vorschussanträge einreichen',
      delegate: 'Vorschussanträge für Mitarbeiter erstellen',
      view: 'Vorschussanträge lesen',
      payment: 'Geschützte Vorschusszahlungsdetails lesen',
      cashRepayment: 'Barrückzahlungen erfassen und stornieren',
      confirmRepayment: 'Eigene Barrückzahlungen bestätigen',
      collection: 'Vorschussanträge',
    },
    title: 'Vorschussanträge',
    new: 'Neuer Vorschussantrag',
    reason: 'Vorschusszweck',
    amount: 'Vorschussbetrag (Yuan)',
    dueDate: 'Rückzahlungsdatum',
    travel: 'Verknüpfter Dienstreiseantrag',
    status: 'Status',
    refresh: 'Aktualisieren',
    loan: 'Vorschusssaldo',
    repayment: 'Barrückzahlung',
    voucher: 'Zahlungsbeleg',
  },
};
