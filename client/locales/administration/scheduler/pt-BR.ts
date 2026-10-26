import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  authorization: { title: 'Agendamentos', read: 'Ler' },
  nav: { automation: 'Automação', schedules: 'Tarefas agendadas' },
  page: {
    refresh: 'Atualizar',
    retry: 'Tentar novamente',
    clearFilters: 'Limpar filtros',
    saved: 'Agendamento "{{name}}" atualizado',
    limitNotice:
      'Somente os {{count}} acionamentos mais recentes são exibidos.',
    scheduleNames: {
      annualLeave: 'Acúmulo automático de férias anuais',
      assetBorrow: 'Lembretes de devolução de bens emprestados',
      departure: 'Execução de desligamento',
      probation: 'Lembretes do fim do período de experiência',
      sealReturn: 'Lembretes de devolução de carimbos',
      vendorQualification:
        'Lembretes de vencimento de qualificações de fornecedores',
      expenseAuthorization: 'Liberar limites de despesas aprovados e vencidos',
      loan: 'Lembretes de pagamento de empréstimos',
    },
    title: 'Tarefas agendadas',
    description:
      'Monitore tarefas agendadas e gerencie quando elas serão executadas.',
    filters: {
      searchLabel: 'Pesquisar agendamentos',
      searchPlaceholder: 'Pesquisar nome, tipo de destino ou agendamento…',
      statusLabel: 'Filtrar por status',
      targetLabel: 'Filtrar por tipo de destino',
      allStatuses: 'Todos os status',
      allTargets: 'Todos os tipos de destino',
    },
    statuses: {
      active: 'Ativa',
      paused: 'Pausado',
      inactive: 'Inativo',
      targetIssue: 'Problema no destino',
    },
    actions: { enable: 'Habilitar', disable: 'Desabilitar' },
    columns: {
      name: 'Nome',
      scheduleTimezone: 'Agendamento / fuso horário',
      triggered: 'Acionado',
      nextRun: 'Próximo acionamento',
      target: 'Destino',
      status: 'Status',
    },
    targets: {
      workflow: 'Fluxo de trabalho',
    },
    targetStates: {
      ready: 'Pronto',
      disabled: 'Desativada',
      missing: 'Ausente',
      invalid: 'Inválido',
    },
    pagination: {
      previous: 'Anterior',
      next: 'Próximo',
      summary: 'Página {{page}} de {{total}}',
    },
    loading: 'Carregando tarefas agendadas…',
    empty: 'Nenhuma tarefa agendada definida.',
    noMatches: 'Nenhuma tarefa agendada corresponde a estes filtros.',
    details: {
      back: 'Voltar às tarefas agendadas',
      loading: 'Carregando detalhes do agendamento…',
      notFound: 'A tarefa agendada não foi encontrada.',
      overview: 'Visão geral',
      triggers: 'Registros de execução',
      schedule: 'Agendamento',
      frequency: 'Frequência',
      timezone: 'Fuso horário',
      nextRun: 'Próxima execução',
      lastTrigger: 'Último acionamento',
      triggerCount: 'Quantidade de acionamentos',
      inactiveReason: 'Motivo da inatividade',
      target: 'Destino de execução',
      targetName: 'Destino',
      targetType: 'Tipo de destino',
      description: 'Descrição',
      targetIssueTitle: 'O destino de execução está indisponível',
      targetIssueBody:
        'Este agendamento definido em código não pode ser acionado até que seu destino esteja disponível novamente.',
    },
    triggersLoading: 'Carregando acionamentos…',
    triggersEmpty: 'Nenhum acionamento iniciado.',
    triggerColumns: {
      startedAt: 'Horário de execução',
      duration: 'Duração',
      status: 'Status',
      target: 'Destino de execução',
    },
    triggerStatuses: {
      pending: 'Pendente',
      running: 'Em execução',
      waiting: 'Aguardando destino',
      succeeded: 'Bem-sucedido',
      triggered: 'Acionado (resultado desconhecido)',
      skipped: 'Ignorado',
      failed: 'Falhou',
      cancelled: 'Cancelado',
      timed_out: 'Tempo esgotado',
    },
    reasons: {
      definition_removed: 'A definição do agendamento foi removida',
      'target-not-found': 'O destino de execução não foi encontrado',
      'target-disabled': 'O destino de execução está desabilitado',
      'target-missing': 'O destino de execução está ausente',
      'target-invalid': 'O destino de execução é inválido',
      'target-unavailable': 'O destino de execução está indisponível',
      'invalid-config': 'Configuração de destino inválida',
      'invalid-input': 'Entrada do fluxo de trabalho inválida',
      'artifact-unavailable':
        'O artefato do fluxo de trabalho está indisponível',
      'dispatch-failed': 'Não foi possível despachar a execução',
      'execution-timeout': 'O tempo de execução esgotou',
      'execution-cancelled': 'A execução foi cancelada',
      'execution-failed': 'A execução falhou',
      'reference-type-mismatch':
        'O tipo de referência da execução não corresponde',
      'run-not-found': 'O registro de execução não foi encontrado',
      'observer-failed': 'Não foi possível observar o resultado da execução',
      'observer-unavailable':
        'O observador de resultados de execução está indisponível',
    },
    inProgress: 'Em andamento',
    viewTarget: 'Visualizar',
    invalidSchedule: 'Agendamento inválido',
    unavailable: '—',
  },
  errors: {
    forbidden: 'O acesso foi removido. Entre em contato com um administrador.',
    notFound: 'Estes registros estão indisponíveis. Volte à área de trabalho.',
    toggleFailed: 'Não foi possível alterar o agendamento. Tente novamente.',
    loadSchedules: 'Não foi possível carregar tarefas agendadas.',
    loadOccurrences: 'Não foi possível carregar acionamentos.',
  },
};

/** English is the source of truth for this plugin's locale shape. */
export type SchedulerResource = LocaleResource<typeof enUS>;

export default enUS;
