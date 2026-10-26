export default {
  budgetAdjustments: {
    businessErrors: {
      BUDGET_ADJUSTMENT_INVALID_ACCOUNT:
        'Wählen Sie eine aktive Abteilung und ein gültiges Budgetjahr.',
      BUDGET_ADJUSTMENT_INVALID_AMOUNT:
        'Geben Sie einen positiven Anpassungsbetrag und eine Begründung ein.',
      BUDGET_ADJUSTMENT_INVALID_SUBJECT:
        'Wählen Sie eine aktivierte Budgetposition.',
      BUDGET_ADJUSTMENT_INVALID_TRANSFER:
        'Verwenden Sie für eine Übertragung unterschiedliche Quell- und Zielpositionen. Entfernen Sie bei einer Erhöhung die Quellposition.',
      BUDGET_ADJUSTMENT_INACTIVE_HEAD:
        'Die Abteilungsleitung ist nicht verfügbar. Bitten Sie einen Administrator, die Abteilungszuweisung zu aktualisieren.',
    },

    authz: {
      resource: 'Budgetanpassungen',
      submit: 'Budgetanpassung einreichen',
      delegate: 'Budgetanpassung für einen Mitarbeiter einreichen',
      view: 'Budgetanpassungen lesen',
    },
    new: 'Neue Budgetanpassung',
    edit: 'Budgetanpassung bearbeiten',
    formDescription:
      'Eine Übertragung zwischen Budgetpositionen oder ein Zusatzbudget vorschlagen.',
    department: 'Budgetabteilung',
    yearInvalid: 'Geben Sie ein ganzzahliges Jahr von 1900 bis 9999 ein.',
    year: 'Budgetjahr',
    type: 'Anpassungsart',
    transfer: 'Übertragung zwischen Budgetpositionen',
    increase: 'Zusatzbudget',
    targetSubject: 'Zielposition',
    sourceSubject: 'Quellposition',
    amount: 'Betrag (Yuan)',
    yuan: 'Yuan',
    reason: 'Begründung',
    amountInvalid:
      'Geben Sie einen positiven Dezimalbetrag mit höchstens zwei Nachkommastellen innerhalb der sicheren Grenze ein.',
    sourceInvalid: 'Wählen Sie unterschiedliche Quell- und Zielpositionen.',
    amountHint:
      'Verwenden Sie Dezimalbeträge in Yuan. Beträge werden als exakte ganzzahlige Cent gespeichert.',
    reserveHint:
      'Die Einreichung reserviert bei einer Übertragung die Quellmittel. Das Budget wird erst nach der endgültigen Genehmigung wirksam.',
    revisionHold:
      'Die ursprüngliche Reservierung bleibt während der Rückgabe bestehen. Eine Änderung des Vorschlags gibt sie erst bei erneuter Einreichung frei und ersetzt sie.',
    retainedHold:
      'Aktuelle ursprüngliche Reservierung: {{subject}} · {{amount}} Yuan. Diese besteht getrennt vom überarbeiteten Vorschlag.',
    actualHold: 'Aktuelle Quellreservierung',
    frozenThreshold:
      'Eingereichter Schwellenwert der Geschäftsführung für eine Erhöhung: {{amount}} Yuan (nur bei strikter Überschreitung).',
    applied:
      'Die endgültige Genehmigung hat diese Budgetanpassung wirksam gemacht.',
    reserved:
      'Die Quellmittel sind reserviert; diese Anpassung ist noch nicht wirksam.',
    awaitingEffect:
      'Dieser Vorschlag ist noch nicht wirksam. Das Zusatzbudget wird erst nach der endgültigen Genehmigung angewendet.',
    insufficient:
      'Das Quellbudget verfügt nicht über genügend verfügbare Mittel. Prüfen Sie Betrag und Quelle; Ihre Eingaben bleiben erhalten.',
    subjectInactive:
      'Diese Budgetposition ist deaktiviert. Wählen Sie vor der Einreichung eine aktive Position.',
    disabled: 'Deaktiviert',
    inactive: 'Der Antragsteller muss ein aktiver Mitarbeiter sein.',
    configuration:
      'Der Genehmigungsantrag kann nicht eingereicht werden. Wenden Sie sich an einen Administrator, um die Genehmigungsfristen zu prüfen.',
    invalid: 'Prüfen Sie Konto, Anpassungsart, Betrag und Begründung.',
    uncertainCreate:
      'Das Speicherergebnis ist ungewiss. Schließen Sie die Ansicht und prüfen Sie „Meine Anträge“, bevor Sie einen weiteren Entwurf erstellen.',
    stages: {
      head: 'Abteilungsleitung',
      finance: 'Finanzleitung',
      cfo: 'Finanzvorstand',
      gm: 'Geschäftsführung',
    },
  },
};
