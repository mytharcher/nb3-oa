export default {
  vendorQualifications: {
    amountUnit: 'CNY (Yuan), bis zu 2 Nachkommastellen',
    authz: {
      resource: 'Lieferantenqualifizierung',
      view: 'Lieferantenqualifizierungen anzeigen',
      submit: 'Anträge zur Lieferantenqualifizierung erstellen und bearbeiten',
      paymentAccount: 'Geschützte Lieferantenbankkonten lesen',
      updatePaymentAccount:
        'Lieferantenbankkonto im eigenen Entwurf aktualisieren',
      manage: 'Ausschuss zur Lieferantenqualifizierung konfigurieren',
    },
    schedule: {
      title: 'Erinnerungen an ablaufende Lieferantenqualifizierungen',
      description:
        'Den Einkauf 30 Tage im Unternehmenskalender vor Ablauf der Qualifizierung erinnern.',
    },

    title: 'Lieferantenqualifizierung und Ausschluss',
    description:
      'Qualifizierung oder Ausschluss beantragen und Prüfungsfortschritt verfolgen.',
    new: 'Neuer Antrag',
    committeeVersion: 'Ausschussprüfung (Version {{version}})',
    allStatuses: 'Alle Stufen',
    clearFilters: 'Filter zurücksetzen',
    view: 'Anzeigen',
    emptyDescription:
      'Erstellen Sie einen Lieferantenantrag oder bitten Sie einen Administrator um Zugriff.',
    rowActions: 'Aktionen für „{{name}}“',
    details: 'Details anzeigen',
    edit: 'Bearbeiten',
    unknown: 'Ergebnis unbestätigt. Wiederholen Sie die unveränderte Anfrage.',
    retryCreate: 'Ursprüngliche Erstellung wiederholen',
    bankHint:
      'Geben Sie unten das geschützte Bankkonto ein und reichen Sie den vollständigen Antrag ein oder speichern Sie einen Entwurf.',
    vetoAbstain: 'Eine Enthaltung verzichtet auf das Veto dieses Sitzes.',
    confirmation: '„{{name}}“: {{action}}?',
    consequence:
      'Dies setzt die Prüfung fort oder beendet sie. Eingereichte Stellungnahmen bleiben im Verlauf erhalten.',
    savedNamed: '„{{name}}“ gespeichert',
    doneNamed: '{{action}} für „{{name}}“ abgeschlossen',
    operations: {
      qualify: 'Qualifizierung',
      remove: 'Ausschluss',
    },
    form: {
      create: 'Neuer Lieferantenantrag',
      edit: 'Lieferantenantrag bearbeiten',
    },
    fields: {
      operation: 'Antragsart',
      vendor: 'Lieferant',
      name: 'Lieferantenname',
      category: 'Lieferantenkategorie',
      reason: 'Begründung',
      quoteCents: 'Angebot',
      cases: 'Referenzen',
      contactName: 'Kontaktname',
      contactPhone: 'Telefon',
      contactEmail: 'E-Mail',
      attachments: 'Qualifizierungsnachweise',
      qualificationExpiry: 'Qualifizierungsablauf',
      number: 'Antragsnummer',
      applicant: 'Antragsteller',
      createdAt: 'Erstellt',
      status: 'Aktuelle Stufe',
      sourceVendorVersion: 'Lieferantendatenversion',
      committeeVersion: 'Ausschussversion',
    },
    common: {
      cancel: 'Abbrechen',
      save: 'Speichern',
      refresh: 'Aktualisieren',
      retry: 'Erneut versuchen',
      search: 'Nach Lieferant oder Antragsnummer suchen',
      more: 'Weitere Aktionen',
      empty: 'Keine Lieferantenanträge',
      noResults: 'Keine passenden Anträge',
      saving: 'Wird gespeichert',
      required: 'Erforderlich',
      comment: 'Kommentar',
      person: 'Prüfer',
      none: 'Nicht zugewiesen',
      searchPeople: 'Geeignete Personen suchen',
    },
    errors: {
      category: 'Wählen Sie eine aktive Lieferantenkategorie.',
      evidence:
        'Laden Sie mindestens eine Qualifizierungsnachweisdatei hoch oder wählen Sie diese aus.',
      expiry:
        'Wählen Sie ein Ablaufdatum nach heute in der Unternehmenszeitzone.',
      qualificationFacts:
        'Vervollständigen Sie Lieferantenname, aktive Kategorie und Qualifizierungsnachweise und wählen Sie ein Ablaufdatum nach heute in der Unternehmenszeitzone.',
      missingReturned:
        '{{name}} ist nicht verfügbar. Zur Quelle zurückgekehrt.',
      missingUnnamed:
        'Der Antrag ist nicht verfügbar. Zur Quelle zurückgekehrt.',
      forbidden:
        'Zugriff nicht verfügbar. Wenden Sie sich an einen Administrator.',
      missing:
        'Antrag nicht verfügbar. Kehren Sie zur vorherigen Ansicht zurück.',
      conflict:
        'Daten geändert. Laden Sie die neueste Version, bevor Sie fortfahren.',
      invalid: 'Prüfen Sie Pflichtfelder und aktuelle Geschäftsbedingungen.',
      failed: 'Laden nicht möglich. Versuchen Sie es erneut.',
      sourceConflict:
        'Lieferantendaten wurden geändert. Bitten Sie einen Genehmigungsadministrator, die Prüfung neu zu starten.',
      eligibility:
        'Keine geeignete Antragsart und kein geeigneter Lieferant verfügbar.',
      amount:
        'Geben Sie einen nicht negativen Betrag mit höchstens zwei Nachkommastellen innerhalb des sicheren Bereichs ein.',
      email: 'Geben Sie eine gültige E-Mail-Adresse ein.',
    },
    account: {
      title: 'Bankkonto',
      edit: 'Bankkonto bearbeiten',
      bankName: 'Bank',
      bankAccount: 'Kontonummer',
      bankAccountName: 'Kontoinhaber',
      reason: 'Änderungsgrund',
      denied: 'Sie können Bankinformationen nicht anzeigen.',
      missing: 'Kontodatensatz fehlt. Laden Sie vor der Bearbeitung neu.',
    },
    configuration: {
      title: 'Konfiguration der Lieferantenprüfung',
      structure: 'Ausschussstruktur',
      assignments: 'Prüfer fester Sitze',
      removal: 'Ausschlussprüfer',
      version: 'Version',
      active: 'Laufende Version: {{version}}',
      min: 'Genehmigungsschwellenwert',
      seats: 'Sitze',
      seatKey: 'Sitzschlüssel',
      source: 'Kandidatenquelle',
      veto: 'Vetositz',
      addSeat: 'Sitz hinzufügen',
      removeSeat: 'Sitz entfernen',
      publish: 'Prüfversion veröffentlichen',
      restartRequired:
        'Starten Sie die Anwendung nach der Veröffentlichung neu. Bestehende Anträge behalten ihre Version.',
      dynamicHead:
        'Verwendet die Leitung der Hauptabteilung des Antragstellers',
      futureOnly:
        'Zuweisungen beeinflussen künftige Anträge. Weisen Sie bestehende Aufgaben über Genehmigungsaktionen neu zu.',
      reason: 'Änderungsgrund',
      invalid:
        'Behalten Sie Einkaufs-, Finanz- und Abteilungsleitungssitze sowie ein Finanzveto bei. Verwenden Sie eindeutige mit Kleinbuchstaben beginnende Schlüssel und einen Schwellenwert innerhalb der Sitzanzahl.',
      published:
        'Version {{version}} veröffentlicht. Starten Sie die Anwendung neu.',
    },
    sources: {
      purchasing: 'Einkauf',
      finance: 'Finanzen',
      applicantHead: 'Abteilungsleitung des Antragstellers',
      technical: 'Technik',
      legal: 'Rechtsabteilung',
    },
    files: {
      attachments: 'Qualifizierungsnachweise',
      uploadHint:
        'PDF, JPEG, PNG oder WebP mit höchstens 5 MB. Das Entfernen einer Auswahl behält die Nachweise bei.',
      fileSize: 'Wählen Sie eine nicht leere Datei mit höchstens 5 MB.',
      fileType: 'Wählen Sie eine unterstützte Datei mit passendem Typ.',
      selectEvidence: 'Hochgeladene Nachweise auswählen',
      uploading: 'Wird hochgeladen',
      uploadUnknown:
        'Upload-Ergebnis unbestätigt. Prüfen Sie die hochgeladenen Nachweise.',
      emptyEvidence: 'Keine hochgeladenen Nachweise',
      removeEvidence: 'Auswahl „{{name}}“ entfernen',
      evidenceMissing: 'Einige Nachweise sind nicht verfügbar.',
    },
    statuses: {
      committee: 'Ausschussprüfung',
      draft: 'Entwurf',
      revision: 'Revision',
      purchasing: 'Einkaufsprüfung',
      removalReview: 'Ausschlussprüfung',
      qualified: 'Qualifiziert',
      removed: 'Ausgeschlossen',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
      terminated: 'Beendet',
    },
    actions: {
      submit: 'Zur Genehmigung einreichen',
      withdraw: 'Zurückziehen',
      terminate: 'Beenden',
      restartReview: 'Prüfung neu starten',
      approve: 'Genehmigen',
      reject: 'Ablehnen',
      return: 'Zurückgeben',
      comment: 'Kommentar',
      read: 'Als gelesen markieren',
      abstain: 'Enthalten',
      appoint: 'Bestimmen',
      reassign: 'Neu zuweisen',
    },
  },
};
