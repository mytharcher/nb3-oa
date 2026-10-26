export default {
  onboarding: {
    notifications: {
      overdueTitle: 'Eintrittsaufgabe überfällig',
      overdueBody:
        'Eine Eintrittsaufgabe ist überfällig. Prüfen Sie Ihre aktuell zugewiesenen Aufgaben.',
    },
    authz: {
      resource: 'Eintritt',
      readable: 'Eintrittsbeteiligte',
      view: 'Eintritt anzeigen',
      create: 'Eintritt anlegen',
      cancel: 'Eintritt abbrechen',
      claim: 'Aufgabe übernehmen',
      reassignMentor: 'Abteilungsleitung neu zuweisen',
      transfer: 'Versetzen',
      release: 'Aufgabe freigeben',
      complete: 'Aufgabe abschließen',
      forceComplete: 'Abschluss erzwingen',
      viewSalary: 'Eintrittsgehalt anzeigen',
      viewBank: 'Bankverbindung beim Eintritt anzeigen',
    },
    errors: {
      employeeSourceConflict:
        'Die Eintrittsquelle wurde bereits mit anderen Mitarbeiterdaten verknüpft.',
      employeeAccountEnabled:
        'Das Eintrittskonto muss deaktiviert bleiben, während der Mitarbeiterdatensatz erstellt wird.',
      forbidden:
        'Sie sind nicht berechtigt, diesen Eintrittsvorgang auszuführen.',
      sourceInvalid:
        'Die Personalbeschaffungszuteilung oder die fachlichen Eintrittsdaten sind nicht mehr gültig.',
      idempotencyConflict:
        'Diese Befehlskennung wurde bereits mit anderen Details verwendet.',
    },
  },
};
