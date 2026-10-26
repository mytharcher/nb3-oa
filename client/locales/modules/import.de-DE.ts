/**
 * English wording of the `import` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `import.zh-CN.ts` is checked against this shape.
 */
const importEnUS = {
  import: {
    navigation: { title: 'Datenimport' },
    // Titles the server registers in the permission workspace (`server/providers/import/index.ts`).
    authz: {
      settings: 'Datenimport',
      read: 'Verlauf und Vorlagen anzeigen',
      update: 'Importieren',
    },
    title: 'Datenimport',
    description:
      'Abteilungen, Positionen, Gehaltsgruppen, Mitarbeiterakten und Funktionsrollenmitglieder aus Excel-Vorlagen importieren.',
    kinds: {
      departments: 'Abteilungen',
      positions: 'Positionen',
      grades: 'Gehaltsgruppen',
      employees: 'Mitarbeiterakten',
      dutyRoleMembers: 'Funktionsrollenmitglieder',
    },
    kindHints: {
      departments:
        'Abgleich anhand des Abteilungscodes. Übergeordnete Abteilungen dürfen weiter unten im Blatt definiert sein.',
      positions: 'Abgleich anhand des Positionscodes.',
      grades: 'Abgleich anhand des Gehaltsgruppencodes.',
      employees:
        'Abgleich anhand der Mitarbeiternummer. Importieren Sie zuerst Abteilungen, Positionen und Gehaltsgruppen; Führungskräfte dürfen im selben Blatt definiert sein.',
      dutyRoleMembers:
        'Abgleich anhand von Rollencode und Konto. „Nein“ in der Aktivspalte entfernt das Mitglied.',
    },
    actions: {
      new: 'Neuer Import',
      templates: 'Vorlage herunterladen',
      templateFor: 'Vorlage für {{kind}} herunterladen',
      check: 'Prüfen',
      checking: 'Wird geprüft…',
      confirm: 'Importieren',
      importing: 'Wird importiert…',
      chooseAgain: 'Andere Datei auswählen',
      back: 'Zurück',
      chooseFile: 'Datei auswählen',
      downloadFile: 'Originaldatei herunterladen',
      refresh: 'Aktualisieren',
      clearFilters: 'Filter zurücksetzen',
    },
    fields: {
      kind: 'Art',
      file: 'Datei',
      createdAt: 'Gestartet',
      finishedAt: 'Abgeschlossen',
      status: 'Ergebnis',
      summary: 'Zusammenfassung',
      actor: 'Von',
      rowCount: 'Gelesene Zeilen',
      createdCount: 'Erstellt',
      updatedCount: 'Aktualisiert',
      unchangedCount: 'Unverändert',
      errorCount: 'Probleme',
      row: 'Zeile',
      column: 'Spalte',
      problem: 'Problem',
    },
    filters: { allKinds: 'Alle Arten' },
    status: { succeeded: 'Erfolgreich', failed: 'Fehlgeschlagen' },
    summary: {
      succeeded:
        '{{created}} erstellt · {{updated}} aktualisiert · {{unchanged}} unverändert',
      failed: 'Probleme: {{count}}',
    },
    noFile: 'Keine Datei ausgewählt',
    templateFile: '{{kind}}-Importvorlage.xlsx',
    fileHint: 'Eine .xlsx-Arbeitsmappe mit höchstens 5 MB im Vorlagenformat.',
    notice: {
      title: 'Vor dem Import',
      accounts:
        'Importe erstellen niemals Konten: Jedes in der Datei genannte Konto (Benutzername oder E-Mail) muss bereits vorhanden und aktiviert sein; andernfalls wird die Zeile gemeldet.',
      atomic:
        'Die gesamte Datei wird zuerst geprüft und in einem Schritt geschrieben: Hat eine Zeile ein Problem, wird nichts geschrieben.',
    },
    validation: {
      kindRequired: 'Wählen Sie den Inhalt der Datei.',
      fileRequired: 'Wählen Sie eine .xlsx-Datei.',
      fileType: 'Nur .xlsx-Arbeitsmappen können importiert werden.',
      fileSize:
        'Die Datei ist größer als 5 MB. Teilen Sie sie in mehrere Dateien auf.',
    },
    report: {
      invalidTitle:
        'Gefundene Probleme: {{count}}. Es wurde nichts importiert.',
      invalidDescription:
        'Korrigieren Sie die folgenden Zeilen in der Datei und prüfen Sie diese erneut.',
      truncated:
        'Es werden nur die ersten {{shown}} von {{count}} Problemen aufgeführt.',
      okTitle: 'Die Datei hat die Prüfung bestanden',
      okDescription:
        '{{rows}} Zeilen gelesen: {{created}} werden erstellt, {{updated}} aktualisiert und {{unchanged}} bleiben unverändert.',
      wholeFile: 'Datei',
    },
    toast: {
      imported: '„{{name}}“ importiert',
      templateFailed:
        'Die Vorlage konnte nicht heruntergeladen werden. Versuchen Sie es erneut.',
    },
    failure: {
      forbidden: 'Sie sind nicht zum Importieren berechtigt.',
      tooLarge:
        'Die Datei ist größer als 5 MB. Teilen Sie sie in mehrere Dateien auf.',
      invalidFile:
        'Die Datei konnte nicht gesendet werden. Wählen Sie eine .xlsx-Arbeitsmappe.',
      generic:
        'Die Anfrage ist fehlgeschlagen. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    },
    empty: {
      title: 'Noch keine Importe',
      description:
        'Laden Sie eine Vorlage herunter, füllen Sie sie aus und importieren Sie sie, um Abteilungen, Personen und Rollen zu übernehmen.',
      readOnly:
        'Noch keine Importe. Bitten Sie einen Administrator, die Organisationsdaten zu importieren.',
    },
    noResults: 'Keine Importe entsprechen dem Filter.',
    loadFailedTitle: 'Importverlauf konnte nicht geladen werden',
    detail: {
      title: 'Importdetails · {{name}}',
      titleLoading: 'Importdetails',
      notFound: 'Dieser Import existiert nicht oder wurde gelöscht.',
      problems: 'Probleme',
    },
    common: {
      forbidden: 'Sie sind nicht berechtigt, dies anzuzeigen.',
      notFound: 'Dieser Datensatz existiert nicht oder wurde gelöscht.',
      loadFailed:
        'Daten konnten nicht geladen werden. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    },
    // One sentence per problem code the server reports; {{value}} is the cell, {{header}} its column.
    errors: {
      FILE_UNREADABLE:
        'Die Datei ist keine lesbare .xlsx-Arbeitsmappe. Speichern Sie sie als Excel-Arbeitsmappe und versuchen Sie es erneut.',
      SHEET_EMPTY:
        'Das erste Blatt hat keine Datenzeilen. Füllen Sie die Zeilen unterhalb der Kopfzeile aus.',
      TOO_MANY_ROWS:
        'Die Datei hat mehr als {{max}} Zeilen. Teilen Sie sie in mehrere Dateien auf.',
      HEADER_MISSING:
        'Die erforderliche Spalte „{{header}}“ fehlt in der Kopfzeile.',
      HEADER_DUPLICATE: 'Die Spalte „{{header}}“ kommt mehrfach vor.',
      REQUIRED: 'Erforderlich.',
      INVALID_CODE:
        '„{{value}}“ ist kein gültiger Code: Verwenden Sie Buchstaben, Ziffern, „.“, „_“ und „-“ mit höchstens 64 Zeichen.',
      TOO_LONG: 'Länger als {{max}} Zeichen.',
      INVALID_INTEGER: '„{{value}}“ ist keine ganze Zahl.',
      INVALID_BOOLEAN: '„{{value}}“ ist nicht 是 / 否 (ja / nein).',
      CAREER_START_FUTURE:
        'Der erste Beschäftigungsbeginn darf nicht nach heute in der Zeitzone des Arbeitskalenders liegen.',
      CAREER_START_AFTER_HIRE:
        'Der erste Beschäftigungsbeginn darf nicht nach dem Eintrittsdatum liegen.',
      INVALID_DATE:
        '„{{value}}“ ist kein gültiges Datum. Verwenden Sie eine Datumszelle oder YYYY-MM-DD.',
      INVALID_STATUS:
        '„{{value}}“ ist kein Status: Verwenden Sie 试用, 正式, 离职中 oder 已离职.',
      INVALID_EMAIL: '„{{value}}“ ist keine E-Mail-Adresse.',
      DUPLICATE_IN_FILE: '„{{value}}“ erscheint bereits in Zeile {{firstRow}}.',
      USER_NOT_FOUND:
        'Kein Konto „{{value}}“. Importe erstellen niemals Konten: Erstellen Sie es zuerst auf der Benutzerseite.',
      USER_DISABLED:
        'Das Konto „{{value}}“ ist deaktiviert. Aktivieren Sie es zuerst auf der Benutzerseite.',
      USER_TAKEN:
        'Das Konto „{{value}}“ gehört bereits zu Mitarbeiter {{code}}.',
      USER_MISMATCH:
        'Diese Mitarbeiternummer ist mit einem anderen Konto verknüpft; eine Akte behält ihr Konto.',
      PARENT_NOT_FOUND:
        'Keine Abteilung mit Code „{{value}}“ in der Datei oder im System.',
      EXECUTIVE_TOP_LEVEL_ONLY:
        'Nur Abteilungen der obersten Ebene dürfen eine Bereichsleitung bestimmen; Unterabteilungen erben diese.',
      PARENT_CYCLE: 'Die übergeordneten Abteilungen bilden einen Zyklus.',
      DEPARTMENT_NOT_FOUND:
        'Keine Abteilung mit Code „{{value}}“. Importieren Sie zuerst Abteilungen.',
      DEPARTMENT_INACTIVE: 'Die Abteilung „{{value}}“ ist deaktiviert.',
      POSITION_NOT_FOUND: 'Keine Position mit Code „{{value}}“.',
      POSITION_INACTIVE: 'Die Position „{{value}}“ ist deaktiviert.',
      GRADE_NOT_FOUND: 'Keine Gehaltsgruppe mit Code „{{value}}“.',
      GRADE_INACTIVE: 'Die Gehaltsgruppe „{{value}}“ ist deaktiviert.',
      MANAGER_NOT_FOUND:
        'Keine Mitarbeiternummer „{{value}}“ in der Datei oder im System.',
      MANAGER_SELF:
        'Ein Mitarbeiter kann nicht seine eigene Führungskraft sein.',
      MANAGER_INACTIVE: 'Die Führungskraft „{{value}}“ ist ausgetreten.',
      MANAGER_CYCLE: 'Die Führungskräfte bilden einen Zyklus.',
      DUTY_ROLE_INACTIVE:
        'Diese Rolle ist inaktiv; neue Mitglieder können nicht hinzugefügt werden.',
      DUTY_ROLE_NOT_FOUND: 'Keine Funktionsrolle mit Code „{{value}}“.',
      WRITE_FAILED:
        'Diese Zeile konnte nicht geschrieben werden ({{reason}}); deshalb wurde nichts importiert. Prüfen Sie die Zeile und versuchen Sie es erneut.',
      unknown: 'Diese Zeile kann nicht importiert werden.',
    },
  },
};

export type ImportLocale = typeof importEnUS;

export default importEnUS;
