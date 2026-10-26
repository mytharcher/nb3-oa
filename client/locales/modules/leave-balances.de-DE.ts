export default {
  leaveBalances: {
    navigationDiscardDescription:
      'Verwerfen Sie diese Änderungen und kehren Sie zur Saldenliste zurück. Die ursprüngliche Navigation wird nicht fortgesetzt.',
    navigationDiscard: 'Verwerfen und zu den Salden zurückkehren',
    clearFilters: 'Filter zurücksetzen',
    clearSearch: 'Suche zurücksetzen',
    title: 'Urlaubssalden',
    adminTitle: 'Urlaubssaldenverwaltung',
    description:
      'Verfügbare Urlaubstage, reservierte Tage und Saldenverlauf anzeigen.',
    adminDescription:
      'Prüfen Sie Mitarbeiterurlaubssalden und erfassen Sie begründete Anpassungen.',
    employee: 'Mitarbeiter',
    employeePlaceholder: 'Mitarbeiter nach Name oder Code suchen',
    type: 'Urlaubsart',
    selectType: 'Urlaubsart auswählen',
    availableUnits: 'Verfügbare Tage',
    heldUnits: 'Reservierte Tage',
    availableDelta: 'Änderung verfügbarer Tage',
    heldDelta: 'Änderung reservierter Tage',
    at: 'Zeit',
    kind: 'Typ',
    reference: 'Quelle',
    actor: 'Bearbeiter',
    reason: 'Begründung',
    days: 'Anpassungstage',
    actions: 'Aktionen für „{{name}}“',
    adjust: 'Anpassen',
    adjustBalance: 'Saldo anpassen',
    refresh: 'Aktualisieren',
    retry: 'Erneut versuchen',
    loading: 'Wird geladen',
    noResults: 'Keine passenden Mitarbeiter. Ändern Sie Ihre Suche.',
    searchCap:
      'Es werden nur die ersten 20 Mitarbeiter angezeigt. Grenzen Sie Ihre Suche ein.',
    noTypes:
      'Keine saldogeführten Urlaubsarten verfügbar. Bitten Sie einen Administrator, diese zu konfigurieren.',
    unopened:
      'Für „{{type}}“ besteht noch kein Konto: {{available}} verfügbare und {{held}} reservierte Tage. Fügen Sie einen Saldo hinzu, um es zu eröffnen.',
    ledgerTitle: '{{type}} · Saldenverlauf',
    adjustTitle: 'Urlaubssaldo anpassen',
    adjustDescription: 'Passen Sie den Saldo von {{type}} für „{{name}}“ an.',
    currentBalance:
      'Aktuell {{available}} verfügbare und {{held}} reservierte Tage.',
    afterBalance:
      'Nach Anpassung verfügbar: {{amount}} Tage, vorbehaltlich der Servervalidierung.',
    noExpiry:
      'Hinzugefügte Salden haben kein Ablaufdatum. Kürzungen behalten bestehende Ablaufregeln bei.',
    daysInvalid:
      'Geben Sie eine Anzahl von Tagen ungleich null in Halbtagsschritten ein.',
    reasonRequired: 'Geben Sie eine Begründung für die Anpassung ein.',
    reasonLong: 'Die Begründung darf höchstens 2.000 Zeichen umfassen.',
    adjusted: 'Saldo für „{{name}}“ angepasst.',
    cancel: 'Abbrechen',
    uncertain:
      'Das Ergebnis ist ungewiss. Wiederholen Sie dieselbe Anpassung; ihre Werte sind gesperrt, um doppelte Datensätze zu verhindern.',
    retryAdjustment: 'Anpassung erneut versuchen',
    discardTitle: 'Saldenanpassung verwerfen',
    discardDescription: 'Ihre nicht gespeicherte Anpassung geht verloren.',
    keepEditing: 'Weiter bearbeiten',
    discard: 'Verwerfen',
    kinds: {
      grant: 'Gewähren',
      hold: 'Reservieren',
      deduct: 'Abziehen',
      release: 'Freigeben',
      expire: 'Verfallen lassen',
      refund: 'Zurückbuchen',
    },
    error: {
      insufficient:
        'Der verfügbare Saldo reicht nicht aus. Verringern Sie den Abzug.',
      forbidden:
        'Sie sind nicht berechtigt, diese Daten anzuzeigen oder anzupassen. Wenden Sie sich an einen Administrator; die Mitarbeitersuche erfordert ebenfalls Zugriff auf Mitarbeiterdatensätze.',
      notFound:
        'Der Mitarbeiterdatensatz fehlt oder ist nicht verknüpft. Wenden Sie sich an die Personalabteilung oder wählen Sie einen anderen Mitarbeiter.',
      invalid:
        'Die Anpassung ist ungültig. Prüfen Sie Tage, Urlaubsart und Begründung.',
      failed:
        'Die Anfrage konnte nicht abgeschlossen werden. Versuchen Sie es erneut.',
    },
    empty: {
      readonlyAccountsTitle: 'Noch keine Urlaubssalden',
      readonlyAccountsDescription:
        'Bitten Sie einen berechtigten Personaladministrator, Urlaubssalden zu gewähren.',
      employeeTitle: 'Mitarbeiter auswählen',
      employeeDescription:
        'Suchen Sie nach Name oder Code, um Urlaubssalden anzuzeigen.',
      accountsTitle: 'Noch keine Urlaubssalden',
      accountsDescription:
        'Wählen Sie eine Urlaubsart und fügen Sie über eine Anpassung einen Saldo hinzu.',
      mineTitle: 'Noch keine Urlaubssalden',
      mineDescription:
        'Die Personalabteilung gewährt Ihre Urlaubssalden. Wenden Sie sich bei Fragen dazu an die Personalabteilung.',
      ledgerTitle: 'Noch kein Saldenverlauf',
      ledgerDescription:
        'Gewährungen, Reservierungen und Abzüge erscheinen hier.',
    },
    authz: {
      section: 'Urlaubsverwaltung',
      title: 'Urlaubssalden',
      read: 'Mitarbeiterurlaubssalden lesen',
      update: 'Mitarbeiterurlaubssalden anpassen',
      permissionSet: 'Urlaubssaldenverwaltung durch die Personalabteilung',
    },
  },
};
