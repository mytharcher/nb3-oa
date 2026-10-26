export default {
  probationRequests: {
    businessErrors: {
      PROBATION_SELF_EVALUATION_REQUIRED:
        'Geben Sie vor der Einreichung die Selbstbewertung des Mitarbeiters ein.',
      PROBATION_CONCLUSION_REQUIRED:
        'Geben Sie vor der Genehmigung das Ergebnis der Führungskraft ein.',
      PROBATION_COMPENSATION_REQUIRED:
        'Vervollständigen Sie die geschützten Gehaltsgruppen- und Gehaltsangaben im Genehmigungsformular der Personalabteilung.',
      PROBATION_INVALID_GRADE: 'Wählen Sie eine aktivierte Gehaltsgruppe.',
      PROBATION_ALREADY_ACTIVE:
        'Für diesen Mitarbeiter besteht bereits ein aktiver Probezeitantrag. Öffnen Sie den vorhandenen Antrag.',
      PROBATION_STALE_EMPLOYEE:
        'Die Probezeitinformationen des Mitarbeiters wurden geändert. Aktualisieren Sie die Ansicht vor einer erneuten Aktion.',
      PROBATION_DEPARTMENT_REQUIRED:
        'Der Mitarbeiter benötigt eine aktive Hauptabteilung. Bitten Sie die Personalabteilung, den Datensatz zu aktualisieren.',
    },

    title: 'Probezeitanträge',
    description:
      'Prüfen Sie Probezeitbewertungen und verfolgen Sie die Entscheidung zur Festanstellung.',
    new: 'Neuer Probezeitantrag',
    edit: 'Bearbeiten',
    details: 'Details anzeigen',
    number: 'Nummer',
    employee: 'Mitarbeiter',
    probationEndDate: 'Probezeitende',
    conclusion: 'Ergebnis',
    search: 'Nach Nummer, Mitarbeitername oder Selbstbewertung suchen',
    view: 'Datensatzansicht',
    allStatuses: 'Alle Status',
    refresh: 'Aktualisieren',
    clearFilters: 'Filter zurücksetzen',
    emptyTitle: 'Noch keine Probezeitanträge',
    emptyDescription:
      'Mitarbeiter erhalten kurz vor Ablauf systemseitige Entwürfe. Die Personalabteilung kann eine Bewertung für einen Mitarbeiter in Probezeit erstellen.',
    noResults: 'Keine passenden Anträge',
    rowActions: 'Aktionen für {{name}}',
    views: {
      mine: 'Meine',
      pending: 'Ausstehend',
      done: 'Fertig',
      copied: 'Kopiert',
    },
    conclusions: {
      regular: 'Festanstellung bestätigen',
      deferred: 'Probezeit verlängern',
      declined: 'Festanstellung ablehnen',
    },
    statuses: {
      draft: 'Entwurf',
      revision: 'Revision',
      manager: 'Prüfung durch die Führungskraft',
      head: 'Abteilungsprüfung',
      hr: 'Prüfung durch die Personalabteilung',
      gm: 'Prüfung durch die Geschäftsführung',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
      terminated: 'Beendet',
    },
    errors: {
      forbidden:
        'Sie haben keinen Zugriff. Bitten Sie einen Administrator, Ihre Berechtigung zu prüfen.',
      notFound:
        'Dieser Datensatz ist nicht mehr vorhanden oder nicht verfügbar. Kehren Sie zur Ursprungsseite zurück.',
      conflict:
        'Diese Bewertung wurde geändert. Lesen Sie den neuesten Datensatz vor einer erneuten Aktion.',
      invalid: 'Prüfen Sie Bewertungsinhalt und Pflichtfelder.',
      failed: 'Die Anfrage wurde nicht abgeschlossen. Versuchen Sie es erneut.',
      departureUnavailable:
        'Der Austrittsprozess ist nicht verfügbar; diese Aktion wurde nicht abgeschlossen. Die Prüfung der Geschäftsführung bleibt ausstehend.',
    },
    detail: {
      creator: 'Erstellt von',
      selfEvaluation: 'Selbstbewertung',
      evaluation: 'Bewertung durch die Führungskraft',
      deferredTo: 'Verlängertes Probezeitende',
      grade: 'Gehaltsgruppe',
      manager: 'Prüfende Führungskraft',
      head: 'Abteilungsprüfer',
      hr: 'Personalprüfer',
      gm: 'Prüfer der Geschäftsführung',
      rules: 'Festgeschriebene Regeln',
      unsubmitted: 'Regeln werden bei der Einreichung festgeschrieben.',
    },
    rules: {
      grade_managerRank: 'Gehaltsgruppenschwelle für Führungskräfte',
      sla_remindHours: 'Erinnerungsfrist in Arbeitsstunden',
      sla_escalateHours: 'Eskalationsfrist in Arbeitsstunden',
      sla_urgeCooldownHours: 'Mindestabstand zwischen Erinnerungen in Stunden',
    },
    compensation: {
      title: 'Vertraulicher Vergütungsvorschlag',
      denied: 'Sie können die Vergütung nicht anzeigen.',
      missing: 'Es wurde kein Vergütungsvorschlag gespeichert.',
      grade: 'Vorgeschlagene Gehaltsgruppe',
      salary: 'Grundgehalt (Yuan)',
    },
    authz: {
      resource: 'Probezeitbewertungen',
      submit: 'Probezeitbewertung bearbeiten und einreichen',
      delegate: 'Personalabteilung erstellt Probezeitbewertungen',
      view: 'Autorisierte Probezeitbewertungen lesen',
      compensation: 'Auf vertrauliche Probezeitvergütung zugreifen',
    },
    schedule: {
      title: 'Erinnerungen an das Probezeitende',
      description:
        'Probezeitdaten in der Unternehmenszeitzone abgleichen, 14 Tage vor Ablauf Selbstbewertungsentwürfe erstellen und Mitarbeiter benachrichtigen.',
    },
  },
};
