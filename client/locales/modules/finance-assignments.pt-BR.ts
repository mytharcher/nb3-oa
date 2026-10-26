export default {
  financeAssignments: {
    create: 'Criar',

    saved: 'Atribuição de contador de "{{name}}" salva',
    saveFailed:
      'Não foi possível salvar a atribuição. Tente novamente após verificar os dados.',
    disableTitle: 'Desabilitar a atribuição de "{{name}}"?',

    loadLatest: 'Carregar atribuição mais recente',
    latestSummary:
      'Mais recente: {{name}} / {{status}}. Os valores do formulário permanecem inalterados.',
    adoptVersion: 'Usar esta versão com minhas alterações',
    uncertain:
      'O resultado da criação é incerto. Verifique este departamento antes de tentar novamente.',
    checkExisting: 'Verificar atribuição do departamento',
    viewExisting: 'Abrir atribuição existente',
    required: 'Este campo é obrigatório.',
    title: 'Contadores de departamentos',
    description:
      'Atribua o revisor financeiro de cada departamento. Atribuições ausentes ou inativas usam o ancestral ativo mais próximo e depois o gerente financeiro.',
    new: 'Atribuir contador',
    edit: 'Editar atribuição',
    view: 'Detalhes da atribuição',
    department: 'Departamento',
    accountant: 'Contador',
    status: 'Status',
    active: 'Ativa',
    inactive: 'Desativada',
    updatedAt: 'Atualizado',
    refresh: 'Atualizar',
    clear: 'Limpar filtros',
    rowActions: 'Ações de {{name}}',
    save: 'Salvar',
    cancel: 'Cancelar',
    loading: 'Carregando atribuições',
    retry: 'Tentar novamente',
    accountantPlaceholder: 'Pesquisar contadores elegíveis',
    noAccountants:
      'Nenhum membro ativo do papel de responsabilidade financeira',
    reason: 'Motivo',
    formDescription:
      'Somente membros ativos do papel de responsabilidade financeira podem ser atribuídos. As alterações são auditadas.',
    departmentPermission:
      'É necessária permissão de leitura de departamentos para escolher um departamento. Peça a um administrador que a conceda.',
    conflictAdvice:
      'Mantenha suas alterações como referência. Feche e reabra este formulário para revisar a atribuição mais recente antes de tentar novamente.',
    disable: 'Desabilitar atribuição',
    disableDescription:
      'Aprovações futuras usarão a atribuição ativa do ancestral mais próximo e depois o gerente financeiro. Tarefas de aprovação existentes continuam atribuídas aos revisores registrados.',
    authz: {
      title: 'Contadores de departamentos',
      read: 'Ler atribuições',
      update: 'Gerenciar atribuições',
      permissionSet: 'Configuração de contadores pelo gerente financeiro',
    },
    empty: {
      accountsTitle: 'Nenhum contador atribuído',
      accountsDescription:
        'Atribua um contador a um departamento para direcionar revisões financeiras.',
      readonlyTitle: 'Nenhuma atribuição',
      readonlyDescription:
        'Um gerente financeiro pode configurar contadores de departamentos.',
      filteredTitle: 'Nenhuma atribuição correspondente',
      filteredDescription:
        'Limpe o filtro de departamento para ver todas as atribuições.',
    },
    error: {
      forbidden: 'Você não tem permissão para acessar estas atribuições.',
      missing: 'Esta atribuição não existe mais.',
      invalid: 'Revise os valores do formulário.',
      failed: 'Não foi possível carregar atribuições. Tente novamente.',
      FINANCE_ASSIGNMENT_NOT_FOUND: 'Esta atribuição não existe mais.',
      FINANCE_ASSIGNMENT_VERSION_CONFLICT:
        'Esta atribuição mudou. Reabra o formulário para revisar a versão mais recente.',
      FINANCE_ASSIGNMENT_ALREADY_EXISTS:
        'Este departamento já possui uma atribuição. Edite-a.',
      FINANCE_ASSIGNMENT_INVALID_DEPARTMENT: 'Escolha um departamento ativo.',
      FINANCE_ASSIGNMENT_INVALID_ACCOUNTANT:
        'Escolha um membro ativo do papel de responsabilidade financeira.',
      FINANCE_ASSIGNMENT_INVALID_COMMAND:
        'São necessários um executor e um motivo.',
    },
  },
};
