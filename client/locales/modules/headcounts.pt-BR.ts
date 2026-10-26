export default {
  headcounts: {
    technicalDetails: 'Detalhes técnicos',
    copyId: 'Copiar ID interno',
    copyFailed: 'Não foi possível copiar o ID interno.',

    name: '{{department}} / {{position}} / {{year}}',
    createSubmit: 'Criar',
    idCopied: 'ID da conta copiado',
    title: 'Quadro de pessoal',
    description:
      'Capacidade anual e ocupação real de colaboradores. Inicialize uma conta antes do recrutamento.',
    account: 'Quadro anual de pessoal',
    state: 'Status de inicialização',
    create: 'Novo quadro anual de pessoal',
    adjust: 'Ajustar limite',
    alreadyInitialized:
      'Esta conta já foi inicializada. Sua ocupação real não pode ser recontada aqui.',
    reconcile: 'Verificar e inicializar',
    confirmInitialize: 'Confirmar inicialização',
    initialized: 'Inicializado',
    uninitialized: 'Não inicializado',
    view: 'Visualizar quadro de pessoal',
    refresh: 'Atualizar',
    cancel: 'Cancelar',
    save: 'Salvar',
    clearFilters: 'Limpar filtros',
    allPositions: 'Todos os cargos',
    rowActions: 'Ações de “{{name}}”',
    empty: 'Nenhum quadro anual de pessoal',
    noResults: 'Nenhum quadro anual de pessoal correspondente',
    filterHelp: 'Altere os filtros.',
    emptyManage: 'Crie uma conta e verifique sua lista de pessoal.',
    emptyRead: 'Peça ao RH que informe o quadro anual de pessoal.',
    journal: 'Diário de origem',
    noJournal: 'Nenhum evento de origem ainda',
    noJournalPermission: 'Você não tem permissão para ler o diário de origem.',
    uninitializedHelp:
      'Esta conta não foi inicializada e não pode ser usada para recrutamento. Verifique a lista completa de pessoal.',
    rosterHelp:
      'Verifique a lista completa de pessoal, incluindo colaboradores em experiência, efetivos e em desligamento.',
    rosterEmpty:
      'Nenhum colaborador correspondente ocupa esta conta atualmente. Confirme que a lista real está vazia.',
    rosterCount: '{{count}} colaboradores',
    confirmRoster: 'Verifiquei a lista completa de colaboradores',
    created: '"{{name}}" criado. Verifique e inicialize a seguir.',
    adjusted: 'Limite de "{{name}}" atualizado.',
    reconciled: '"{{name}}" inicializado para recrutamento.',
    invalidYear: 'Informe um ano inteiro de 1900 a 9999.',
    invalidLimit: 'Informe um número inteiro de 0 a 1.000.000.',
    reasonRequired: 'Informe um motivo de 1 a 5.000 caracteres.',
    selectRequired:
      'Selecione um departamento e um cargo atualmente autorizados.',
    rosterConfirmationRequired:
      'Confirme que verificou a lista completa de pessoal.',
    noAccess: 'Você não tem permissão para ler este quadro de pessoal.',
    missing: 'Esta conta do quadro de pessoal não existe ou está inacessível.',
    failed: 'Não foi possível concluir a requisição. Tente novamente.',
    loadLatest: 'Carregar dados mais recentes',
    unknownOutcome:
      'O resultado não foi confirmado. Mantenha este comando e tente novamente.',
    retryCommand: 'Repetir esta operação',
    reduceTitle: 'Reduzir o limite do quadro de pessoal de “{{account}}”?',
    reduceDescription:
      'O limite mudará de {{previous}} para {{next}}. A ocupação e as reservas existentes devem permanecer cobertas.',
    reduceConfirm: 'Confirmar redução',
    minimumLimit:
      'A ocupação e as reservas atuais totalizam {{count}}. O novo limite não pode ser menor.',
    discard: 'Descartar alterações não salvas?',
    discardDescription: 'Fechar descartará estas alterações não salvas.',
    discardConfirm: 'Descartar alterações',
    noTargets:
      'Nenhum departamento ou cargo de destino autorizado. Peça a um administrador que verifique as permissões de gerenciamento do quadro de pessoal.',
    recruitmentSource: 'Visualizar solicitação de recrutamento',
    transferSource: 'Visualizar solicitação de transferência',
    fields: {
      department: 'Departamento',
      position: 'Cargo',
      year: 'Ano do quadro de pessoal',
      limit: 'Limite autorizado',
      used: 'Ocupação por colaboradores',
      pending: 'Reservas pendentes',
      allocated: 'Aprovado, não admitido',
      available: 'Capacidade disponível',
      id: 'ID interno',
      version: 'Versão',
      updatedAt: 'Atualizado em',
      reason: 'Motivo',
      replacementPending: 'Reposições futuras pendentes',
      replacementAllocated: 'Reposições futuras aprovadas',
      replacementBlocked: 'Vagas de reposição bloqueadas',
    },
    journalActions: {
      create: 'Criar conta',
      reconcile: 'Verificar e inicializar',
      adjustLimit: 'Ajustar limite',
      hold: 'Reservar capacidade',
      reviseHold: 'Revisar reserva',
      allocate: 'Alocar capacidade aprovada',
      close: 'Encerrar origem',
      consume: 'Consumir para admissão',
      releaseEmployee: 'Liberar ocupação do colaborador',
      invalidateReplacement: 'Invalidar reposição',
      rebindOut: 'Desvincular da origem',
      rebindIn: 'Vincular ao destino',
      transferOut: 'Transferir para fora',
      transferIn: 'Transferir para dentro',
      claimReplacement: 'Assumir reposição',
      cancelReplacement: 'Cancelar reposição',
      fulfillReplacement: 'Concluir reposição',
      other: 'Alteração do quadro de pessoal',
    },
    journalColumns: {
      time: 'Horário',
      actor: 'Executor',
      action: 'Ação',
      source: 'Origem de negócio',
    },
    employeeStatus: {
      probation: 'Experiência',
      regular: 'Efetivo',
      leaving: 'Em desligamento',
    },
    authz: {
      title: 'Capacidade do quadro de pessoal',
      view: 'Visualizar capacidade',
      manage: 'Gerenciar capacidade anual',
      viewJournal: 'Visualizar diário de origem',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        'A lista completa de colaboradores não é legível. Peça a um administrador que verifique as permissões de leitura de colaboradores.',
      HEADCOUNT_ACCESS_DENIED:
        'Você não tem permissão para executar esta operação do quadro de pessoal.',
      HEADCOUNT_FIELD_ACCESS_DENIED:
        'Os campos do resumo de capacidade estão fora da sua permissão.',
      HEADCOUNT_NOT_FOUND: 'A conta do quadro de pessoal está indisponível.',
      HEADCOUNT_ALREADY_EXISTS:
        'Este departamento, cargo e ano já possuem uma conta.',
      HEADCOUNT_NOT_INITIALIZED:
        'Concilie a lista completa de colaboradores antes de reservar capacidade.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        'Selecione toda a lista real de colaboradores em experiência, efetivos e em desligamento.',
      HEADCOUNT_ROSTER_DRIFT:
        'A lista real de colaboradores mudou. Concilie os dados de origem antes de prosseguir.',
      HEADCOUNT_VERSION_CONFLICT: 'A conta mudou. Atualize antes de salvar.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT:
        'Este identificador de requisição já pertence a outra operação.',
      HEADCOUNT_INSUFFICIENT:
        'O limite anual não cobre o quadro de pessoal realmente ocupado e reservado.',
      HEADCOUNT_INVALID_NUMBER:
        'Informe uma quantidade inteira de pessoas dentro do limite.',
      HEADCOUNT_INVALID_ACCOUNT:
        'Selecione um departamento, um cargo e um ano reais.',
      HEADCOUNT_INVALID_IDENTITY:
        'Selecione um departamento e um cargo ativos na organização.',
      HEADCOUNT_INVALID_COMMAND:
        'São necessários um executor, um identificador de requisição e um motivo.',
      HEADCOUNT_INVALID_SOURCE:
        'São necessários um tipo e um identificador de origem reais.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        'Cada vaga de reposição precisa de um colaborador em desligamento distinto.',
      HEADCOUNT_INVALID_REPLACEMENT:
        'A origem da reposição deve corresponder a uma ocupação real em desligamento ou desligada.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'Esta ocupação de reposição não existe ou já foi assumida.',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        'O colaborador de origem restaurado bloqueia esta reposição.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND:
        'O cadastro do colaborador está indisponível.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        'O colaborador real não corresponde ao departamento e cargo alocados.',
      HEADCOUNT_ALREADY_OCCUPIED: 'Este colaborador já ocupa esta conta anual.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        'Vincule explicitamente ao ano atual da empresa antes do consumo.',
      HEADCOUNT_SOURCE_NOT_FOUND: 'A origem da capacidade está indisponível.',
      HEADCOUNT_SOURCE_EXISTS: 'Esta origem já possui uma reserva.',
      HEADCOUNT_SOURCE_STATE: 'O estado da origem não permite esta operação.',
      HEADCOUNT_SOURCE_CLOSED: 'A origem da capacidade já está encerrada.',
      HEADCOUNT_SEAT_STATE: 'A vaga reservada não está pendente.',
      HEADCOUNT_STATE_CONFLICT: 'A vaga reservada mudou.',
      HEADCOUNT_NO_ALLOCATION: 'Nenhuma vaga aprovada disponível restante.',
      HEADCOUNT_NOT_LEFT:
        'É necessário o desligamento real antes de liberar a capacidade ocupada.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        'É necessária uma ocupação real de colaborador ainda não liberada.',
      HEADCOUNT_NOT_RESTORED:
        'É necessária a restauração real antes de bloquear reposições futuras.',
      HEADCOUNT_INVALID_REBIND:
        'O vínculo anual deve preservar departamento e cargo e avançar no tempo.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        'Créditos de reposição exigem origens explícitas no ano de destino.',
      HEADCOUNT_INVALID_TRANSFER:
        'É necessária uma reserva de destino aprovada distinta.',
      HEADCOUNT_INVALID_PAGE: 'Selecione um tamanho de página entre 1 e 100.',
      HEADCOUNT_GUARD_UNAVAILABLE:
        'A proteção transacional da capacidade está indisponível.',
    },
  },
};
