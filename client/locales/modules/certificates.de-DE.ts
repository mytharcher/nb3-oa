export default {
  certificates: {
    authz: {
      readable: 'Eigene und mitbearbeitete Anträge',
      requests: 'Bescheinigungsanträge',
      view: 'Anzeigen',
      create: 'Erstellen',
      edit: 'Bearbeiten',
      operate: 'Bearbeiten',
      issue: 'Ausstellen',
      income: 'Einkommen',
      owned: 'Eigene',
    },
    savedRecord: 'Bescheinigungsantrag für „{{name}}“ gespeichert',
    issuedRecord: 'Bescheinigung für „{{name}}“ ausgestellt',
    submittedRecord: 'Bescheinigungsantrag für „{{name}}“ eingereicht',

    businessErrors: {
      CERTIFICATE_ACCESS_DENIED:
        'Bescheinigungsvorgang abgelehnt: Zugriff verweigert',
      CERTIFICATE_APPROVAL_REFUSED:
        'Bescheinigungsvorgang abgelehnt: Genehmigung verweigert',
      CERTIFICATE_ARTIFACT_MISSING:
        'Bescheinigungsvorgang abgelehnt: Ausgabedokument fehlt',
      CERTIFICATE_CLAIM_REQUIRED:
        'Bescheinigungsvorgang abgelehnt: Übernahme erforderlich',
      CERTIFICATE_COMMAND_CONFLICT:
        'Bescheinigungsvorgang abgelehnt: Befehlskonflikt',
      CERTIFICATE_COMMAND_INVALID:
        'Bescheinigungsvorgang abgelehnt: ungültiger Befehl',
      CERTIFICATE_DEPARTMENT_REQUIRED:
        'Bescheinigungsvorgang abgelehnt: Abteilung erforderlich',
      CERTIFICATE_EMPLOYEE_REQUIRED:
        'Bescheinigungsvorgang abgelehnt: Mitarbeiter erforderlich',
      CERTIFICATE_HEAD_REQUIRED:
        'Bescheinigungsvorgang abgelehnt: Abteilungsleitung erforderlich',
      CERTIFICATE_HR_REQUIRED:
        'Bescheinigungsvorgang abgelehnt: Personalabteilung erforderlich',
      CERTIFICATE_INCOME_DENIED:
        'Bescheinigungsvorgang abgelehnt: Zugriff auf Einkommen verweigert',
      CERTIFICATE_INCOME_INVALID:
        'Bescheinigungsvorgang abgelehnt: ungültiges Einkommen',
      CERTIFICATE_INVALID: 'Bescheinigungsvorgang abgelehnt: ungültig',
      CERTIFICATE_PREPARATION_INVALID:
        'Bescheinigungsvorgang abgelehnt: ungültige Vorbereitung',
      CERTIFICATE_PREPARATION_MISSING:
        'Bescheinigungsvorgang abgelehnt: Vorbereitung fehlt',
      CERTIFICATE_PREPARATION_STALE:
        'Bescheinigungsvorgang abgelehnt: Vorbereitung veraltet',
      CERTIFICATE_SOURCE_STALE:
        'Bescheinigungsvorgang abgelehnt: Quelle veraltet',
      CERTIFICATE_TARGET_MISMATCH:
        'Bescheinigungsvorgang abgelehnt: Ziel stimmt nicht überein',
      CERTIFICATE_TEMPLATE_DENIED:
        'Bescheinigungsvorgang abgelehnt: Vorlagenzugriff verweigert',
    },

    title: 'Bescheinigungen',
    description: 'Mitarbeiterbescheinigungen beantragen und ausstellen',
    new: 'Neuer Bescheinigungsantrag',
    edit: 'Bescheinigungsantrag bearbeiten',
    detail: 'Bescheinigungsdetails',
    issue: 'Bescheinigung ausstellen',
    refresh: 'Aktualisieren',
    clear: 'Filter zurücksetzen',
    search: 'Zweck durchsuchen',
    all: 'Alle Status',
    name: 'Bescheinigung',
    recordName: 'Bescheinigung · {{name}}',
    type: 'Typ',
    purpose: 'Zweck',
    copies: 'Exemplare',
    delivery: 'Zustellmethode',
    applicant: 'Antragsteller',
    createdAt: 'Beantragt am',
    status: 'Status',
    number: 'Bescheinigungsnummer',
    issueDate: 'Ausstellungsdatum',
    oldest: 'Älteste zuerst',
    newest: 'Neueste zuerst',
    empty: 'Keine Bescheinigungsanträge',
    noMatch: 'Keine passenden Anträge',
    failed: 'Dieser Vorgang kann nicht abgeschlossen werden',
    unavailable: 'Dieser Datensatz oder diese Aktion ist nicht mehr verfügbar',
    retry: 'Erneut versuchen',
    cancel: 'Abbrechen',
    save: 'Entwurf speichern',
    saved: 'Gespeichert',
    loading: 'Bescheinigungsdetails werden geladen',
    moreActions: 'Weitere Aktionen',
    backToList: 'Zurück zur Bescheinigungsliste',
    consequences: {
      withdraw:
        'Diesen Antrag zurückziehen; er verlässt die aktive Prüfwarteschlange.',
      terminate:
        'Diesen Antrag beenden; die normale Bearbeitung wird gestoppt.',
      forceComplete:
        'Diesen Antrag außerordentlich beenden; es wird keine Bescheinigung ausgestellt.',
      reject:
        'Diesen Antrag ablehnen; er wird nicht zur Ausstellung weitergeleitet.',
      return: 'Diesen Antrag für Änderungen an den Antragsteller zurückgeben.',
      unable:
        'Erfassen, dass die Personalabteilung diese Bescheinigung nicht ausstellen kann; der Antrag erfordert Klärung.',
    },
    invalidInput:
      'Prüfen Sie die angegebenen Felder und geben Sie gültige Werte ein.',
    invalidCopies: 'Geben Sie eine ganze Zahl von 1 bis 100 ein.',
    invalidPurpose: 'Der Zweck darf höchstens 2.000 Zeichen umfassen.',
    required: 'Erforderlich',
    confirm: 'Bestätigen',
    discard: 'Änderungen verwerfen',
    discardDescription: 'Ihre nicht gespeicherten Änderungen gehen verloren.',
    confirmDescription:
      'Diese Aktion auf die von {{name}} beantragte Bescheinigung anwenden? Dies ändert den aktuellen Antrag.',
    history: 'Genehmigungsverlauf',
    mode: 'Prüferposition',
    modes: {
      before: 'Vor meiner Entscheidung',
      alongside: 'Parallel zu meiner Entscheidung',
    },
    recipient: 'Empfänger',
    reason: 'Begründung oder Kommentar',
    download: 'DOCX herunterladen',
    income: 'Monatliches Einkommen (CNY)',
    template: 'Vorlage',
    selectTemplate: 'Vorlage auswählen',
    revision: 'Feste Revision',
    previous: 'Zurück',
    next: 'Weiter',
    prepare: 'Ausstellung vorbereiten',
    generate: 'Dokument erzeugen',
    confirmIssue: 'Ausgabe bestätigen',
    issued: 'Bescheinigung ausgestellt',
    issueDescription:
      'Bereiten Sie eine feste Vorlagenrevision vor, erzeugen Sie das tatsächliche Dokument und bestätigen und archivieren Sie anschließend die Ausstellung.',
    invalidIssue:
      'Wählen Sie ein Ausstellungsdatum und geben Sie einen gültigen Einkommensbetrag mit höchstens zwei Nachkommastellen ein.',
    generateDescription:
      'Die Erzeugung kann einen Moment dauern. Falls sie fehlschlägt, wiederholen Sie diese Vorbereitung; es wurde noch keine Bescheinigung ausgestellt.',
    confirmIssueDescription:
      'Das erzeugte Dokument wird ausgestellt und dauerhaft im Mitarbeiterdatensatz erfasst.',
    types: {
      employment: 'Beschäftigung',
      income: 'Einkommen',
      other: 'Sonstige',
    },
    deliveries: { pickup: 'Abholung', mail: 'E-Mail', digital: 'Digital' },
    states: {
      draft: 'Entwurf',
      revision: 'Überarbeitung erforderlich',
      head: 'Prüfung durch die Führungskraft',
      issuing: 'Personalbearbeitung',
      issued: 'Ausgegeben',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
      terminated: 'Beendet',
      issueException: 'Ausgabeausnahme',
      administrativelyClosed: 'Administrativ geschlossen',
    },
    actions: {
      edit: 'Bearbeiten',
      submit: 'Einreichen',
      withdraw: 'Zurückziehen',
      terminate: 'Beenden',
      forceComplete: 'Administrativer Abschluss',
      retry: 'Bearbeitung erneut versuchen',
      approve: 'Genehmigen',
      reject: 'Ablehnen',
      return: 'Zur Überarbeitung zurückgeben',
      claim: 'Übernehmen',
      release: 'Freigeben',
      assign: 'Zuweisen',
      transfer: 'Versetzen',
      appoint: 'Bestimmen',
      reassign: 'Neu zuweisen',
      comment: 'Kommentar',
      read: 'Als gelesen markieren',
      cc: 'Kopieren',
      addSigner: 'Prüfer hinzufügen',
      addSign: 'Prüfer hinzufügen',
      urge: 'Erinnern',
      complete: 'Ausgabe bestätigen',
      unable: 'Ausgabe nicht möglich',
      delegate: 'Delegieren',
      recall: 'Zurückrufen',
    },
  },
};
