export default {
  exported: 'Download do Excel iniciado.',
  title: 'Tempo decorrido das tarefas de decisão de licença',
  description:
    'Tarefas de decisão de licença concluídas: da criação ao encerramento em milissegundos corridos, incluindo espera e reenvios históricos; agrupadas pelo mês inicial da solicitação original, não por tempo útil, SLA, taxa de devolução ou duração total do processo.',
  year: 'Ano inicial',
  month: 'Mês inicial (opcional)',
  clear: 'Limpar filtros',
  export: 'Exportar Excel',
  exporting: 'Exportando…',
  refresh: 'Atualizar',
  selectYear:
    'Escolha o ano inicial da solicitação original para carregar este relatório.',
  invalid: 'Informe um ano de 1900 a 9998 e um mês opcional de 1 a 12.',
  forbidden:
    'As permissões atuais de registros ou campos de licença não permitem este relatório. Entre em contato com um administrador.',
  precondition:
    'O limite de origem ou a verificação de marcas de tempo das tarefas falhou. Restrinja o intervalo de ano/mês ou peça a um administrador que verifique as marcas de tempo de origem.',
  failed: 'Não foi possível carregar o relatório. Tente novamente.',
  retry: 'Tentar novamente',
  exportFailed: 'A exportação Excel falhou. Tente novamente.',
  empty: 'Nenhuma tarefa de decisão concluída',
  noResults: 'Nenhuma tarefa corresponde a este mês',
  emptyHint:
    'Somente tarefas de decisão concluídas de solicitações de licença atualmente legíveis são contadas. Escolha outro ano ou mês inicial.',
  total: '{{count}} grupos de etapas',
  generatedAt: 'Gerado em {{value}}',
  previous: 'Anterior',
  next: 'Próximo',
  fields: {
    stage: 'Etapa',
    completedTaskCount: 'Tarefas de decisão concluídas',
    totalElapsedMs: 'Total de ms corridos',
    averageElapsedMs: 'Média de ms corridos',
  },
  stages: { manager: 'Gestor', head: 'Chefe de departamento', hr: 'RH' },
};
