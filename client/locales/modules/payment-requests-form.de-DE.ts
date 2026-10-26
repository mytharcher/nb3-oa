export default {
  paymentRequestsForm: {
    new: 'Neuer Zahlungsantrag',
    edit: 'Zahlungsantrag bearbeiten',
    description:
      'Reichen Sie den vollständigen Antrag ein oder speichern Sie einen Entwurf. Erforderliche fachliche Daten werden bei der Einreichung erneut geprüft.',
    save: 'Entwurf speichern',
    saved: 'Zahlungsentwurf gespeichert',
    draft: 'Entwurf',
    maxFiles: 'Wählen Sie höchstens 10 Nachweisdateien.',
    limit: 'Dieser Text überschreitet die Längenbegrenzung.',
    required: 'Dieses Feld ist erforderlich.',
    amountInvalid:
      'Geben Sie einen nicht negativen Betrag mit höchstens zwei Nachkommastellen innerhalb des unterstützten exakten Centbereichs ein.',
    invalid: 'Prüfen Sie dieses Feld.',
    notEditable: 'Dieser Datensatz ist nicht mehr zur Bearbeitung verfügbar.',
    inactive: 'Nicht verfügbar — wählen Sie eine geeignete Option',
    select: 'Option auswählen',
    unknown:
      'Das Ergebnis ist unbestätigt. Behalten Sie Ihre Eingaben bei und wiederholen Sie genau dieselbe Anfrage.',
    replay: 'Ursprünglichen Antrag abgleichen',
    latest:
      'Neueste Version geladen. Ihre Eingaben bleiben erhalten; vergleichen Sie sie vor erneutem Speichern mit den neuesten Quelloptionen.',
    leaveReady:
      'Klicken Sie erneut auf Ihr ursprüngliches Ziel, um die Ansicht zu verlassen. Weitere Bearbeitung hebt diese Bestätigung auf.',
    applicantId: 'Antragsteller',
    reason: 'Zahlungsgrund',
    sourceMode: 'Vorherige Genehmigungsquelle',
    contract: 'Vertrag',
    contractVersion: 'Vertragsversion',
    contractId: 'Vertrag',
    counterparty: 'Vertragsgegenpartei',
    customerAccountHint:
      'Kundenverträge haben kein Lieferantenbankkonto. Falls erforderlich, kann das geschützte Konto korrigiert werden, nachdem die Kassenbearbeitung eine Ausnahme meldet.',
    purchase: 'Genehmigte Bestellung',
    none: 'Keine vorherige Genehmigung',
    purchaseOrderId: 'Bestellung',
    noPriorApprovalReason: 'Begründung für Zahlung ohne vorherige Genehmigung',
    vendorId: 'Zahlungsempfänger',
    amount: 'Betrag (Yuan)',
    invoiceNumber: 'Rechnungsnummer',
    paymentMethod: 'Zahlungsmethode',
    orderStatus: 'Bestellstatus',
    approved: 'Genehmigter Betrag',
    paid: 'Bereits bezahlt',
    pending: 'Ausstehende Zahlungen',
    available: 'Verfügbarer Betrag',
    cents: 'Cent',
    overApproval:
      'Beträge über der genehmigten kumulierten Grenze einschließlich ausstehender Zahlungen erfordern eine vollständige Genehmigung. Überzahlungsanträge sind zulässig.',
    frozenHint:
      'Quelle, Zahlungsempfänger, Betrag und Rechnung werden bei der Einreichung festgeschrieben.',
    voucherAttachments: 'Zahlungsnachweise',
    attachments: 'Rechnungsnachweise',
    uploadHint:
      'PDF, JPEG, PNG oder WebP; höchstens 5 MB. Das Entfernen einer Auswahl behält den gespeicherten Nachweis bei.',
    fileSize: 'Wählen Sie eine nicht leere Datei mit höchstens 5 MB.',
    fileType:
      'Wählen Sie eine PDF-, JPEG-, PNG- oder WebP-Datei mit passender Dateierweiterung.',
    selectEvidence: 'Gespeicherte Nachweise auswählen / Upload abgleichen',
    uploading: 'Nachweise werden hochgeladen oder gelesen…',
    uploadUnknown:
      'Das Upload-Ergebnis ist unbestätigt. Lesen und prüfen Sie die gespeicherten Nachweise vor einem erneuten Upload. Der Upload wird nicht automatisch wiederholt.',
    emptyEvidence: 'Keine gespeicherten Nachweise.',
    evidenceMissing:
      'Einige Nachweise sind nicht mehr zugänglich. Aktualisieren Sie die Ansicht oder prüfen Sie Ihre Berechtigungen.',
    removeEvidence: '{{name}} aus dieser Auswahl entfernen',
    bank: {
      title: 'Vertrauliches Empfängerkonto',
      denied: 'Sie haben keinen Zugriff auf dieses Zahlungskonto.',
      missing: 'Es wurde kein Zahlungskonto erfasst.',
      correct: 'Zahlungskonto korrigieren',
      unavailable:
        'Eine Kontokorrektur ist nur dem Antragsteller oder Ersteller während der Bearbeitung einer Ausnahme möglich.',
      bankName: 'Bank',
      bankAccount: 'Kontonummer',
      bankAccountName: 'Kontoinhaber',
      reason: 'Korrekturbegründung',
      saved: 'Zahlungskonto korrigiert',
      unknown:
        'Das Schreibergebnis ist unbestätigt. Lesen und vergleichen Sie das neueste Konto, bevor Sie ausdrücklich erneut einreichen.',
      conflict:
        'Das Konto oder die Zahlungsversion wurde geändert. Laden Sie die neuesten Daten; Ihre Änderungen bleiben erhalten.',
      reconciled:
        'Neueste Daten geladen. Vergleichen Sie Ihre beibehaltenen Eingaben und bestätigen Sie jeden neuen Schreibvorgang ausdrücklich.',
    },
  },
};
