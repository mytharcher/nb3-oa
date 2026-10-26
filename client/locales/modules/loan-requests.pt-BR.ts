export default {
  loanRequests: {
    relatedUnavailable: 'Registro relacionado indisponível',
    rowActions: 'Ações de {{name}}',
    description: 'Gerencie solicitações de empréstimo, pagamentos e quitações.',

    saved: 'Solicitação de empréstimo "{{name}}" salva',
    submitted: 'Solicitação de empréstimo "{{name}}" enviada',
    cashRecorded: 'Quitação em dinheiro de "{{name}}" registrada',
    repaymentConfirmed: 'Quitação "{{receipt}}" confirmada',
    repaymentCancelled: 'Quitação "{{receipt}}" cancelada',
    confirmRepaymentTitle: 'Confirmar quitação "{{receipt}}"?',
    cancelRepaymentTitle: 'Cancelar quitação "{{receipt}}"?',

    businessErrors: {
      LOAN_REQUEST_DEPARTMENT_REQUIRED:
        'O solicitante precisa de um departamento principal ativo. Peça ao RH que atualize o cadastro do colaborador.',
      LOAN_REQUEST_INVALID_DATE:
        'A data de vencimento da quitação deve ser hoje ou posterior no fuso horário da empresa.',
      LOAN_REQUEST_INVALID_TRAVEL:
        'Selecione sua própria viagem aprovada vigente.',
      LOAN_REQUEST_INVALID_INPUT:
        'Informe um motivo para o empréstimo e um valor positivo.',
      LOAN_REQUEST_NOT_PAID:
        'Este empréstimo não foi pago. A quitação só pode ser registrada após o pagamento.',
      LOAN_REQUEST_REPAYMENT_INPUT_INVALID:
        'Informe o comprovante e o motivo da quitação.',
    },

    loadLatest: 'Carregar dados mais recentes',
    latestFacts:
      'Versão {{version}} · {{amount}} yuan · vence em {{date}} · finalidade: {{reason}}',
    adoptVersion: 'Manter meus dados e usar esta versão',
    noLongerEditable: 'Esta solicitação não pode mais ser editada.',
    invalidDate: 'Escolha uma data atual ou futura do calendário da empresa.',
    number: 'Referência',
    more: 'Mais ações',
    confirm: 'Confirmar',
    operationLabels: {
      complete: 'Concluir pagamento',
      unable: 'Pagamento falhou',
      retryCash: 'Repetir pagamento',
      claim: 'Assumir processamento',
      release: 'Liberar processamento',
      assign: 'Atribuir responsável',
    },
    confirmRetry:
      'Atualize os dados de sua conta bancária e devolva esta solicitação aprovada ao caixa.',
    confirmPayment:
      'Confirme que o pagamento foi efetivamente concluído com este comprovante. Isto cria a dívida do tomador.',
    confirmUnable:
      'Registre a exceção de pagamento e o motivo. O valor aprovado permanece reservado.',
    receipt: 'Referência do comprovante',
    actions: 'Ações',
    bank: 'Conta de pagamento protegida',
    hideBank: 'Ocultar conta de pagamento',
    showBank: 'Mostrar conta de pagamento',
    bankRestricted:
      'Somente o tomador e os papéis financeiros explicitamente autorizados podem ler a conta de pagamento.',
    bankName: 'Banco',
    bankHolder: 'Titular da conta',
    bankAccount: 'Número da conta bancária',
    loadingBank: 'Carregando conta de pagamento…',
    bankNotSnapshot: 'Nenhuma conta de pagamento foi capturada ainda.',
    recordCash: 'Registrar quitação em dinheiro',
    invalidRepaymentAmount:
      'Não foi possível ler os valores de quitação. Entre em contato com o financeiro para verificar este registro.',
    noRepayments: 'Nenhum registro de quitação',
    loading: 'Carregando…',
    confirmRepayment: 'Confirmar quitação',
    cancelRepayment: 'Cancelar comprovante pendente',
    confirmReason: 'O tomador confirmou a quitação em dinheiro',
    cancelReason: 'O caixa cancelou o comprovante de dinheiro pendente',
    confirmCashWarning:
      'Confirme o comprovante {{receipt}} de {{amount}} yuan. Isto reduz sua dívida e não pode ser desfeito.',
    cancelCashWarning:
      'Cancele o comprovante {{receipt}} de {{amount}} yuan. Sua dívida pendente permanece inalterada.',
    cashRestricted:
      'Somente um caixa pode registrar quitações de um empréstimo pago.',
    repaymentStates: {
      pending: 'Aguardando confirmação',
      settled: 'Confirmado',
      cancelled: 'Cancelado',
    },
    department: 'Departamento',
    yuan: 'yuan',
    inflight: 'Reservado contra o limite de empréstimos: {{amount}} yuan',
    quotaFact:
      'Dados do envio: dívida {{debt}}, outras solicitações {{inflight}}, total incluindo esta solicitação {{total}} yuan.',
    principal: 'Principal original',
    repaid: 'Quitado',
    outstanding: 'Dívida pendente',
    pendingRepayment: 'Reservas de quitação pendentes',
    pendingHint:
      'Confirmações pendentes de dinheiro e compensações de reembolso não reduzem a dívida pendente.',
    edit: 'Editar rascunho de empréstimo',
    invalidAmount: 'Informe um valor positivo com até duas casas decimais.',
    invalidTravel: 'Escolha sua própria solicitação de viagem aprovada ativa.',
    readOnly: 'Você não tem permissão para editar este rascunho.',
    bankMissing:
      'Sua conta de pagamento está incompleta. Atualize-a antes de o caixa concluir o pagamento.',
    conflict:
      'A solicitação mudou. Abra os detalhes atuais antes de editar novamente.',
    amountHint:
      'Os valores usam centavos exatos; no máximo duas casas decimais.',
    companyDate: 'Data do calendário no fuso horário da empresa: {{zone}}',
    noTravel: 'Sem vínculo de viagem',
    search: 'Número, finalidade ou solicitante',
    allStatuses: 'Todos os status',
    view: 'Lista de trabalho',
    filteredEmpty: 'Nenhuma solicitação de empréstimo correspondente',
    empty: 'Nenhuma solicitação de empréstimo',
    emptyHint:
      'Crie uma solicitação de empréstimo para financiar necessidades de negócio aprovadas.',
    clear: 'Limpar filtros',
    states: {
      draft: 'Rascunho',
      revision: 'Devolvido para revisão',
      manager: 'Revisão do gestor',
      head: 'Revisão do chefe de departamento',
      finance: 'Revisão financeira',
      executive: 'Revisão da vice-presidência',
      gm: 'Revisão da direção geral',
      cashier: 'Aguardando pagamento',
      exception: 'Exceção de pagamento',
      paid: 'Pago',
      rejected: 'Rejeitado',
      withdrawn: 'Retirado',
      terminated: 'Encerrado',
    },
    stages: {
      draft: 'Rascunho',
      revision: 'Devolvido para revisão',
      manager: 'Revisão do gestor',
      head: 'Revisão do chefe de departamento',
      finance: 'Revisão financeira',
      executive: 'Revisão da vice-presidência',
      gm: 'Revisão da direção geral',
      cashier: 'Aguardando pagamento',
      exception: 'Exceção de pagamento',
      paid: 'Pago',
      rejected: 'Rejeitado',
      withdrawn: 'Retirado',
      terminated: 'Encerrado',
    },
    errors: {
      inactive: 'É necessário um cadastro de colaborador ativo.',
      configuration:
        'Não é possível enviar a aprovação. Entre em contato com um administrador para verificar os prazos de aprovação.',
      invalid: 'Verifique os campos de entrada e tente novamente.',
      quota: 'O limite pessoal de empréstimos seria excedido.',
      overdue: 'Quite sua dívida vencida antes de solicitar outro empréstimo.',
    },
    authz: {
      ownedScope: 'Solicitações que fiz ou criei',
      resource: 'Solicitações de empréstimo',
      submit: 'Enviar próprias solicitações de empréstimo',
      delegate: 'Criar solicitações de empréstimo para colaboradores',
      view: 'Ler solicitações de empréstimo',
      payment: 'Ler detalhes protegidos de pagamento de empréstimos',
      cashRepayment: 'Registrar e cancelar quitações em dinheiro',
      confirmRepayment: 'Confirmar próprias quitações em dinheiro',
      collection: 'Solicitações de empréstimo',
    },
    title: 'Solicitações de empréstimo',
    new: 'Nova solicitação de empréstimo',
    reason: 'Finalidade do empréstimo',
    amount: 'Valor do empréstimo (yuan)',
    dueDate: 'Data de quitação',
    travel: 'Solicitação de viagem vinculada',
    status: 'Status',
    refresh: 'Atualizar',
    loan: 'Saldo do empréstimo',
    repayment: 'Quitação em dinheiro',
    voucher: 'Comprovante de pagamento',
  },
};
