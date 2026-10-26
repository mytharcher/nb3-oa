export default {
  // Existing permission titles use the collection name.
  trainingRequests: {
    authz: {
      resource: 'Schulung und Weiterbildung',
      submit: 'Schulungsantrag einreichen',
      delegate: 'Im Namen eines Mitarbeiters einreichen',
      view: 'Schulungsanträge anzeigen',
    },
  },
  training: {
    actionForm: {
      title: 'Schulungsantrag „{{name}}“: {{action}}',
      completed: '{{action}} für Schulungsantrag „{{name}}“ abgeschlossen',
      saved: 'Schulungsantrag „{{name}}“ gespeichert',
    },
    businessErrors: {
      TRAINING_INVALID_INPUT:
        'Vervollständigen Sie Schulungsname, Einrichtung und Begründung und geben Sie gültige nicht negative Kosten ein.',
      TRAINING_INVALID_DATE:
        'Das Schulungsende muss nach dem Beginn liegen. Prüfen Sie die Datums- und Zeitangaben.',
      TRAINING_DEPARTMENT_REQUIRED:
        'Der Antragsteller benötigt eine aktive Hauptabteilung. Bitten Sie die Personalabteilung, den Mitarbeiterdatensatz zu aktualisieren.',
    },

    cc: 'Kopieempfänger hinzufügen',
    authz: {
      resource: 'Schulung und Weiterbildung',
      submit: 'Schulungsantrag einreichen',
      delegate: 'Im Namen eines Mitarbeiters einreichen',
      view: 'Schulungsanträge anzeigen',
    },
    new: 'Neuer Schulungsantrag',
    edit: 'Schulungsantrag bearbeiten',
    formDescription: 'Schulung oder externe Weiterbildung beantragen.',
    name: 'Schulungsname',
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
      'Bei Nutzung von Arbeitszeit erfasst die Genehmigung die Schulungsteilnahme. Kostenpflichtige Schulungen erzeugen ein genehmigtes Erstattungsbudget; es wurde noch keine Zahlung geleistet.',
    approvedFacts:
      'Diese Schulung wurde genehmigt. Die Personalabteilung erhält eine Kopie.',
    attendanceRecorded: 'Die Schulungsteilnahme wurde erfasst.',
    authorizationIssued:
      'Genehmigtes Erstattungsbudget: {{amount}} Yuan. Erstattungsanträge unterliegen der Budgetrichtlinie.',
    zeroNoAuthorization:
      'Für kostenlose Schulungen wird kein Gebührenbudget erstellt.',
    uncertainCreate:
      'Das Speicherergebnis ist unbekannt. Prüfen Sie „Meine Anträge“, bevor Sie einen weiteren Antrag erstellen.',
    inactive: 'Ein aktiver Mitarbeiterdatensatz ist erforderlich.',
    configuration:
      'Der Genehmigungsantrag kann nicht eingereicht werden. Wenden Sie sich an einen Administrator, um die Genehmigungsfristen zu prüfen.',
    invalid:
      'Prüfen Sie die Antragsfelder und laden Sie bei Bedarf den neuesten Datensatz.',
    stages: {
      manager: 'Direkte Führungskraft',
      head: 'Abteilungsleitung',
      finance: 'Finanzen',
      executive: 'Bereichsleitung',
      gm: 'Geschäftsführung',
    },
  },
};
