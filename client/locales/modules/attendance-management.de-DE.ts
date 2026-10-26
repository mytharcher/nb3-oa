export default {
  attendanceManagement: {
    savedSchedule: 'Dienstplan für „{{department}}“ am {{date}} gespeichert',
    savedShift: 'Schicht „{{name}}“ gespeichert',

    editAction: 'Bearbeiten',
    errors: {
      NOT_FOUND: 'Diese Schicht ist nicht mehr vorhanden.',
      ACCESS_DENIED:
        'Sie haben keinen Zugriff auf diese Anwesenheitskonfiguration.',
      ATTENDANCE_ACCESS_DENIED:
        'Die aktuelle Datensatz- oder Feldberechtigung erlaubt diese Änderung nicht.',
      ATTENDANCE_VERSION_CONFLICT:
        'Die Konfiguration wurde geändert. Laden Sie sie vor dem Speichern neu.',
      ATTENDANCE_SHIFT_INVALID:
        'Geben Sie eine gültige, ausdrückliche Schichtdefinition ein.',
      ATTENDANCE_SHIFT_NOT_FOUND: 'Die Schicht fehlt oder ist deaktiviert.',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE:
        'Ein Schichtcode kann nicht geändert werden.',
      ATTENDANCE_SHIFT_CODE_CONFLICT:
        'Dieser Schichtcode ist bereits vorhanden.',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED:
        'Verwenden Sie eine Revision in der aktuellen Unternehmenszeitzone.',
      ATTENDANCE_SCHEDULE_INVALID:
        'Wählen Sie ein tatsächliches Datum und eine ausdrückliche Schicht oder einen Ruhetag.',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE: 'Diese Abteilung ist nicht verfügbar.',
      ATTENDANCE_SCHEDULE_NOT_READABLE:
        'Die aktuelle Dienstplanrevision ist nicht lesbar.',
      ATTENDANCE_LIST_INVALID: 'Die Seitenparameter sind ungültig.',
      ATTENDANCE_LOCAL_TIME_INVALID:
        'Die Ortszeit entfällt oder wiederholt sich wegen der Zeitumstellung. Wählen Sie eindeutige Zeitgrenzen.',
    },
    authz: {
      resource: 'Anwesenheitskonfiguration',
      view: 'Anwesenheitskonfiguration anzeigen',
      manage: 'Anwesenheitskonfiguration verwalten',
      attendanceShifts: 'Anwesenheitsschichten',
      attendanceShiftRevisions: 'Schichtrevisionen',
      attendanceSchedules: 'Abteilungsdienstpläne',
      attendanceScheduleRevisions: 'Dienstplanrevisionen',
    },
    nameTooLong: 'Verwenden Sie höchstens 200 Zeichen.',
    reasonTooLong: 'Verwenden Sie höchstens 2000 Zeichen.',
    title: 'Anwesenheitskonfiguration',
    description:
      'Konfigurieren Sie ausdrückliche Schichten und Abteilungsdienstpläne. Fehlende Konfiguration blockiert die Anwesenheitsbewertung.',
    shifts: 'Schichten',
    schedules: 'Abteilungsdienstpläne',
    create: 'Schicht hinzufügen',
    edit: 'Schicht bearbeiten',
    view: 'Revision anzeigen',
    save: 'Speichern',
    saving: 'Wird gespeichert…',
    cancel: 'Abbrechen',
    refresh: 'Aktualisieren',
    retry: 'Erneut versuchen',
    loading: 'Anwesenheitskonfiguration wird geladen',
    denied: 'Sie haben keinen Zugriff auf diese Anwesenheitskonfiguration.',
    notFound:
      'Diese Konfiguration ist nicht mehr vorhanden. Kehren Sie zur Konfigurationsliste zurück.',
    failed:
      'Die Anwesenheitskonfiguration konnte nicht geladen oder gespeichert werden. Versuchen Sie es erneut.',
    conflict:
      'Die Konfiguration wurde geändert. Laden Sie vor dem Speichern neu. Ihre Eingaben wurden beibehalten.',
    code: 'Schichtcode',
    name: 'Schichtname',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
    status: 'Status',
    version: 'Revision',
    revisionLabel: 'Revision {{revision}}',
    actions: 'Aktionen für {{name}}',
    all: 'Alle Status',
    clearFilters: 'Filter zurücksetzen',
    search: 'Nach Schichtcode oder Name suchen',
    empty:
      'Keine Schichten konfiguriert. Fügen Sie zuerst eine ausdrückliche Unternehmensschicht hinzu.',
    noMatches: 'Keine Schichten entsprechen den Filtern.',
    department: 'Abteilung',
    date: 'Dienstplandatum',
    chooseDepartmentDate:
      'Wählen Sie Abteilung und Datum, um den Dienstplan zu prüfen.',
    unconfigured:
      'Für diese Abteilung und dieses Datum ist kein Dienstplan konfiguriert. Die Anwesenheitsbewertung bleibt gesperrt.',
    restDay: 'Ausdrücklicher Ruhetag',
    workingDay: 'Geplanter Arbeitstag',
    configure: 'Dienstplan konfigurieren',
    history: 'Verlauf',
    shiftRevision: 'Exakte Schichtrevision',
    reason: 'Änderungsgrund',
    createdBy: 'Geändert von',
    createdAt: 'Geändert am',
    timeZone: 'Aktuelle Unternehmenszeitzone',
    basic: 'Grundangaben',
    intervals: 'Arbeitsintervalle',
    rules: 'Anwesenheitsregeln',
    addInterval: 'Intervall hinzufügen',
    removeInterval: 'Intervall {{index}} entfernen',
    start: 'Startzeit (HH:mm)',
    end: 'Endzeit (HH:mm)',
    startDayOffset: 'Starttag',
    endDayOffset: 'Endtag',
    sameDay: 'Gleicher Tag',
    nextDay: 'Folgetag',
    lateToleranceMinutes: 'Verspätungstoleranz (Minuten)',
    earlyToleranceMinutes: 'Toleranz für vorzeitiges Gehen (Minuten)',
    absenceThresholdMinutes: 'Abwesenheitsschwelle (Minuten)',
    required: 'Dieses Feld ist erforderlich.',
    invalidShift:
      'Verwenden Sie gültige HH:mm-Intervalle in aufsteigender Reihenfolge innerhalb von 24 Stunden; geben Sie ganzzahlige Toleranzen unterhalb der Arbeitsdauer und eine Abwesenheitsschwelle innerhalb dieser Dauer ein.',
    invalidNumber: 'Geben Sie eine gültige nicht negative Ganzzahl ein.',
    invalidCode:
      'Verwenden Sie 1–64 Buchstaben, Ziffern, Unterstriche oder Bindestriche.',
    saved: 'Anwesenheitskonfiguration gespeichert.',
    disableTitle: 'Schicht „{{name}}“ deaktivieren?',
    disableDescription:
      'Bestehender Dienstplanverlauf bleibt erhalten. Neue Dienstpläne können diese Schicht nicht auswählen.',
    disableConfirm: 'Deaktivieren und speichern',
    leaveTitle: 'Nicht gespeicherte Änderungen verwerfen?',
    leaveDescription:
      'Die Änderungen in diesem Formular wurden nicht gespeichert.',
    discard: 'Änderungen verwerfen',
    continueEditing: 'Weiter bearbeiten',
    revisionReadonly:
      'Unveränderliche historische Revision. Änderungen erstellen eine neue Revision.',
    noEnabledShifts:
      'In der aktuellen Unternehmenszeitzone sind keine aktivierten Schichten verfügbar. Konfigurieren Sie zuerst eine Schicht oder wählen Sie ausdrücklich einen Ruhetag.',
    shiftOptionsCap:
      'Es werden nur die ersten 100 aktivierten Schichten angezeigt. Suchen Sie nach Code oder Name, um die Auswahl einzugrenzen.',
    oldTimeZone:
      'Diese historische Revision verwendet eine andere Unternehmenszeitzone. Das Speichern veröffentlicht eine neue Revision in der aktuellen Zeitzone.',
    selectShift: 'Aktivierte Schicht auswählen',
    chooseRevision: 'Unveränderliche Revision auswählen',
    intervalHint:
      'Verwenden Sie separate Intervalle für Pausen. Geben Sie bei Nachtarbeit Versätze zum Folgetag an. Es werden keine Geschäftszeiten standardmäßig vorgegeben.',
    restHint:
      'Ein Ruhetag ist eine ausdrückliche Tatsache und unterscheidet sich von fehlender Konfiguration.',
    reload: 'Neueste Konfiguration neu laden',
    back: 'Zurück zur Konfiguration',
  },
};
