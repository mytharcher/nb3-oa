import type { ApprovalReviewLocale } from './en-US.js';
const locale: ApprovalReviewLocale = {
  approvalAi: {
    history: {
      title: 'Generierungsverlauf',
      total: 'Versuche: {{count}}',
      succeeded: 'Erfolgreich',
      failed: 'Fehlgeschlagen',
      cancelled: 'Abgebrochen',
      generating: 'Wird generiert',
      unavailable: 'Nicht verfügbar',
      current: 'Angezeigt',
      viewing: 'Vorschlagsversion V{{count}}',
      viewLatest: 'Neuesten Bericht anzeigen',
      failedReport:
        'Die letzte Generierung ist fehlgeschlagen. V{{count}} wird weiterhin angezeigt.',
      cancelledReport:
        'Die letzte Generierung wurde abgebrochen. V{{count}} wird angezeigt.',
      unknownFailure:
        'Generierung fehlgeschlagen; keine genaue Ursache aufgezeichnet.',
      invalidReport:
        'Der generierte Inhalt hat die Validierung nicht bestanden.',
      outputLimit:
        'Das Ausgabelimit wurde vor Abschluss des Berichts erreicht.',
      interrupted:
        'Die Generierung wurde unterbrochen. Starten Sie einen neuen Versuch.',
      incomplete: 'Das Modell hat den Bericht nicht abgeschlossen.',
      invalidJson:
        'Das Modell hat keinen vollständigen JSON-Bericht zurückgegeben.',
      unverifiedEvidence:
        'Ein Zitat konnte anhand der bereitgestellten Materialien nicht überprüft werden.',
      started: 'Beginn: {{time}}',
      deadline: 'Frist: {{time}}',
      tokens:
        'Tokens: Eingabe {{input}} · Ausgabe {{output}} · Schlussfolgerung {{reasoning}}',
      duration: 'Modellaufruf: {{seconds}} s',
      network: 'Die Verbindung zum Modell ist fehlgeschlagen.',
      rateLimited: 'Das Anfragelimit des Modelldienstes wurde erreicht.',
      configuration:
        'Konfiguration oder Zugangsdaten des Modelldienstes sind ungültig.',
      quota: 'Das Kontingent des Modelldienstes ist aufgebraucht.',
      contextLimit:
        'Die Materialien überschreiten das Kontextlimit des Modells.',
      providerRejected:
        'Der Modelldienst hat die Generierungsanfrage abgelehnt.',
      timeout: 'Zeitüberschreitung bei der Generierung.',
    },
    retry: 'Erneut generieren',
    readOnly: 'Dieser Vorschlag ist schreibgeschützt.',
    actionFailed:
      'Aktion fehlgeschlagen. Status aktualisieren und erneut versuchen.',
    versionCount: '{{current}} / {{count}}',
    version: 'Version {{count}}',
    latestVersion: '(neueste)',
    latestRunActions: 'Aktionen betreffen die aktuelle Generierung.',
    cancelGeneration: 'Generierung abbrechen',
    cancelling: 'Wird abgebrochen…',
    expandReport: 'Details aufklappen',
    collapseReport: 'Details zuklappen',
    findings: 'Prüfpunkte',
    generatedAt: 'Generiert am',
    nextStep: 'Empfohlener nächster Schritt:',
    noFindings: 'Keine Ergebnisse',
    noMaterials: 'Keine Prüfunterlagen erfasst. Originale prüfen.',
    coverageCounts:
      'Gelesen {{read}} · Nicht unterstützt {{unsupported}} · Fehlend {{missing}}',
    reviewPrivacy:
      'KI-Inhalt dient als Hinweis. Belege vor der Entscheidung prüfen.',
    historyReadOnly: 'Vorschlag einer abgeschlossenen Aufgabe zur Ansicht.',
    materialKinds: {
      field: 'Antragsfeld',
      text: 'Text',
      attachment: 'Anhang',
      knowledge: 'Prüfgrundlage',
      record: 'Geschäftsdatensatz',
      aggregate: 'Aggregierte Daten',
    },
    materialStatuses: {
      partial_read: 'Teilweise gelesen',
      read: 'Gelesen',
      not_supported: 'Nicht unterstützt',
      missing: 'Fehlend oder unzugänglich',
    },
    stateHints: {
      cancelled: 'Generierung abgebrochen. Erneut generieren ist möglich.',
      none: 'Kein Vorschlag. Manuell generieren; Genehmigung bleibt möglich.',
      queued: 'Wartet auf Verarbeitung. Genehmigung kann fortgesetzt werden.',
      running: 'Vorschlag wird generiert. Genehmigung bleibt möglich.',
      failed: 'Generierung fehlgeschlagen. Erneut versuchen ist möglich.',
    },
    verdicts: {
      conforms: 'Konform',
      nonconforming: 'Nicht konform',
      needs_verification: 'Zu prüfen',
      not_covered: 'Nicht abgedeckt',
    },
    title: 'KI-Genehmigungsassistent',
    refresh: 'Aktualisieren',
    submittingGeneration: 'Anfrage wird gesendet…',
    statuses: {
      cancelled: 'Abgebrochen',
      none: 'Nicht generiert',
      queued: 'In Warteschlange',
      running: 'Wird generiert',
      succeeded: 'Bereit',
      failed: 'Fehlgeschlagen',
    },
    generate: 'Vorschlag generieren',
    regenerate: 'Neu generieren',
    model: 'Modell',
    coverage: 'Unterlagenabdeckung',
    evidence: 'Belege',
  },
};
export default locale;
