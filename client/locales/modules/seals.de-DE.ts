export default {
  seals: {
    authz: {
      requests: 'Siegelanträge',
      view: 'Anzeigen',
      create: 'Erstellen',
      edit: 'Bearbeiten',
      operate: 'Bearbeiten',
      actualReturn: 'Tatsächliche außerordentliche Rückgabe',
      ledger: 'Siegelverzeichnis',
      instances: 'Siegelexemplare',
      manage: 'Siegelstammdaten verwalten',
      owned: 'Eigene Datensätze',
      readable: 'Eigene und mitbearbeitete Datensätze',
    },
    registrationSource: 'Registrierung für Antrag {{number}}',
    relatedUnavailable: 'Verknüpfter Datensatz nicht verfügbar',
    copiesRange: 'Geben Sie eine ganze Zahl von 1 bis {{max}} ein.',
    actionSaved: '{{action}} für Siegelantrag „{{name}}“ abgeschlossen',
    requestSaved: 'Siegelantrag „{{name}}“ gespeichert',

    noLongerEditable:
      'Dieser Antrag kann nicht mehr bearbeitet werden. Schließen Sie ihn und aktualisieren Sie die Liste.',

    businessErrors: {
      REVIEWER_REQUIRED:
        'Der tatsächlich zugewiesene Prüfer muss die erforderliche aktive Funktionsrolle weiterhin besitzen.',
      APPROVAL_REFUSED:
        'Die aktuellen Genehmigungs- oder Bearbeitungsregeln verweigern diesen Vorgang.',
      ACCESS_DENIED:
        'Sie können auf diese Siegelseinträge oder Felder nicht zugreifen.',
      ACTIVE_EMPLOYEE_REQUIRED:
        'Ein aktives Mitarbeiterkonto ist erforderlich.',
      ADMIN_KEEPER_REQUIRED:
        'Tatsächliche außerordentliche Rückgaben erfordern sowohl die Administrator- als auch die Siegelverwalterrolle.',
      ADMIN_REQUIRED: 'Eine aktive Verwaltungsfunktionsrolle ist erforderlich.',
      BODY_TOO_LARGE: 'Der Anhang überschreitet die zulässige Uploadgröße.',
      COMMAND_CONFLICT:
        'Dieser Anfrageschlüssel wurde bereits für andere Inhalte verwendet.',
      CONTRACT_ACCESS_DENIED:
        'Sie können den verknüpften Vertrag nicht anzeigen.',
      CONTRACT_NOT_EFFECTIVE: 'Der verknüpfte Vertrag ist nicht wirksam.',
      CONTRACT_VERSION_CONFLICT:
        'Der verknüpfte Vertrag wurde nach der Genehmigung geändert.',
      DEPARTMENT_REQUIRED: 'Der Antragsteller muss eine Hauptabteilung haben.',
      INVALID_COMMAND: 'Ein gültiger Anfrageschlüssel ist erforderlich.',
      INVALID_COPIES:
        'Die Anzahl tatsächlich gesiegelter Exemplare muss positiv sein und darf die genehmigte Menge nicht überschreiten.',
      INVALID_FILE:
        'Der Anhang fehlt, ist unsicher oder gehört nicht zu diesem Antrag.',
      INVALID_INPUT: 'Die Felder des Siegelantrags sind ungültig.',
      INVALID_OUTPUT: 'Das Ergebnis der physischen Bearbeitung ist ungültig.',
      INVALID_RETURN:
        'Die tatsächliche Rückgabe erfordert eine administrativ abgeschlossene externe Ausleihe und eine Begründung.',
      INVALID_SEAL_TYPE:
        'Die Siegelart ist inaktiv oder stimmt nicht mit dem genehmigten Antrag überein.',
      INVALID_TIME:
        'Die tatsächlichen Zeitangaben oder die Rückgabefrist sind ungültig.',
      KEEPER_REQUIRED: 'Eine aktive Siegelverwalterrolle ist erforderlich.',
      OUTSTANDING_CUSTODY:
        'Dieses Siegel befindet sich noch in physischer Verwahrung.',
      PHYSICAL_ALREADY_REGISTERED:
        'Die tatsächliche Nutzung oder Rückgabe wurde bereits erfasst.',
      REQUEST_NOT_FOUND: 'Der Antrag ist nicht verfügbar.',
      SEAL_EVIDENCE_REQUIRED:
        'Ein tatsächlicher unveränderlicher Siegelnachweis ist erforderlich.',
      SEAL_NOT_FOUND: 'Das Siegel ist nicht verfügbar.',
      SEAL_UNAVAILABLE: 'Dieses Siegel ist derzeit ausgeliehen.',
      SLA_UNSUPPORTED:
        'Der konfigurierte Erinnerungszeitplan wird nicht unterstützt.',
      TARGET_MISMATCH: 'Die angebotene Aufgabe gehört nicht zu diesem Antrag.',
      VERSION_CONFLICT:
        'Der Datensatz wurde geändert. Aktualisieren Sie die Ansicht vor einem erneuten Versuch.',
    },

    disableInstance: 'Siegel „{{name}}“ deaktivieren?',
    disableInstanceDescription:
      'Deaktivierte Siegel können nicht für neue physische Bearbeitung ausgewählt werden. Bestehende unveränderliche Registrierungs- und Verwahrungsnachweise bleiben erhalten.',
    disable: 'Siegel deaktivieren',
    instanceSaved: 'Siegel „{{name}}“ gespeichert',

    reloadInstance: 'Siegelstammdaten neu laden?',
    reloadInstanceDescription:
      'Das Neuladen verwirft Ihre nicht gespeicherten Eingaben und verwendet die aktuelle Version. Sie müssen den Änderungsgrund erneut eingeben.',

    save: 'Siegel speichern',
    forbidden: 'Zugriff verweigert. Wenden Sie sich an einen Administrator',
    missing: 'Dieses Siegel ist nicht verfügbar',

    instances: 'Siegelverwaltung',
    instanceNotice:
      'Siegelstammdaten verwalten. Physische Verwahrung und Registrierung werden nur durch tatsächliche Bearbeitung erfasst.',
    instanceCode: 'Siegelcode',
    instanceName: 'Siegelname',
    instanceActive: 'Aktiv',
    instanceVersion: 'Version',
    newInstance: 'Neues Siegel',
    editInstance: 'Siegel bearbeiten',
    emptyInstances: 'Noch keine Siegel',

    returnTarget: 'Rückgabeziel',
    title: 'Siegelanträge',
    description:
      'Siegelnutzung beantragen und aktuelle Genehmigungs- und physische Bearbeitungsdaten prüfen.',
    confirmations: {
      confirmed: 'Bestätigt',
      notApplicable: 'Nicht zutreffend',
      unconfirmed: 'Unbestätigt',
    },
    confirmedBy: 'Rückgabe bestätigt von',
    contractConfirmation: 'Bestätigung der Vertragsnachweise',
    ledger: 'Siegelverzeichnis',
    number: 'Antragsnummer',
    purpose: 'Zweck',
    applicant: 'Antragsteller',
    sealType: 'Siegelart',
    copies: 'Genehmigte Exemplare',
    status: 'Status',
    refresh: 'Aktualisieren',
    new: 'Neuer Siegelantrag',
    edit: 'Antrag bearbeiten',
    search: 'Nach Nummer, Zweck oder Antragsteller suchen',
    all: 'Alle Status',
    clear: 'Filter zurücksetzen',
    oldest: 'Erstellt: älteste zuerst',
    newest: 'Erstellt: neueste zuerst',
    draft: 'Entwurf',
    noMatch: 'Keine passenden Anträge',
    empty: 'Noch keine Siegelanträge',
    emptyLedger: 'Noch keine physische Registrierung',
    sealId: 'Tatsächliches Siegel',
    actualCopies: 'Tatsächliche Exemplare',
    borrowedAt: 'Tatsächliche Ausleihzeit',
    sealedAt: 'Tatsächliche Siegelungszeit',
    returnedAt: 'Tatsächliche Rückgabezeit',
    registeredBy: 'Erfasst von',
    physicalNotice:
      'Genehmigung oder administrativer Abschluss beweist keine physische Siegelung oder Rückgabe. Eine Ausleihe erfasst nur die physische Verwahrung.',
    detail: 'Siegelantragsdetails',
    moreActions: 'Weitere Aktionen',
    contractId: 'Verknüpfter Vertrag',
    contractVersion: 'Festgeschriebene Vertragsversion',
    contact: 'Kontakt und Hinweise',
    external: 'Externe Ausleihe',
    returnDueAt: 'Voraussichtliche Rückgabezeit',
    ledgerId: 'Unveränderliche Registrierungs-ID',
    exceptionReason: 'Bearbeitungsausnahme',
    administrativeReason: 'Begründung des administrativen Abschlusses',
    yes: 'Ja',
    no: 'Nein',
    files: 'Antragsdateien',
    history: 'Aktionsverlauf',
    download: 'Herunterladen',
    cancel: 'Abbrechen',
    saveDraft: 'Entwurf speichern',
    submit: 'Speichern und einreichen',
    confirm: 'Aktion bestätigen',
    saved: 'Siegelantrag gespeichert',
    required: 'Dieses Feld ist erforderlich',
    futureReturn: 'Die voraussichtliche Rückgabe muss in der Zukunft liegen',
    sourceRequired:
      'Wählen Sie vor der Einreichung einen Vertrag oder laden Sie eine Datei hoch',
    fileSource: 'Antragsdateien verwenden',
    uploadNotice:
      'Vervollständigen Sie zuerst die Pflichtfelder. Ein Upload speichert einen Entwurf; Speichern oder Einreichen verknüpft die hochgeladenen Dateien.',
    remove: 'Entfernen',
    discard: 'Änderungen verwerfen',
    discardDescription:
      'Nicht gespeicherte Änderungen gehen verloren. Hochgeladene Dateien und gespeicherte Entwürfe bleiben erhalten.',
    unavailable:
      'Dieser Datensatz oder diese Aktion ist nicht verfügbar. Kehren Sie zur Liste zurück und aktualisieren Sie die Ansicht.',
    failed:
      'Der Vorgang ist fehlgeschlagen. Prüfen Sie die Eingabe oder aktualisieren Sie die Ansicht und versuchen Sie es erneut.',
    retry: 'Erneut versuchen',
    backToList: 'Zur Liste zurückkehren',
    loading: 'Wird geladen',
    invalidInput:
      'Vervollständigen Sie Pflichtfelder und prüfen Sie tatsächliche Mengen und Zeiten.',
    checkoutNotice:
      'Bestätigen Sie die tatsächliche Siegelausleihe. Die Ausleihe erfasst weder Siegelungszeit noch tatsächliche Exemplare.',
    exceptionalNotice:
      'Ein administrativer Abschluss behält ausstehende Verwahrung bei. Eine außerordentliche Rückgabe behält die ursprüngliche Vertragsversion bei und aktiviert den Vertrag nicht.',
    recipient: 'Empfänger',
    reason: 'Begründung oder Kommentar',
    mode: 'Unterzeichnermodus',
    confirmDescription:
      'Dies ändert das Antragsergebnis. Bestätigen Sie den Antrag und die gewählte Aktion.',
    states: {
      draft: 'Entwurf',
      revision: 'Revision',
      head: 'Abteilungsgenehmigung',
      legal: 'Rechtsgenehmigung',
      financeManager: 'Finanzgenehmigung',
      gm: 'Genehmigung der Geschäftsführung',
      stamping: 'Siegelungsregistrierung',
      returning: 'Rückgabebestätigung',
      exception: 'Bearbeitungsausnahme',
      returnException: 'Rückgabeausnahme',
      completed: 'Abgeschlossen',
      administrativelyClosed: 'Administrativ geschlossen',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
      terminated: 'Beendet',
    },
    actions: {
      edit: 'Bearbeiten',
      submit: 'Einreichen',
      withdraw: 'Zurückziehen',
      terminate: 'Beenden',
      retry: 'Bearbeitung erneut versuchen',
      forceComplete: 'Administrativ schließen',
      actualReturn: 'Außerordentliche physische Rückgabe bestätigen',
      approve: 'Genehmigen',
      reject: 'Ablehnen',
      return: 'Zur Überarbeitung zurückgeben',
      comment: 'Kommentar',
      read: 'Als gelesen markieren',
      claim: 'Übernehmen',
      release: 'Freigeben',
      complete: 'Tatsächliche Bearbeitung abschließen',
      unable: 'Bearbeitung nicht möglich',
      transfer: 'Versetzen',
      assign: 'Zuweisen',
      cc: 'Empfänger hinzufügen',
      addSigner: 'Unterzeichner hinzufügen',
      urge: 'Dringende Erinnerung senden',
      appoint: 'Administrative Bestimmung',
      reassign: 'Administrative Neuzuweisung',
    },
    types: {
      official: 'Offiziell',
      contract: 'Vertrag',
      legalRepresentative: 'Gesetzlicher Vertreter',
      finance: 'Finanzen',
    },
    modes: {
      before: 'Davor',
      parallel: 'Parallel',
    },
  },
};
