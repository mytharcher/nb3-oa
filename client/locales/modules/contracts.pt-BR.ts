export default {
  contracts: {
    title: 'Solicitações de contrato',
    ledgerTitle: 'Contratos',
    description: 'Inicie a revisão de contratos e acompanhe seu progresso',
    ledgerDescription: 'Ler contratos aprovados e versões imutáveis',
    source: 'Página de origem',
    detail: 'Detalhes do contrato',
    new: 'Novo contrato',
    edit: 'Editar',
    save: 'Salvar',
    saveDraft: 'Salvar rascunho',
    cancel: 'Cancelar',
    submit: 'Enviar para aprovação',
    appendText: 'Adicionar texto',
    rebase: 'Atualizar versão base',
    historicalEntry: 'Registrar contrato histórico',
    number: 'Número',
    contractType: 'Tipo de contrato',
    operation: 'Operação',
    counterparty: 'Contraparte',
    counterpartyKind: 'Tipo de contraparte',
    customer: 'Cliente',
    vendor: 'Fornecedor qualificado',
    amountCents: 'Valor do contrato (yuan)',
    startsOn: 'Data de início',
    endsOn: 'Data de término',
    paymentTerms: 'Condições de pagamento',
    standardTemplate: 'Modelo padrão',
    reason: 'Motivo',
    textVersionId: 'Texto do contrato',
    attachments: 'Anexos',
    versions: 'Versões imutáveis',
    version: 'Versão',
    baseVersion: 'Versão base',
    nonStandard: 'Parecer jurídico não padrão',
    selectOpinion: 'Selecionar um parecer jurídico',
    yes: 'Sim',
    no: 'Não',
    search: 'Pesquisar número ou contraparte',
    ledgerSearch: 'Pesquisar número do contrato',
    empty: 'Nenhuma solicitação de contrato',
    emptyDescription: 'Crie uma solicitação para iniciar a revisão',
    emptyReadOnly:
      'Entre em contato com um administrador para obter acesso ao envio de contratos',
    ledgerEmpty: 'Nenhum contrato',
    ledgerEmptyDescription: 'Contratos aprovados aparecem aqui',
    noResults: 'Nenhuma correspondência',
    clear: 'Limpar filtros',
    retry: 'Tentar novamente',
    refresh: 'Atualizar',
    allStatuses: 'Todos os status',
    status: 'Status',
    createdAt: 'Data de criação',
    updatedAt: 'Data de atualização',
    view: 'Visualizar',
    noAccess:
      'Sem acesso a este contrato. Entre em contato com um administrador.',
    fieldsRestricted:
      'Os campos completos do contrato não são legíveis. Entre em contato com um administrador.',
    missing: 'O contrato não existe mais. Volte à página de origem.',
    failed: 'Não foi possível carregar os dados do contrato. Tente novamente.',
    invalid: 'Verifique os detalhes do contrato e os requisitos da ação atual.',
    conflict: 'O contrato mudou. Carregue a versão mais recente e verifique-a.',
    loadLatest: 'Carregar versão mais recente',
    textDenied: 'O texto do contrato não é legível',
    unknown:
      'O resultado precisa ser verificado. Os dados estão bloqueados; repita a operação original.',
    retryExact: 'Repetir operação original',
    required: 'Preencha este campo',
    amountInvalid: 'Informe um valor não negativo com até duas casas decimais',
    dateInvalid: 'A data de término não pode ser anterior à data de início',
    tooLong: 'Este valor é muito longo',
    textRequired:
      'Envie e vincule o texto do contrato antes de enviar a solicitação',
    actionsFor: 'Ações de "{{name}}"',
    rebaseTitle: 'Atualizar a versão base do contrato "{{name}}"?',
    rebaseDescription:
      'Mantenha esta proposta, atualize a versão base e repita a revisão completa.',
    saved: '"{{name}}" salvo',
    submitted: '"{{name}}" enviado',
    completed: 'Ação concluída para "{{name}}"',
    draftName: 'Rascunho de contrato',
    confirmation: '{{action}} o contrato "{{name}}"?',
    dangerConsequence:
      'Isto encerra a revisão atual da solicitação e fecha suas tarefas pendentes.',
    historicalConsequence:
      'Publica uma versão histórica auditada. Verifique o texto e a proposta.',
    notAvailable: 'Esta ação está indisponível. Atualize para verificar.',
    comment: 'Comentário ou motivo',
    recipient: 'Destinatário',
    recipientSearch: 'Pesquisar destinatários elegíveis',
    moreCandidates: 'Mais candidatos',
    noCandidates: 'Nenhum destinatário elegível',
    place: 'Posição de aprovação',
    returnTarget: 'Devolver para',
    signerMode: 'Modo do signatário adicionado',
    sourceContract: 'Contrato aprovado',
    proposal: 'Proposta de contrato',
    paidCents: 'Valor pago',
    heldCents: 'Pagamentos reservados',
    availableCents: 'Disponível para pagamento',
    actor: 'Executor',
    request: 'Solicitação',
    openRequest: 'Visualizar solicitação',
    privateTextHint:
      'O texto do contrato exige acesso à solicitação proprietária.',
    selectExisting: 'Escolher arquivo enviado',
    removeFile: 'Remover seleção de "{{name}}"',
    uploadHint:
      'Texto: PDF. Comprovantes: PDF, JPEG, PNG ou WebP; até 5 MB por arquivo.',
    fileInvalid:
      'Escolha um arquivo de formato suportado correspondente com até 5 MB.',
    uploadUnknown:
      'O resultado do envio precisa ser verificado. Escolha um arquivo enviado; não envie novamente.',
    fileMissing:
      'O arquivo selecionado está indisponível. Verifique o acesso e a versão do texto.',
    noFiles: 'Nenhum arquivo enviado',
    uploaded: '"{{name}}" enviado',
    bindText: 'Continuar vinculando texto adicionado',
    boundText: 'Versão do texto {{version}} vinculada',
    currentVersion: 'Versão atual',
    selectSource:
      'Escolha um contrato aprovado para carregar sua versão completa',
    discard: 'Descartar alterações não salvas?',
    discardDescription:
      'Seus dados serão descartados; os comprovantes enviados permanecem armazenados.',
    discardConfirm: 'Descartar alterações',
    progress: 'Progresso da revisão',
    timeline: 'Histórico de revisão',
    selectFile: 'Escolher arquivo',
    sourceVersion: 'Versão de origem',
    operations: {
      new: 'Novo contrato',
      change: 'Alteração',
      renew: 'Renovação',
      terminate: 'Rescisão',
    },
    statuses: {
      draft: 'Rascunho',
      revision: 'Revisão',
      head: 'Revisão do departamento',
      legalFinance: 'Revisão jurídica e financeira',
      standardFinance: 'Revisão financeira',
      executive: 'Revisão executiva',
      gm: 'Revisão da direção geral',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      withdrawn: 'Retirado',
      terminated: 'Encerrado',
      activePendingSeal: 'Aprovado, aguardando carimbo',
      active: 'Ativa',
    },
    views: {
      mine: 'Minhas',
      pending: 'Pendente',
      done: 'Concluído',
      copied: 'Copiado',
    },
    actions: {
      edit: 'Editar',
      submit: 'Enviar para aprovação',
      withdraw: 'Retirar',
      terminate: 'Encerrar',
      approve: 'Aprovar',
      reject: 'Rejeitar',
      return: 'Devolver',
      claim: 'Assumir',
      comment: 'Comentário',
      read: 'Marcar como lido',
      transfer: 'Transferir',
      addSigner: 'Adicionar signatário',
      urge: 'Cobrar',
      appoint: 'Designar aprovador',
      reassign: 'Reatribuir',
      historicalEntry: 'Registrar contrato histórico',
      rebase: 'Atualizar versão base',
    },
    modes: { before: 'Antes', after: 'Depois', alongside: 'Em paralelo' },

    errors: {
      CONTRACT_ACCESS_DENIED:
        'Este contrato está fora do seu acesso concedido.',
      CONTRACT_ACTION_NOT_ALLOWED:
        'Esta ação está indisponível para o contrato.',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        'O valor do contrato não pode ser inferior à soma dos pagamentos pagos e reservados.',
      CONTRACT_ATTACHMENT_DENIED:
        'O campo de anexos ou o registro do contrato está fora do seu acesso concedido.',
      CONTRACT_ATTACHMENT_INVALID:
        'Escolha anexos válidos pertencentes a esta solicitação de contrato.',
      CONTRACT_CANDIDATE_REMOVED:
        'Este contrato candidato não publicado foi removido. Crie uma nova solicitação.',
      CONTRACT_CATEGORY_INACTIVE: 'Escolha um tipo de contrato ativo.',
      CONTRACT_CORRUPT_BALANCE:
        'Os totais de pagamento do contrato são inconsistentes. Entre em contato com um administrador.',
      CONTRACT_EMPLOYEE_REQUIRED:
        'É necessário um colaborador ativo com departamento principal.',
      CONTRACT_FIELDS_RESTRICTED:
        'Os campos obrigatórios do contrato estão fora do seu acesso concedido.',
      CONTRACT_FILE_SIZE:
        'Escolha um arquivo de contrato não vazio de até 5 MB.',
      CONTRACT_FILE_TYPE:
        'O texto do contrato deve ser PDF; os comprovantes podem ser PDF, JPEG, PNG ou WebP, com conteúdo correspondente.',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        'Esta chave de requisição já foi usada com outros detalhes. Atualize antes de enviar novamente.',
      CONTRACT_INACTIVE_SOURCE:
        'Escolha uma origem de contrato aprovado vigente.',
      CONTRACT_INCOMPLETE_PROPOSAL:
        'Preencha o motivo do contrato, as condições de pagamento e a versão imutável do texto.',
      CONTRACT_INPUT_INVALID:
        'Verifique os campos de entrada declarados do contrato.',
      CONTRACT_INVALID_AMOUNT:
        'Informe um valor não negativo em centavos inteiros exatos dentro do intervalo suportado.',
      CONTRACT_INVALID_ID:
        'É necessária uma identidade válida de tamanho limitado.',
      CONTRACT_INVALID_TIME: 'A marca de tempo do contrato é inválida.',
      CONTRACT_LIMIT_EXCEEDED:
        'Os valores pendentes e pagos excedem o limite do contrato.',
      CONTRACT_NOT_CANDIDATE:
        'Somente o contrato candidato não publicado desta solicitação pode ser removido.',
      CONTRACT_NOT_FOUND: 'A origem do contrato não foi encontrada.',
      CONTRACT_OUTSTANDING_PAYMENTS:
        'Libere os pagamentos pendentes antes de rescindir o contrato.',
      CONTRACT_REASON_REQUIRED:
        'Informe um motivo dentro do tamanho suportado.',
      CONTRACT_REBASE_NOT_ALLOWED:
        'Somente o solicitante pode atualizar explicitamente a versão base de uma alteração devolvida.',
      CONTRACT_REQUEST_KEY_REQUIRED:
        'É necessária uma chave de requisição estável.',
      CONTRACT_RESERVATION_CLOSED: 'A reserva de pagamento já foi encerrada.',
      CONTRACT_RULE_INVALID:
        'A política de aprovação de contratos não existe ou é inválida. Entre em contato com um administrador.',
      CONTRACT_SLA_UNSUPPORTED:
        'O adaptador de aprovação instalado suporta somente o relógio configurado de 24/48 horas.',
      CONTRACT_SOURCE_CONFLICT:
        'Esta referência pertence a outra origem de contrato.',
      CONTRACT_STORED_ID_INVALID:
        'Uma identidade de contrato armazenada é inválida. Entre em contato com um administrador.',
      CONTRACT_SUPPLIER_INVALID:
        'O fornecedor deve estar ativo e ter qualificação aprovada. Atualize sua qualificação antes da aprovação.',
      CONTRACT_TARGET_MISMATCH:
        'O destino de aprovação pertence a outra solicitação de contrato.',
      CONTRACT_TEXT_INVALID:
        'Escolha uma versão imutável do texto PDF pertencente a esta solicitação.',
      CONTRACT_TEXT_NOT_EDITABLE:
        'Versões do texto do contrato só podem ser adicionadas a um rascunho próprio ou a uma revisão devolvida.',
      CONTRACT_TEXT_REQUIRED:
        'Selecione uma versão imutável válida do texto do contrato.',
      CONTRACT_TRANSITION_NOT_ALLOWED:
        'Use a operação protegida específica de contratos.',
      CONTRACT_VERSION_CONFLICT:
        'O contrato aprovado mudou. Devolva a solicitação, atualize explicitamente sua versão base e envie para revisão novamente.',
    },
    authz: {
      resource: 'Contratos e alterações',
      view: 'Visualizar solicitações de contrato',
      submit: 'Criar e editar próprias solicitações de contrato',
      ledger: 'Ler cadastro de contratos aprovados e versões imutáveis',
      historicalEntry:
        'Registrar um contrato histórico com registro jurídico auditado',
    },
  },
};
