export default {
  exported: 'Excel-Download gestartet.',
  title: 'Bearbeitungsdauer von Urlaubsentscheidungsaufgaben',
  description:
    'Abgeschlossene Urlaubsentscheidungsaufgaben: Zeit von der Erstellung bis zum Abschluss in tatsächlichen Millisekunden einschließlich Wartezeiten und früherer Wiedereinreichungen; gruppiert nach dem ursprünglichen Startmonat des Antrags. Dies entspricht weder Arbeitszeit noch SLA, Rückgabequote oder Gesamtdauer des Prozesses.',
  year: 'Startjahr',
  month: 'Startmonat (optional)',
  clear: 'Filter zurücksetzen',
  export: 'Excel exportieren',
  exporting: 'Wird exportiert…',
  refresh: 'Aktualisieren',
  selectYear:
    'Wählen Sie das ursprüngliche Startjahr des Antrags, um diesen Bericht zu laden.',
  invalid:
    'Geben Sie ein Jahr von 1900 bis 9998 und optional einen Monat von 1 bis 12 ein.',
  forbidden:
    'Die aktuellen Berechtigungen für Urlaubsdatensätze oder Felder erlauben diesen Bericht nicht. Wenden Sie sich an einen Administrator.',
  precondition:
    'Die Quellengrenze oder die Prüfung der Aufgabenzeitstempel ist fehlgeschlagen. Grenzen Sie den Jahres-/Monatsbereich ein oder bitten Sie einen Administrator, die Quellzeitstempel zu prüfen.',
  failed: 'Der Bericht konnte nicht geladen werden. Versuchen Sie es erneut.',
  retry: 'Erneut versuchen',
  exportFailed: 'Der Excel-Export ist fehlgeschlagen. Versuchen Sie es erneut.',
  empty: 'Keine abgeschlossenen Entscheidungsaufgaben',
  noResults: 'Keine passenden Aufgaben für diesen Monat',
  emptyHint:
    'Es werden nur abgeschlossene Entscheidungsaufgaben aus aktuell lesbaren Urlaubsanträgen gezählt. Wählen Sie ein anderes Startjahr oder einen anderen Startmonat.',
  total: '{{count}} Stufengruppen',
  generatedAt: 'Erstellt {{value}}',
  previous: 'Zurück',
  next: 'Weiter',
  fields: {
    stage: 'Stufe',
    completedTaskCount: 'Abgeschlossene Entscheidungsaufgaben',
    totalElapsedMs: 'Gesamte tatsächliche Dauer in ms',
    averageElapsedMs: 'Mittlere tatsächliche Dauer in ms',
  },
  stages: {
    manager: 'Führungskraft',
    head: 'Abteilungsleitung',
    hr: 'Personalabteilung',
  },
};
