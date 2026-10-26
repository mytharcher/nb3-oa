export default {
  reportsExpense: {
    firstPage: 'Zur ersten Seite',

    pageEmpty: 'Keine Ausgabengruppen auf dieser Seite',
    pageEmptyHint:
      'Die aktuelle Quelle enthält weniger Gruppen. Wechseln Sie zur ersten Seite oder kehren Sie mit „Zurück“ zu einer verfügbaren Seite zurück.',

    exportStarted: 'Excel-Download gestartet',
    reloading:
      'Wird aktualisiert… Das vorherige Ergebnis bleibt sichtbar, bis die aktuellen Filter vollständig geladen sind.',
    exportLock:
      'Wird exportiert… Filter und Navigation sind bis zum Abschluss des Downloads gesperrt.',

    title: 'Abgerechnete Ausgaben nach Monat',
    description:
      'Abgerechnete Bruttoausgaben nach ursprünglichem Ausgabedatum und Kategorie; dies sind keine ausgezahlten Nettobeträge.',
    month: 'Ausgabenmonat (1–12, optional)',
    effectiveYear: 'Jahr im Unternehmenskalender: {{year}}',
    sourceNotice:
      'Bis zu 10.000 berechtigte abgerechnete Anträge können geprüft werden. Eine Änderung von Jahr oder Monat verkleinert diese Quellensuche nicht.',
    precondition:
      'Die Abrechnungsnachweise konnten nicht verifiziert werden oder eine Berichtsgrenze wurde überschritten. Bitten Sie einen Administrator, die Quellnachweise und die Berichtsgröße zu prüfen.',
    forbidden:
      'Sie haben keinen Zugriff auf die aktuelle Erstattungsquelle. Wenden Sie sich zur Prüfung der Quellenberechtigungen an einen Administrator.',
    empty: 'Noch keine abgerechneten Ausgaben in diesem Jahr',
    emptyHint:
      'Es werden nur berechtigte Anträge mit verifizierten Abrechnungsnachweisen berücksichtigt. Prüfen Sie Jahr und Monat oder bitten Sie einen Administrator, den Quellenzugriff zu prüfen.',
    fields: {
      year: 'Jahr',
      month: 'Ausgabenmonat',
      category: 'Kategoriecode',
      settledRequestCount: 'Abgerechnete Anträge',
      settledExpenseCents:
        'Abgerechnete Bruttoausgaben (CNY, keine Barauszahlung)',
    },
  },
};
