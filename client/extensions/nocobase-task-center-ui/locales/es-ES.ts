/**
 * The wording of the task-center-ui components' own chrome, under `taskCenterUi`. Everything the data says — sources,
 * subjects, titles, statuses, summaries and batch actions — arrives translated from the page; merge these into the
 * locale resources of the namespace that renders the components.
 */
const enUS = {
  taskCenterUi: {
    nav: {
      label: 'Fuentes de tareas',
      search: 'Buscar tipos de tarea',
      noMatches: 'No hay tipos de tarea coincidentes',
      clearSearch: 'Borrar búsqueda',
      expand: 'Expandir {{name}}',
      collapse: 'Contraer {{name}}',
      subjects: 'Tipos de tarea de {{name}}',
      pending: '{{count}} pendientes',
    },
    tabs: {
      pending: 'Pendientes',
      closed: 'Finalizadas',
      all: 'Todas',
    },
    groups: {
      today: 'Hoy',
      yesterday: 'Ayer',
      earlier: 'Anteriores',
    },
    time: {
      received: '{{time}}',
      closed: 'Cerrada {{time}}',
    },
    selection: {
      select: 'Seleccionar «{{name}}»',
      lockedTask:
        '«{{name}}» no está disponible: se ha seleccionado {{type}} y solo se pueden seleccionar juntas tareas de un mismo tipo',
      otherType:
        'Se ha seleccionado {{type}}; solo se pueden seleccionar juntas tareas de un mismo tipo',
      unsupportedTask: '«{{name}}» no tiene acciones por lotes',
      unsupported: 'Las tareas de este tipo se procesan individualmente',
    },
    bulk: {
      label: 'Acciones por lotes',
      selected: '{{count}} seleccionadas',
      clear: 'Borrar selección',
      cancel: 'Cancelar',
      skipped:
        'Las otras {{count}} tareas seleccionadas no admiten esta acción y permanecerán como están.',
    },
    empty: {
      pending: {
        title: 'Todo al día',
        description: 'No tienes nada pendiente aquí.',
      },
      closed: {
        title: 'Aún no hay tareas finalizadas',
        description: 'Aquí aparecen las tareas finalizadas o canceladas.',
      },
      all: {
        title: 'No hay tareas',
        description:
          'Las tareas de este tipo aparecerán aquí cuando te correspondan.',
      },
      showAll: 'Mostrar todo',
    },
    loading: 'Cargando tareas',
    pagination: {
      label: 'Páginas',
      summary: 'Página {{page}} de {{pages}}, {{total}} tareas',
      previous: 'Anterior',
      next: 'Siguiente',
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
