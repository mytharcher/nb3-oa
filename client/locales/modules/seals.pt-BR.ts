export default {
  seals: {
    authz: {
      requests: 'Solicitações de carimbos',
      view: 'Visualizar',
      create: 'Criar',
      edit: 'Editar',
      operate: 'Operar',
      actualReturn: 'Devolução excepcional real',
      ledger: 'Registro de carimbos',
      instances: 'Instâncias de carimbos',
      manage: 'Gerenciar metadados de carimbos',
      owned: 'Registros próprios',
      readable: 'Registros próprios e com participação',
    },
    registrationSource: 'Registro da solicitação {{number}}',
    relatedUnavailable: 'Registro relacionado indisponível',
    copiesRange: 'Informe um número inteiro de 1 a {{max}}.',
    actionSaved:
      '{{action}} concluída para a solicitação de carimbo "{{name}}"',
    requestSaved: 'Solicitação de carimbo "{{name}}" salva',

    noLongerEditable:
      'Esta solicitação não pode mais ser editada. Feche-a e atualize a lista.',

    businessErrors: {
      REVIEWER_REQUIRED:
        'O revisor realmente atribuído deve manter o papel de responsabilidade ativo obrigatório.',
      APPROVAL_REFUSED:
        'As regras atuais de aprovação ou processamento recusam esta operação.',
      ACCESS_DENIED:
        'Você não pode acessar estes registros ou campos de carimbos.',
      ACTIVE_EMPLOYEE_REQUIRED: 'É necessária uma conta de colaborador ativa.',
      ADMIN_KEEPER_REQUIRED:
        'Devoluções excepcionais reais exigem os papéis de administrador e responsável pelos carimbos.',
      ADMIN_REQUIRED:
        'É necessário um papel de responsabilidade administrativa ativo.',
      BODY_TOO_LARGE: 'O anexo excede o limite de tamanho para envio.',
      COMMAND_CONFLICT:
        'Esta chave de requisição já foi usada para outro conteúdo.',
      CONTRACT_ACCESS_DENIED: 'Você não pode visualizar o contrato vinculado.',
      CONTRACT_NOT_EFFECTIVE: 'O contrato vinculado não está vigente.',
      CONTRACT_VERSION_CONFLICT: 'O contrato vinculado mudou após a aprovação.',
      DEPARTMENT_REQUIRED: 'O solicitante deve ter um departamento principal.',
      INVALID_COMMAND: 'É necessária uma chave de requisição válida.',
      INVALID_COPIES:
        'As cópias realmente carimbadas devem ser positivas e não superiores à quantidade aprovada.',
      INVALID_FILE: 'O anexo está ausente, inseguro ou fora desta solicitação.',
      INVALID_INPUT: 'Os campos da solicitação de carimbo são inválidos.',
      INVALID_OUTPUT: 'O resultado do processamento físico é inválido.',
      INVALID_RETURN:
        'A devolução real exige uma retirada externa encerrada administrativamente e um motivo.',
      INVALID_SEAL_TYPE:
        'O tipo de carimbo está inativo ou não corresponde à solicitação aprovada.',
      INVALID_TIME:
        'Os horários físicos ou o prazo de devolução são inválidos.',
      KEEPER_REQUIRED:
        'É necessário um papel ativo de responsável pelos carimbos.',
      OUTSTANDING_CUSTODY: 'Este carimbo tem custódia física pendente.',
      PHYSICAL_ALREADY_REGISTERED:
        'O uso físico ou a devolução já foi registrado.',
      REQUEST_NOT_FOUND: 'A solicitação está indisponível.',
      SEAL_EVIDENCE_REQUIRED:
        'São necessários comprovantes reais imutáveis de aplicação de carimbo.',
      SEAL_NOT_FOUND: 'O carimbo está indisponível.',
      SEAL_UNAVAILABLE: 'Este carimbo está retirado no momento.',
      SLA_UNSUPPORTED:
        'O agendamento de lembretes configurado não é suportado.',
      TARGET_MISMATCH: 'A tarefa oferecida não pertence a esta solicitação.',
      VERSION_CONFLICT: 'O registro mudou. Atualize antes de tentar novamente.',
    },

    disableInstance: 'Desabilitar o carimbo "{{name}}"?',
    disableInstanceDescription:
      'Carimbos desabilitados não podem ser selecionados para novo processamento físico. Registros imutáveis existentes e comprovantes de custódia são mantidos.',
    disable: 'Desabilitar carimbo',
    instanceSaved: 'Carimbo "{{name}}" salvo',

    reloadInstance: 'Recarregar metadados do carimbo?',
    reloadInstanceDescription:
      'Recarregar descarta seus dados não salvos e usa a versão atual. Você deve informar o motivo da alteração novamente.',

    save: 'Salvar carimbo',
    forbidden: 'Acesso negado. Entre em contato com um administrador',
    missing: 'Este carimbo está indisponível',

    instances: 'Gerenciamento de carimbos',
    instanceNotice:
      'Gerencie metadados de carimbos. Custódia física e registros são feitos somente pelo processamento real.',
    instanceCode: 'Código do carimbo',
    instanceName: 'Nome do carimbo',
    instanceActive: 'Ativa',
    instanceVersion: 'Versão',
    newInstance: 'Novo carimbo',
    editInstance: 'Editar carimbo',
    emptyInstances: 'Nenhum carimbo ainda',

    returnTarget: 'Destino da devolução',
    title: 'Solicitações de carimbos',
    description:
      'Solicite o uso de carimbos e revise os dados atuais de aprovação e processamento físico.',
    confirmations: {
      confirmed: 'Confirmado',
      notApplicable: 'Não se aplica',
      unconfirmed: 'Não confirmado',
    },
    confirmedBy: 'Devolução confirmada por',
    contractConfirmation: 'Confirmação de comprovantes de contrato',
    ledger: 'Registro de carimbos',
    number: 'Número da solicitação',
    purpose: 'Finalidade',
    applicant: 'Solicitante',
    sealType: 'Tipo de carimbo',
    copies: 'Cópias aprovadas',
    status: 'Status',
    refresh: 'Atualizar',
    new: 'Nova solicitação de carimbo',
    edit: 'Editar solicitação',
    search: 'Pesquisar número, finalidade ou solicitante',
    all: 'Todos os status',
    clear: 'Limpar filtros',
    oldest: 'Criação: mais antigos primeiro',
    newest: 'Criação: mais recentes primeiro',
    draft: 'Rascunho',
    noMatch: 'Nenhuma solicitação correspondente',
    empty: 'Nenhuma solicitação de carimbo ainda',
    emptyLedger: 'Nenhum registro físico ainda',
    sealId: 'Carimbo real',
    actualCopies: 'Cópias reais',
    borrowedAt: 'Horário real da retirada',
    sealedAt: 'Horário real da aplicação de carimbo',
    returnedAt: 'Horário real da devolução',
    registeredBy: 'Registrado por',
    physicalNotice:
      'A aprovação ou o encerramento administrativo não comprova aplicação física de carimbo ou devolução. A retirada registra somente a custódia física.',
    detail: 'Detalhes da solicitação de carimbo',
    moreActions: 'Mais ações',
    contractId: 'Contrato vinculado',
    contractVersion: 'Versão congelada do contrato',
    contact: 'Contato e observações',
    external: 'Retirada externa',
    returnDueAt: 'Horário previsto de devolução',
    ledgerId: 'ID imutável do registro',
    exceptionReason: 'Exceção de processamento',
    administrativeReason: 'Motivo do encerramento administrativo',
    yes: 'Sim',
    no: 'Não',
    files: 'Arquivos da solicitação',
    history: 'Histórico de ações',
    download: 'Baixar',
    cancel: 'Cancelar',
    saveDraft: 'Salvar rascunho',
    submit: 'Salvar e enviar',
    confirm: 'Confirmar ação',
    saved: 'Solicitação de carimbo salva',
    required: 'Este campo é obrigatório',
    futureReturn: 'A devolução prevista deve ser posterior a agora',
    sourceRequired:
      'Escolha um contrato ou envie um arquivo antes de enviar a solicitação',
    fileSource: 'Usar arquivos da solicitação',
    uploadNotice:
      'Preencha primeiro os campos obrigatórios. O envio de arquivo salva um rascunho; salvar ou enviar a solicitação associa os arquivos enviados.',
    remove: 'Remover',
    discard: 'Descartar alterações',
    discardDescription:
      'Alterações não salvas serão perdidas. Arquivos enviados e rascunhos salvos permanecem.',
    unavailable:
      'Este registro ou ação está indisponível. Volte à lista e atualize.',
    failed:
      'A operação falhou. Verifique os dados ou atualize e tente novamente.',
    retry: 'Tentar novamente',
    backToList: 'Voltar à lista',
    loading: 'Carregando',
    invalidInput:
      'Preencha os campos obrigatórios e verifique as quantidades e horários reais.',
    checkoutNotice:
      'Confirme a retirada real do carimbo. A retirada não registra o horário da aplicação nem as cópias reais.',
    exceptionalNotice:
      'O encerramento administrativo preserva a custódia pendente. A devolução excepcional mantém a versão original do contrato e não ativa o contrato.',
    recipient: 'Destinatário',
    reason: 'Motivo ou comentário',
    mode: 'Modo de assinatura',
    confirmDescription:
      'Isto altera o resultado da solicitação. Confirme a solicitação e a ação selecionada.',
    states: {
      draft: 'Rascunho',
      revision: 'Revisão',
      head: 'Aprovação do departamento',
      legal: 'Aprovação jurídica',
      financeManager: 'Aprovação do financeiro',
      gm: 'Aprovação da direção geral',
      stamping: 'Registro de aplicação de carimbo',
      returning: 'Confirmação de devolução',
      exception: 'Exceção de processamento',
      returnException: 'Exceção de devolução',
      completed: 'Concluído',
      administrativelyClosed: 'Encerrado administrativamente',
      rejected: 'Rejeitado',
      withdrawn: 'Retirado',
      terminated: 'Encerrado',
    },
    actions: {
      edit: 'Editar',
      submit: 'Enviar',
      withdraw: 'Retirar',
      terminate: 'Encerrar',
      retry: 'Repetir processamento',
      forceComplete: 'Encerrar administrativamente',
      actualReturn: 'Confirmar devolução física excepcional',
      approve: 'Aprovar',
      reject: 'Rejeitar',
      return: 'Devolver para revisão',
      comment: 'Comentário',
      read: 'Marcar como lido',
      claim: 'Assumir',
      release: 'Liberar',
      complete: 'Concluir processamento real',
      unable: 'Não foi possível processar',
      transfer: 'Transferir',
      assign: 'Atribuir',
      cc: 'Adicionar destinatários',
      addSigner: 'Adicionar signatário',
      urge: 'Cobrar',
      appoint: 'Designação pelo administrador',
      reassign: 'Reatribuição pelo administrador',
    },
    types: {
      official: 'Oficial',
      contract: 'Contrato',
      legalRepresentative: 'Representante legal',
      finance: 'Financeiro',
    },
    modes: {
      before: 'Antes',
      parallel: 'Em paralelo',
    },
  },
};
