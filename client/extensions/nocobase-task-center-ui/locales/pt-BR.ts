/**
 * The wording of the task-center-ui components' own chrome, under `taskCenterUi`. Everything the data says — sources,
 * subjects, titles, statuses, summaries and batch actions — arrives translated from the page; merge these into the
 * locale resources of the namespace that renders the components.
 */
const enUS = {
  taskCenterUi: {
    nav: {
      label: 'Origens de tarefas',
      search: 'Pesquisar tipos de tarefas',
      noMatches: 'Nenhum tipo de tarefa correspondente',
      clearSearch: 'Limpar pesquisa',
      expand: 'Expandir {{name}}',
      collapse: 'Recolher {{name}}',
      subjects: 'Tipos de tarefas de {{name}}',
      pending: '{{count}} a fazer',
    },
    tabs: {
      pending: 'A fazer',
      closed: 'Concluído',
      all: 'Todos',
    },
    groups: {
      today: 'Hoje',
      yesterday: 'Ontem',
      earlier: 'Anteriores',
    },
    time: {
      received: '{{time}}',
      closed: 'Encerrado {{time}}',
    },
    selection: {
      select: 'Selecionar "{{name}}"',
      lockedTask:
        '"{{name}}" está indisponível: {{type}} está selecionado e somente tarefas de um mesmo tipo podem ser selecionadas juntas',
      otherType:
        '{{type}} está selecionado; somente tarefas de um mesmo tipo podem ser selecionadas juntas',
      unsupportedTask: '"{{name}}" não tem ações em lote',
      unsupported: 'Tarefas deste tipo são processadas uma por vez',
    },
    bulk: {
      label: 'Ações em lote',
      selected: '{{count}} selecionados',
      clear: 'Limpar seleção',
      cancel: 'Cancelar',
      skipped:
        '{{count}} outras tarefas selecionadas não oferecem suporte e permanecem como estão.',
    },
    empty: {
      pending: {
        title: 'Tudo em dia',
        description: 'Nada aqui está aguardando você.',
      },
      closed: {
        title: 'Nada concluído ainda',
        description: 'Tarefas concluídas por você ou canceladas aparecem aqui.',
      },
      all: {
        title: 'Nenhuma tarefa',
        description: 'Tarefas deste tipo aparecem aqui quando chegam até você.',
      },
      showAll: 'Mostrar tudo',
    },
    loading: 'Carregando tarefas',
    pagination: {
      label: 'Páginas',
      summary: 'Página {{page}} de {{pages}}, {{total}} tarefas',
      previous: 'Anterior',
      next: 'Próximo',
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
