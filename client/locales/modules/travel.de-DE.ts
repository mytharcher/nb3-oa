export default {
  travel: {
    fieldInvalid: 'Prüfen Sie {{field}}.',

    confirmRetryBooking:
      'Buchung für diese genehmigte Dienstreise erneut versuchen?',
    confirmReviseTrip:
      'Diese Dienstreise überarbeiten und die Genehmigung neu starten?',
    states: {
      completed: 'Abgeschlossen',
      cancelled: 'Abgebrochen',
      exception: 'Buchungsausnahme',
    },
    businessErrors: {
      TRAVEL_ITINERARY_REQUIRED:
        'Auslandsreisen erfordern einen Reiseplan als Anhang. Laden Sie ihn vor der Einreichung hoch oder wählen Sie ihn aus.',
      TRAVEL_OVERLAP:
        'Dieser Zeitraum überschneidet sich mit einer genehmigten Dienstreise. Passen Sie die Reisedaten an.',
      TRAVEL_COMPANIONS_INVALID:
        'Wählen Sie unterschiedliche Begleitpersonen außer dem Antragsteller.',
      TRAVEL_COMPANION_INACTIVE:
        'Ein ausgewählter Reisender ist nicht mehr aktiv. Wählen Sie erneut aktuelle Mitarbeiter aus.',
      TRAVEL_DEPARTMENT_REQUIRED:
        'Der Antragsteller benötigt eine aktive Hauptabteilung. Bitten Sie die Personalabteilung, den Mitarbeiterdatensatz zu aktualisieren.',
      TRAVEL_INVALID_DATE:
        'Das Reiseende muss nach dem Beginn liegen. Prüfen Sie beide Datums- und Zeitangaben.',
      TRAVEL_INVALID_INPUT:
        'Vervollständigen Sie Ziel und Begründung und geben Sie gültige nicht negative Reisekosten ein.',
    },

    requestLoan: 'Verknüpften Vorschuss beantragen',
    reviseTrip: 'Dienstreise überarbeiten und Genehmigung neu starten',
    revisionWarning:
      'Die Überarbeitung schließt das alte Erstattungsbudget und beendet die alte Anwesenheitsaktivität vor der neuen Genehmigung. Bestehende Vorschusshauptbeträge und ursprüngliche Fälligkeitstermine bleiben unverändert; bearbeiten Sie Vorschüsse separat.',
    cancelTrip: 'Dienstreisestornierung beantragen',
    complete: 'Buchung abschließen',
    unable: 'Buchung nicht möglich',
    forceComplete: 'Schließung der Buchung erzwingen',
    retryBooking: 'Buchung erneut versuchen',
    standard: 'Festgeschriebener Reisestandard',
    lodgingPerNight: 'Übernachtungsstandard pro Nacht (Yuan)',
    allowancePerDay: 'Pauschalenstandard pro Tag (Yuan)',
    companions: 'Begleitpersonen',
    addCompanion: 'Begleitperson hinzufügen',
    removeCompanion: 'Entfernen',
    companionsInvalid: 'Begleitpersonen müssen unterschiedlich sein',
    peopleUnavailable:
      'Ihre Berechtigungen erlauben keine Mitarbeitersuche. Wenden Sie sich an einen Administrator.',
    destination: 'Reiseziel',
    international: 'Auslandsreise',
    needsBooking: 'Administrative Buchung',
    needsLoan: 'Vorschuss beantragt',
    transportCents: 'Transport',
    lodgingCents: 'Übernachtung',
    allowanceCents: 'Pauschale',
    bookingInformation: 'Buchungsdetails',
    exceptionReason: 'Ausnahmebegründung',
    cc: 'Kopieempfänger hinzufügen',
    authz: {
      resource: 'Dienstreiseanträge',
      submit: 'Dienstreiseantrag einreichen',
      delegate: 'Im Namen eines Mitarbeiters einreichen',
      view: 'Dienstreiseanträge anzeigen',
    },
    new: 'Neuer Dienstreiseantrag',
    edit: 'Dienstreiseantrag bearbeiten',
    formDescription: 'Dienstreise beantragen.',
    name: 'Dienstreisename',
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
      'Die Genehmigung erfasst die Dienstreiseanwesenheit und erstellt bei positiven Schätzbeträgen ein Erstattungsbudget. Buchung und Vorschussauszahlung erfolgen separat.',
    approvedFacts:
      'Die Reisegenehmigung ist abgeschlossen; der Buchungsfortschritt wird separat angezeigt.',
    attendanceRecorded: 'Die Dienstreiseanwesenheit wurde erfasst.',
    authorizationIssued:
      'Genehmigtes Erstattungsbudget: {{amount}} Yuan. Erstattungsanträge unterliegen der Budgetrichtlinie.',
    zeroNoAuthorization:
      'Geschätzte Kosten von null erzeugen kein Budget; eine Finanzprüfung ist dennoch erforderlich.',
    uncertainCreate:
      'Das Speicherergebnis ist unbekannt. Prüfen Sie „Meine Anträge“, bevor Sie einen weiteren Antrag erstellen.',
    inactive: 'Ein aktiver Mitarbeiterdatensatz ist erforderlich.',
    configuration:
      'Der Genehmigungsantrag kann nicht eingereicht werden. Wenden Sie sich an einen Administrator, um die Genehmigungsfristen zu prüfen.',
    invalid:
      'Prüfen Sie die Antragsfelder und laden Sie bei Bedarf den neuesten Datensatz.',
    stages: {
      completed: 'Abgeschlossen',
      manager: 'Direkte Führungskraft',
      head: 'Abteilungsleitung',
      finance: 'Finanzen',
      executive: 'Bereichsleitung',
      gm: 'Geschäftsführung',
      booking: 'Administrative Buchung',
    },
  },
};
