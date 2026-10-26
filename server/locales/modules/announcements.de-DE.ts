export default {
  announcements: {
    authz: {
      title: 'Mitteilungen',
      owned: 'Von mir veröffentlicht',
      readable: 'Meine Veröffentlichungen und empfangenen Mitteilungen',
      view: 'Mitteilungen lesen',
      create: 'Mitteilungsentwürfe erstellen',
      edit: 'Eigenen Entwurf bearbeiten',
      publish: 'Eigene Mitteilung veröffentlichen',
      revoke: 'Eigene Mitteilung zurückziehen',
      remind: 'Empfänger ohne Bestätigung erinnern',
      receipts: 'Eigene Empfängerliste lesen',
      confirm: 'Eigenen Empfang bestätigen',
    },
    notifications: {
      title: 'Unternehmensmitteilung',
      body: 'Eine Mitteilung ist verfügbar. Öffnen Sie die Anwendung, um sie zu lesen.',
    },
    errors: {
      ACCESS_DENIED:
        'Auf diese Mitteilung oder diesen Vorgang kann nicht zugegriffen werden.',
      NOT_FOUND: 'Mitteilung nicht gefunden.',
      INVALID_INPUT:
        'Ungültige Mitteilungsdaten oder ungültiger Gültigkeitszeitraum.',
      INVALID_AUDIENCE:
        'Die Zielgruppe enthält eine nicht verfügbare Abteilung oder Funktionsrolle.',
      EMPTY_AUDIENCE: 'Die Mitteilung hat keine aktiven Empfänger.',
      INVALID_ATTACHMENT: 'Ungültiger oder nicht verfügbarer Anhang.',
      INVALID_STATE: 'Dieser Vorgang ist im aktuellen Status nicht verfügbar.',
      VERSION_CONFLICT:
        'Die Mitteilung wurde geändert. Laden Sie sie neu und versuchen Sie es erneut.',
      COMMAND_CONFLICT:
        'Diese Anfragekennung wurde bereits mit anderen Eingaben verwendet.',
      KNOWLEDGE_UNAVAILABLE:
        'Das verknüpfte Dokument ist nicht verfügbar oder nicht lesbar.',
    },
  },
};
