export default {
  wecomAttendance: {
    title: 'Origem de ponto do WeCom',
    description:
      'Importe registros de ponto dos colaboradores mapeados e revise as últimas 30 execuções de sincronização.',
    sync: 'Sincronizar',
    refresh: 'Atualizar',
    runs: 'Execuções de sincronização',
    retry: 'Tentar novamente',
    counts: 'Registros confirmados: {{records}} · Lotes: {{batches}}',
    runFailed:
      'Não foi possível importar alguns registros. Verifique os mapeamentos de colaboradores, as atribuições de turnos e o acesso à origem antes de tentar novamente. Lotes concluídos são mantidos.',
    denied: 'Você não tem acesso à sincronização de ponto.',
    disabled:
      'A origem está desabilitada. Peça a um administrador que configure a aplicação dedicada de ponto.',
    unconfigured:
      'A origem precisa de credenciais e mapeamentos explícitos de colaboradores antes da sincronização.',
    ready_one: 'Pronto para sincronizar {{count}} colaborador mapeado.',
    ready_other: 'Pronto para sincronizar {{count}} colaboradores mapeados.',
    startedAt: 'Iniciado em {{time}}',
    empty: 'Nenhuma execução de sincronização ainda.',
    rangeHint:
      'Selecione até sete dias encerrados do calendário local da empresa. Registros de origem repetidos não são duplicados.',
    start: 'Data de início',
    end: 'Data de término',
    reason: 'Motivo',
    cancel: 'Cancelar',
    syncing: 'Sincronizando…',
    states: {
      running: 'Em andamento',
      completed: 'Concluído',
      failed: 'Precisa de atenção',
    },
  },
};
