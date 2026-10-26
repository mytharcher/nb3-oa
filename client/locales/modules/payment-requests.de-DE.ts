export default {
  paymentRequests: {
    relatedUnavailable: 'Verknüpfter Datensatz nicht verfügbar',
    businessErrors: {
      PAYMENT_REQUEST_INVALID_INPUT:
        'Vervollständigen Sie Begründung, Zahlungsempfänger, positiven Betrag, Rechnungsnummer und Rechnungsnachweise.',
      PAYMENT_REQUEST_ACCOUNT_REQUIRED:
        'Vervollständigen Sie vor der Einreichung das geschützte Bankkonto des Zahlungsempfängers.',
      PAYMENT_REQUEST_ACCOUNT_STALE:
        'Das Empfängerkonto wurde geändert. Laden Sie vor der Korrektur das neueste Konto.',
      PAYMENT_REQUEST_DEPARTMENT_REQUIRED:
        'Der Antragsteller benötigt eine aktive Hauptabteilung. Bitten Sie die Personalabteilung, den Mitarbeiterdatensatz zu aktualisieren.',
      PAYMENT_REQUEST_METHOD_INVALID:
        'Wählen Sie eine aktivierte Zahlungsmethode.',
      PAYMENT_REQUEST_SOURCE_REQUIRED:
        'Erklären Sie, warum keine vorherige Genehmigung vorliegt, und entfernen Sie die verknüpfte Bestellung.',
      PAYMENT_REQUEST_SOURCE_INVALID:
        'Wählen Sie eine wirksame Bestellung oder einen Vertrag und den ursprünglichen Zahlungsempfänger.',
      PAYMENT_REQUEST_SOURCE_STALE:
        'Der Quellbeleg wurde geändert. Aktualisieren Sie Zahlung und Quelle vor einer erneuten Aktion.',
      PAYMENT_REQUEST_CONTRACT_STALE:
        'Der Vertrag wurde geändert. Aktualisieren Sie seine Version und überarbeiten Sie die Zahlung vor erneuter Einreichung.',
      PAYMENT_REQUEST_VOUCHER_REQUIRED:
        'Geben Sie die Zahlungsbelegnummer ein und laden Sie Zahlungsnachweise hoch oder wählen Sie diese aus.',
      PAYMENT_REQUEST_FORCE_CONFIRMATION_REQUIRED:
        'Bestätigen Sie den exakten genehmigten Betrag, bevor Sie den Zahlungsabschluss erzwingen.',
      PAYMENT_REQUEST_HANDLING_REASON_REQUIRED:
        'Geben Sie die Begründung ein, weshalb die Zahlung nicht abgeschlossen werden konnte.',
      PAYMENT_REQUEST_ALREADY_PAID:
        'Diese Zahlung ist bereits abgerechnet. Aktualisieren Sie sie, um das erfasste Ergebnis zu sehen.',
      PAYMENT_REQUEST_CONTRACT_ACTUAL_PAYMENT_REQUIRED:
        'Erfassen Sie die tatsächliche Vertragszahlung, bevor Sie diesen Vorgang abschließen.',
      PAYMENT_FILE_SIZE:
        'Wählen Sie einen nicht leeren Anhang mit höchstens 5 MB.',
      PAYMENT_FILE_TYPE:
        'Laden Sie eine PDF-, JPEG-, PNG- oder WebP-Datei mit passendem Dateityp hoch.',
      PAYMENT_ATTACHMENT_INVALID:
        'Wählen Sie Nachweise, die für diesen Zahlungsantrag hochgeladen wurden.',
    },

    title: 'Zahlungsanträge',
    description:
      'Prüfen Sie Zahlungsanträge, festgeschriebene Quelldaten und Kassenbearbeitung.',
    new: 'Neuer Zahlungsantrag',
    edit: 'Bearbeiten',
    details: 'Details anzeigen',
    number: 'Nummer',
    reason: 'Begründung',
    vendor: 'Zahlungsempfänger',
    amount: 'Zahlungsbetrag (Yuan)',
    search:
      'Nach Nummer, Begründung, Antragsteller oder Zahlungsempfänger suchen',
    view: 'Datensatzansicht',
    allStatuses: 'Alle Status',
    refresh: 'Aktualisieren',
    clearFilters: 'Filter zurücksetzen',
    emptyTitle: 'Noch keine Zahlungsanträge',
    emptyDescription:
      'Erstellen Sie einen Entwurf, um eine Zahlung zu beantragen, und fügen Sie die Rechnungsnachweise hinzu.',
    noResults:
      'Keine passenden Datensätze. Setzen Sie die Filter zurück oder passen Sie sie an.',
    rowActions: 'Aktionen für {{name}}',
    yes: 'Ja',
    no: 'Nein',
    frozenHint:
      'Quelle, Zahlungsempfänger, Betrag und Rechnung werden bei der Einreichung festgeschrieben.',
    sourceModes: {
      contract: 'Vertrag',
      purchase: 'Bestellung',
      none: 'Keine vorherige Genehmigung',
    },
    views: {
      mine: 'Meine',
      pending: 'Ausstehend',
      done: 'Fertig',
      copied: 'Kopiert',
    },
    statuses: {
      draft: 'Entwurf',
      revision: 'Revision',
      head: 'Abteilungsprüfung',
      finance: 'Prüfung durch die Finanzabteilung',
      executive: 'Prüfung durch die Bereichsleitung',
      gm: 'Prüfung durch die Geschäftsführung',
      cashier: 'Kassenbearbeitung',
      exception: 'Bearbeitungsausnahme',
      paid: 'Bezahlt',
      forcedPaid: 'Erzwungene Zahlung erfasst',
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
        'Diese Zahlung wurde geändert. Lesen Sie den neuesten Datensatz vor einer erneuten Aktion.',
      invalid: 'Prüfen Sie Zahlungsinhalt und erforderliche Nachweise.',
      failed: 'Die Anfrage wurde nicht abgeschlossen. Versuchen Sie es erneut.',
    },
    detail: {
      creator: 'Erstellt von',
      sourceMode: 'Quelle',
      order: 'Bestellung',
      noPriorReason: 'Begründung für fehlende vorherige Genehmigung',
      invoice: 'Rechnungsnummer',
      method: 'Zahlungsmethode',
      failure: 'Bearbeitungsfehler',
      voucher: 'Zahlungsbeleg',
      forcedReason: 'Begründung für erzwungene Zahlung',
      paidAt: 'Bezahlt am',
      sourceFacts: 'Festgeschriebene Quelldaten',
      cumulativeHint:
        'Eingereichte kumulierte Zahlungen umfassen ausstehende Zahlungen. Die Reservierung des aktuellen Antrags wird separat angezeigt und darf nicht erneut addiert werden. Die Zahlung bestätigt weder Lieferung noch Empfang.',
      sourceApproved: 'Genehmigter Bestellbetrag (Yuan)',
      sourceCumulative: 'Eingereichter kumulierter Betrag (Yuan)',
      sourceHeld: 'Aktuelle Quellreservierung (Yuan)',
      fullApproval: 'Vollständige Genehmigung erforderlich',
      attachments: 'Rechnungsnachweise',
      voucherAttachments: 'Zahlungsnachweise',
      notSubmitted: 'Regeln werden bei der Einreichung festgeschrieben.',
    },
    rules: {
      spend_vp: 'Schwellenwert der Bereichsleitung (Yuan)',
      spend_gm: 'Schwellenwert der Geschäftsführung (Yuan)',
      sla_remindHours: 'Erinnerungsfrist in Arbeitsstunden',
      sla_escalateHours: 'Eskalationsfrist in Arbeitsstunden',
      sla_urgeCooldownHours: 'Mindestabstand zwischen Erinnerungen in Stunden',
    },
    authz: {
      voucherEvidence: 'Zahlungsbelegnachweise hochladen',
      ownScope: 'Mir gehörende oder von mir erstellte Zahlungen',
      resource: 'Zahlungsanträge',
      view: 'Zahlungsanträge anzeigen',
      submit: 'Meine Zahlungen erstellen und einreichen',
      delegate: 'Zahlungen für Mitarbeiter erstellen',
      paymentAccount: 'Autorisierte Zahlungskonten lesen und korrigieren',
    },
  },
};
