import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  authorization: { title: 'Zeitpläne', read: 'Lesen' },
  nav: { automation: 'Automatisierung', schedules: 'Geplante Aufgaben' },
  page: {
    refresh: 'Aktualisieren',
    retry: 'Erneut versuchen',
    clearFilters: 'Filter zurücksetzen',
    saved: 'Zeitplan „{{name}}“ aktualisiert',
    limitNotice: 'Es werden nur die neuesten {{count}} Auslösungen angezeigt.',
    scheduleNames: {
      annualLeave: 'Automatische Zuteilung von Jahresurlaub',
      assetBorrow: 'Erinnerungen an die Rückgabe ausgeliehener Anlagen',
      departure: 'Austritt durchführen',
      probation: 'Erinnerungen an das Probezeitende',
      sealReturn: 'Erinnerungen an die Siegelrückgabe',
      vendorQualification:
        'Erinnerungen an ablaufende Lieferantenqualifizierungen',
      expenseAuthorization: 'Abgelaufene genehmigte Ausgabenbudgets freigeben',
      loan: 'Erinnerungen an Vorschussrückzahlungen',
    },
    title: 'Geplante Aufgaben',
    description:
      'Überwachen Sie geplante Aufgaben und verwalten Sie ihre Ausführungszeiten.',
    filters: {
      searchLabel: 'Zeitpläne suchen',
      searchPlaceholder: 'Nach Name, Zieltyp oder Zeitplan suchen…',
      statusLabel: 'Nach Status filtern',
      targetLabel: 'Nach Zieltyp filtern',
      allStatuses: 'Alle Status',
      allTargets: 'Alle Zieltypen',
    },
    statuses: {
      active: 'Aktiv',
      paused: 'Pausiert',
      inactive: 'Inaktiv',
      targetIssue: 'Zielproblem',
    },
    actions: { enable: 'Aktivieren', disable: 'Deaktivieren' },
    columns: {
      name: 'Name',
      scheduleTimezone: 'Zeitplan / Zeitzone',
      triggered: 'Ausgelöst',
      nextRun: 'Nächste Auslösung',
      target: 'Ziel',
      status: 'Status',
    },
    targets: {
      workflow: 'Workflow',
    },
    targetStates: {
      ready: 'Bereit',
      disabled: 'Deaktiviert',
      missing: 'Fehlt',
      invalid: 'Ungültig',
    },
    pagination: {
      previous: 'Zurück',
      next: 'Weiter',
      summary: 'Seite {{page}} von {{total}}',
    },
    loading: 'Geplante Aufgaben werden geladen…',
    empty: 'Keine geplanten Aufgaben definiert.',
    noMatches: 'Keine geplanten Aufgaben entsprechen diesen Filtern.',
    details: {
      back: 'Zurück zu geplanten Aufgaben',
      loading: 'Zeitplandetails werden geladen…',
      notFound: 'Die geplante Aufgabe wurde nicht gefunden.',
      overview: 'Übersicht',
      triggers: 'Ausführungsnachweise',
      schedule: 'Zeitplan',
      frequency: 'Häufigkeit',
      timezone: 'Zeitzone',
      nextRun: 'Nächste Ausführung',
      lastTrigger: 'Letzte Auslösung',
      triggerCount: 'Anzahl der Auslösungen',
      inactiveReason: 'Inaktivitätsgrund',
      target: 'Ausführungsziel',
      targetName: 'Ziel',
      targetType: 'Zieltyp',
      description: 'Beschreibung',
      targetIssueTitle: 'Das Ausführungsziel ist nicht verfügbar',
      targetIssueBody:
        'Dieser im Code definierte Zeitplan kann erst ausgelöst werden, wenn sein Ziel wieder verfügbar ist.',
    },
    triggersLoading: 'Auslösungen werden geladen…',
    triggersEmpty: 'Noch keine Auslösungen gestartet.',
    triggerColumns: {
      startedAt: 'Ausführungszeit',
      duration: 'Dauer',
      status: 'Status',
      target: 'Ausführungsziel',
    },
    triggerStatuses: {
      pending: 'Ausstehend',
      running: 'Wird ausgeführt',
      waiting: 'Warten auf Ziel',
      succeeded: 'Erfolgreich',
      triggered: 'Ausgelöst (Ergebnis unbekannt)',
      skipped: 'Übersprungen',
      failed: 'Fehlgeschlagen',
      cancelled: 'Abgebrochen',
      timed_out: 'Zeitüberschreitung',
    },
    reasons: {
      definition_removed: 'Zeitplandefinition wurde entfernt',
      'target-not-found': 'Ausführungsziel wurde nicht gefunden',
      'target-disabled': 'Ausführungsziel ist deaktiviert',
      'target-missing': 'Ausführungsziel fehlt',
      'target-invalid': 'Ausführungsziel ist ungültig',
      'target-unavailable': 'Ausführungsziel ist nicht verfügbar',
      'invalid-config': 'Ungültige Zielkonfiguration',
      'invalid-input': 'Ungültige Workflow-Eingabe',
      'artifact-unavailable': 'Workflow-Artefakt ist nicht verfügbar',
      'dispatch-failed': 'Ausführung konnte nicht gestartet werden',
      'execution-timeout': 'Zeitüberschreitung bei der Ausführung',
      'execution-cancelled': 'Ausführung wurde abgebrochen',
      'execution-failed': 'Ausführung fehlgeschlagen',
      'reference-type-mismatch':
        'Typ der Ausführungsreferenz stimmt nicht überein',
      'run-not-found': 'Ausführungsnachweis wurde nicht gefunden',
      'observer-failed': 'Ausführungsergebnis konnte nicht beobachtet werden',
      'observer-unavailable':
        'Beobachter des Ausführungsergebnisses ist nicht verfügbar',
    },
    inProgress: 'In Bearbeitung',
    viewTarget: 'Anzeigen',
    invalidSchedule: 'Ungültiger Zeitplan',
    unavailable: '—',
  },
  errors: {
    forbidden:
      'Der Zugriff wurde entzogen. Wenden Sie sich an einen Administrator.',
    notFound:
      'Diese Datensätze sind nicht verfügbar. Kehren Sie zum Arbeitsplatz zurück.',
    toggleFailed:
      'Der Zeitplan konnte nicht geändert werden. Versuchen Sie es erneut.',
    loadSchedules: 'Geplante Aufgaben konnten nicht geladen werden.',
    loadOccurrences: 'Auslösungen konnten nicht geladen werden.',
  },
};

/** English is the source of truth for this plugin's locale shape. */
export type SchedulerResource = LocaleResource<typeof enUS>;

export default enUS;
