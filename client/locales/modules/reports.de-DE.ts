export default {
  reports: {
    administrativeExportHint:
      'Der Export enthält alle für Sie lesbaren Datensätze bis zu 10.000 Zeilen, nicht nur diese Seite. Größere Verzeichnisse erfordern einen separaten Export durch Ihren Administrator.',
    administrativeColumns: {
      number: 'Antragsnummer',
      itemCode: 'Artikelcode',
      requestedQuantity: 'Angeforderte Menge',
      actualQuantity: 'Ausgegebene Menge',
      recipient: 'Empfänger',
      operator: 'Erfasst von',
      recordedAt: 'Erfasst am',
      sealName: 'Siegel',
      approvedCopies: 'Genehmigte Exemplare',
      actualCopies: 'Tatsächliche Exemplare',
      applicant: 'Antragsteller',
      sealedAt: 'Gesiegelt am',
    },
    noData: 'Noch keine Berichtsdaten',
    title: 'Berichte',
    description:
      'Aktuell autorisierte Berichte lesen und ihre Quelldaten exportieren.',
    invalidFilters:
      'Geben Sie ein Jahr von 1900 bis 9999 und einen Monat von 1 bis 12 ein oder setzen Sie die Filter zurück.',
    monthlyForbidden:
      'Sie haben keinen Zugriff auf die aktuelle Urlaubsantragsquelle. Wenden Sie sich zur Prüfung der Quellenberechtigungen an einen Administrator.',
    clearFilters: 'Filter zurücksetzen',
    monthlyEmpty: 'Noch keine genehmigten Urlaubsanträge',
    monthlyEmptyHint:
      'Es werden nur aktuell autorisierte genehmigte Anträge berücksichtigt. Prüfen Sie Jahr und Monat oder bitten Sie einen Administrator, die Quellenberechtigungen zu prüfen.',
    sourceLimit:
      'Dieser Bereich überschreitet 10.000 autorisierte genehmigte Anträge. Wählen Sie einen Monat oder ein anderes Jahr und versuchen Sie es erneut.',
    refresh: 'Aktualisieren',
    exporting: 'Wird exportiert…',
    export: 'Excel exportieren',
    exportFailed:
      'Export fehlgeschlagen. Prüfen Sie Berechtigungen oder Filter und versuchen Sie es erneut.',
    retry: 'Erneut versuchen',
    forbidden: 'Sie sind nicht berechtigt, diese Berichtsquelle zu lesen.',
    failed:
      'Dieser Bericht konnte nicht geladen werden. Versuchen Sie es erneut.',
    empty: 'Keine passenden Datensätze.',
    total: '{{count}} Datensätze',
    generatedAt: 'Erstellt {{value}}',
    previous: 'Zurück',
    next: 'Weiter',
    basisPoints: '{{value}} Bp.',
    capacityNotice:
      'Nicht initialisierte Kapazität kann nicht genutzt werden. Blockierte Ersatzstellen erfordern eine fachliche Klärung und erhöhen niemals die verfügbare Kapazität.',
    states: {
      activePendingSeal: 'Aktiv, Siegelung ausstehend',
      active: 'Aktiv',
      uninitialized: 'Nicht initialisiert',
      blocked: 'Blockierte Ersatzstelle',
      ready: 'Initialisiert',
      terminated: 'Beendet',
      expired: 'Abgelaufen',
      current: 'Nicht abgelaufen',
      unpaid: 'Unbezahlt',
      partial: 'Teilweise bezahlt',
      paid: 'Bezahlt',
      overpaid: 'Überzahlt',
    },
    filters: {
      month: 'Startmonat (1–12, optional)',
      position: 'Position',
      positionFailed: 'Positionsoptionen konnten nicht geladen werden.',
      positionEmpty: 'Keine passenden Positionen.',
      endsBefore: 'Endet am oder vor',
      department: 'Abteilung',
      year: 'Jahr',
      search: 'Nach Vertragsnummer suchen',
      status: 'Vertragsstatus',
      statusHint: 'aktiv / beendet',
    },
    datasets: {
      'supply-ledger': {
        title: 'Büromaterialverzeichnisbericht',
        description:
          'Ausgegebenes Büromaterial innerhalb Ihres aktuellen Verzeichniszugriffs.',
      },
      'seal-ledger': {
        title: 'Siegelverzeichnisbericht',
        description:
          'Erfasste Siegelungen innerhalb Ihres aktuellen Verzeichnis- und Antragszugriffs.',
      },
      'leave-monthly': {
        title: 'Monatliche Urlaubsanträge',
        description:
          'Genehmigte ursprünglich beantragte Tage nach Startmonat des Antrags vor Stornierungen; dies ist kein tatsächlicher Anwesenheitsverbrauch.',
      },
      'budget-balances': {
        title: 'Budgetsalden',
        description:
          'Jährliche Budgetsalden nach Abteilung und Budgetposition.',
      },
      'contract-ledger': {
        title: 'Vertragsverzeichnis',
        description:
          'Aktuelle unveränderliche Ablaufdaten und verifizierter Abrechnungsfortschritt unter Verzeichnis- und allgemeinen Anzeigeberechtigungen.',
      },
      'headcount-balances': {
        title: 'Personalstellensalden',
        description:
          'Jährliche autorisierte Kapazitätssalden nach Abteilung und Position.',
      },
    },
    fields: {
      departmentName: 'Abteilung',
      positionName: 'Position',
      subjectName: 'Budgetposition',
      month: 'Startmonat',
      leaveType: 'Urlaubsart',
      approvedRequestCount: 'Genehmigte Anträge',
      approvedRequestedDays: 'Genehmigte ursprünglich beantragte Tage',
      startsOn: 'Beginnt am',
      endsOn: 'Endet am',
      asOf: 'Stand (Unternehmenskalender)',
      expiryState: 'Ablaufstatus',
      paymentState: 'Zahlungsfortschritt',
      paidBasisPoints: 'Bezahlt (Basispunkte; 10000 = 100 %)',
      capacityState: 'Kapazitätsstatus',
      departmentId: 'Abteilungs-ID',
      positionId: 'Positions-ID',
      year: 'Jahr',
      subject: 'Budgetposition',
      allocatedCents: 'Zugeteilt (CNY)',
      heldCents: 'Reserviert (CNY)',
      usedCents: 'Verbraucht (CNY)',
      availableCents: 'Verfügbar (CNY)',
      number: 'Vertragsnummer',
      status: 'Status',
      amountCents: 'Betrag (CNY)',
      paidCents: 'Bezahlt (CNY)',
      limit: 'Grenze',
      initialized: 'Initialisiert',
      used: 'Verbraucht',
      pending: 'Ausstehend',
      allocated: 'Zugeteilt',
      replacementPending: 'Ersatz ausstehend',
      replacementAllocated: 'Ersatz zugeteilt',
      replacementBlocked: 'Ersatz blockiert',
      available: 'Verfügbar',
    },
  },
};
