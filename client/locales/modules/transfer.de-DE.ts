export default {
  recordName: 'Personaländerung für „{{name}}“',
  namedAction: '{{action}} für „{{name}}“?',
  savedRecord: 'Personaländerung für „{{name}}“ gespeichert',

  businessErrors: {
    TRANSFER_INVALID_DATE:
      'Wählen Sie ein gültiges Wirksamkeitsdatum für die Personaländerung.',
    TRANSFER_NO_CHANGE:
      'Es wurden keine fachlichen Details geändert. Ändern Sie mindestens ein zulässiges Feld.',
    TRANSFER_SALARY_INVALID:
      'Geben Sie einen gültigen Gehaltsbetrag innerhalb des unterstützten Bereichs ein.',
    TRANSFER_RATIO_INVALID:
      'Prüfen Sie die Gehaltsanpassungsquote anhand der konfigurierten Grenze.',
    TRANSFER_INVALID_PROMOTION:
      'Die ausgewählte Gehaltsgruppe gilt nicht als Beförderung. Prüfen Sie aktuelle und Zielgehaltsgruppe.',
    TRANSFER_TARGET_DEPARTMENT_UNAVAILABLE:
      'Wählen Sie eine aktive Zielabteilung.',
    TRANSFER_TARGET_POSITION_UNAVAILABLE:
      'Wählen Sie eine aktive Position in der Zielabteilung.',
    TRANSFER_ACCOUNT_UNAVAILABLE:
      'Wählen Sie ein passendes initialisiertes Personalstellenkonto mit ausreichender Kapazität.',
    TRANSFER_YEAR_REBIND_REQUIRED:
      'Das Jahr wurde geändert. Verknüpfen Sie den Antrag neu mit dem passenden jährlichen Personalstellenkonto.',
    TRANSFER_SOURCE_CHANGED:
      'Die aktuelle Zuordnung des Mitarbeiters wurde geändert. Aktualisieren Sie die Ansicht und überarbeiten Sie den Vorschlag.',
    TRANSFER_COMPENSATION_CHANGED:
      'Das Gehalt des Mitarbeiters wurde geändert. Aktualisieren Sie die Ansicht vor der Vergütungsüberarbeitung.',
    TRANSFER_NOT_DUE:
      'Das Wirksamkeitsdatum ist noch nicht erreicht. Warten Sie bis zum geplanten Datum.',
    TRANSFER_INVALID_KINDS:
      'Wählen Sie die Personaländerungsarten, die den geänderten Feldern entsprechen.',
  },

  moreActions: 'Weitere Aktionen',
  return: 'Zurückgeben',
  destructiveConsequence:
    'Diese Aktion beendet oder ändert die aktuelle Genehmigung. Prüfen Sie die Folgen vor der Bestätigung.',
  searchPeople: 'Nach Kandidatenname suchen',
  title: 'Personaländerungen',
  description: 'Genehmigung und Wirksamkeit von Personaländerungen verfolgen.',
  create: 'Neuer Antrag',
  search: 'Nach Begründung oder Antrags-ID suchen',
  searchEmployees: 'Nach Mitarbeitername oder -code suchen',
  empty: 'Keine Personaländerungsanträge',
  noResults: 'Keine passenden Anträge',
  refresh: 'Aktualisieren',
  clear: 'Filter zurücksetzen',
  allStatuses: 'Alle Status',
  employeeInDetail: 'Details ansehen',
  salary: 'Vertrauliches Gehalt',
  currentSalary: 'Aktuelles Gehalt',
  salaryDenied: 'Sie können das Gehalt für diesen Antrag nicht anzeigen',
  failedToExecute:
    'Wirksamwerden fehlgeschlagen. Klären Sie Mitarbeiterdaten oder Kapazitätskonten vor einem erneuten Versuch.',
  loading: 'Wird geladen…',
  saved: 'Vorgang abgeschlossen',
  saving: 'Wird gespeichert…',
  save: 'Speichern',
  cancel: 'Abbrechen',
  confirm: 'Aktion bestätigen',
  retry: 'Erneut versuchen',
  loadLatest: 'Neueste Version laden',
  reviewEditWarning:
    'Änderungen starten die Genehmigung neu und schließen bestehende Aufgaben.',
  cancelConsequence:
    'Kapazität bleibt zugeteilt, bis eine unabhängige Person der Personalabteilung die Stornierung bestätigt.',
  rebindConsequence:
    'Tatsächliche Konten des laufenden Jahres neu verknüpfen. Das Wirksamwerden bleibt bis zur Pflege ausstehend.',
  confirmAction:
    'Prüfen Sie aktuellen Antrag und Aktion und geben Sie eine Begründung an.',
  unavailable:
    'Die Aufgabe oder Berechtigung wurde geändert. Kehren Sie zu den Details zurück und aktualisieren Sie die Ansicht.',
  recipient: 'Empfänger',
  select: 'Option auswählen',
  none: 'Keine',
  required: 'Dieses Feld ist erforderlich',
  tooLong: 'Der Inhalt ist zu lang',
  noChanges: 'Mindestens ein zulässiges Feld ändern',
  capacityResolved:
    'Kapazitätskonten ermittelt. Die Reservierung wird in der Genehmigungstransaktion geprüft.',
  capacityRequired:
    'Wählen Sie Mitarbeiter, Zielabteilung, Position und Wirksamkeitsdatum, um tatsächliche Kapazitätskonten zu ermitteln.',
  previous: 'Zurück',
  next: 'Weiter',
  discardTitle: 'Nicht gespeicherte Änderungen verwerfen?',
  discardDescription:
    'Beim Verlassen werden Ihre aktuellen Eingaben verworfen.',
  keepEditing: 'Weiter bearbeiten',
  discard: 'Änderungen verwerfen',

  fields: {
    id: 'Antrags-ID',
    employeeId: 'Mitarbeiter',
    kinds: 'Änderungsarten',
    targetDepartmentId: 'Zielabteilung',
    targetPositionId: 'Zielposition',
    targetGradeId: 'Zielgehaltsgruppe',
    targetManagerId: 'Zielführungskraft',
    effectiveDate: 'Wirksamkeitsdatum',
    targetSalary: 'Zielgehalt (CNY)',
    reason: 'Begründung',
    status: 'Status',
    applicantId: 'Antragsteller',
    createdAt: 'Erstellt am',
  },
  factFields: {
    employee: 'Mitarbeiter',
    department: 'Zielabteilung',
    position: 'Zielposition',
    grade: 'Zielgehaltsgruppe',
    manager: 'Zielführungskraft',
  },
  status: {
    completed: 'Wirksam',
    draft: 'Entwurf',
    revision: 'Zur Überarbeitung zurückgegeben',
    manager: 'Prüfung durch die Führungskraft',
    sourceHead: 'Prüfung der Quellabteilung',
    targetHead: 'Prüfung der Zielabteilung',
    hr: 'Prüfung durch die Personalabteilung',
    executive: 'Prüfung durch die Bereichsleitung',
    gm: 'Prüfung durch die Geschäftsführung',
    pendingEffective: 'Wirksamwerden ausstehend',
    cancellationReview: 'Stornierungsbestätigung ausstehend',
    executed: 'Wirksam',
    cancelled: 'Abgebrochen',
    rejected: 'Abgelehnt',
    withdrawn: 'Zurückgezogen',
    terminated: 'Beendet',
  },
  operations: {
    submit: 'Einreichen',
    edit: 'Antrag bearbeiten',
    reviewEdit: 'Prüffelder überarbeiten',
    withdraw: 'Zurückziehen',
    terminate: 'Beenden',
    requestCancellation: 'Stornierung beantragen',
    rebind: 'Kapazität des laufenden Jahres neu verknüpfen',
  },
  kinds: {
    transfer: 'Versetzen',
    salaryChange: 'Gehaltsänderung',
    promotion: 'Beförderung',
  },
  authz: {
    rebind: 'Kapazität für das laufende Jahr neu verknüpfen',
    resource: 'Personaländerungen',
    view: 'Anträge anzeigen',
    operate: 'Genehmigungsaktionen ausführen',
    viewSalary: 'Gehalt anzeigen',
    submit: 'Anträge einreichen und bearbeiten',
    reviewEdit: 'Zulässige Prüffelder überarbeiten',
    cancel: 'Stornierung vor Wirksamkeit beantragen',
    readable: 'Eigene und mitbearbeitete Anträge',
  },
  errors: {
    missing:
      'Dieser Antrag ist nicht verfügbar. Kehren Sie zur Liste zurück und aktualisieren Sie die Ansicht.',
    conflict:
      'Der Antrag wurde geändert. Laden Sie die neuesten Details und versuchen Sie es erneut.',
    precondition:
      'Fachliche Voraussetzungen sind nicht verfügbar. Prüfen Sie Mitarbeiterdaten und Kapazitätskonten.',
    salary:
      'Geben Sie ein Gehalt innerhalb des zulässigen Bereichs mit bis zu zwei Nachkommastellen ein.',

    denied: 'Sie sind für diese Personaländerung nicht berechtigt.',
    failed:
      'Die Personaländerung konnte nicht abgeschlossen werden. Aktualisieren Sie die Ansicht und versuchen Sie es erneut.',
  },
};
