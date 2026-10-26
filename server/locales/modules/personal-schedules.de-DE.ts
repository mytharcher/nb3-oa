export default {
  personalSchedules: {
    authz: {
      title: 'Persönliche Termine',
      owned: 'Meine Termine',
      view: 'Anzeigen',
      create: 'Erstellen',
      edit: 'Bearbeiten',
      delete: 'Löschen',
    },
    errors: {
      SOURCE_MANAGED:
        'Verwalten Sie diese Besprechung über ihre Buchung und nicht über Ihre persönlichen Termine.',
      ACCESS_DENIED:
        'Sie sind nicht berechtigt, auf diesen Termin zuzugreifen.',
      NOT_FOUND: 'Termin nicht gefunden.',
      INVALID_INPUT:
        'Geben Sie einen Titel und eine gültige Start- und Endzeit ein.',
      VERSION_CONFLICT:
        'Dieser Termin wurde geändert. Aktualisieren Sie die Ansicht und versuchen Sie es erneut.',
    },
  },
};
