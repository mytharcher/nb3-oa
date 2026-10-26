export default {
  hrMasterData: {
    mappingSearch:
      'Encontre um registro mapeado pelo ID externo exato (os últimos 100 são exibidos sem filtro)',
    title: 'Sincronização de RH',
    description:
      'Receba dados mestres de organização e colaboradores de um gateway de integração aprovado. Vínculos de conta existentes são obrigatórios; a sincronização não habilita o acesso.',
    read: 'Visualizar sincronização',
    sync: 'Sincronizar e repetir',
    manage: 'Gerenciar origens e propriedade',
    addSource: 'Adicionar origem',
    editSource: 'Editar origem',
    sourceCode: 'Código da origem (letras minúsculas, números e hífens)',
    sourceName: 'Nome da origem',
    principal: 'Conta de integração autorizada',
    enabled: 'Habilitado',
    disabled: 'Desativada',
    noSources: 'Nenhuma origem de RH configurada para sua conta.',
    recent: 'Sincronização recente',
    latest: 'Exibindo os últimos 50 lotes desta origem.',
    items_one: '{{count}} registro',
    items_other: '{{count}} registros',
    actions: 'Ações',
    replay: 'Repetir lote original',
    refresh: 'Atualizar',
    noRuns: 'Nenhum lote recebido ainda.',
    mappings: 'Registros mapeados',
    revision: 'Revisão {{revision}}',
    reclaim: 'Restaurar propriedade externa',
    reclaimHelp:
      'Edições locais são protegidas. Restaurar a propriedade permite que a origem externa substitua estes campos na próxima atualização válida. Revise o registro local e explique sua decisão primeiro.',
    confirmReclaim: 'Confirmar propriedade externa',
    reason: 'Motivo',
    cancel: 'Cancelar',
    save: 'Salvar',
    failed:
      'A operação falhou. Verifique suas permissões e configurações de origem e tente novamente.',
    localConflict:
      'Este registro foi alterado localmente. O RH deve revisar e restaurar explicitamente a propriedade externa antes de tentar novamente.',
    businessConflict:
      'Não foi possível aplicar um registro. Corrija os dados de origem ou resolva a restrição de negócio e repita o lote original.',
    states: { pending: 'Pendente', completed: 'Concluído', failed: 'Falhou' },
    entities: {
      department: 'Departamento',
      grade: 'Nível',
      employee: 'Colaborador',
    },
  },
};
