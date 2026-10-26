export default {
  workItems: {
    authz: {
      confirmationOwned: 'Von mir zu bestätigende Aufgaben',
      handoverConfirmation: 'Bestätigungsverantwortung übertragen',

      title: 'Allgemeine Arbeitsaufgaben',
      owned: 'Von mir erstellt',
      readable:
        'Von mir erstellte, mir gehörende oder für mich geeignete Aufgaben',
      view: 'anzeigen',
      create: 'erstellen',
      edit: 'bearbeiten',
      dispatch: 'zuweisen',
      claim: 'übernehmen',
      release: 'freigeben',
      complete: 'abschließen',
      confirm: 'bestätigen',
      return: 'zurückgeben',
      block: 'blockieren',
      resume: 'fortsetzen',
      reassign: 'neu zuweisen',
      cancel: 'abbrechen',
      forceComplete: 'Abschluss erzwingen',
    },
    notifications: {
      title: 'Arbeitsaufgabe aktualisiert',
      body: 'Eine allgemeine Aufgabe wurde geändert. Öffnen Sie die Anwendung für Details.',
    },
    errors: {
      ACCESS_DENIED: 'Die Aufgabe oder der Vorgang ist nicht zugänglich.',
      NOT_FOUND: 'Aufgabe nicht gefunden.',
      REASON_REQUIRED: 'Eine Begründung ist erforderlich.',
      RESULT_REQUIRED: 'Ein Abschlussergebnis ist erforderlich.',
      INVALID_INPUT:
        'Die Eingabe oder der Status ist ungültig. Aktualisieren Sie die Ansicht und versuchen Sie es erneut.',
      INVALID_TARGET:
        'Die Eingabe oder der Status ist ungültig. Aktualisieren Sie die Ansicht und versuchen Sie es erneut.',
      INVALID_ATTACHMENT:
        'Die Eingabe oder der Status ist ungültig. Aktualisieren Sie die Ansicht und versuchen Sie es erneut.',
      VERSION_CONFLICT:
        'Die Eingabe oder der Status ist ungültig. Aktualisieren Sie die Ansicht und versuchen Sie es erneut.',
      COMMAND_CONFLICT:
        'Die Eingabe oder der Status ist ungültig. Aktualisieren Sie die Ansicht und versuchen Sie es erneut.',
    },
  },
};
