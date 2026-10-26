export default {
  flowDiagram: {
    escapeHint: 'Zum Beenden Esc drücken',
    controls: 'Diagrammsteuerung',
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    fitView: 'Ansicht einpassen',
    fullscreen: 'Vollbild',
    exitFullscreen: 'Vollbild beenden',
    minimap: 'Minikarte',

    empty: 'Keine Zustände anzuzeigen.',
    loading: 'Diagramm wird angeordnet…',
    failed:
      'Diagramm konnte nicht angeordnet werden. Prüfen Sie die Prozessparameter und die letzten Ausführungen.',
    nodeHelp: 'Prozesszustand. Zum Erkunden verschieben und zoomen.',
    edgeHelp: 'Prozessübergang',
  },
  processManagement: {
    managementReason: 'Begründung',
    normalDescription:
      'Zeigt den Hauptgeschäftsweg; Bedingungen bestimmen die Verzweigungen.',
    revealHint:
      'Bewegen Sie den Mauszeiger über einen Schritt, um Rückgaben und weitere Ausgänge anzuzeigen, und danach über einen Ausgang für Details.',
    graphLegend: 'Diagrammlegende',
    otherExits: 'Weitere Ausgänge',
    exitNext: 'Danach ist möglich:',
    exitEnds: 'Der Prozess endet hier.',
    nodeTypes: {
      start: 'Beginn',
      approval: 'Genehmigung',
      work: 'Arbeitsschritt',
      success: 'Abgeschlossen',
      negative: 'Beendet',
      exception: 'Rückgabe oder Ausnahme',
    },
    rulesCount_one: '{{count}} Regel',
    rulesCount_other: '{{count}} Regeln',
    notReached: 'Noch nicht erreicht',
    parameters: {
      title: 'Workflow-Parameter',
      description:
        'Schwellenwerte, die dieser Prozess bei jedem Schritt liest. Jeder Wert wird einmal festgelegt und gilt für alle daneben aufgeführten Schritte.',
      none: 'Dieser Prozess hat keine einstellbaren Parameter.',
      onNodes:
        'Dieser Prozess wird an seinen Schritten konfiguriert. Verwenden Sie die Einstellungsschaltfläche eines Schritts im Diagramm.',
      forbidden:
        'Sie sind nicht berechtigt, die Parameter dieses Prozesses anzuzeigen.',
      readOnly: 'Sie können diese Parameter anzeigen, aber nicht ändern.',
      changed: 'Geändert',
      scheduled: 'Ändert sich am {{date}} auf {{value}}.',
      orderViolated:
        'Widerspruch zu einem zugehörigen Parameter: Ein niedrigerer Schwellenwert darf einen höheren nicht überschreiten. Passen Sie beide hier an und speichern Sie sie gemeinsam.',
      discard: 'Änderungen verwerfen',
      save_zero: 'Speichern',
      save_one: '1 Änderung speichern',
      save_other: '{{count}} Änderungen speichern',
      saved_one: '1 Parameter gespeichert',
      saved_other: '{{count}} Parameter gespeichert',
    },
    nodeSettings: {
      edit: 'Parameter bearbeiten',
      editNamed: 'Parameter für {{name}} bearbeiten',
      title: 'Parameter für {{name}} bearbeiten',
      parameter: 'Parameter',
      effect:
        'Änderungen schreiben weder gespeicherte Antragsstände noch bestehende Aufgaben um. Neue Einreichungen verwenden die wirksame Konfiguration; Wiedereinreichungen folgen den Regeln des zuständigen Prozesses.',
      shared: 'Gemeinsame Einstellung. Betrifft außerdem: {{flows}}.',
      unavailable:
        'Dieser Knoten hat keine verfügbaren bearbeitbaren Parameter. Schließen Sie diesen Dialog und wählen Sie einen konfigurierten Knoten.',
      forbidden:
        'Sie sind nicht berechtigt, die Konfiguration dieses Knotens zu bearbeiten.',
      newCommittee: 'Neue Ausschussstruktur veröffentlichen',
      seat: 'Version {{version}} · Person für Sitz {{name}}',
      committeeContext:
        'Ausgewählter Knoten: Version {{selected}}. Aktiv: {{active}}. Zuletzt gespeichert: {{latest}}.',
    },
    conditionMissing:
      'Diese Verzweigung benötigt eine ausdrückliche Bedingungsbeschreibung; prüfen Sie die zuständigen Geschäftsregeln',
    snapshotConditions:
      'Betrags-, Tages- und Gehaltsgruppenschwellen verwenden die bei Einreichung festgeschriebenen Regeln. Diese Definition erklärt die Entscheidungskriterien, nicht den gespeicherten Stand eines historischen Antrags.',
    branchConditions: {
      travelCancellation_unbooking:
        'Die ursprüngliche Dienstreise fordert eine Buchung an; daher erfordert die Stornierung eine Buchungsaufhebung',
      travelCancellation_approved:
        'Die ursprüngliche Dienstreise fordert keine Buchung an; daher ist keine Buchungsaufhebung erforderlich',
      reimbursement_managerApproved_head:
        'Gesamterstattung > festgeschriebene Abteilungsleitungsschwelle und Zusammenführungsprüfung der Aufgaben von Führungskraft und Abteilungsleitung nicht bestanden',
      reimbursement_managerApproved_finance:
        'Gesamterstattung überschreitet die Leitungsschwelle nicht oder Genehmigungsaufgaben von Führungskraft und Abteilungsleitung wurden gültig zusammengeführt',

      training_managerApproved_head:
        'Schulungsbetrag > 0 und Genehmigungsaufgaben von Führungskraft und Abteilungsleitung wurden nicht gültig zusammengeführt',
      training_managerApproved_finance:
        'Schulungsbetrag > 0; Führungskraft und Abteilungsleitung sind dieselbe Person und diese Runde besteht die Zusammenführungsprüfung der Genehmigungsaufgaben',
      training_managerApproved_approved: 'Schulungsbetrag ist null',

      travel_managerApproved_head:
        'Zusammenführungsbedingungen für Führungskraft und Abteilungsleitung sind nicht erfüllt',
      travel_managerApproved_finance:
        'Führungskraft und Abteilungsleitung sind dieselbe Person und diese Runde besteht die Zusammenführungsprüfung der Genehmigungsaufgaben',
      probation_managerApproved_head:
        'Zusammenführungsbedingungen für Führungskraft und Abteilungsleitung sind nicht erfüllt',
      probation_managerApproved_hr:
        'Führungskraft und Abteilungsleitung sind dieselbe Person und diese Runde besteht die Zusammenführungsprüfung der Genehmigungsaufgaben',
      departure_managerApproved_head:
        'Zusammenführungsbedingungen für Führungskraft und Abteilungsleitung sind nicht erfüllt',
      departure_managerApproved_hr:
        'Führungskraft und Abteilungsleitung sind dieselbe Person und diese Runde besteht die Zusammenführungsprüfung der Genehmigungsaufgaben',
      expensePlan_financeApproved_executive:
        'Genehmigung der Bereichsleitung erforderlich: Betrag > bei Einreichung festgeschriebene Bereichsleitungsschwelle',
      expensePlan_financeApproved_gm:
        'Keine Genehmigung der Bereichsleitung erforderlich; Betrag > bei Einreichung festgeschriebene Geschäftsführungsschwelle',
      expensePlan_financeApproved_approved:
        'Weder Bedingungen für zusätzliche Bereichsleitungs- noch Geschäftsführungsgenehmigung gelten',
      expensePlan_executiveApproved_gm:
        'Die Genehmigung der Geschäftsführung ist erforderlich; die Zusammenführung der Aufgaben von Bereichsleitung und Geschäftsführung wurde noch nicht erfolgreich geprüft',
      expensePlan_executiveApproved_approved:
        'Geschäftsführungsgenehmigung nicht erforderlich oder Genehmigungsaufgaben von Bereichsleitung und Geschäftsführung wurden gültig zusammengeführt',
      loan_financeApproved_executive:
        'Genehmigung der Bereichsleitung erforderlich: Betrag > bei Einreichung festgeschriebene Bereichsleitungsschwelle',
      loan_financeApproved_gm:
        'Keine Genehmigung der Bereichsleitung erforderlich; Betrag > bei Einreichung festgeschriebene Geschäftsführungsschwelle',
      loan_financeApproved_cashier:
        'Weder Bedingungen für zusätzliche Bereichsleitungs- noch Geschäftsführungsgenehmigung gelten',
      loan_executiveApproved_gm:
        'Die Genehmigung der Geschäftsführung ist erforderlich; die Zusammenführung der Aufgaben von Bereichsleitung und Geschäftsführung wurde noch nicht erfolgreich geprüft',
      loan_executiveApproved_cashier:
        'Geschäftsführungsgenehmigung nicht erforderlich oder Genehmigungsaufgaben von Bereichsleitung und Geschäftsführung wurden gültig zusammengeführt',
      purchase_financeApproved_executive:
        'Genehmigung der Bereichsleitung erforderlich: Betrag > bei Einreichung festgeschriebene Bereichsleitungsschwelle',
      purchase_financeApproved_gm:
        'Keine Genehmigung der Bereichsleitung erforderlich; Betrag > bei Einreichung festgeschriebene Geschäftsführungsschwelle',
      purchase_financeApproved_approved:
        'Weder Bedingungen für zusätzliche Bereichsleitungs- noch Geschäftsführungsgenehmigung gelten',
      purchase_executiveApproved_gm:
        'Die Genehmigung der Geschäftsführung ist erforderlich; die Zusammenführung der Aufgaben von Bereichsleitung und Geschäftsführung wurde noch nicht erfolgreich geprüft',
      purchase_executiveApproved_approved:
        'Geschäftsführungsgenehmigung nicht erforderlich oder Genehmigungsaufgaben von Bereichsleitung und Geschäftsführung wurden gültig zusammengeführt',
      payment_financeApproved_executive:
        'Genehmigung der Bereichsleitung erforderlich: vollständige Genehmigungsstufen und Betrag > bei Einreichung festgeschriebene Bereichsleitungsschwelle',
      payment_financeApproved_gm:
        'Keine Genehmigung der Bereichsleitung erforderlich; Betrag > bei Einreichung festgeschriebene Geschäftsführungsschwelle und vollständige Genehmigung erforderlich',
      payment_financeApproved_cashier:
        'Weder Bedingungen für zusätzliche Bereichsleitungs- noch Geschäftsführungsgenehmigung gelten',
      payment_executiveApproved_gm:
        'Die Genehmigung der Geschäftsführung ist erforderlich; die Zusammenführung der Aufgaben von Bereichsleitung und Geschäftsführung wurde noch nicht erfolgreich geprüft',
      payment_executiveApproved_cashier:
        'Geschäftsführungsgenehmigung nicht erforderlich oder Genehmigungsaufgaben von Bereichsleitung und Geschäftsführung wurden gültig zusammengeführt',
      travel_financeApproved_executive:
        'Genehmigung der Bereichsleitung erforderlich: Auslandsreise oder Betrag > bei Einreichung festgeschriebene Bereichsleitungsschwelle',
      travel_financeApproved_gm:
        'Keine Genehmigung der Bereichsleitung erforderlich; Betrag > bei Einreichung festgeschriebene Geschäftsführungsschwelle',
      travel_financeApproved_booking:
        'Keine weitere Genehmigung von Bereichsleitung/Geschäftsführung erforderlich und Buchung angefordert',
      travel_financeApproved_completed:
        'Keine weitere Genehmigung von Bereichsleitung/Geschäftsführung erforderlich und keine Buchung angefordert',
      travel_executiveApproved_gm:
        'Die Genehmigung der Geschäftsführung ist erforderlich; die Zusammenführung der Aufgaben von Bereichsleitung und Geschäftsführung wurde noch nicht erfolgreich geprüft',
      travel_executiveApproved_booking:
        'Geschäftsführungsgenehmigung nicht erforderlich oder gültig zusammengeführt; Buchung angefordert',
      travel_executiveApproved_completed:
        'Geschäftsführungsgenehmigung nicht erforderlich oder gültig zusammengeführt; keine Buchung angefordert',
      travel_gmApproved_booking: 'Buchung angefordert',
      travel_gmApproved_completed: 'Keine Buchung angefordert',
      payment_submit_head:
        'Die Finanzierungsquellenprüfung erfordert die vollständigen Genehmigungsstufen einschließlich zusätzlicher Genehmigung für Mehrzahlungen',
      payment_submit_finance:
        'Die Finanzierungsquellenprüfung erfordert nicht die vollständigen Genehmigungsstufen',
      budgetAdjustment_cfoApproved_gm:
        'Budgeterhöhungsbetrag überschreitet die bei Einreichung festgeschriebene Geschäftsführungsschwelle',
      budgetAdjustment_cfoApproved_approved:
        'Keine Budgeterhöhung oder die Erhöhung überschreitet die festgeschriebene Geschäftsführungsschwelle nicht',
      leave_managerApproved_head:
        'Tage ≥ festgeschriebene Abteilungsleitungsschwelle und Abteilungsleitung fehlt oder unterscheidet sich von der Führungskraft',
      leave_managerApproved_hr:
        'Keine Leitungsprüfung erforderlich; Urlaubsart erfordert Personalprüfung oder Tage ≥ festgeschriebene Personalschwelle',
      leave_managerApproved_approved:
        'Keine Leitungsprüfung, keine personalprüfungspflichtige Urlaubsart und Tage unter der festgeschriebenen Personalschwelle',
      leave_headApproved_hr:
        'Urlaubsart erfordert Personalprüfung oder Tage ≥ festgeschriebene Personalschwelle',
      leave_headApproved_approved:
        'Urlaubsart erfordert keine Personalprüfung und Tage liegen unter der festgeschriebenen Personalschwelle',
      overtime_managerApproved_head:
        'Monatliche Überstunden überschreiten die festgeschriebene Leitungsprüfungsschwelle und Abteilungsleitung fehlt oder unterscheidet sich von der Führungskraft',
      overtime_managerApproved_hr:
        'Keine Leitungsprüfung erforderlich; Einreichung mehr als 3 Arbeitstage nach dem Überstundendatum',
      overtime_managerApproved_approved:
        'Keine Leitungsprüfung erforderlich; Einreichung innerhalb des Meldefensters von 3 Arbeitstagen',
      overtime_headApproved_hr:
        'Einreichung mehr als 3 Arbeitstage nach dem Überstundendatum',
      overtime_headApproved_approved:
        'Einreichung innerhalb von 3 Arbeitstagen nach dem Überstundendatum',
      supplies_submit_issuing:
        'Aus einer Erfüllungsausnahme mit unveränderten genehmigten Inhalten erneut eingereicht',
      supplies_submit_manager:
        'Neuer Antrag, geänderte genehmigungsrelevante Inhalte oder nicht erfüllte Fortsetzungsbedingungen',
      vehicleRequest_submit_dispatch:
        'Aus einer Erfüllungsausnahme mit unveränderten genehmigten Inhalten erneut eingereicht',
      vehicleRequest_submit_head:
        'Neuer Antrag, geänderte genehmigungsrelevante Inhalte oder nicht erfüllte Fortsetzungsbedingungen',
      purchase_submit_purchasing:
        'Aus einer Erfüllungsausnahme mit unveränderten genehmigten Inhalten erneut eingereicht',
      purchase_submit_head:
        'Neuer Antrag, geänderte genehmigungsrelevante Inhalte oder nicht erfüllte Fortsetzungsbedingungen',
      assetRequest_submit_issuing:
        'Aus einer Erfüllungsausnahme mit unveränderten genehmigten Inhalten erneut eingereicht; Fortsetzung zulässig; kein Verschrottungsantrag',
      assetRequest_submit_head:
        'Neuer Antrag, geänderte genehmigungsrelevante Inhalte oder nicht erfüllte Fortsetzungsbedingungen',
      sealRequest_submit_stamping:
        'Aus einer Erfüllungsausnahme mit unveränderten genehmigten Inhalten erneut eingereicht; Fortsetzung zulässig',
      sealRequest_submit_head:
        'Neuer Antrag, geänderte genehmigungsrelevante Inhalte oder nicht erfüllte Fortsetzungsbedingungen',
      purchase_priced_revision:
        'Tatsächlicher Preis > 120 % der ursprünglichen Schätzung; Bestätigung und Wiedereinreichung durch Antragsteller erforderlich',
      purchase_priced_finance:
        'Tatsächlicher Preis ≤ 120 % der ursprünglichen Schätzung',
      purchase_forcedPriced_revision:
        'Tatsächlicher Preis > 120 % der ursprünglichen Schätzung; Bestätigung und Wiedereinreichung durch Antragsteller erforderlich',
      purchase_forcedPriced_finance:
        'Tatsächlicher Preis ≤ 120 % der ursprünglichen Schätzung',
      probation_hrApproved_gm:
        'Festanstellung abgelehnt oder die von der Personalabteilung bestätigte Gehaltsgruppe erreicht die festgeschriebene Führungskräfterangschwelle',
      probation_hrApproved_approved:
        'Festanstellung nicht abgelehnt und die von der Personalabteilung bestätigte Gehaltsgruppe liegt unter der Führungskräfteschwelle',
      departure_hrApproved_gm:
        'Mitarbeitergehaltsgruppe ≥ bei Einreichung festgeschriebene Führungskräfterangschwelle',
      departure_hrApproved_handover:
        'Mitarbeitergehaltsgruppe liegt unter der festgeschriebenen Führungskräfterangschwelle',
      departure_cancellationRejected_gm:
        'Stornierung abgelehnt; gespeicherten Geschäftsführungsstatus vor der Stornierung fortsetzen',
      departure_cancellationRejected_handover:
        'Stornierung abgelehnt; gespeicherten Übergabestatus vor der Stornierung fortsetzen',
      departure_cancellationRejected_completed:
        'Stornierung abgelehnt; gespeicherten abgeschlossenen Status vor der Stornierung fortsetzen',
      recruitment_submit_head:
        'Antragsteller ist nicht die Abteilungsleitung oder die Leitung fehlt',
      recruitment_submit_hrbp:
        'Antragsteller ist die Abteilungsleitung; Selbstgenehmigung überspringen',
      recruitment_reviewEdit_head:
        'Antragsteller ist nicht die Abteilungsleitung oder die Leitung fehlt',
      recruitment_reviewEdit_hrbp:
        'Antragsteller ist die Abteilungsleitung; Selbstgenehmigung überspringen',
      recruitment_hrDirectorApproved_executive:
        'Die Bedarfsanforderung nutzt zusätzliche Personalstellen',
      recruitment_hrDirectorApproved_gm:
        'Keine zusätzlichen Personalstellen; Zielgehaltsgruppe erreicht die festgeschriebene Direktorenrangschwelle',
      recruitment_hrDirectorApproved_approved:
        'Keine zusätzlichen Personalstellen; Zielgehaltsgruppe liegt unter der festgeschriebenen Direktorenrangschwelle',
      recruitment_executiveApproved_gm:
        'Zusätzliche Personalstellen oder Zielgehaltsgruppe erreicht die Direktorenrangschwelle',
      recruitment_executiveApproved_approved:
        'Keine zusätzlichen Personalstellen und Zielgehaltsgruppe liegt unter der Direktorenrangschwelle',
      transfer_submit_manager:
        'Einreichender Bearbeiter ist nicht die Führungskraft des Mitarbeiters; bei fehlender Führungskraft erfolgt dennoch die Führungsprüfung',
      transfer_submit_sourceHead:
        'Einreichender Bearbeiter ist die Führungskraft des Mitarbeiters',
      transfer_reviewEdit_manager:
        'Einreichender Bearbeiter ist nicht die Führungskraft des Mitarbeiters; bei fehlender Führungskraft erfolgt dennoch die Führungsprüfung',
      transfer_reviewEdit_sourceHead:
        'Einreichender Bearbeiter ist die Führungskraft des Mitarbeiters',
      transfer_sourceHeadApproved_targetHead:
        'Die Änderung umfasst einen Abteilungswechsel',
      transfer_sourceHeadApproved_hr:
        'Die Änderung umfasst keinen Abteilungswechsel',
      transfer_hrApproved_executive:
        'Gehaltserhöhung überschreitet die festgeschriebene Bereichsleitungsschwelle oder Zielgehaltsgruppe erreicht den Führungskräfterang',
      transfer_hrApproved_gm:
        'Keine Bereichsleitungsprüfung; Erhöhung überschreitet die festgeschriebene Geschäftsführungsschwelle oder Zielgehaltsgruppe erreicht den Direktorenrang',
      transfer_hrApproved_pendingEffective:
        'Keine Bedingungen für zusätzliche Bereichsleitungs-/Geschäftsführungsprüfung aufgrund von Gehalt oder Gehaltsgruppe gelten',
      transfer_executiveApproved_gm:
        'Erhöhung überschreitet die festgeschriebene Geschäftsführungsschwelle oder Zielgehaltsgruppe erreicht den Direktorenrang',
      transfer_executiveApproved_pendingEffective:
        'Weder Gehalts- noch Gehaltsgruppenbedingungen für zusätzliche Geschäftsführungsprüfung gelten',
      assetRequest_headApproved_appraisal:
        'Der Antrag betrifft Anlagenverschrottung',
      assetRequest_headApproved_issuing:
        'Der Antrag betrifft keine Anlagenverschrottung',
      assetRequest_financeApproved_gm:
        'Verschrottungsantrag; gesamter Anschaffungswert der Anlagen überschreitet die festgeschriebene Geschäftsführungsschwelle für Verschrottung',
      assetRequest_financeApproved_scrapped:
        'Die Geschäftsführungsschwelle für den Verschrottungsanschaffungswert wird nicht überschritten',
      assetRequest_issueCompleted_returning:
        'Ausleihantrag: ausgeben und danach Rückgabebearbeitung starten',
      assetRequest_issueCompleted_issued: 'Der Antrag betrifft keine Ausleihe',
      sealRequest_stamped_returning:
        'Externe Siegelausleihe erfordert Rückgabebearbeitung',
      sealRequest_stamped_completed: 'Das Siegel wird nicht extern verwendet',
      vendorQualification_submit_removalReview:
        'Der Vorgang entfernt einen Lieferanten aus dem Verzeichnis',
      vendorQualification_submit_purchasing:
        'Der Vorgang entfernt keinen Lieferanten',
      contract_headApproved_legalFinance:
        'Vertragsbeendigung oder Nichtstandardvorlage',
      contract_headApproved_standardFinance:
        'Keine Beendigung und eine Standardvorlage wird verwendet',
      contract_legalFinanceApproved_executive:
        'Vertragsbetrag überschreitet die festgeschriebene Bereichsleitungsschwelle; keine Beendigung',
      contract_legalFinanceApproved_gm:
        'Keine Bereichsleitungsprüfung; Betrag überschreitet die festgeschriebene Vertragsgeschäftsführungsschwelle oder Rechts-/Finanzabteilung kennzeichnet ihn als nicht standardmäßig; keine Beendigung',
      contract_legalFinanceApproved_approved:
        'Beendigung oder keine weiteren Genehmigungsbedingungen',
      contract_standardFinanceApproved_executive:
        'Vertragsbetrag überschreitet die festgeschriebene Bereichsleitungsschwelle',
      contract_standardFinanceApproved_gm:
        'Keine Bereichsleitungsprüfung; Betrag überschreitet die festgeschriebene Vertragsgeschäftsführungsschwelle',
      contract_standardFinanceApproved_approved:
        'Weder Bereichsleitungs- noch Vertragsgeschäftsführungsschwelle überschritten',
      contract_executiveApproved_gm:
        'Betrag überschreitet die festgeschriebene Vertragsgeschäftsführungsschwelle oder der Vertrag ist nicht standardmäßig',
      contract_executiveApproved_approved:
        'Betrag überschreitet die Vertragsgeschäftsführungsschwelle nicht und der Vertrag ist standardmäßig',
      committeeVersion:
        'Die Ausschussgruppe verwenden, die der bei Einreichung festgeschriebenen Version entspricht',
      returnApplicant:
        'Die Rückgabeentscheidung wählt Überarbeitung und Wiedereinreichung durch den Antragsteller',
      returnEarlier:
        'Die Rückgabeentscheidung wählt diese zuvor betretene frühere Genehmigungsstufe',
      seal_legal:
        'Nach Leitungsprüfung: Vertragssiegel oder verknüpfter Vertrag',
      seal_financeManager:
        'Aus Leitungs-/Rechtsprüfung: Finanzsiegel, nach Vorrang des Vertragswegs',
      seal_gm:
        'Kein Rechts-/Finanzzweig gilt; Vertretungssiegel oder externe Nutzung und aktueller Prüfer ist nicht die Geschäftsführung',
      seal_stamping:
        'Kein Rechts-/Finanzzweig gilt und keine zusätzliche Geschäftsführungsprüfung oder aktueller Prüfer ist die Geschäftsführung',
    },

    conditional: 'Fachliche Bedingungen gelten',
    transitionUnknown: 'Aktion: {{name}}',
    transitionNames: {
      edit: 'Inhalt bearbeiten',
      submit: 'Einreichen',
      approved: 'Genehmigung erteilt',
      rejected: 'Ablehnen',
      returned: 'Zur Überarbeitung zurückgeben',
      withdraw: 'Zurückziehen',
      terminate: 'Beenden',
      booked: 'Buchung abgeschlossen',
      bookingFailed: 'Buchung fehlgeschlagen',
      bookingForced: 'Abschluss bestätigen',
      retryBooking: 'Buchung erneut versuchen',
      reviseTrip: 'Dienstreise überarbeiten',
      cancelApproved: 'Stornierung genehmigt',
      issued: 'Ausgabe abgeschlossen',
      unavailable: 'Nicht verfügbar / Erfüllung fehlgeschlagen',
      forceClosed: 'Schließen erzwingen',
    },

    place: 'Unbesetzte Stelle',
    placeNumber: 'Unbesetzte Stelle {{number}}',
    placeRequired: 'Wählen Sie eine unbesetzte Stelle.',
    title: 'Prozessverwaltung',
    description:
      'Autorisierte Prozessdefinitionen, Ausführungen und Genehmigungsverlauf anzeigen',
    definitions: 'Definitionen',
    executions: 'Ausführungen',
    refresh: 'Aktualisieren',
    search: 'Nach Nummer, Prozess oder Antragsteller suchen',
    definitionSearch: 'Nach Prozessname suchen',
    clear: 'Filter zurücksetzen',
    all: 'Alle',
    name: 'Name',
    domain: 'Geschäftsbereich',
    category: 'Kategorie',
    capabilities: 'Verwaltungsfunktionen',
    approval: 'Genehmigungsprozess',
    connected: 'Verbunden',
    readOnly: 'Schreibgeschützt',
    notConnected: 'Verwaltungsaktionen noch nicht angebunden',
    reference: 'Nummer / Titel',
    applicant: 'Antragsteller',
    status: 'Status',
    stage: 'Aktuelle Stufe',
    createdAt: 'Gestartet',
    endedAt: 'Beendet',
    empty: 'Noch keine Ausführungen',
    emptyDescription:
      'Ausführungen angebundener Prozesse erscheinen hier nach dem Start',
    noDefinitions: 'Keine lesbaren Definitionen',
    noDefinitionsDescription:
      'Bitten Sie einen Administrator, den Definitionszugriff zu konfigurieren',
    noResults: 'Keine passenden Datensätze',
    noResultsDescription:
      'Passen Sie Filter an oder setzen Sie diese zurück, um Datensätze zu finden',
    definitionGraph: 'Aktuelle Definition',
    graphDescription:
      'Aktuell registrierte Zustände und Übergänge; Geschäftsregeln bestimmen dynamische Verzweigungen',
    currentNode: 'Aktueller Zustand',
    visitedNode: 'Besucht',
    unvisitedNode: 'Nicht besucht',
    executionHistory: 'Ausführungsverlauf',
    terminationOutcome: 'Beendigungsergebnis',
    actualPath: 'Tatsächlicher Ausführungsweg',
    actualDescription:
      'Der vollständige Genehmigungs- und Erfüllungsablauf mit hervorgehobenen besuchten Knoten, Übergängen und aktuellem Zustand. Tatsächliche Rückgaben und historische Wege bleiben sichtbar.',
    tasks: 'Aufgaben und Genehmigungsverlauf',
    timeline: 'Genehmigungs- und Verwaltungsverlauf',
    run: 'Genehmigungslauf',
    historical: 'Ausführungsverlauf',
    definitionMissing: 'Historische Definition nicht verfügbar',
    commentsRestricted:
      'Kommentare können vertrauliche Inhalte enthalten und erfordern separaten Geschäftszugriff',
    comment: 'Kommentar / Begründung',
    actor: 'Bearbeiter',
    assignee: 'Zugewiesene Person',
    answer: 'Entscheidung',
    previousTask: 'Vorherige Aufgabe',
    from: 'Von',
    to: 'Nach',
    initial: 'Anfang',
    final: 'Ende',
    transitions: 'Zustandsübergänge',
    definitionDetails: 'Stufen und Übergänge',
    viewExecutions: 'Alle Datensätze anzeigen',
    back: 'Zurück',
    manage: 'Verwaltungsaktionen',
    appoint: 'Zuweisen',
    reassign: 'Neu zuweisen',
    terminate: 'Beenden',
    unavailable:
      'Die aktuelle Aufgabe oder der Geschäftsstatus erlaubt diese Aktion nicht',
    person: 'Empfänger',
    reason: 'Begründung',
    personRequired: 'Empfänger auswählen',
    reasonRequired: 'Begründung eingeben',
    cancel: 'Abbrechen',
    retry: 'Erneut versuchen',
    loadFailed: 'Laden fehlgeschlagen. Erneut versuchen',
    submitFailed: 'Aktion fehlgeschlagen. Prüfen und erneut versuchen',
    unknown: 'Ergebnis unbekannt. Zur Prüfung aktualisieren',
    stale: 'Die Aufgabe wurde geändert. Aktualisieren und prüfen Sie diese',
    gone: 'Datensatz fehlt oder liegt außerhalb Ihres aktuellen Bereichs',
    forbidden:
      'Sie können diesen Bereich nicht lesen. Wenden Sie sich an einen Administrator',
    loading: 'Wird geladen',
    noPeople: 'Keine geeigneten Empfänger für die aktuelle Aufgabe',
    peopleSearch: 'Autorisierte Empfänger suchen',
    loadMore: 'Weitere laden',
    reassignTitle: 'Aufgabe für „{{recordLabel}}“ neu zuweisen',
    appointTitle: 'Aufgabe für „{{recordLabel}}“ zuweisen',
    terminateTitle: 'Antrag „{{recordLabel}}“ beenden',
    reassigned: 'Aufgabe für „{{recordLabel}}“ neu zugewiesen',
    appointed: 'Aufgabe für „{{recordLabel}}“ zugewiesen',
    terminated: 'Antrag „{{recordLabel}}“ beendet',
    recentDescription:
      'Die fünf neuesten autorisierten Ausführungen. Öffnen Sie die Ausführungsliste für den vollständigen Verlauf.',
    vehicleTerminationGuard:
      'Bereits eingesetzte Anträge können nicht direkt beendet werden. Der tatsächliche Antragsteller muss die Nutzung erfassen und dem Fahrzeuggeschäftsprozess folgen.',
    terminationConsequences: {
      vehicle:
        'Beendet einen noch nicht eingesetzten Antrag. Dieser Vorgang kann keinen bereits eingesetzten Antrag schließen.',
      leave:
        'Schließt die aktuelle Genehmigung; der Urlaubsdienst bearbeitet ausstehende Quotenreservierungen.',
      funding:
        'Schließt die aktuelle Genehmigung; der Geschäftsdienst bearbeitet ausstehende Budget-, Finanzierungs- oder Antragsreservierungen. Abgerechnete Zahlungen bleiben erfasst.',
      stock:
        'Schließt die aktuelle Genehmigung; der Büromaterialdienst bearbeitet ausstehende Bestandsreservierungen. Physische Rückgaben erfordern ihren Geschäftsprozess.',
      ordinary:
        'Schließt die aktuelle Genehmigung und führt fachliche Beendigungsschutzprüfungen und Abschlussbearbeitung aus.',
    },
    terminationDescription:
      'Die Beendigung schließt aktuelle Aufgaben und gibt Reservierungen nach Geschäftsregeln frei; der gesamte Verlauf bleibt erhalten. Ausgeführte Geschäftsvorgänge erfordern eigene Stornierung oder Verwahrungsfreigabe.',
    graphView: 'Diagramm',
    dateRange: 'Startdatum',
    last7: 'Letzte 7 Tage',
    last30: 'Letzte 30 Tage',
    last90: 'Letzte 90 Tage',
    thisMonth: 'Dieser Monat',
    lastMonth: 'Letzter Monat',
    safeHistory:
      'Diese Ansicht enthält nur autorisierte sichere Prozessinformationen',
    business: 'Geschäftsinhalt',
    businessRestricted:
      'Geschäftsinhalte, Anhänge und vertrauliche Felder benötigen separaten Zugriff',
    guardedBranch: 'Verzweigung gemäß fachlichen Quellbedingungen ausgewählt',
    frozen: 'Festgeschriebene Felder',
    covered: 'Abgedeckte Felder',
    management: 'Administratoreingriff',
    kinds: {
      leave: 'Urlaub',
      overtime: 'Überstunden',
      leaveCancellation: 'Urlaubsstornierung',
      general: 'Allgemeiner Antrag',
      attendanceChange: 'Anwesenheitskorrektur',
      outing: 'Außentermin',
      supplies: 'Büromaterialantrag',
      budgetAdjustment: 'Budgetanpassung',
      expensePlan: 'Ausgabenberechtigung',
      training: 'Schulung',
      travel: 'Dienstreisen',
      travelCancellation: 'Dienstreisestornierung',
      reimbursement: 'Kostenerstattung',
      purchase: 'Beschaffung',
      loan: 'Vorschussantrag',
      payment: 'Zahlungsantrag',
      probation: 'Probezeitbeurteilung',
      vehicleRequest: 'Fahrzeugantrag',
      contract: 'Vertrag',
      assetRequest: 'Anlagenantrag',
      vendorQualification: 'Lieferantenqualifizierung',
      recruitment: 'Personalbeschaffung',
      sealRequest: 'Siegelantrag',
      transfer: 'Personaländerung',
      departure: 'Austritt',
      certificateRequest: 'Bescheinigungsantrag',
    },
    domains: {
      office: 'Büroalltag',
      organization: 'Organisation und Personal',
      finance: 'Finanzen und Ausgaben',
      procurement: 'Beschaffung und Verträge',
      administration: 'Verwaltung und Anlagen',
    },
    states: {
      issued: 'Ausgegeben',
      forcedClosed: 'Zwangsweise geschlossen',
      draft: 'Entwurf',
      revision: 'Revision',
      manager: 'Führungskraft',
      head: 'Abteilungsleitung',
      hr: 'Personalabteilung',
      extra: 'Zusätzliche Prüfung',
      finance: 'Finanzen',
      cashier: 'Kassenverwalter',
      executive: 'Bereichsleitung',
      gm: 'Geschäftsführung',
      cfo: 'Finanzvorstand',
      legal: 'Rechtsabteilung',
      financeManager: 'Finanzleitung',
      hrbp: 'HR-Business-Partner',
      hrDirector: 'Personalleitung',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
      terminated: 'Beendet',
      completed: 'Abgeschlossen',
      exception: 'Bearbeitungsausnahme',
      dispatch: 'Einsetzen',
      usage: 'Fahrzeugnutzung',
      issuing: 'Ausgabe',
      returning: 'Rückgabe',
      returnException: 'Rückgabeausnahme',
      stamping: 'Siegelung',
      booking: 'Buchung',
      unbooking: 'Buchung stornieren',
      paid: 'Bezahlt',
      paymentException: 'Zahlungsausnahme',
      pendingEffective: 'Wirksamkeitsdatum ausstehend',
      cancellationReview: 'Stornierungsprüfung',
      sourceHead: 'Quellabteilungsleitung',
      targetHead: 'Zielabteilungsleitung',
      committee: 'Ausschuss',
      purchasing: 'Einkauf',
      inquiry: 'Anfrage',
      quoting: 'Angebot',
      pending: 'Ausstehend',
      claimed: 'Übernommen',
      waiting: 'Wartend',
      blocked: 'Blockiert',
      candidate: 'Kandidat',
      suspended: 'Ausgesetzt',
      transferred: 'Übertragen',
      voided: 'Geschlossen',
      open: 'Öffnen',
      cancelled: 'Abgebrochen',
      returned: 'Zurückgegeben',
      concluded: 'Abgeschlossen',
      decide: 'Entscheidung',
      copy: 'Kopieren',
      approve: 'Genehmigen',
      reject: 'Ablehnen',
      return: 'Zurückgeben',
      unknown: 'Anderer Zustand',
    },
    authz: {
      definitionRead: 'Definitionen',
      historyRead: 'Ausführungsverlauf',
      appoint: 'Zuweisen',
      reassign: 'Neu zuweisen',
      terminate: 'Beenden',
    },
    otherStage: 'Andere Stufe ({{name}})',
    otherEvent: 'Prozessereignis ({{name}})',
    events: {
      approve: 'Genehmigt',
      reject: 'Abgelehnt',
      return: 'Zurückgegeben',
      reassign: 'Administrative Neuzuweisung',
      appoint: 'Administrative Zuweisung',
      comment: 'Kommentar',
      transfer: 'Übertragen',
      addSign: 'Unterzeichner hinzugefügt',
      claim: 'Übernommen',
      release: 'Aufgabe freigegeben',
      'stage.unassigned': 'Nicht zugewiesene Stufe',
      'run.started': 'Genehmigung gestartet',
      'run.ended': 'Genehmigung beendet',
      'stage.entered': 'Stufe betreten',
      remind: 'Erinnerung',
      escalate: 'Eskaliert',
      read: 'Lesen',
    },
  },
};
