export default {
  paymentRequests: {
    relatedUnavailable: 'Registro relacionado indisponível',
    businessErrors: {
      PAYMENT_REQUEST_INVALID_INPUT:
        'Preencha o motivo, o beneficiário, o valor positivo, o número da nota fiscal e seus comprovantes.',
      PAYMENT_REQUEST_ACCOUNT_REQUIRED:
        'Preencha a conta bancária protegida do beneficiário antes de enviar.',
      PAYMENT_REQUEST_ACCOUNT_STALE:
        'A conta do beneficiário mudou. Carregue a conta mais recente antes de corrigi-la.',
      PAYMENT_REQUEST_DEPARTMENT_REQUIRED:
        'O solicitante precisa de um departamento principal ativo. Peça ao RH que atualize o cadastro do colaborador.',
      PAYMENT_REQUEST_METHOD_INVALID:
        'Selecione uma forma de pagamento habilitada.',
      PAYMENT_REQUEST_SOURCE_REQUIRED:
        'Explique por que não há aprovação prévia e limpe o pedido de compra vinculado.',
      PAYMENT_REQUEST_SOURCE_INVALID:
        'Selecione um pedido de compra ou contrato vigente e seu beneficiário original.',
      PAYMENT_REQUEST_SOURCE_STALE:
        'O documento de origem mudou. Atualize o pagamento e a origem antes de agir novamente.',
      PAYMENT_REQUEST_CONTRACT_STALE:
        'O contrato mudou. Atualize sua versão e revise o pagamento antes de reenviar.',
      PAYMENT_REQUEST_VOUCHER_REQUIRED:
        'Informe o número do comprovante de pagamento e envie ou selecione os comprovantes.',
      PAYMENT_REQUEST_FORCE_CONFIRMATION_REQUIRED:
        'Confirme o valor aprovado exato antes de forçar a conclusão do pagamento.',
      PAYMENT_REQUEST_HANDLING_REASON_REQUIRED:
        'Informe o motivo pelo qual o pagamento não pôde ser concluído.',
      PAYMENT_REQUEST_ALREADY_PAID:
        'Este pagamento já está liquidado. Atualize para ver o resultado registrado.',
      PAYMENT_REQUEST_CONTRACT_ACTUAL_PAYMENT_REQUIRED:
        'Registre o pagamento real do contrato antes de concluir esta operação.',
      PAYMENT_FILE_SIZE: 'Selecione um anexo não vazio de no máximo 5 MB.',
      PAYMENT_FILE_TYPE:
        'Envie um arquivo PDF, JPEG, PNG ou WebP com o tipo de arquivo correspondente.',
      PAYMENT_ATTACHMENT_INVALID:
        'Selecione comprovantes enviados para esta solicitação de pagamento.',
    },

    title: 'Solicitações de pagamento',
    description:
      'Revise solicitações de pagamento, dados de origem congelados e processamento do caixa.',
    new: 'Nova solicitação de pagamento',
    edit: 'Editar',
    details: 'Visualizar detalhes',
    number: 'Número',
    reason: 'Motivo',
    vendor: 'Beneficiário',
    amount: 'Valor do pagamento (yuan)',
    search: 'Pesquisar número, motivo, solicitante ou beneficiário',
    view: 'Visualização do registro',
    allStatuses: 'Todos os status',
    refresh: 'Atualizar',
    clearFilters: 'Limpar filtros',
    emptyTitle: 'Nenhuma solicitação de pagamento ainda',
    emptyDescription:
      'Crie um rascunho para solicitar um pagamento e anexe os comprovantes da nota fiscal.',
    noResults: 'Nenhum registro correspondente. Limpe ou ajuste os filtros.',
    rowActions: 'Ações de {{name}}',
    yes: 'Sim',
    no: 'Não',
    frozenHint:
      'Origem, beneficiário, valor e nota fiscal são congelados no envio.',
    sourceModes: {
      contract: 'Contrato',
      purchase: 'Pedido de compra',
      none: 'Sem aprovação prévia',
    },
    views: {
      mine: 'Minhas',
      pending: 'Pendente',
      done: 'Concluído',
      copied: 'Copiado',
    },
    statuses: {
      draft: 'Rascunho',
      revision: 'Revisão',
      head: 'Revisão do departamento',
      finance: 'Revisão financeira',
      executive: 'Revisão executiva',
      gm: 'Revisão da direção geral',
      cashier: 'Processamento do caixa',
      exception: 'Exceção de processamento',
      paid: 'Pago',
      forcedPaid: 'Pagamento forçado registrado',
      rejected: 'Rejeitado',
      withdrawn: 'Retirado',
      terminated: 'Encerrado',
    },
    errors: {
      forbidden:
        'Você não tem acesso. Peça a um administrador que verifique sua permissão.',
      notFound:
        'Este registro não existe mais ou está indisponível. Volte à página de origem.',
      conflict:
        'Este pagamento mudou. Leia o registro mais recente antes de agir novamente.',
      invalid:
        'Verifique o conteúdo do pagamento e os comprovantes obrigatórios.',
      failed: 'A requisição não foi concluída. Tente novamente.',
    },
    detail: {
      creator: 'Criado por',
      sourceMode: 'Origem',
      order: 'Pedido de compra',
      noPriorReason: 'Motivo da ausência de aprovação prévia',
      invoice: 'Número da nota fiscal',
      method: 'Forma de pagamento',
      failure: 'Falha no processamento',
      voucher: 'Comprovante de pagamento',
      forcedReason: 'Motivo do pagamento forçado',
      paidAt: 'Pago em',
      sourceFacts: 'Dados de origem congelados',
      cumulativeHint:
        'Os pagamentos cumulativos enviados incluem pagamentos pendentes. A reserva da solicitação atual é exibida separadamente e não deve ser somada novamente. O pagamento não confirma entrega ou recebimento.',
      sourceApproved: 'Valor aprovado do pedido (yuan)',
      sourceCumulative: 'Valor cumulativo enviado (yuan)',
      sourceHeld: 'Reserva atual da origem (yuan)',
      fullApproval: 'Aprovação completa necessária',
      attachments: 'Comprovantes de nota fiscal',
      voucherAttachments: 'Comprovantes de pagamento',
      notSubmitted: 'As regras são congeladas no envio.',
    },
    rules: {
      spend_vp: 'Limite do executivo (yuan)',
      spend_gm: 'Limite do diretor geral (yuan)',
      sla_remindHours: 'Horas úteis para lembrete',
      sla_escalateHours: 'Horas úteis para escalonamento',
      sla_urgeCooldownHours: 'Horas de intervalo entre lembretes',
    },
    authz: {
      voucherEvidence: 'Enviar comprovante de pagamento',
      ownScope: 'Pagamentos que possuo ou criei',
      resource: 'Solicitações de pagamento',
      view: 'Visualizar solicitações de pagamento',
      submit: 'Criar e enviar meus pagamentos',
      delegate: 'Criar pagamentos para colaboradores',
      paymentAccount: 'Ler e corrigir contas de pagamento autorizadas',
    },
  },
};
