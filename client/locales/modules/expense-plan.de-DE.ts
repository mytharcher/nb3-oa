export default {
  expensePlans: {
    relatedUnavailable: 'Verknüpfter Datensatz nicht verfügbar',
    businessErrors: {
      EXPENSE_PLAN_DEPARTMENT_REQUIRED:
        'Der Antragsteller benötigt eine aktive Hauptabteilung. Bitten Sie die Personalabteilung, den Mitarbeiterdatensatz zu aktualisieren.',
      EXPENSE_PLAN_INVALID_DATE:
        'Wählen Sie ein gültiges voraussichtliches Ausgabedatum.',
      EXPENSE_PLAN_INVALID_DICTIONARY:
        'Wählen Sie eine aktivierte Vorgangsart und Budgetposition.',
      EXPENSE_PLAN_INVALID_INPUT:
        'Geben Sie einen positiven Betrag, die Teilnehmer und die Ausgabenbegründung ein.',
    },

    new: 'Neue Ausgabenvorabgenehmigung',
    edit: 'Ausgabenvorabgenehmigung bearbeiten',
    formDescription:
      'Planen Sie Bewirtung, Teambuilding oder eine Veranstaltung vor der Ausgabe.',
    matterType: 'Vorgangsart',
    subject: 'Budgetposition',
    amount: 'Geschätzte Ausgaben (Yuan)',
    yuan: 'Yuan',
    participants: 'Teilnehmer',
    eventDate: 'Veranstaltungsdatum',
    budgetYear: 'Eingereichtes Budgetjahr',
    department: 'Eingereichte Hauptabteilung',
    primaryDepartment:
      'Aktuelle Hauptabteilung: {{department}}. Sie wird bei der Einreichung erneut geprüft.',
    departmentMissing: 'Nicht konfiguriert',
    departmentPending: 'Wird bei der Einreichung bestimmt',
    departmentUnavailable: 'Abteilung derzeit nicht verfügbar',
    year: 'Budgetjahr: {{year}} · Unternehmenskalender: {{timeZone}}',
    amountHint:
      'Geben Sie Dezimalbeträge in Yuan ein; Beträge werden als exakte ganzzahlige Cent gespeichert.',
    amountInvalid:
      'Geben Sie einen positiven Betrag mit höchstens zwei Nachkommastellen innerhalb der sicheren Grenze ein.',
    participantsInvalid: 'Geben Sie eine ganze Zahl von 1 bis 100000 ein.',
    dateInvalid: 'Wählen Sie ein gültiges Datum.',
    disabled: 'Deaktiviert',
    subjectInactive: 'Wählen Sie eine aktive Vorgangsart und Budgetposition.',
    optionsEmpty:
      'Vor dem Speichern müssen eine aktive Vorgangsart und Budgetposition konfiguriert sein.',
    reserveHint:
      'Die Einreichung reserviert Budget. Die endgültige Genehmigung gewährt eine Erstattungsquote.',
    revisionHold:
      'Die ursprüngliche Budgetreservierung bleibt während der Überarbeitung erhalten. Sie ändert sich erst bei erneuter Einreichung.',
    retainedHold:
      'Ursprüngliche Reservierung: {{subject}} · {{amount}} Yuan. Diese besteht getrennt vom überarbeiteten Vorschlag.',
    actualHold: 'Reservierung bei Genehmigung',
    holdFactHint:
      'Dies ist der ursprüngliche Reservierungsnachweis, nicht der verbleibende Saldo nach späteren Erstattungen.',
    frozenThreshold:
      'Eingereichte Schwellenwerte: Bereichsleitung > {{vp}} Yuan; Geschäftsführung > {{gm}} Yuan.',
    applied:
      'Eine genehmigte Quote wurde erteilt. Dies bedeutet keine Erstattung oder Zahlung.',
    reserved:
      'Budget ist reserviert, während dieser Antrag auf Genehmigung wartet.',
    awaitingEffect: 'Für diesen Antrag wurde keine genehmigte Quote erteilt.',
    uncertainCreate:
      'Das Speicherergebnis ist ungewiss. Schließen Sie die Ansicht und prüfen Sie „Meine Anträge“, bevor Sie einen weiteren Entwurf erstellen.',
    unknownEdit:
      'Das Speicherergebnis ist ungewiss. Ihre Eingaben sind gesperrt, bis der neueste Datensatz geladen wurde.',
    authorization: 'Genehmigte Quote',
    quotaId: 'Quotenreferenz',
    grantedAmount: 'Gewährter Betrag',
    quotaState: 'Quotenstatus',
    deadline: 'Ablaufdatum',
    quotaHint:
      'Kostenerstattungen rechnen diese Quote ab. Schließung oder Ablauf macht diese Genehmigung nicht rückgängig.',
    mergedTitle: 'Zusammenführung bei gleicher Person',
    quotaStates: {
      open: 'Öffnen',
      closed: 'Geschlossen',
      expired: 'Abgelaufen',
    },
    createdBy: 'Erstellt von',
    authz: {
      resource: 'Ausgabenvorabgenehmigung',
      submit: 'Ausgabenvorabgenehmigung einreichen',
      delegate: 'Ausgabenvorabgenehmigung für einen Mitarbeiter einreichen',
      view: 'Ausgabenvorabgenehmigung lesen',
    },
    stages: {
      head: 'Abteilungsleitung',
      finance: 'Finanzen',
      executive: 'Zuständige Bereichsleitung',
      gm: 'Geschäftsführung',
    },
    states: { approved: 'Genehmigte Quote erteilt' },
    merged:
      'Bereichsleitung und Geschäftsführung zusammengeführt: Dieselbe Person hat in eigener Funktion genehmigt.',
    errors: {
      invalid:
        'Prüfen Sie Datum, Teilnehmer, Betrag, Vorgangsart und Budgetposition.',
      department: 'Der Antragsteller benötigt eine aktive Hauptabteilung.',
      insufficient:
        'Dieses Budgetkonto verfügt nicht über genügend verfügbare Mittel.',
      inactive:
        'Der Antragsteller muss einen aktiven Mitarbeiterdatensatz haben.',
      configuration:
        'Der Genehmigungsantrag kann nicht eingereicht werden. Wenden Sie sich an einen Administrator, um die Genehmigungsfristen zu prüfen.',
    },
  },
};
