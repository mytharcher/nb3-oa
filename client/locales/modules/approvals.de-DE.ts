import registryLocale from '../../extensions/nocobase-approval-ui/locales/de-DE.js';
import { approvalLocaleDeDE as pluginLocale } from '@nocobase/app-plugin-approval/client';
const existing = {
  approvals: {
    printPdf: 'Drucken / Als PDF speichern',
    printFailed: 'Drucken fehlgeschlagen. Versuchen Sie es erneut.',
    saving: 'Wird gespeichert…',
    noAvailableAction: 'Derzeit ist keine Aktion verfügbar',
    authz: {
      cancellation: 'Urlaubsstornierung',
      section: 'OA-Genehmigungen',
      leave: 'Urlaubsanträge',
      submit: 'Eigenen Antrag einreichen',
      delegate: 'Antrag für einen Mitarbeiter einreichen',
      view: 'Anträge lesen',
      delegations: 'Genehmigungsdelegierungen',
      read: 'Lesen',
      update: 'Verwalten',
    },
    permissionSets: { delegations: 'Verwaltung von Genehmigungsdelegierungen' },
  },
};

const copy = {
  actionErrors: {
    REASON_REQUIRED: 'Geben Sie die Begründung für diesen Vorgang ein.',
    CLAIM_FIRST:
      'Übernehmen Sie diese Bearbeitungsaufgabe, bevor Sie ihr Ergebnis erfassen.',
    TASK_CLOSED:
      'Diese Aufgabe ist beendet. Aktualisieren Sie den Antrag und verwenden Sie seine aktuell verfügbaren Aktionen.',
    ALREADY_ANSWERED:
      'Diese Aufgabe enthält bereits Ihre Antwort. Aktualisieren Sie die Ansicht, um das erfasste Ergebnis zu sehen.',
    NOT_YOUR_TURN:
      'Eine frühere Genehmigung steht noch aus. Warten Sie, bis Sie an der Reihe sind.',
    STALE:
      'Die Genehmigung wurde geändert. Laden Sie den neuesten Antrag, bevor Sie fortfahren.',
    CONTENT_CHANGED:
      'Der geprüfte Inhalt wurde geändert. Aktualisieren und prüfen Sie ihn erneut vor einer Aktion.',
    STALE_CONTENT:
      'Der geprüfte Inhalt wurde geändert. Aktualisieren und prüfen Sie ihn erneut vor einer Aktion.',
    INVALID_ANSWER:
      'Diese Entscheidung ist in der aktuellen Stufe nicht verfügbar. Aktualisieren Sie die Ansicht und wählen Sie eine verfügbare Aktion.',
    NOT_ALLOWED:
      'Diese Aktion ist nicht mehr verfügbar. Aktualisieren Sie die Ansicht und wählen Sie eine aktuelle Aktion.',
    NO_ASSIGNEE:
      'Kein geeigneter Bearbeiter zugewiesen. Bitten Sie einen Genehmigungsadministrator um Zuweisung.',
    NO_STAGE:
      'Keine aktive Genehmigungsstufe verfügbar. Aktualisieren Sie die Ansicht und bitten Sie einen Genehmigungsadministrator, den Antrag zu prüfen.',
    ASSIGNMENT_LOOP:
      'Diese Neuzuweisung würde die Aufgabe an einen früheren Bearbeiter zurückgeben. Wählen Sie einen anderen geeigneten Empfänger.',
  },
  businessErrorFields: '{{message}} Prüfen Sie diese Felder: {{fields}}.',
  invalidFields: 'Prüfen Sie diese Felder: {{fields}}.',
  fieldSeparator: ', ',
  businessErrors: {
    LEAVE_EMPLOYEE_INACTIVE:
      'Die antragstellende Person benötigt einen aktiven Mitarbeiterdatensatz. Bitten Sie HR, den Datensatz und das verknüpfte Konto zu prüfen.',
    LEAVE_HANDOVER_INACTIVE:
      'Die ausgewählte Übergabeperson ist nicht verfügbar. Wählen Sie eine andere Person oder leeren Sie das Feld, wenn die Genehmigungsvertretung deaktiviert ist.',
    LEAVE_MAX_DAYS:
      'Der beantragte Urlaub überschreitet das Maximum dieser Urlaubsart. Verkürzen Sie den Zeitraum.',
    LEAVE_NO_WORKDAYS:
      'Der gewählte Zeitraum enthält keine Arbeitshalbtage. Passen Sie die Daten an.',
    LEAVE_TYPE_UNAVAILABLE:
      'Diese Urlaubsart ist nicht verfügbar. Wählen Sie eine aktivierte Urlaubsart.',
    LEAVE_DELEGATE_REQUIRED:
      'Wählen Sie für den delegierten Antrag einen anderen aktiven Mitarbeiter.',
  },

  creationUnknown:
    'Das Speicherergebnis ist unbekannt. Wiederholen Sie denselben Speichervorgang oder prüfen Sie vorhandene Entwürfe.',
  resubmit: 'Erneut einreichen',
  submitted: '{{name}} eingereicht',
  draftSavedSubmitFailed:
    'Entwurf gespeichert. Die Einreichung wurde nicht abgeschlossen. Beheben Sie das Problem und versuchen Sie es erneut.',
  submissionUnknown:
    'Das Einreichungsergebnis ist unbekannt. Wiederholen Sie die Einreichung mit demselben Inhalt, bevor Sie Änderungen vornehmen.',
  transfer: 'Versetzen',
  addSigner: 'Unterzeichner hinzufügen',
  urge: 'Erinnern',
  recipientSearch: 'Geeignete Empfänger suchen',
  moreRecipients: 'Weitere Empfänger laden',
  signerMode: 'Unterzeichnermodus',
  signerbefore: 'Vor meiner Entscheidung',
  signeralongside: 'Parallel zu meiner Entscheidung',
  emptyTodoTitle: 'Keine ausstehenden Genehmigungen',
  emptyTodoDescription:
    'Genehmigungen, die Ihre Aktion erfordern, erscheinen hier.',
  emptyDoneTitle: 'Keine abgeschlossenen Genehmigungen',
  emptyDoneDescription:
    'Genehmigungen, die Sie bearbeitet haben, erscheinen hier.',
  emptyCopiedTitle: 'Keine Genehmigungskopien',
  emptyCopiedDescription: 'An Sie in Kopie gesendete Anträge erscheinen hier.',
  emptyMineTitle: 'Keine gestarteten Anträge',
  emptyMineDescription:
    'Vervollständigen Sie einen Antrag und reichen Sie ihn ein oder speichern Sie einen Entwurf.',
  calendarTimeZone: 'Datumsangaben verwenden den Arbeitskalender in {{zone}}.',
  refreshAfterSuccess:
    'Die Aktion war erfolgreich, aber die neuesten Details konnten nicht geladen werden. Aktualisieren Sie die Ansicht, ohne die Aktion zu wiederholen.',
  domainInvalid:
    'Der Antrag erfüllt die fachlichen Bedingungen nicht. Prüfen Sie Urlaubsart, Daten, Übergabeperson und Antragsdetails.',
  confirmSubmit:
    'Die Einreichung startet den Genehmigungsprozess. Bestätigen Sie die Antragsdetails.',
  confirmWithdraw:
    'Das Zurückziehen verlässt den aktuellen Genehmigungsprozess.',
  confirmReject:
    'Die Ablehnung beendet diesen Antrag und seinen Genehmigungsprozess.',
  confirmReturn:
    'Die Rückgabe ermöglicht dem Antragsteller die Überarbeitung. Die Wiedereinreichung beginnt bei der ersten Stufe.',
  confirmTerminate:
    'Die administrative Beendigung beendet diesen Genehmigungsprozess.',

  navigation: {
    center: 'Aufgabenzentrale',
    delegations: 'Genehmigungsdelegierungen',
  },
  description: 'Genehmigungsaufgaben bearbeiten und eigene Anträge verfolgen.',
  tabs: {
    todo: 'Zu erledigen',
    done: 'Fertig',
    copied: 'Kopie an mich',
    mine: 'Meine Anträge',
  },
  newLeave: 'Neuer Urlaubsantrag',
  editLeave: 'Urlaubsantrag bearbeiten',
  draft: 'Entwurf',
  search: 'Nach Referenz oder Antragsteller suchen',
  clear: 'Filter zurücksetzen',
  all: 'Alle',
  noResults: 'Keine passenden Datensätze',
  emptyTitle: 'Noch keine Anträge',
  emptyDescription: 'Neue Genehmigungsaufgaben und Anträge erscheinen hier.',
  refresh: 'Aktualisieren',
  loading: 'Wird geladen',
  reference: 'Antragsnummer',
  applicant: 'Antragsteller',
  type: 'Urlaubsart',
  days: 'Tage',
  status: 'Status',
  createdAt: 'Beantragt am',
  actions: 'Aktionen für „{{name}}“',
  detail: 'Anzeigen',
  edit: 'Bearbeiten',
  saveDraft: 'Entwurf speichern',
  save: 'Speichern',
  cancel: 'Abbrechen',
  close: 'Schließen',
  submit: 'Einreichen',
  withdraw: 'Zurückziehen',
  terminate: 'Beenden',
  read: 'Als gelesen markieren',
  approve: 'Genehmigen',
  reject: 'Ablehnen',
  return: 'Zurückgeben',
  comment: 'Kommentar',
  appoint: 'Zuweisen',
  reassign: 'Neu zuweisen',
  reason: 'Begründung',
  opinion: 'Kommentar',
  person: 'Genehmiger',
  place: 'Nicht zugewiesene Stelle',
  startDate: 'Startdatum',
  endDate: 'Enddatum',
  startHalf: 'Starthalbtag',
  endHalf: 'Endhalbtag',
  am: 'Vormittag',
  pm: 'Nachmittag',
  handover: 'Übergabeperson',
  delegate: 'Genehmigungen während des Urlaubs delegieren',
  attachmentMissing:
    'Einige Anhänge sind nicht verfügbar. Laden Sie den Antrag neu oder wenden Sie sich an seinen Antragsteller.',
  attachments: 'Anhänge',
  attachmentRequired:
    'Fügen Sie die für die gewählte Urlaubsart erforderlichen unterstützenden Anhänge hinzu.',
  attachmentUnavailable:
    'Anhang-Uploads sind vorübergehend nicht verfügbar. Versuchen Sie es später erneut oder wenden Sie sich an einen Administrator.',
  attachmentInvalid:
    'Einige ausgewählte Anhänge sind ungültig oder gehören nicht zu diesem Antrag. Laden Sie den Antrag neu und wählen Sie diese erneut aus.',
  attachmentLimit:
    'Anhänge: PDF, JPEG, PNG oder WebP, höchstens 5 MB pro Datei und 10 Dateien. Vor dem ersten Upload wird ein gültiger Entwurf gespeichert.',
  attachmentSize: 'Wählen Sie eine nicht leere Datei mit höchstens 5 MB.',
  attachmentType:
    'Wählen Sie eine PDF-, JPEG-, PNG- oder WebP-Datei mit passendem Format.',
  attachmentCount: 'Höchstens 10 Anhänge sind zulässig.',
  attachmentDenied:
    'Sie können auf Anhänge dieses Antrags nicht zugreifen. Laden Sie den Antrag neu, um den Zugriff zu prüfen.',
  attachmentFailed:
    'Upload fehlgeschlagen. Prüfen Sie Formular und Verbindung und wählen Sie die Datei erneut aus.',
  attachmentUploading: 'Entwurf wird gespeichert und hochgeladen…',
  attachmentRemove: 'Anhang {{number}} entfernen',
  balanceInsufficient:
    'Der verfügbare Urlaubssaldo reicht nicht aus. Verringern Sie die Tage oder wenden Sie sich an die Personalabteilung.',
  balanceLimit:
    'Jahresurlaub und Freizeitausgleich sind mit Urlaubssalden verfügbar.',
  unavailable: 'Diese Aktion ist nicht verfügbar. Prüfen Sie ihre Hindernisse.',
  formDescription:
    'Vervollständigen Sie den Antrag und reichen Sie ihn ein oder speichern Sie einen Entwurf.',
  preview: 'Vorschau des Genehmigungswegs',
  facts: 'Antragsdetails',
  progress: 'Genehmigungsfortschritt',
  timeline: 'Genehmigungsverlauf',
  saved: 'Urlaubsantrag „{{name}}“ gespeichert',
  completed: '{{action}}: „{{name}}“',
  actionTitle: 'Antrag „{{name}}“: {{action}}',
  returnHint:
    'An den Antragsteller zurückgeben; die Wiedereinreichung beginnt bei der ersten Stufe.',
  confirmDescription:
    'Dies beendet die aktuelle Genehmigungsaufgabe. Bestätigen Sie den geprüften Inhalt.',
  discard: 'Änderungen verwerfen?',
  discardDescription: 'Nicht gespeicherte Änderungen gehen verloren.',
  discardConfirm: 'Änderungen verwerfen',
  readOnly: 'Dieser Datensatz ist schreibgeschützt.',
  hrPreview:
    'Bei einem im Namen eines Mitarbeiters gestellten Antrag wird der Weg bei der Einreichung berechnet.',
  dateRange: 'Das Ende darf nicht vor dem Beginn liegen.',
  required: 'Geben Sie einen Wert ein.',
  limit: 'Verwenden Sie höchstens 10.000 Zeichen.',
  handoverRequired:
    'Wählen Sie eine Übergabeperson, um die Delegierung zu aktivieren.',
  unknownPerson: 'Name nicht verfügbar',
  yes: 'Ja',
  no: 'Nein',
  error: {
    invalid:
      'Der Inhalt oder die Aktion erfüllt die Anforderungen nicht. Prüfen und passen Sie dies an.',
    overlap:
      'Ein aktiver oder genehmigter Urlaubsantrag überschneidet sich bereits mit diesem Zeitraum. Passen Sie die Daten an.',
    configuration:
      'Die aktuelle Genehmigungsfristenkonfiguration wird nicht unterstützt. Wenden Sie sich an einen Administrator.',
    inactive:
      'Ein erforderlicher Mitarbeiter ist nicht verfügbar. Prüfen Sie den Mitarbeiterstatus.',

    failed: 'Die Anfrage ist fehlgeschlagen. Versuchen Sie es erneut.',
    forbidden: 'Zugriff verweigert. Wenden Sie sich an einen Administrator.',
    notFound:
      'Dieser Datensatz fehlt oder wurde gelöscht. Kehren Sie zur Liste zurück.',
    conflict:
      'Dieser Antrag wurde geändert. Laden Sie vor einer Aktion den neuesten Inhalt.',
    stale:
      'Diese Aufgabe ist geschlossen oder die Aktion ist nicht mehr verfügbar.',
  },
  loadLatest: 'Neueste Version laden',
  retry: 'Erneut versuchen',
  states: {
    draft: 'Entwurf',
    revision: 'Überarbeitung erforderlich',
    manager: 'Prüfung durch die Führungskraft',
    head: 'Prüfung durch die Abteilungsleitung',
    hr: 'Prüfung durch die Personalabteilung',
    approved: 'Genehmigt',
    rejected: 'Abgelehnt',
    withdrawn: 'Zurückgezogen',
    terminated: 'Beendet',
  },
  stages: {
    manager: 'Direkte Führungskraft',
    head: 'Abteilungsleitung',
    hr: 'Personalabteilung',
    revision: 'Überarbeitung durch den Antragsteller',
  },
  delegations: {
    create: 'Erstellen',
    description:
      'Lassen Sie einen Vertreter während eines bestimmten Zeitraums Genehmigungen bearbeiten.',
    new: 'Neue Delegierung',
    edit: 'Delegierung bearbeiten',
    disable: 'Deaktivieren',
    principal: 'Vertretener',
    delegate: 'Delegieren',
    scope: 'Bereich',
    from: 'Beginn',
    to: 'Ende',
    source: 'Quelle',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    manual: 'Manuell',
    leave: 'Urlaub',
    search: 'Nach Vertretenem oder Vertreter suchen',
    sourceLeave:
      'Aus Urlaub erstellt. Verwalten Sie dies über den zugehörigen Antrag.',
    invalid:
      'Wählen Sie unterschiedliche aktive Mitarbeiter und ein Ende nach dem Beginn.',
    overlap:
      'Eine Delegierung deckt diesen Bereich und Zeitraum bereits ab. Passen Sie Zeitraum oder Bereich an.',
    disableTitle:
      'Delegierung von „{{principal}}“ an „{{delegate}}“ deaktivieren?',
    disableDescription:
      'Der Vertreter bearbeitet keine Genehmigungen in diesem Bereich mehr.',
    saved: 'Delegierung für „{{name}}“ gespeichert',
    empty: 'Noch keine Genehmigungsdelegierungen',
    emptyDescription:
      'Erstellen Sie eine Delegierung, damit jemand Genehmigungen für einen Zeitraum bearbeiten kann.',
    timeZone: 'Zeiten verwenden {{zone}}. Der Endzeitpunkt ist ausgeschlossen.',
  },
  typeUnavailable: 'Urlaubsart nicht verfügbar',
  noPickerPermission:
    'Die Personenauswahl erfordert Leseberechtigung für Benutzer. Wenden Sie sich an einen Administrator.',
};
export default {
  ...registryLocale,
  ...pluginLocale,
  approvals: {
    ...existing.approvals,
    ...copy,
    authz: {
      ...existing.approvals.authz,
      ownScope: 'Meine Datensätze',
      readableScope: 'Lesbare Genehmigungsanträge',
    },
    delegations: {
      ...copy.delegations,
      allScope: 'Alle Genehmigungen',
      leaveScope: 'Urlaubsgenehmigungen',
      fromTime: 'Startzeit (HH:mm)',
      toTime: 'Endzeit (HH:mm)',
      timeInvalid:
        'Wählen Sie Daten und geben Sie gültige Zeiten im 24-Stunden-Format ein.',
      disabled: 'Genehmigungsdelegierung für „{{name}}“ deaktiviert',
      readOnly: 'Diese Delegierung ist schreibgeschützt.',
    },
  },
};
