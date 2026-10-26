/**
 * The wording of the task-center-ui components' own chrome, under `taskCenterUi`. Everything the data says — sources,
 * subjects, titles, statuses, summaries and batch actions — arrives translated from the page; merge these into the
 * locale resources of the namespace that renders the components.
 */
const enUS = {
  taskCenterUi: {
    nav: {
      label: 'Sources de tâches',
      search: 'Rechercher des types de tâches',
      noMatches: 'Aucun type de tâche correspondant',
      clearSearch: 'Effacer la recherche',
      expand: 'Développer {{name}}',
      collapse: 'Réduire {{name}}',
      subjects: 'Types de tâches de {{name}}',
      pending: '{{count}} à faire',
    },
    tabs: {
      pending: 'À faire',
      closed: 'Terminé',
      all: 'Tout',
    },
    groups: {
      today: 'Aujourd’hui',
      yesterday: 'Hier',
      earlier: 'Antérieur',
    },
    time: {
      received: '{{time}}',
      closed: 'Clos {{time}}',
    },
    selection: {
      select: 'Sélectionner « {{name}} »',
      lockedTask:
        '« {{name}} » est indisponible : {{type}} est sélectionné et seules des tâches de même type peuvent être sélectionnées ensemble',
      otherType:
        '{{type}} est sélectionné ; seules des tâches de même type peuvent être sélectionnées ensemble',
      unsupportedTask: '« {{name}} » ne propose aucune action par lot',
      unsupported: 'Les tâches de ce type sont traitées une à une',
    },
    bulk: {
      label: 'Actions par lot',
      selected: '{{count}} sélectionnés',
      clear: 'Effacer la sélection',
      cancel: 'Annuler',
      skipped:
        '{{count}} autres tâches sélectionnées ne la prennent pas en charge et restent inchangées.',
    },
    empty: {
      pending: {
        title: 'Tout est à jour',
        description: 'Aucun élément ne vous attend ici.',
      },
      closed: {
        title: 'Aucun élément terminé',
        description:
          'Les tâches que vous terminez ou qui sont annulées apparaissent ici.',
      },
      all: {
        title: 'Aucune tâche',
        description:
          'Les tâches de ce type apparaissent ici lorsqu’elles vous parviennent.',
      },
      showAll: 'Tout afficher',
    },
    loading: 'Chargement des tâches',
    pagination: {
      label: 'Pages',
      summary: 'Page {{page}} sur {{pages}}, {{total}} tâches',
      previous: 'Précédent',
      next: 'Suivant',
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
