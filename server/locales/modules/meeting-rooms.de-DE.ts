export default {
  meetingRooms: {
    authz: {
      title: 'Besprechungsräume',
      bookings: 'Besprechungsbuchungen',
      view: 'Anzeigen',
      manage: 'Besprechungsräume verwalten',
      create: 'Raum buchen',
      edit: 'Buchungen bearbeiten',
      cancel: 'Buchungen stornieren',
      confirm: 'Verwaltungsanfragen bestätigen',
      reject: 'Verwaltungsanfragen ablehnen',
      checkIn: 'Einchecken',
      owned: 'Von mir organisiert',
      participating: 'Besprechungen, an denen ich teilnehme',
      readable: 'Von mir organisierte oder besuchte Besprechungen',
    },
    notifications: {
      title: 'Besprechungsbuchung aktualisiert',
      body: 'Eine Sie betreffende Besprechungsbuchung wurde geändert. Öffnen Sie Ihre Besprechungsbuchungen, um die für Sie zugänglichen Details zu prüfen.',
    },
    errors: {
      SORT_LIMIT_EXCEEDED:
        'Zu viele passende Datensätze. Grenzen Sie die Suche ein, bevor Sie nach Namen sortieren.',
      ACCESS_DENIED:
        'Dieser Vorgang oder seine Felder liegen außerhalb Ihrer Berechtigung.',
      ACTIVE_EMPLOYEE_REQUIRED:
        'Ein aktiver Mitarbeiterdatensatz ist erforderlich.',
      BOOKING_NOT_FOUND: 'Die Buchung ist nicht verfügbar.',
      CAPACITY_EXCEEDED:
        'Die Anzahl von Organisator und Teilnehmern überschreitet die Raumkapazität.',
      COMMAND_CONFLICT:
        'Diese Anfragekennung gehört zu einem anderen Vorgang oder Bearbeiter.',
      INVALID_BOOKING:
        'Geben Sie einen Titel und unterschiedliche aktive Teilnehmer ein.',
      INVALID_INTERVAL:
        'Wählen Sie einen zukünftigen Zeitraum, dessen Ende nach dem Beginn liegt.',
      INVALID_PARTICIPANT: 'Alle Teilnehmer müssen aktive Mitarbeiter sein.',
      INVALID_RECURRENCE:
        'Wählen Sie eine tägliche oder wöchentliche Serie mit 1 bis 52 Terminen.',
      INVALID_REQUEST_ID: 'Eine Anfragekennung ist erforderlich.',
      INVALID_ROOM:
        'Geben Sie einen Raumnamen, eine Kapazität und eine Änderungsbegründung ein.',
      INVALID_SERIES: 'Wählen Sie eine vorhandene Serie.',
      INVALID_STATE:
        'Dieser Vorgang kann für diese Buchung im aktuellen Status oder Zeitraum nicht ausgeführt werden.',
      REASON_REQUIRED:
        'Geben Sie eine Begründung für diese Verwaltungsentscheidung ein.',
      ROOM_INACTIVE: 'Dieser Raum ist inaktiv.',
      ROOM_NOT_FOUND: 'Dieser Raum ist nicht verfügbar.',
      TIME_CONFLICT:
        'Ein oder mehrere angefragte Zeiträume überschneiden sich mit einem belegten Zeitraum.',
      VERSION_CONFLICT:
        'Die Buchung oder der Raum wurde geändert. Aktualisieren Sie die Ansicht vor einem erneuten Versuch.',
      INVALID_LOCAL_TIME:
        'Geben Sie ein gültiges Datum und eine gültige Uhrzeit in der Unternehmenszeitzone ein.',
      NONEXISTENT_LOCAL_TIME:
        'Diese Ortszeit ist wegen einer Zeitzonenänderung nicht vorhanden. Wählen Sie eine andere Zeit.',
      AMBIGUOUS_LOCAL_TIME:
        'Diese Ortszeit tritt wegen einer Zeitzonenänderung zweimal auf. Wählen Sie eine eindeutige Zeit.',
    },
  },
};
