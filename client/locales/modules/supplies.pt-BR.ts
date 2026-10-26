export default {
  supplies: {
    namedRowActions: 'Ações de {{name}}',

    businessErrors: {
      SUPPLY_REQUIRED_FIELDS:
        'Adicione pelo menos um item e informe sua finalidade.',
      SUPPLY_ITEM_UNAVAILABLE:
        'Um item selecionado está indisponível. Selecione um item habilitado novamente.',
      SUPPLY_CONTENT_CHANGED:
        'Os itens aprovados mudaram. Atualize a solicitação antes de registrar a entrega.',
    },

    rowActions: 'Ações do registro',
    number: 'Número da requisição',
    unknownEdit:
      'O resultado do salvamento é incerto. Carregue a solicitação mais recente antes de editar novamente.',
    emptyCatalog:
      'Nenhum item de escritório ativo configurado. Entre em contato com a Administração.',
    ledgerDetail: 'Registro de entrega',
    ledgerDescription:
      'Quantidades registradas e encerramentos administrativos. Quantidades não confirmadas não comprovam entrega.',
    entryMissing: 'Este registro de entrega está indisponível.',
    authz: {
      resource: 'Requisições de materiais',
      ledger: 'Ler registro de entrega de materiais',
    },
    navigation: 'Registro de materiais',
    new: 'Nova requisição de materiais',
    edit: 'Editar requisição de materiais',
    formDescription:
      'Escolha itens e quantidades. Seu gestor aprova a solicitação antes de a Administração entregá-los.',
    purpose: 'Finalidade',
    item: 'Item',
    items: 'Itens solicitados',
    quantity: 'Quantidade',
    quantityValue: 'Quantidade: {{quantity}}',
    chooseItem: 'Escolher um item',
    line: 'Item {{number}}',
    remove: 'Remover item {{number}}',
    addItem: 'Adicionar item',
    quantityInvalid: 'Informe uma quantidade inteira de 1 a 100.000.',
    duplicate: 'Escolha cada item uma única vez.',
    emailInvalid: 'Informe um endereço de e-mail válido.',
    printRequired:
      'Preencha as informações obrigatórias de impressão de cartões de visita.',
    print: {
      name: 'Nome',
      title: 'Título do cargo',
      phone: 'Telefone',
      email: 'E-mail',
      address: 'Endereço',
      department: 'Departamento (opcional)',
    },
    approvedAt: 'Horário de aprovação do gestor',
    issuingStage: 'Entrega administrativa',
    resubmitHint:
      'Reenviar itens e finalidade inalterados retorna à Administração. Alterá-los exige nova aprovação do gestor. A aprovação anterior permanece no histórico.',
    forcedHint:
      'Um administrador de aprovação encerrou esta solicitação sem confirmar a entrega física. As quantidades reais não foram confirmadas.',
    uncertainCreate:
      'O resultado do salvamento é incerto. Feche e verifique Minhas solicitações antes de criar outro rascunho.',
    invalid:
      'Verifique a finalidade, as escolhas de itens e as quantidades inteiras.',
    itemUnavailable:
      'Um item está desabilitado ou ausente. Atualize antes de enviar o conteúdo alterado.',
    inactive: 'É necessário um cadastro de colaborador ativo.',
    configuration:
      'Não é possível enviar a aprovação. Entre em contato com um administrador para verificar os prazos de aprovação.',
    contentChanged:
      'O conteúdo não corresponde mais à solicitação aprovada. Carregue a versão mais recente.',
    reasonRequired: 'Informe um motivo.',
    actions: {
      claim: 'Assumir entrega',
      release: 'Liberar tarefa assumida',
      assign: 'Atribuir responsável',
      complete: 'Confirmar emissão',
      unable: 'Não é possível emitir',
      forceComplete: 'Forçar encerramento',
    },
    actionHints: {
      complete:
        'Confirme que cada item solicitado foi entregue fisicamente na quantidade total solicitada. Isto grava o registro de entrega.',
      unable:
        'Explique a falta de estoque ou outro motivo que impeça a conclusão da entrega. A aprovação do gestor é mantida.',
      release:
        'Libere esta tarefa para que outro responsável administrativo possa assumi-la.',
      forceComplete:
        'Encerre por decisão administrativa sem confirmar a entrega. As quantidades reais serão registradas como não confirmadas. É necessário um motivo.',
    },
    states: {
      issuing: 'Aguardando entrega',
      exception: 'Exceção de emissão',
      issued: 'Entregue',
      forcedClosed: 'Encerrado administrativamente',
    },
    ledgerTitle: 'Registro de entrega de materiais',
    requestedQuantity: 'Quantidade solicitada',
    actualQuantity: 'Quantidade real',
    outcome: 'Resultado',
    recipient: 'Destinatário',
    issuer: 'Responsável',
    unconfirmed: 'Não confirmado',
    reason: 'Motivo',
    emptyLedger: 'Nenhum registro de entrega',
    viewRequest: 'Visualizar requisição',
  },
};
