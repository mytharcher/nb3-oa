export default {
  attendanceImport: {
    title: 'Anwesenheitsnachweise importieren',
    description:
      'Unveränderliche ursprüngliche Nachweise in der Vorschau prüfen und importieren. Dabei werden weder Anwesenheit bewertet noch Gehälter berechnet.',
    template: 'Excel-Vorlage herunterladen',
    downloadStarted: 'Download der Excel-Vorlage gestartet.',
    downloadFailed:
      'Die Excel-Vorlage konnte nicht heruntergeladen werden. Versuchen Sie es erneut.',
    file: 'Excel-Nachweisdatei',
    empty: 'Wählen Sie eine .xlsx-Datei, um die Vorschau zu starten.',
    help: 'Verwenden Sie die Vorlage mit einem Blatt und Textzellen. Erforderliche Spalten: userId, date, punchKind, source, sourceKey und sourceData (JSON-Objekt). punchedAt darf leer sein oder UTC-ISO-Text wie 2035-01-02T01:00:00Z enthalten. date ist das lokale Unternehmensdatum. userId ist die beständige Benutzer-ID eines tatsächlichen Mitarbeiters, niemals ein Name. Höchstens 4 MiB und 1.000 Zeilen. Formeln und numerische Datumswerte werden abgelehnt. JSON-Objektschlüssel müssen eindeutig sein; Zahlen müssen bei der Serialisierung ihren Dezimalwert behalten und Ganzzahlen im sicheren Wertebereich liegen. Stellen Sie größere IDs oder exakte Dezimalwerte als Zeichenfolgen dar.',
    parsing: 'Excel wird eingelesen',
    preview: 'Vorschau: {{count}} Zeilen',
    confirm:
      'Ich habe diese Nachweise geprüft und bestätige den Import des gesamten Stapels',
    submit: 'Stapelimport bestätigen',
    submitting: 'Wird importiert',
    success: '{{count}} Nachweiszeilen importiert.',
    evidence: 'Ursprünglichen Nachweis aufklappen',
    denied: 'Sie sind nicht berechtigt, Anwesenheitsnachweise zu importieren.',
    failed:
      'Der Stapel konnte nicht importiert werden. Prüfen Sie die Datei und versuchen Sie es erneut.',
    invalid:
      'Der Server hat diese Nachweise abgelehnt. Prüfen Sie Mitarbeiter-IDs, Unternehmensdaten und Quelldaten.',
    conflict:
      'Ein Quellschlüssel enthält bereits andere Nachweise. Es wurden keine Zeilen dieses Stapels importiert.',
    retry: 'Import erneut versuchen',
    discard: 'Vorschau der nicht eingereichten Nachweise verwerfen?',
    continue: 'Prüfung fortsetzen',
    discardConfirm: 'Vorschau verwerfen',
    discardHelp:
      'Klicken Sie nach dem Verwerfen der Vorschau erneut auf Ihr Ziel, um die Navigation fortzusetzen.',
    columns: {
      userId: 'Benutzer-ID',
      date: 'Unternehmensdatum',
      punchKind: 'Buchungsart',
      punchedAt: 'UTC-Zeitpunkt',
      source: 'Quelle',
      sourceKey: 'Quellschlüssel',
      sourceData: 'Ursprünglicher Nachweis',
    },
    errors: {
      file: 'Wählen Sie eine .xlsx-Datei mit höchstens 4 MiB.',
      archive:
        'Das Excel-Archiv ist ungültig oder überschreitet die sicheren Entpackgrenzen.',
      template:
        'Verwenden Sie genau die heruntergeladenen Vorlagenüberschriften und ein einziges Blatt.',
      cell: 'Zeile {{row}}: Verwenden Sie Textzellen ohne Formeln und nur die sieben Vorlagenspalten.',
      rows: 'Verwenden Sie 1–1.000 aufeinanderfolgende Nachweiszeilen nach der Kopfzeile.',
      identity:
        'Zeile {{row}}: Geben Sie eine beständige Benutzer-ID sowie eine gültige Quelle und einen gültigen Quellschlüssel an.',
      date: 'Zeile {{row}}: Geben Sie ein tatsächliches Unternehmensdatum, die Art in/out und einen ausdrücklichen UTC-ISO-Zeitpunkt oder einen Leerwert an.',
      evidence:
        'Zeile {{row}}: Geben Sie ein begrenztes JSON-Objekt mit eindeutigen Objektschlüsseln, ohne Wertverlust serialisierbaren Zahlen und einem eindeutigen Quellschlüssel an.',
    },
  },
};
