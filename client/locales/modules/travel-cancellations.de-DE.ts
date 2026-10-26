export default {
  // Existing permission titles use the collection name.
  travelCancellations: {
    authz: {
      resource: 'Dienstreisestornierungsanträge',
      submit: 'Dienstreisestornierungsantrag einreichen',
      delegate: 'Im Namen eines Mitarbeiters einreichen',
      view: 'Dienstreisestornierungsanträge anzeigen',
    },
  },
  travelCancellation: {
    fieldInvalid: 'Prüfen Sie {{field}}.',

    sourceUnavailable: 'Ursprüngliche Dienstreise nicht verfügbar',
    exceptionReason: 'Ausnahmebegründung',
    exception: 'Buchungsstornierungsausnahme',
    businessErrors: {
      TRAVEL_CANCELLATION_REASON_REQUIRED:
        'Geben Sie den Grund für die Dienstreisestornierung ein.',
      TRAVEL_CANCELLATION_ALREADY_PENDING:
        'Für diese Dienstreise ist bereits eine Stornierung ausstehend. Öffnen Sie den vorhandenen Antrag.',
      TRAVEL_CANCELLATION_BASELINE_CHANGED:
        'Die genehmigte Dienstreise wurde geändert. Aktualisieren Sie sie und überarbeiten Sie die Stornierung vor der erneuten Einreichung.',
      TRAVEL_CANCELLATION_INVALID_SOURCE:
        'Die ursprüngliche Dienstreise kann nicht mehr storniert werden. Wählen Sie eine wirksame genehmigte Dienstreise.',
    },

    retryUnbooking: 'Verwaltungsstornierung erneut versuchen',
    bookingInformation: 'Stornierungsauftrag und Rückerstattungsvereinbarungen',
    unbookingHint:
      'Die ursprüngliche Dienstreise wird nach Genehmigung der Abteilungsleitung widerrufen. Die Verwaltung muss Stornierungs- und Rückerstattungsvereinbarungen erfassen; dadurch wird keine Rückerstattungszahlung bestätigt.',
    complete: 'Verwaltungsstornierung abschließen',
    unable: 'Buchung kann nicht storniert werden',
    forceComplete: 'Stornierung zwangsweise schließen',
    source: 'Ursprüngliche Dienstreise',
    chooseSource: 'Genehmigte Dienstreise auswählen',
    effectHint:
      'Die ursprüngliche Abteilungsleitung muss genehmigen, bevor Anwesenheit und Erstattungsberechtigung widerrufen werden. Verknüpfte Vorschüsse werden entsprechend ihrem Auszahlungsstatus behandelt.',
    cc: 'Kopieempfänger hinzufügen',
    authz: {
      resource: 'Dienstreisestornierungsanträge',
      submit: 'Dienstreisestornierungsantrag einreichen',
      delegate: 'Im Namen eines Mitarbeiters einreichen',
      view: 'Dienstreisestornierungsanträge anzeigen',
    },
    new: 'Neuer Dienstreisestornierungsantrag',
    edit: 'Dienstreisestornierungsantrag bearbeiten',
    formDescription: 'Stornierung einer genehmigten Dienstreise beantragen.',
    name: 'Name der Dienstreisestornierung',
    institution: 'Einrichtung',
    startAt: 'Beginn',
    endAt: 'Ende',
    usesWorkingTime: 'Nutzt Arbeitszeit',
    amount: 'Gebühr (Yuan)',
    yuan: 'Yuan',
    yes: 'Ja',
    no: 'Nein',
    timeZone: 'Unternehmenszeitzone: {{zone}}',
    amountHint:
      'Geben Sie Yuan mit bis zu zwei Nachkommastellen ein. Gebühren von null sind zulässig.',
    amountInvalid:
      'Geben Sie einen nicht negativen Betrag mit bis zu zwei Nachkommastellen ein.',
    dateInvalid:
      'Wählen Sie einen gültigen Zeitraum, dessen Ende nach dem Beginn liegt.',
    approvalHint:
      'Bei Nutzung von Arbeitszeit erfasst die Genehmigung die Anwesenheit zur Dienstreisestornierung. Eine kostenpflichtige Dienstreisestornierung erzeugt ein genehmigtes Erstattungsbudget; es wurde noch keine Zahlung geleistet.',
    approvedFacts:
      'Diese Dienstreisestornierung wurde genehmigt. Die Personalabteilung erhält eine Kopie.',
    attendanceRecorded:
      'Die Anwesenheitsaktivität zur Dienstreisestornierung wurde erfasst.',
    authorizationIssued:
      'Genehmigtes Erstattungsbudget: {{amount}} Yuan. Erstattungsanträge unterliegen der Budgetrichtlinie.',
    zeroNoAuthorization:
      'Für eine kostenlose Dienstreisestornierung wird kein Gebührenbudget erstellt.',
    uncertainCreate:
      'Das Speicherergebnis ist unbekannt. Prüfen Sie „Meine Anträge“, bevor Sie einen weiteren Antrag erstellen.',
    inactive: 'Ein aktiver Mitarbeiterdatensatz ist erforderlich.',
    configuration:
      'Der Genehmigungsantrag kann nicht eingereicht werden. Wenden Sie sich an einen Administrator, um die Genehmigungsfristen zu prüfen.',
    invalid:
      'Prüfen Sie die Antragsfelder und laden Sie bei Bedarf den neuesten Datensatz.',
    stages: {
      unbooking: 'Administrative Buchungsstornierung',
      manager: 'Direkte Führungskraft',
      head: 'Abteilungsleitung',
      finance: 'Finanzen',
      executive: 'Bereichsleitung',
      gm: 'Geschäftsführung',
    },
  },
};
