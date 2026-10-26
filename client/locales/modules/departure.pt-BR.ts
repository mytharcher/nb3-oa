export default {
  businessErrors: {
    DEPARTURE_CHECKLIST_REQUIRED:
      'Conclua a lista de desligamento antes de prosseguir.',
    DEPARTURE_LAST_WORKING_DAY_REQUIRED:
      'Confirme o último dia de trabalho do colaborador.',
    DEPARTURE_DATE_PAST:
      'O último dia de trabalho não pode ser anterior a hoje no fuso horário da empresa.',
    DEPARTURE_HANDOVER_INVALID:
      'Selecione um destinatário de transferência elegível diferente do colaborador em desligamento.',
    DEPARTURE_HANDOVER_INCOMPLETE:
      'Conclua os itens de transferência antes de prosseguir.',
    DEPARTURE_ORDINARY_WORK_INCOMPLETE:
      'Conclua a transferência normal do trabalho antes de liquidar o desligamento.',
    DEPARTURE_LOAN_UNCLEARED:
      'Quite os empréstimos pendentes do colaborador antes de liquidar o desligamento.',
    DEPARTURE_RECEIPT_REQUIRED:
      'Informe o comprovante de recebimento ou quitação deste item de transferência.',
    DEPARTURE_SETTLEMENT_NOTE_REQUIRED:
      'Informe a observação de liquidação do desligamento.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      'Conclua a reatribuição de tarefas pendentes antes de prosseguir.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      'Escolha o último dia de trabalho previsto e o destinatário da transferência.',
    DEPARTURE_TYPE_INVALID: 'Selecione um tipo de desligamento habilitado.',
    DEPARTURE_ALREADY_ACTIVE:
      'Este colaborador já tem uma solicitação de desligamento ativa. Abra a solicitação existente.',
    DEPARTURE_CANCELLATION_PENDING:
      'O cancelamento do desligamento está pendente. Resolva-o antes de prosseguir.',
    DEPARTURE_EXECUTION_BASELINE_CHANGED:
      'Os dados do colaborador ou do desligamento mudaram. Atualize e verifique-os antes da execução.',
  },

  authz: {
    cancel: 'Cancelar desligamento',
    resource: 'Desligamento e transferência',
    view: 'Visualizar solicitações de desligamento',
    submit: 'Enviar solicitações de desligamento',
    delegate: 'Criar solicitações de desligamento para colaboradores',
    work: 'Processar transferência de desligamento',
    settle: 'Confirmar liquidação do desligamento',
  },
  schedule: {
    title: 'Execução de desligamento',
    description:
      'Execute desligamentos vencidos e repita alterações incompletas de conta e associações.',
  },

  title: 'Desligamento e transferência',
  description:
    'Revise desligamentos, transferências e execução na data efetiva.',
  new: 'Nova solicitação de desligamento',
  edit: 'Editar',
  number: 'Número da solicitação',
  refresh: 'Atualizar',
  search: 'Pesquisar por número da solicitação, colaborador ou motivo',
  view: 'Visualizar',
  allTypes: 'Todos os tipos de desligamento',
  allStatuses: 'Todos os status',
  clearFilters: 'Limpar filtros',
  emptyTitle: 'Nenhuma solicitação de desligamento',
  emptyDescription:
    'Solicitações de desligamento e progresso de transferência aparecerão aqui.',
  noResults: 'Nenhuma solicitação de desligamento correspondente',
  departureType: 'Tipo de desligamento',
  reason: 'Motivo',
  expectedLastWorkingDay: 'Último dia de trabalho previsto',
  lastWorkingDay: 'Último dia de trabalho confirmado',
  handoverUser: 'Destinatário da transferência',
  createdBy: 'Criado por',
  application: 'Solicitação',
  settlement: 'Liquidação de RH',
  settlementDate: 'Data de liquidação',
  settlementNote: 'Observação de liquidação',
  execution: 'Execução de desligamento',
  notSettled: 'A liquidação não foi concluída.',
  notExecuted:
    'A execução do desligamento está incompleta. A conta não foi desabilitada.',
  executionComplete:
    'A conta e as associações organizacionais foram desabilitadas.',
  cancellationReason: 'Motivo do cancelamento',
  cancellationGuidance:
    'Após a entrevista de RH, o RH pode solicitar o cancelamento antes do desligamento real. Outro revisor de RH deve confirmar antes de restaurar o vínculo.',
  handover: 'Trabalho de transferência',
  claimant: 'Assumido por',
  receiver: 'Destinatário',
  manager: 'Gestor responsável',
  forcedBy: 'Dispensado por',
  forceReason: 'Motivo da dispensa',
  checklistConfirmed: 'Lista confirmada',
  receiverAcknowledged: 'Recebimento confirmado',
  yes: 'Sim',
  no: 'Não',
  notReady: 'Os requisitos de envio estão incompletos.',
  views: {
    mine: 'Minhas',
    pending: 'Pendente',
    done: 'Concluído',
    copied: 'Copiado',
  },
  statuses: {
    cancellationReview: 'Confirmação de cancelamento',
    cancelled: 'Cancelado',
    draft: 'Rascunho',
    revision: 'Devolvido para revisão',
    manager: 'Revisão do gestor',
    head: 'Revisão do chefe de departamento',
    hr: 'Entrevista de RH',
    gm: 'Revisão da direção geral',
    handover: 'Transferência',
    completed: 'Liquidação concluída',
    withdrawn: 'Retirado',
    rejected: 'Rejeitado',
    terminated: 'Encerrado',
  },
  workKinds: {
    work: 'Transferência de trabalho',
    it: 'TI e contas',
    admin: 'Patrimônio e infraestrutura',
    finance: 'Empréstimos e reembolsos',
  },
  workStates: {
    cancelled: 'Cancelado',
    open: 'Disponível para assumir',
    claimed: 'Em andamento',
    completed: 'Concluído',
  },
  executionStates: {
    cancelled: 'Cancelado',
    ready: 'Aguardando data efetiva',
    transferring: 'Transferindo aprovações pendentes',
    blocked: 'Execução bloqueada',
    executed: 'Conta desabilitada',
  },
  errors: {
    missingUnnamed:
      'Esta solicitação de desligamento não existe mais. Retorno à lista de origem.',
    missingReturned:
      '"{{name}}" não está mais disponível. Retorno à lista de origem.',
    forbidden: 'Você não tem mais acesso a este registro.',
    notFound: 'Este registro não existe. Volte à lista.',
    conflict:
      'Este registro mudou. Carregue o registro mais recente antes de confirmar novamente.',
    invalid:
      'Os requisitos da operação não foram atendidos. Revise o registro atual.',
    failed: 'A requisição falhou. Tente carregar novamente.',
  },
  form: {
    create: 'Nova solicitação de desligamento',
    confirmSubmission: 'Confirmar envio do desligamento',
    submissionHelp:
      'Confirme o último dia de trabalho previsto e o destinatário da transferência antes de enviar para aprovação.',
    edit: 'Editar solicitação de desligamento',
    save: 'Salvar rascunho',
    saved: '"{{name}}" salvo',
    mode: 'Criar para',
    self: 'Meu pedido de demissão',
    manual: 'Solicitação delegada de RH',
    employee: 'Colaborador',
    employeeSearch: 'Pesquisar colaboradores',
    chooseEmployee: 'Escolher um colaborador ativo',
    employeesDenied:
      'É necessário acesso ao cadastro de colaboradores para selecionar um destinatário.',
    previous: 'Candidatos anteriores',
    next: 'Próximos candidatos',
    chooseType: 'Escolher um tipo de desligamento',
    chooseHandover: 'Escolher um destinatário da transferência',
    searchHandover: 'Pesquisar destinatários elegíveis',
    handoverSearchMinimum:
      'Informe pelo menos dois caracteres para pesquisar por nome ou código do colaborador.',
    noHandoverCandidates:
      'Nenhum destinatário elegível encontrado. Tente outro nome ou código de colaborador ou peça ao RH que verifique o status do colaborador e da conta.',
    requiredOnSubmit: 'Obrigatório para envio; opcional ao salvar um rascunho.',
    handoverHelp:
      'Obrigatório para envio; opcional para rascunho. Escolha outro colaborador em experiência ou efetivo com conta habilitada. Pesquise por nome ou código de colaborador.',
    refineHandoverSearch:
      'Muitos destinatários correspondentes. Informe um nome mais específico para restringir a pesquisa.',
    required: 'Preencha este campo.',
    dateInvalid: 'Escolha uma data válida do calendário.',
    invalid: 'Revise este campo e tente novamente.',
    dateHelp:
      'A data confirmada durante a entrevista de RH é o último dia de trabalho definitivo.',
    manualHelp:
      'O RH pode criar solicitações de demissão ou vencimento de contrato para colaboradores.',
    unavailable:
      'Você não pode criar esta solicitação. Verifique seu status de colaborador e suas permissões.',
    unknown:
      'O resultado do salvamento não foi confirmado. Verifique os rascunhos existentes antes de criar outra solicitação.',
    checkDrafts: 'Verificar rascunhos existentes',
    noProof:
      'Nenhum rascunho correspondente encontrado. Isto não prova que o salvamento falhou. Mantenha esta solicitação bloqueada e entre em contato com RH.',
    openDraft: 'Abrir este rascunho para verificação',
    confirmDraft: 'Esta é a solicitação salva',
    storageUnavailable:
      'O armazenamento do navegador está indisponível. O salvamento está desabilitado para evitar duplicatas após uma interrupção.',
    unknownPersisted:
      'Uma requisição anterior de criação ainda não foi confirmada. Este bloqueio persiste após atualizar.',
  },
  actionForm: {
    approveConsequence:
      'A aprovação oferecida foi registrada. A aprovação final aplica o resultado aprovado do vínculo empregatício.',

    uncertain:
      'O resultado não foi confirmado. Mantenha estes dados e repita a operação idêntica; não emita uma solicitação alterada.',
    replay: 'Repetir operação idêntica',
    unsupported:
      'Esta ação exige um contrato de entrada que esta página não suporta.',
    person: 'Destinatário',
    mode: 'Posição do signatário',
    place: 'Posição de aprovação',
    releaseConsequence:
      'Isto libera tarefas pendentes de aprovação e não pode ser desfeito aqui.',
    returnConsequence:
      'A solicitação retorna para correção e o trabalho pendente atual é encerrado.',
    submitConsequence:
      'A solicitação entra em aprovação com os dados enviados congelados.',
    genericConsequence:
      'O servidor aplica a operação oferecida ao destino de aprovação selecionado.',
    latest: 'Ler versão mais recente',
    conflict:
      'A solicitação de desligamento mudou. Seus dados foram mantidos. Leia a versão mais recente, revise-a e confirme novamente.',
    completed: '{{action}} concluída para "{{name}}"',
    committed:
      'A operação foi concluída. Atualize a solicitação de desligamento antes de executar outra ação.',
    before: 'Antes',
    after: 'Depois',
    alongside: 'Em paralelo',
    revision: 'Correção do solicitante',
    required: 'Preencha este campo.',
    limit: 'Este valor é muito longo.',
    title: '{{action}} o desligamento de "{{name}}"',
    comment: 'Comentário / motivo',
    confirm: 'Confirmar',
    saved: '"{{name}}" atualizado',
    unavailable:
      'Esta ação não está mais disponível. Carregue o registro mais recente.',
    unknown:
      'O resultado não foi confirmado. Carregue o registro mais recente antes de continuar.',
    to: 'Destinatário',
    returnTarget: 'Devolver para',
    confirmTitle: '{{action}} "{{name}}"?',
    confirmDescription:
      'Isto atualiza a decisão de desligamento. Confirme o colaborador e o registro atual.',
    lastWorkingDay: 'Último dia de trabalho confirmado',
    settlementDate: 'Data de liquidação',
    settlementNote: 'Observação de liquidação',
    labels: {
      requestCancellation: 'Solicitar cancelamento de desligamento',
      submit: 'Enviar',
      withdraw: 'Retirar',
      terminate: 'Encerrar',
      settle: 'Confirmar liquidação',
      approve: 'Aprovar',
      reject: 'Rejeitar',
      return: 'Devolver',
      returnTo: 'Devolver',
      comment: 'Comentário',
      read: 'Marcar como lido',
      urge: 'Cobrar',
      transfer: 'Transferir',
      addSigner: 'Adicionar signatário',
      cc: 'Copiar',
      claim: 'Assumir',
      release: 'Liberar',
      appoint: 'Designar',
      reassign: 'Reatribuir',
    },
  },
  work: {
    labels: {
      requestCancellation: 'Solicitar cancelamento de desligamento',
      claim: 'Assumir',
      confirmChecklist: 'Confirmar lista',
      acknowledgeReceipt: 'Confirmar recebimento',
      complete: 'Concluir',
      forceComplete: 'Forçar conclusão',
    },
    title: '{{action}} {{kind}} de "{{name}}"',
    reason: 'Motivo da dispensa',
    confirmChecklist: 'Concluí a lista de verificação.',
    acknowledgeReceipt: 'Recebi a transferência.',
    blocked:
      'A liberação está incompleta. Resolva os itens pendentes listados.',
    forceWarning:
      'A conclusão forçada da transferência não altera os dados dos registros patrimoniais ou financeiros.',
    forceConfirm: 'Dispensar {{kind}} de "{{name}}"?',
    forceDescription:
      'Os comprovantes normais de liberação serão ignorados. O motivo e o executor real serão auditados.',
  },
  blockers: {
    generic:
      'Um requisito não foi atendido. Atualize e peça ao responsável que o resolva.',
    DEPARTURE_ASSET_SERVICE_UNAVAILABLE:
      'A liberação patrimonial normal ainda não está disponível.',
    DEPARTURE_REIMBURSEMENT_SERVICE_UNAVAILABLE:
      'A liberação de reembolsos não está disponível.',
    DEPARTURE_LOANS_NOT_CLEARED:
      'Empréstimos ou pagamentos reservados não foram quitados.',
    REIMBURSEMENT_DEPARTURE_NOT_CLEARED:
      'Solicitações de reembolso ainda estão abertas.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      'Escolha a data prevista e o destinatário da transferência.',
    DEPARTURE_DATE_PAST: 'O último dia de trabalho previsto está no passado.',
    DEPARTURE_REASSIGNMENT_UNAVAILABLE:
      'A transferência de aprovações está indisponível. A conta permanece habilitada.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      'Aprovações pendentes continuam atribuídas a este colaborador.',
    DEPARTURE_EXECUTION_FAILED:
      'A execução do desligamento falhou e será repetida pela tarefa diária.',
  },
};
