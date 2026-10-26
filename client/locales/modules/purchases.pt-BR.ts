export default {
  purchases: {
    businessErrors: {
      PURCHASE_INVALID_ITEMS:
        'Cada item de compra precisa de nome, unidade e quantidade positiva. Verifique itens duplicados.',
      PURCHASE_INVALID_DATE:
        'Selecione uma data prevista de recebimento válida.',
      PURCHASE_INVALID_PRICE:
        'Informe um preço real positivo, selecione um fornecedor e anexe os comprovantes de cotação.',
      PURCHASE_INVALID_QUOTES:
        'Um arquivo de cotação não pode ser reutilizado para fornecedores diferentes. Selecione comprovantes separados.',
      PURCHASE_QUOTES_REQUIRED:
        'Este valor exige cotações de três fornecedores diferentes, cada uma com um anexo.',
      PURCHASE_PRICE_CONFIRMATION_REQUIRED:
        'Revise o orçamento estimado para o preço cotado confirmado antes de reenviar.',
      PURCHASE_INVALID_INPUT:
        'Adicione itens de compra e uma finalidade e informe um valor estimado positivo.',
      PURCHASE_DEPARTMENT_REQUIRED:
        'O solicitante precisa de um departamento principal ativo. Peça ao RH que atualize o cadastro do colaborador.',
      INVALID_RECEIPT:
        'Selecione a data real de recebimento e informe um motivo de confirmação.',
    },

    discardThenNavigate:
      'Descartar estas alterações não salvas? Após confirmar, selecione novamente seu destino.',
    localInputsRetained:
      'Versão mais recente carregada. Seus dados foram mantidos; revise-os antes de salvar novamente.',
    chooseForceMode: 'Escolha uma forma de processamento',
    confirmForceClose: 'Encerrar a compra {{name}}?',
    confirmPricing: 'Confirmar a cotação de {{name}}?',
    confirmCancelOrder: 'Cancelar o pedido {{name}}?',
    priceWillReturn:
      'O preço excede a estimativa em mais de 20%. Isto devolve a solicitação ao solicitante para confirmação antes da revisão financeira.',
    pricingSubmitConsequence:
      'O envio congela esta cotação para a próxima etapa de aprovação e ajusta a retenção orçamentária.',

    new: 'Nova compra',
    edit: 'Editar compra',
    saved: 'Compra salva',
    formDescription:
      'Descreva os itens, a finalidade e a estimativa. O envio reserva orçamento do departamento principal para o ano atual do calendário da empresa.',
    primaryDepartment: 'Departamento principal: {{department}}',
    yearHint: 'O ano do envio segue o calendário da empresa ({{timeZone}}).',
    departmentMissing: 'Sem departamento principal',
    department: 'Departamento',
    departmentPending: 'Determinado no envio',
    departmentUnavailable: 'Departamento indisponível',
    budgetYear: 'Exercício orçamentário',
    purpose: 'Finalidade',
    subject: 'Rubrica orçamentária',
    selectSubject: 'Selecionar rubrica orçamentária',
    estimated: 'Valor estimado',
    actual: 'Preço real',
    actualAmount: 'Preço real (yuan)',
    yuan: 'yuan',
    expectedDate: 'Data prevista de entrega',
    suggestedVendor: 'Fornecedor sugerido',
    selectedVendor: 'Fornecedor selecionado',
    vendor: 'Fornecedor',
    vendorUnavailable: 'Fornecedor indisponível',
    noSuggestedVendor: 'Nenhum fornecedor sugerido',
    vendorInactive: 'Escolher um fornecedor ativo',
    subjectInactive: 'Escolher uma rubrica orçamentária ativa',
    disabled: 'Desativada',
    inactive: 'Inativo',
    fieldInvalid: 'Verifique este campo',
    amountInvalid: 'Informe um valor positivo com até duas casas decimais',
    amountHint: 'Use no máximo duas casas decimais.',
    dateInvalid: 'Escolha uma data válida',
    items: 'Itens de compra',
    itemName: 'Nome do item',
    itemNumber: 'Item {{number}}',
    specification: 'Especificação',
    quantity: 'Quantidade',
    unit: 'Unidade',
    quantityInvalid: 'Informe uma quantidade positiva; decimais são aceitos',
    quantityHint: 'Quantidades decimais são aceitas, por exemplo 1,5 kg.',
    addItem: 'Adicionar item',
    removeItem: 'Remover item',
    reserveHint: 'Rascunhos não reservam orçamento. O envio cria a retenção.',
    loadLatest: 'Carregar solicitação mais recente',
    unknownCreate:
      'O resultado do salvamento é incerto. Outra criação está bloqueada. Verifique o rascunho na central de tarefas.',
    unknownEdit:
      'O resultado do salvamento é incerto. Carregue a solicitação mais recente antes de continuar.',
    unknownPricing:
      'O resultado é incerto e o formulário está bloqueado. Repetir envia exatamente os mesmos dados e ID de requisição.',
    quotes: 'Comprovantes de cotação',
    quoteEvidence: 'Comprovantes de cotação do fornecedor',
    quoteEvidenceDescription:
      'Envie comprovantes para cada fornecedor. Comprovantes existentes podem ser reutilizados se os requisitos não mudarem. Acima do limite congelado de cotação, são necessários comprovantes de três fornecedores distintos.',
    addQuote: 'Adicionar cotação de fornecedor',
    removeQuote: 'Remover seleção de cotação',
    threeQuotesRequired:
      'Acima do limite de cotação, forneça anexos de cotação de três fornecedores distintos.',
    selectExistingQuote: 'Selecionar cotação existente: {{filename}}',
    refreshQuotes: 'Atualizar cotações existentes',
    completePricing: 'Concluir precificação',
    forcePricing: 'Ação administrativa de compras',
    forceMode: 'Modo de ação',
    forcePriced: 'Enviar resultados completos para aprovação financeira',
    forceClose: 'Forçar encerramento sem pedido',
    forceCloseDescription:
      'O encerramento forçado libera a retenção orçamentária e registra o motivo do administrador. Não declara a compra ou o recebimento como concluídos e não cria pedido.',
    priceConfirmationDescription:
      'Preços acima de 120% da estimativa retornam ao solicitante para confirmação. Outros resultados entram na aprovação financeira.',
    confirmPriceHint:
      'O preço excede 120% da estimativa. Revise-o e reenvie para confirmar.',
    handler: 'Responsável por compras',
    forcedClosedHint:
      'Um administrador encerrou esta solicitação à força. A retenção foi liberada e nenhum pedido ou recebimento foi criado.',
    actualHold: 'Retenção orçamentária atual',
    holdHint:
      'A aprovação mantém a retenção orçamentária. O orçamento é liquidado quando o solicitante confirma o recebimento.',
    order: 'Pedido de compra',
    orderHint:
      'O pedido congela o preço, o fornecedor e os itens aprovados. Recebimento e pagamento são acompanhados separadamente.',
    openOrder: 'Abrir pedido',
    mergedTitle: 'Aprovações adjacentes unificadas',
    merged:
      '{{name}} concluiu pessoalmente a etapa adjacente; a aprovação da mesma pessoa foi unificada.',
    authz: {
      orderScope: 'Pedidos de compras que este usuário pode ler',
      resource: 'Compras',
      submit: 'Enviar compras',
      view: 'Visualizar compras',
      orders: 'Visualizar pedidos de compra',
      accept: 'Confirmar recebimento',
    },
    errors: {
      insufficient:
        'O orçamento disponível é insuficiente. Entre em contato com o responsável pelo orçamento.',
      inactive: 'O solicitante está inativo.',
      configuration:
        'A configuração de aprovação não é suportada. Entre em contato com um administrador.',
      invalid: 'Verifique os campos destacados.',
    },
    states: {
      draft: 'Rascunho',
      revision: 'Revisão',
      head: 'Aprovação do departamento',
      purchasing: 'Processamento de compras',
      exception: 'Exceção de compras',
      finance: 'Aprovação financeira',
      executive: 'Aprovação executiva',
      gm: 'Aprovação da direção geral',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      withdrawn: 'Retirado',
      terminated: 'Encerrado',
      forcedClosed: 'Encerrado à força',
    },
    stages: {
      draft: 'Rascunho',
      revision: 'Revisão',
      head: 'Aprovação do departamento',
      purchasing: 'Processamento de compras',
      exception: 'Exceção de compras',
      finance: 'Aprovação financeira',
      executive: 'Aprovação executiva',
      gm: 'Aprovação da direção geral',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      withdrawn: 'Retirado',
      terminated: 'Encerrado',
      forcedClosed: 'Encerrado à força',
    },
    actions: {
      claim: 'Assumir',
      release: 'Liberar tarefa assumida',
      complete: 'Concluir precificação',
      unable: 'Não é possível comprar',
      forceComplete: 'Ação do administrador',
      cc: 'Copiar',
    },
    ledgerTitle: 'Cadastro de pedidos de compra',
    ledgerDescription:
      'Revise pedidos de compra aprovados, status de recebimento e registros de pagamento. O recebimento liquida o orçamento; pagamentos são registrados independentemente.',
    orderNumber: 'Número do pedido',
    emptyOrders: 'Nenhum pedido de compra no seu escopo',
    pendingPayments: 'Pagamentos pendentes (yuan)',
    paidPayments: 'Valor pago (yuan)',
    receiptDate: 'Data de recebimento',
    acceptedBy: 'Recebimento confirmado por',
    receiptReason: 'Observações do recebimento',
    confirmReceipt: 'Confirmar recebimento',
    cancelOrder: 'Cancelar pedido',
    orderSaved: 'Pedido atualizado',
    unknownOrderAction:
      'O resultado é incerto. O formulário está bloqueado; repetir envia os mesmos dados e ID de requisição.',
    receiptSettlementHint:
      'A confirmação liquida a retenção orçamentária do pedido. Não significa que o fornecedor foi pago. O recebimento confirmado é imutável.',
    cancelOrderHint:
      'Somente administradores de aprovação podem cancelar um pedido não recebido sem valores pendentes ou pagos. O cancelamento libera a retenção orçamentária e registra o motivo.',
    orderStates: {
      awaitingReceipt: 'Aguardando recebimento',
      accepted: 'Recebidos',
      cancelled: 'Cancelado',
    },
    actionTitle: '{{action}} a compra “{{name}}”',
    completed: '{{action}} concluída para a compra “{{name}}”',
    quoteBasisChanged:
      'Os requisitos de compra mudaram. Seus dados de rascunho foram preservados, mas os comprovantes de cotação devem corresponder aos requisitos mais recentes.',
    frozenRules: 'Regras aplicadas no envio',
    frozenRulesHint:
      'Somente valores estritamente acima destes limites exigem os comprovantes de cotação ou etapas de aprovação correspondentes. Alterações posteriores das regras não modificam este envio.',
    ruleLabels: {
      purchase_quotes: 'Limite de cotação de três fornecedores',
      spend_vp: 'Limite de aprovação executiva',
      spend_gm: 'Limite de aprovação da direção geral',
    },
    staleQuoteUpload:
      'A versão do processamento mudou. Atualize a solicitação antes de enviar comprovantes de cotação.',
    ordersTitle: 'Pedidos de compra',
  },
};
