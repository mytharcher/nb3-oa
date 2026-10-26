export default {
  leaveBalances: {
    navigationDiscardDescription:
      'Descarte estas alterações e volte à lista de saldos. A navegação original não continuará.',
    navigationDiscard: 'Descartar e voltar aos saldos',
    clearFilters: 'Limpar filtros',
    clearSearch: 'Limpar pesquisa',
    title: 'Saldos de licença',
    adminTitle: 'Administração de saldos de licença',
    description:
      'Visualize licenças disponíveis, dias retidos e histórico de saldos.',
    adminDescription:
      'Revise saldos de licença dos colaboradores e registre ajustes justificados.',
    employee: 'Colaborador',
    employeePlaceholder: 'Pesquisar colaboradores por nome ou código',
    type: 'Tipo de licença',
    selectType: 'Selecionar um tipo de licença',
    availableUnits: 'Dias disponíveis',
    heldUnits: 'Dias retidos',
    availableDelta: 'Alteração disponível (dias)',
    heldDelta: 'Alteração retida (dias)',
    at: 'Horário',
    kind: 'Tipo',
    reference: 'Origem',
    actor: 'Executor',
    reason: 'Motivo',
    days: 'Dias do ajuste',
    actions: 'Ações de "{{name}}"',
    adjust: 'Ajustar',
    adjustBalance: 'Ajustar saldo',
    refresh: 'Atualizar',
    retry: 'Tentar novamente',
    loading: 'Carregando',
    noResults: 'Nenhum colaborador correspondente. Altere sua pesquisa.',
    searchCap:
      'Somente os primeiros 20 colaboradores são exibidos. Restrinja sua pesquisa.',
    noTypes:
      'Nenhum tipo de licença com saldo disponível. Peça a um administrador que os configure.',
    unopened:
      '"{{type}}" ainda não possui conta: {{available}} dias disponíveis e {{held}} dias retidos. Adicione um saldo para abri-la.',
    ledgerTitle: '{{type}} · Histórico de saldo',
    adjustTitle: 'Ajustar saldo de licença',
    adjustDescription: 'Ajuste o saldo de {{type}} de "{{name}}".',
    currentBalance:
      'Atualmente {{available}} dias disponíveis e {{held}} dias retidos.',
    afterBalance:
      'Disponível após ajuste: {{amount}} dias, sujeito à validação do servidor.',
    noExpiry:
      'Saldos adicionados não expiram. Reduções preservam as regras de vencimento existentes.',
    daysInvalid:
      'Informe um número de dias diferente de zero em incrementos de meio dia.',
    reasonRequired: 'Informe um motivo para o ajuste.',
    reasonLong: 'Mantenha o motivo em até 2.000 caracteres.',
    adjusted: 'Saldo de "{{name}}" ajustado.',
    cancel: 'Cancelar',
    uncertain:
      'O resultado é incerto. Repita o mesmo ajuste; seus valores estão bloqueados para evitar registros duplicados.',
    retryAdjustment: 'Repetir ajuste',
    discardTitle: 'Descartar ajuste de saldo',
    discardDescription: 'Seu ajuste não salvo será perdido.',
    keepEditing: 'Continuar editando',
    discard: 'Descartar',
    kinds: {
      grant: 'Conceder',
      hold: 'Reter',
      deduct: 'Deduzir',
      release: 'Liberar',
      expire: 'Expirar',
      refund: 'Restituir',
    },
    error: {
      insufficient: 'O saldo disponível é insuficiente. Reduza a dedução.',
      forbidden:
        'Você não tem permissão para visualizar ou ajustar estes dados. Consulte um administrador; pesquisas de colaboradores também exigem acesso ao cadastro.',
      notFound:
        'O cadastro do colaborador não existe ou não está vinculado. Consulte o RH ou selecione outro colaborador.',
      invalid:
        'O ajuste é inválido. Verifique os dias, o tipo de licença e o motivo.',
      failed: 'Não foi possível concluir a requisição. Tente novamente.',
    },
    empty: {
      readonlyAccountsTitle: 'Nenhum saldo de licença ainda',
      readonlyAccountsDescription:
        'Peça a um administrador de RH autorizado que conceda saldos de licença.',
      employeeTitle: 'Selecionar um colaborador',
      employeeDescription:
        'Pesquise por nome ou código para visualizar saldos de licença.',
      accountsTitle: 'Nenhum saldo de licença ainda',
      accountsDescription:
        'Selecione um tipo de licença e adicione um saldo por meio de ajuste.',
      mineTitle: 'Nenhum saldo de licença ainda',
      mineDescription:
        'O RH concede seus saldos de licença. Entre em contato com RH se precisar verificá-los.',
      ledgerTitle: 'Nenhum histórico de saldo ainda',
      ledgerDescription: 'Concessões, retenções e deduções aparecerão aqui.',
    },
    authz: {
      section: 'Gerenciamento de licenças',
      title: 'Saldos de licença',
      read: 'Ler saldos de licença dos colaboradores',
      update: 'Ajustar saldos de licença dos colaboradores',
      permissionSet: 'Administração de saldos de licença de RH',
    },
  },
};
