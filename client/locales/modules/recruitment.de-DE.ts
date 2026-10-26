export default {
  recruitment: {
    authz: {
      reviewEdit: 'Zulässige Prüferfelder ändern',
      resource: 'Personalbeschaffungsanträge',
      requisitions: 'Personalbeschaffungszuteilungen',
      view: 'Personalbeschaffung anzeigen',
      submit: 'Personalbeschaffung erstellen und einreichen',
      operate: 'Personalbeschaffungsgenehmigungen bearbeiten',
      viewSalary: 'Vertraulichen Gehaltsbereich anzeigen',
      close: 'Verbleibende Personalbeschaffungszuteilung schließen',
    },
    identityUnavailable: 'Organisationsname nicht verfügbar',
    catalogRequired:
      'Laden Sie die Abteilungs- und Positionsnamen, bevor Sie diese Zuteilung schließen.',
    requisitionName:
      'Personalbeschaffungsbedarf {{year}} / {{department}} / {{position}}',
    preciseAllocationName:
      'Personalbeschaffungszuteilung {{year}} / {{department}} / {{position}}',

    savedRecord: 'Personalbeschaffung für „{{name}}“ gespeichert',

    allocationName: 'Personalbeschaffungszuteilung {{year}}',

    yearInvalid: 'Geben Sie ein ganzzahliges Jahr zwischen 1900 und 9999 ein.',
    businessErrors: {
      RECRUITMENT_INVALID_QUANTITY:
        'Geben Sie eine positive ganzzahlige Anzahl neuer Mitarbeiter innerhalb des unterstützten Bereichs ein.',
      RECRUITMENT_INVALID_SALARY:
        'Geben Sie einen gültigen Gehaltsbereich ein, dessen Minimum nicht über dem Maximum liegt.',
      RECRUITMENT_INVALID_REPLACEMENTS:
        'Wählen Sie austretende oder ausgetretene Ersatzpersonen entsprechend der Einstellungsmenge.',
      RECRUITMENT_REPLACEMENT_UNAVAILABLE:
        'Eine Ersatzperson ist nicht mehr geeignet. Aktualisieren Sie die Ansicht und wählen Sie eine geeignete Ersatzperson.',
      RECRUITMENT_ACCOUNT_MISMATCH:
        'Das Personalstellenkonto muss zu Abteilung, Position und Jahr passen.',
      RECRUITMENT_YEAR_MISMATCH:
        'Das Personalstellenjahr wurde geändert. Wählen Sie das passende Jahreskonto.',
      RECRUITMENT_DEPARTMENT_UNAVAILABLE:
        'Wählen Sie eine aktive Abteilung aus.',
      RECRUITMENT_POSITION_UNAVAILABLE:
        'Wählen Sie eine aktive Position in der gewählten Abteilung.',
      RECRUITMENT_GRADE_UNAVAILABLE:
        'Wählen Sie eine aktivierte Gehaltsgruppe.',
      RECRUITMENT_GRADE_SNAPSHOT_MISMATCH:
        'Die Gehaltsgruppe wurde geändert. Aktualisieren und prüfen Sie den Gehaltsbereich vor erneuter Einreichung.',
      RECRUITMENT_RESERVATION_UNAVAILABLE:
        'Keine nutzbare Personalstellenreservierung verfügbar. Aktualisieren Sie das Personalstellenkonto und prüfen Sie die Kapazität.',
      RECRUITMENT_REQUISITION_ALREADY_PUBLISHED:
        'Dieser Personalbeschaffungsbedarf wurde bereits veröffentlicht. Aktualisieren Sie die Ansicht, um den Status zu sehen.',
      RECRUITMENT_INVALID_INPUT:
        'Vervollständigen Sie Abteilung, Position, Gehaltsgruppe, Personalstellenzahl, Startdatum, Stellenbeschreibung und Begründung.',
    },

    capacityEmpty:
      'Keine passende initialisierte jährliche Personalstellenkapazität. Bitten Sie die Personalabteilung, diese anzulegen und zu initialisieren.',
    capacitySelectTarget: 'Wählen Sie zuerst Abteilung, Position und Jahr.',
    capacityLedger: 'Personalstellenverzeichnis anzeigen',

    title: 'Personalbeschaffungsanträge',
    requisitions: 'Bedarfsanforderungen',
    new: 'Neuer Personalbeschaffungsantrag',
    detailTitle: 'Personalbeschaffungsantrag · {{name}}',
    detail: 'Personalbeschaffungsantrag',
    search: 'Stellenbeschreibung oder Begründung durchsuchen',
    all: 'Alle Status',
    clear: 'Filter zurücksetzen',
    empty: 'Noch keine Personalbeschaffungsanträge',
    filteredEmpty: 'Keine Anträge entsprechen diesen Filtern',
    emptyRequisitions: 'Keine autorisierten Bedarfsanforderungen',
    cancel: 'Abbrechen',
    save: 'Personalbeschaffungsantrag speichern',
    saved: 'Personalbeschaffungsvorgang gespeichert',
    refresh: 'Aktualisieren',
    retry: 'Erneut versuchen',
    loadLatest: 'Neueste Daten laden',
    noAccess: 'Sie haben keinen Zugriff auf diesen Datensatz.',
    fieldsRestricted: 'Pflichtfelder sind eingeschränkt.',
    missing: 'Dieser Datensatz ist nicht verfügbar.',
    conflict:
      'Dieser Datensatz wurde geändert. Laden Sie die neuesten Daten und versuchen Sie es erneut.',
    invalid:
      'Vervollständigen Sie Pflichtfelder und wählen Sie ein initialisiertes Kapazitätskonto. Prüfen Sie Ersatzanzahl und Gehaltsbereich.',
    failed: 'Der Vorgang ist fehlgeschlagen. Versuchen Sie es erneut.',
    notAvailable:
      'Dieser Vorgang ist mit Ihren aktuellen Berechtigungen nicht mehr verfügbar.',
    commandReason: 'Begründung für diesen Vorgang',
    replacementNote:
      'Es werden nur aktuell autorisierte austretende oder ausgetretene Personen aufgeführt. Die Einreichung prüft die tatsächliche Kapazitätseignung.',
    unknown:
      'Das Ergebnis ist ungewiss. Wiederholen Sie genau denselben Befehl, um sein Ergebnis zu bestätigen.',
    retryExact: 'Exakten Befehl wiederholen',
    progress: 'Genehmigungsfortschritt',
    timeline: 'Zeitleiste',
    recipient: 'Empfänger',
    candidatesFailed:
      'Empfänger konnten nicht geladen werden. Versuchen Sie es erneut oder aktualisieren Sie die Genehmigungsdetails.',
    noCandidates:
      'Keine Empfänger erfüllen die aktuellen Genehmigungsanforderungen.',
    actionInvalid:
      'Geben Sie eine Vorgangsbegründung ein und wählen Sie Empfänger, Rückgabestufe, Unterzeichnermodus oder Position gemäß den Anforderungen dieser Aktion.',
    recipientSearch: 'Geeignete Empfänger suchen',
    moreCandidates: 'Weitere Empfänger laden',
    returnTarget: 'Zur Stufe zurückgeben',
    signerMode: 'Unterzeichnerreihenfolge',
    place: 'Nicht zugewiesener Sitz',
    confirmAction: '{{action}} für {{id}}?',
    actionConsequence:
      'Dieser Vorgang ändert die aktuelle Genehmigung oder Zuteilung.',
    closeConsequence:
      'Nur die verbleibende nicht verbrauchte Personalbeschaffungszuteilung wird freigegeben. Der Verlauf bereits zugeordneter Mitarbeiter bleibt erhalten.',
    discard: 'Nicht gespeicherte Änderungen verwerfen?',
    discardDescription: 'Die Änderungen in diesem Formular gehen verloren.',
    discardConfirm: 'Änderungen verwerfen',
    fields: {
      requisitionTitle: 'Bedarfstitel',
      id: 'Kennung',
      requisitionId: 'Bedarfs-ID',
      requestId: 'Quellantrags-ID',
      departmentId: 'Abteilung',
      positionId: 'Position',
      gradeId: 'Gehaltsgruppe',
      accountId: 'Jährliche Personalstellenkapazität',
      year: 'Kapazitätsjahr',
      quantity: 'Menge',
      kind: 'Einstellungsart',
      replacementEmployeeIds: 'Ersatzmitarbeiter',
      minimumCents: 'Mindestgehalt',
      maximumCents: 'Höchstgehalt',
      expectedStartDate: 'Voraussichtliches Startdatum',
      jobDescription: 'Stellenbeschreibung',
      reason: 'Geschäftliche Begründung',
      applicant: 'Antragsteller',
      status: 'Status',
      createdAt: 'Erstellt am',
      statusChangedAt: 'Status aktualisiert am',
      sourceYear: 'Quelljahr',
      sourceVersion: 'Quellversion',
      originalQuantity: 'Genehmigte Menge',
      remaining: 'Verbleibend',
      consumed: 'Verbraucht',
    },
    actions: {
      submit: 'Einreichen',
      withdraw: 'Zurückziehen',
      terminate: 'Beenden',
      edit: 'Entwurf bearbeiten',
      reviewEdit: 'Prüferfelder ändern',
      approve: 'Genehmigen',
      reject: 'Ablehnen',
      return: 'Zurückgeben',
      comment: 'Kommentar',
      appoint: 'Bestimmen',
      reassign: 'Neu zuweisen',
      read: 'Als gelesen markieren',
      transfer: 'Versetzen',
      addSigner: 'Unterzeichner hinzufügen',
      urge: 'Dringende Erinnerung senden',
      cc: 'Kopieempfänger',
      close: 'Verbleibende Zuteilung schließen',
    },
    status: {
      draft: 'Entwurf',
      revision: 'Revision',
      head: 'Abteilungsleitung',
      hrbp: 'HR-Business-Partner',
      hrDirector: 'Personalleitung',
      executive: 'Bereichsleitung',
      gm: 'Geschäftsführung',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
      terminated: 'Beendet',
      recruiting: 'Personalbeschaffung läuft',
      full: 'Vollständig besetzt',
      closed: 'Geschlossen',
    },
    kinds: {
      additional: 'Zusätzliche Personalstellen',
      replacement: 'Ersatz',
    },
    modes: {
      before: 'Davor',
      after: 'Danach',
      alongside: 'Parallel',
    },
  },
};
