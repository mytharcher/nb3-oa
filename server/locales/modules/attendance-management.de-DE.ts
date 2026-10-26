export default {
  attendanceManagement: {
    errors: {
      ATTENDANCE_INVALID_INPUT:
        'Ungültige ursprüngliche Anwesenheitsnachweise.',
      ATTENDANCE_INVALID_TIME:
        'Die Zeitbuchung muss zum Anwesenheitsdatum des Unternehmens gehören.',
      ATTENDANCE_INVALID_BATCH:
        'Geben Sie 1–1000 Zeilen innerhalb der Größenbeschränkung für Nachweise an.',
      ATTENDANCE_SOURCE_CONFLICT:
        'Der Quellschlüssel bezeichnet andere unveränderliche Nachweise.',
      ATTENDANCE_IDENTITY_UNAVAILABLE:
        'Jede Zeile erfordert eine tatsächliche Person mit einem Mitarbeiterdatensatz.',

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
      importResource: 'Import ursprünglicher Anwesenheitsdaten',
      ingest: 'Unveränderliche Nachweise importieren',
      attendanceRecords: 'Ursprüngliche Anwesenheitsdaten',

      resource: 'Anwesenheitskonfiguration',
      view: 'Anwesenheitskonfiguration anzeigen',
      manage: 'Anwesenheitskonfiguration verwalten',
      attendanceShifts: 'Anwesenheitsschichten',
      attendanceShiftRevisions: 'Schichtrevisionen',
      attendanceSchedules: 'Abteilungsdienstpläne',
      attendanceScheduleRevisions: 'Dienstplanrevisionen',
    },
  },
};
