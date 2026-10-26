export default {
  budgets: {
    create: 'Erstellen',

    title: 'Budgetverwaltung',
    description:
      'Die Finanzabteilung erfasst Jahresbudgets und protokollierte manuelle Änderungen; reservierte und verbrauchte Mittel stammen aus Geschäftsbelegen.',
    new: 'Neues Jahresbudget',
    newDescription:
      'Erstellen Sie ein Budgetkonto für eine Abteilung, ein Jahr und eine Budgetposition.',
    adjustTitle: 'Budget anpassen',
    adjustDescription:
      'Erfassen Sie eine manuelle Zuteilungsänderung mit Begründung. Bestehende Reservierungen und Ausgaben bleiben im Verzeichnis erhalten.',
    detail: 'Budgetkonto',
    detailDescription:
      'Prüfen Sie Salden und unveränderliche Budgetänderungen.',
    accountTitle: '{{department}} · {{year}} · {{subject}}',
    department: 'Abteilung',
    year: 'Jahr',
    subject: 'Budgetposition',
    allocatedCents: 'Zugeteilt',
    heldCents: 'Reserviert',
    usedCents: 'Verbraucht',
    availableCents: 'Verfügbar',
    amount: 'Jährliche Zuteilung',
    changeAmount: 'Zuteilungsänderung',
    amountHint: 'Positive Währungsbeträge mit höchstens zwei Nachkommastellen.',
    deltaHint:
      'Ein positiver Betrag fügt Mittel hinzu; ein negativer verringert sie. Reservierte und verbrauchte Mittel können nicht entfernt werden.',
    reason: 'Begründung',
    ledger: 'Budgetänderungen',
    kind: 'Änderungsart',
    at: 'Zeit',
    reference: 'Quelle',
    actor: 'Bearbeiter',
    allocatedDelta: 'Zuteilungsänderung',
    heldDelta: 'Reservierungsänderung',
    usedDelta: 'Verbrauchsänderung',
    allSubjects: 'Alle Budgetpositionen',
    selectSubject: 'Budgetposition auswählen',
    yearPlaceholder: 'Nach Jahr filtern',
    refresh: 'Aktualisieren',
    clear: 'Filter zurücksetzen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    adjust: 'Anpassen',
    view: 'Anzeigen',
    retry: 'Erneut versuchen',
    loading: 'Wird geladen',
    rowActions: 'Aktionen für {{name}}',
    saved: 'Budget für „{{name}}“ gespeichert',
    currentAccount:
      '{{department}} · {{year}} · {{subject}} · zugeteilt {{amount}}',
    openExisting: 'Vorhandenes Konto öffnen',
    required: 'Füllen Sie dieses Pflichtfeld aus.',
    invalidYear: 'Geben Sie ein Jahr von 1900 bis 9999 ein.',
    invalidAmount:
      'Geben Sie einen Betrag ungleich null mit höchstens zwei Nachkommastellen innerhalb der sicheren Grenze für ganzzahlige Cent ein.',
    positiveAmount:
      'Geben Sie einen positiven Betrag mit höchstens zwei Nachkommastellen innerhalb der sicheren Grenze für ganzzahlige Cent ein.',
    longReason: 'Die Begründung darf höchstens 4.000 Zeichen umfassen.',
    invalidField: 'Prüfen Sie dieses Feld und versuchen Sie es erneut.',
    kinds: {
      consume: 'Teilabrechnung',
      allocate: 'Zuteilung',
      hold: 'Reservierung',
      release: 'Freigegeben',
      settle: 'Abrechnung',
      transferOut: 'Ausgehend übertragen',
      transferIn: 'Eingehend übertragen',
    },
    empty: {
      accountsTitle: 'Noch keine Budgets',
      accountsDescription:
        'Erstellen Sie jährliche Zuteilungen, um die Budgetkontrolle zu aktivieren.',
      readonlyTitle: 'Noch keine Budgets',
      readonlyDescription:
        'Bitten Sie die Finanzabteilung, die Jahresbudgets einzutragen.',
      filteredTitle: 'Keine passenden Budgets',
      filteredDescription:
        'Setzen Sie die Filter zurück oder ändern Sie sie, um ein Konto zu finden.',
      ledgerTitle: 'Noch keine Änderungen',
      ledgerDescription:
        'Budgetänderungen erscheinen hier, sobald sie erfasst werden.',
    },
    error: {
      failed:
        'Das Budget konnte nicht geladen oder gespeichert werden. Versuchen Sie es mit denselben Eingaben erneut.',
      forbidden:
        'Sie haben keine Budgetberechtigung. Wenden Sie sich an einen Administrator.',
      missing:
        'Dieses Budget ist nicht mehr vorhanden. Kehren Sie zur Liste zurück.',
      BUDGET_NOT_FOUND:
        'Dieses Budget ist nicht mehr vorhanden. Kehren Sie zur Liste zurück.',
      BUDGET_ALREADY_EXISTS:
        'Für dieses Konto besteht ein Budget. Öffnen Sie es und verwenden Sie „Anpassen“.',
      BUDGET_IDEMPOTENCY_CONFLICT:
        'Dieser Anfrageschlüssel bezeichnet bereits eine andere Änderung. Prüfen Sie Ihre Eingaben und speichern Sie erneut.',
      BUDGET_INSUFFICIENT:
        'Durch die Anpassung bliebe zu wenig verfügbares Budget. Verringern Sie die Kürzung.',
      BUDGET_INVALID_DEPARTMENT: 'Wählen Sie eine aktive Abteilung aus.',
      BUDGET_INVALID_SUBJECT: 'Wählen Sie eine aktive Budgetposition.',
      BUDGET_INVALID_AMOUNT:
        'Prüfen Sie den Betrag und verwenden Sie höchstens zwei Nachkommastellen.',
      BUDGET_INVALID_COMMAND:
        'Prüfen Sie die erforderliche Begründung und die Antragsdetails.',
      BUDGET_INVALID_ACCOUNT: 'Prüfen Sie Abteilung, Jahr und Budgetposition.',
      BUDGET_INVALID_PAGE: 'Prüfen Sie Seite und Seitengröße.',
      invalid:
        'Prüfen Sie die Pflichtfelder und korrigieren Sie die hervorgehobenen Werte.',
    },
    authz: {
      title: 'Budgetverwaltung',
      read: 'Konten und Budgetänderungen lesen',
      update: 'Budgets erstellen und manuelle Anpassungen erfassen',
      permissionSet: 'Finanzbudgetverwaltung',
    },
  },
};
