/**
 * The wording of the task-center-ui components' own chrome, under `taskCenterUi`. Everything the data says — sources,
 * subjects, titles, statuses, summaries and batch actions — arrives translated from the page; merge these into the
 * locale resources of the namespace that renders the components.
 */
const enUS = {
  taskCenterUi: {
    nav: {
      label: 'Aufgabenquellen',
      search: 'Aufgabenarten suchen',
      noMatches: 'Keine passende Aufgabenart',
      clearSearch: 'Suche zurücksetzen',
      expand: '{{name}} aufklappen',
      collapse: '{{name}} zuklappen',
      subjects: 'Aufgabenarten von {{name}}',
      pending: '{{count}} zu erledigen',
    },
    tabs: {
      pending: 'Zu erledigen',
      closed: 'Fertig',
      all: 'Alle',
    },
    groups: {
      today: 'Heute',
      yesterday: 'Gestern',
      earlier: 'Früher',
    },
    time: {
      received: '{{time}}',
      closed: 'Abgeschlossen {{time}}',
    },
    selection: {
      select: '„{{name}}“ auswählen',
      lockedTask:
        '„{{name}}“ ist nicht verfügbar: {{type}} ist ausgewählt. Es können nur Aufgaben derselben Art gemeinsam ausgewählt werden',
      otherType:
        '{{type}} ist ausgewählt; es können nur Aufgaben derselben Art gemeinsam ausgewählt werden',
      unsupportedTask: 'Für „{{name}}“ sind keine Sammelaktionen verfügbar',
      unsupported: 'Aufgaben dieser Art werden einzeln bearbeitet',
    },
    bulk: {
      label: 'Sammelaktionen',
      selected: '{{count}} ausgewählt',
      clear: 'Auswahl aufheben',
      cancel: 'Abbrechen',
      skipped:
        '{{count}} weitere ausgewählte Aufgaben unterstützen diese Aktion nicht und bleiben unverändert.',
    },
    empty: {
      pending: {
        title: 'Alles erledigt',
        description: 'Hier wartet nichts auf Sie.',
      },
      closed: {
        title: 'Noch nichts erledigt',
        description:
          'Erledigte oder abgebrochene Aufgaben werden hier angezeigt.',
      },
      all: {
        title: 'Keine Aufgaben',
        description:
          'Aufgaben dieser Art erscheinen hier, sobald sie Ihnen zugewiesen werden.',
      },
      showAll: 'Alle anzeigen',
    },
    loading: 'Aufgaben werden geladen',
    pagination: {
      label: 'Seiten',
      summary: 'Seite {{page}} von {{pages}}, {{total}} Aufgaben',
      previous: 'Zurück',
      next: 'Weiter',
    },
  },
};

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

/** The shape every locale of task-center-ui has. */
export type TaskCenterUiLocale = Widen<typeof enUS>;

const locale: TaskCenterUiLocale = enUS;

export default locale;
