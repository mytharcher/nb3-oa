import actionCopy from './reimbursement-actions.de-DE.js';
import formCopy from './reimbursement-forms.de-DE.js';
export default {
  reimbursementRequests: {
    relatedUnavailable: 'Verknüpfter Datensatz nicht verfügbar',
    categoryUnavailable: 'Kategorie nicht verfügbar',

    businessErrors: {
      REIMBURSEMENT_INVALID_LINE_AMOUNT:
        'Jede Ausgabenposition muss einen positiven Betrag innerhalb des unterstützten Bereichs haben.',
      REIMBURSEMENT_INVALID_LINE_DATE:
        'Wählen Sie für jede Position ein gültiges Ausgabedatum.',
      REIMBURSEMENT_VOUCHER_REQUIRED:
        'Geben Sie vor der Zahlungsbestätigung die Zahlungsbelegnummer ein.',
      REIMBURSEMENT_PAYMENT_CONFIRMATION_REQUIRED:
        'Geben Sie eine Begründung ein und bestätigen Sie die exakte Erstattungssumme, Vorschussverrechnung und Barauszahlung.',
      REIMBURSEMENT_HANDLING_REASON_REQUIRED:
        'Geben Sie die Begründung ein, weshalb die Zahlung nicht abgeschlossen werden konnte.',
      REIMBURSEMENT_PAYMENT_ACCOUNT_STALE:
        'Das Zahlungskonto wurde geändert. Laden Sie vor der Korrektur das neueste Konto.',
      REIMBURSEMENT_AUTHORIZATION_CHANGED:
        'Das genehmigte Budget wurde geändert. Aktualisieren Sie es und prüfen Sie die Erstattungssumme.',
      REIMBURSEMENT_INVOICES_CHANGED:
        'Rechnungsnachweise wurden geändert. Aktualisieren Sie den Antrag und wählen Sie verfügbare Rechnungen erneut aus.',
      REIMBURSEMENT_LOAN_CHANGED:
        'Die Vorschussverrechnung wurde geändert. Aktualisieren Sie den Vorschuss und bestätigen Sie den Verrechnungsbetrag.',
      REIMBURSEMENT_TOTAL_TOO_LARGE:
        'Die Ausgabensumme überschreitet den unterstützten Betrag. Verringern Sie die Summe oder teilen Sie den Antrag auf.',
      REIMBURSEMENT_FILE_SIZE:
        'Wählen Sie einen nicht leeren Anhang mit höchstens 5 MB.',
      REIMBURSEMENT_FILE_TYPE:
        'Laden Sie eine PDF-, JPEG-, PNG- oder WebP-Datei mit passendem Dateityp hoch.',
    },

    ...formCopy,
    ...actionCopy,
    title: 'Ausgabenerstattungen',
    description:
      'Prüfen Sie Ausgabennachweise und verfolgen Sie Positionsgenehmigungen und Zahlungsbearbeitung.',
    new: 'Neue Kostenerstattung',
    edit: 'Kostenerstattung bearbeiten',
    details: 'Details anzeigen',
    number: 'Nummer',
    reason: 'Begründung',
    gross: 'Bruttoerstattung',
    offset: 'Vorschussverrechnung',
    net: 'Nettoauszahlung',
    search: 'Nach Nummer, Begründung oder Antragsteller suchen',
    view: 'Datensatzansicht',
    allStatuses: 'Alle Status',
    refresh: 'Kostenerstattungen aktualisieren',
    clearFilters: 'Filter zurücksetzen',
    emptyTitle: 'Noch keine Kostenerstattungen',
    emptyDescription:
      'Erstellen Sie einen Entwurf und fügen Sie anschließend Ausgabenpositionen und Nachweise hinzu.',
    noResults: 'Keine passenden Kostenerstattungen. Passen Sie die Filter an.',
    rowActions: 'Aktionen für {{name}}',
    views: {
      mine: 'Meine',
      pending: 'Ausstehend',
      done: 'Fertig',
      copied: 'Kopiert',
    },
    statuses: {
      draft: 'Entwurf',
      revision: 'Revision',
      manager: 'Prüfung durch die Führungskraft',
      head: 'Abteilungsprüfung',
      finance: 'Prüfung durch die Finanzabteilung',
      executive: 'Prüfung durch die Bereichsleitung',
      gm: 'Prüfung durch die Geschäftsführung',
      cashier: 'Kassenbearbeitung',
      exception: 'Bearbeitungsausnahme',
      paid: 'Bezahlt',
      forcedPaid: 'Administrativ erfasste Abrechnung',
      rejected: 'Abgelehnt',
      withdrawn: 'Zurückgezogen',
      terminated: 'Beendet',
    },
    errors: {
      invoiceDuplicate:
        'Rechnungsnummern müssen innerhalb dieser Kostenerstattung eindeutig sein. Prüfen Sie jede Ausgabenposition.',
      overrunReasonRequired:
        'Kumulierte Erstattungsansprüche überschreiten das verknüpfte genehmigte Budget um mehr als 20 %. Geben Sie eine Überschreitungsbegründung ein.',
      invoiceUnavailable:
        'Die Rechnung ist durch eine andere Kostenerstattung reserviert oder verwendet. Prüfen Sie Rechnungsnummer und Antrag.',
      paymentAccountRequired:
        'Das Zahlungskonto des Mitarbeiters ist unvollständig. Bitten Sie die Personalabteilung, vor der Einreichung Bankname, Kontonummer und Kontoinhaber zu vervollständigen.',
      employeeInactive:
        'Der Antragsteller benötigt ein aktives Mitarbeiterprofil. Bitten Sie die Personalabteilung, es zu prüfen.',
      departmentRequired:
        'Der Antragsteller hat keine aktive Hauptabteilung. Bitten Sie die Personalabteilung oder einen Organisationsadministrator um Zuweisung.',
      categoryInvalid:
        'Eine Ausgabenkategorie ist inaktiv oder nicht verfügbar. Wählen Sie für jede Position eine aktive Kategorie.',
      sourceInvalid:
        'Das verknüpfte Budget ist nicht verfügbar, nicht genehmigt oder gehört zu einem anderen Antragsteller. Prüfen Sie den verknüpften Antrag.',
      sourceRebind:
        'Eine eingereichte Kostenerstattung kann ihr verknüpftes Budget oder ihren Vorschuss nicht ändern. Behalten Sie die ursprünglichen Verknüpfungen bei.',
      loanRequired:
        'Wählen Sie einen Vorschuss für den Verrechnungsbetrag oder geben Sie 0 ein, wenn kein Vorschuss verrechnet wird.',
      loanInvalid:
        'Der ausgewählte Vorschuss ist nicht verfügbar oder gehört zu einem anderen Antragsteller. Wählen Sie einen anderen Vorschuss.',
      loanInsufficient:
        'Der verfügbare Vorschusssaldo reicht nicht aus. Verringern Sie die Verrechnung und prüfen Sie den Saldo.',
      invalidOffset:
        'Die Vorschussverrechnung darf die Erstattungssumme nicht überschreiten. Prüfen Sie die Beträge.',
      attachmentInvalid:
        'Einige Nachweise sind nicht verfügbar oder gehören zu einer anderen Kostenerstattung. Wählen oder laden Sie Nachweise für diesen Antrag.',
      slaConfiguration:
        'Die Genehmigungsfristen werden nicht unterstützt. Wenden Sie sich an den Workflow-Administrator.',
      inputInvalid:
        'Geben Sie eine Erstattungsbegründung ein und vervollständigen Sie unterschiedliche Ausgabenpositionen mit Nachweisen.',
      configuration:
        'Die Datenstruktur der Kostenerstattung ist unvollständig. Bitten Sie den Systemadministrator um Reparatur, bevor Sie es erneut versuchen.',
      forbidden: 'Sie können auf diese Kostenerstattung nicht zugreifen.',
      notFound: 'Diese Kostenerstattung ist nicht mehr vorhanden.',
      conflict:
        'Diese Kostenerstattung wurde geändert. Laden und prüfen Sie sie vor einer erneuten Aktion.',
      standardReason:
        'Begründen Sie jede Position an einem Tag, an dem der genehmigte Standard überschritten wird.',
      standardCategoryChanged:
        'Diese Kategorie liegt außerhalb der ursprünglichen Richtlinie. Erstellen Sie einen neuen Antrag, um die aktuelle Richtlinie zu verwenden.',
      standardConfiguration:
        'Der genehmigte Reisestandard ist unvollständig. Bitten Sie einen Administrator, die Konfiguration zu prüfen.',
      invalid: 'Prüfen Sie Erstattungsinhalt und erforderliche Nachweise.',
      failed: 'Die Anfrage wurde nicht abgeschlossen. Versuchen Sie es erneut.',
    },
    standard: {
      title: 'Festgeschriebene Ausgabenrichtlinie',
      unsubmitted:
        'Die Richtlinie wird bei der ersten Einreichung festgeschrieben.',
      frozenHint:
        'Diese gespeicherten Zuordnungen und genehmigten Reisegrenzen bleiben bei Überarbeitungen unverändert. Tagesbeträge werden nach Standardart zusammengefasst.',
      gradeCode: 'Reisegruppe',
      gradeRank: 'Gruppenrang',
      lodging: 'Übernachtung pro Nacht (Yuan)',
      allowance: 'Pauschale pro Tag (Yuan)',
      notApplicable: 'Für diesen Antrag gilt kein genehmigter Reisestandard.',
      kinds: {
        none: 'Keine tägliche Reisegrenze',
        lodging: 'Tägliche Übernachtungsgrenze',
        allowance: 'Tägliche Pauschalengrenze',
      },
    },
    detail: {
      lines: 'Ausgabenpositionen',
      failure: 'Bearbeitungsfehler',
      voucher: 'Zahlungsbeleg',
      forcedReason: 'Begründung der administrativen Abrechnung',
      noLines: 'Noch keine Ausgabenpositionen.',
      line: 'Ausgabenposition {{number}}',
      financeResult: 'Finanzergebnis',
      lineStates: {
        approved: 'Genehmigt',
        returned: 'Zur Korrektur zurückgegeben',
        pending: 'Prüfung ausstehend',
      },
    },
    bank: {
      title: 'Vertrauliches Zahlungskonto',
      bankName: 'Bank',
      bankAccount: 'Bankkonto',
      bankAccountName: 'Kontoinhaber',
      missing: 'Kein gespeichertes Zahlungskonto.',
      correct: 'Zahlungskonto korrigieren',
      saved: 'Zahlungskonto korrigiert',
      denied: 'Zugriff auf das Zahlungskonto verweigert.',
      unavailable:
        'Kontokorrektur ist nicht verfügbar. Laden Sie diese Kostenerstattung neu und prüfen Sie ihr gespeichertes Konto.',
    },
    authz: {
      resource: 'Ausgabenerstattungen',
      submit: 'Meine Kostenerstattungen erstellen und einreichen',
      delegate: 'Kostenerstattungen für Mitarbeiter erstellen',
      view: 'Kostenerstattungen anzeigen',
      paymentAccount: 'Autorisierte Zahlungskonten lesen und korrigieren',
    },
  },
};
