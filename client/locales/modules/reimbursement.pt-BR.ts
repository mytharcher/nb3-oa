import actionCopy from './reimbursement-actions.pt-BR.js';
import formCopy from './reimbursement-forms.pt-BR.js';
export default {
  reimbursementRequests: {
    relatedUnavailable: 'Registro relacionado indisponível',
    categoryUnavailable: 'Categoria indisponível',

    businessErrors: {
      REIMBURSEMENT_INVALID_LINE_AMOUNT:
        'Cada linha de despesa deve ter um valor positivo dentro do intervalo suportado.',
      REIMBURSEMENT_INVALID_LINE_DATE:
        'Selecione uma data de despesa válida para cada linha.',
      REIMBURSEMENT_VOUCHER_REQUIRED:
        'Informe o número do comprovante antes de confirmar o pagamento.',
      REIMBURSEMENT_PAYMENT_CONFIRMATION_REQUIRED:
        'Informe um motivo e confirme o total exato do reembolso, a compensação de empréstimo e o pagamento em dinheiro.',
      REIMBURSEMENT_HANDLING_REASON_REQUIRED:
        'Informe o motivo pelo qual o pagamento não pôde ser concluído.',
      REIMBURSEMENT_PAYMENT_ACCOUNT_STALE:
        'A conta de pagamento mudou. Carregue a conta mais recente antes de corrigi-la.',
      REIMBURSEMENT_AUTHORIZATION_CHANGED:
        'O limite aprovado mudou. Atualize-o e verifique o total do reembolso.',
      REIMBURSEMENT_INVOICES_CHANGED:
        'Os comprovantes de notas fiscais mudaram. Atualize a solicitação e selecione novamente as notas disponíveis.',
      REIMBURSEMENT_LOAN_CHANGED:
        'A compensação de empréstimo mudou. Atualize o empréstimo e confirme o valor da compensação.',
      REIMBURSEMENT_TOTAL_TOO_LARGE:
        'O total das despesas excede o valor suportado. Reduza o total ou divida a solicitação.',
      REIMBURSEMENT_FILE_SIZE:
        'Selecione um anexo não vazio de no máximo 5 MB.',
      REIMBURSEMENT_FILE_TYPE:
        'Envie um arquivo PDF, JPEG, PNG ou WebP com o tipo de arquivo correspondente.',
    },

    ...formCopy,
    ...actionCopy,
    title: 'Reembolsos de despesas',
    description:
      'Revise comprovantes de despesas e acompanhe aprovações de linhas e processamento de pagamentos.',
    new: 'Novo reembolso',
    edit: 'Editar reembolso',
    details: 'Visualizar detalhes',
    number: 'Número',
    reason: 'Motivo',
    gross: 'Reembolso bruto',
    offset: 'Compensação de empréstimo',
    net: 'Dinheiro líquido',
    search: 'Pesquisar número, motivo ou solicitante',
    view: 'Visualização do registro',
    allStatuses: 'Todos os status',
    refresh: 'Atualizar reembolsos',
    clearFilters: 'Limpar filtros',
    emptyTitle: 'Nenhum reembolso ainda',
    emptyDescription:
      'Crie um rascunho e adicione linhas de despesas e comprovantes.',
    noResults: 'Nenhum reembolso correspondente. Ajuste os filtros.',
    rowActions: 'Ações de {{name}}',
    views: {
      mine: 'Minhas',
      pending: 'Pendente',
      done: 'Concluído',
      copied: 'Copiado',
    },
    statuses: {
      draft: 'Rascunho',
      revision: 'Revisão',
      manager: 'Revisão do gestor',
      head: 'Revisão do departamento',
      finance: 'Revisão financeira',
      executive: 'Revisão executiva',
      gm: 'Revisão da direção geral',
      cashier: 'Processamento do caixa',
      exception: 'Exceção de processamento',
      paid: 'Pago',
      forcedPaid: 'Liquidação registrada administrativamente',
      rejected: 'Rejeitado',
      withdrawn: 'Retirado',
      terminated: 'Encerrado',
    },
    errors: {
      invoiceDuplicate:
        'Os números das notas fiscais devem ser únicos neste reembolso. Verifique cada linha de despesa.',
      overrunReasonRequired:
        'Os pedidos cumulativos excedem o limite aprovado vinculado em mais de 20%. Informe uma justificativa de excesso.',
      invoiceUnavailable:
        'A nota fiscal está reservada ou utilizada por outro reembolso. Verifique o número da nota e a solicitação.',
      paymentAccountRequired:
        'A conta de pagamento do colaborador está incompleta. Peça ao RH que complete o banco, o número da conta e o titular antes do envio.',
      employeeInactive:
        'O solicitante precisa de um perfil de colaborador ativo. Entre em contato com RH para verificá-lo.',
      departmentRequired:
        'O solicitante não tem departamento principal ativo. Peça ao RH ou a um administrador da organização que atribua um.',
      categoryInvalid:
        'Uma categoria de despesa está inativa ou indisponível. Escolha uma categoria ativa para cada linha.',
      sourceInvalid:
        'O limite vinculado está indisponível, não aprovado ou pertence a outro solicitante. Verifique a solicitação vinculada.',
      sourceRebind:
        'Um reembolso enviado não pode alterar seu limite ou empréstimo vinculado. Mantenha os vínculos originais.',
      loanRequired:
        'Selecione um empréstimo para a compensação ou informe 0 se nenhum empréstimo for compensado.',
      loanInvalid:
        'O empréstimo selecionado está indisponível ou pertence a outro solicitante. Escolha outro empréstimo.',
      loanInsufficient:
        'O saldo disponível do empréstimo é insuficiente. Reduza a compensação e verifique o saldo.',
      invalidOffset:
        'A compensação do empréstimo não pode exceder o total do reembolso. Verifique os valores.',
      attachmentInvalid:
        'Alguns comprovantes estão indisponíveis ou pertencem a outro reembolso. Selecione ou envie comprovantes para esta solicitação.',
      slaConfiguration:
        'Os prazos de aprovação não são suportados. Entre em contato com o administrador de fluxos de trabalho.',
      inputInvalid:
        'Informe um motivo de reembolso e complete linhas de despesas distintas com comprovantes.',
      configuration:
        'A estrutura de dados de reembolso está incompleta. Peça ao administrador do sistema que a repare antes de tentar novamente.',
      forbidden: 'Você não pode acessar este reembolso.',
      notFound: 'Este reembolso não existe mais.',
      conflict:
        'Este reembolso mudou. Recarregue e revise antes de agir novamente.',
      standardReason:
        'Justifique cada linha de um dia que exceda o padrão aprovado.',
      standardCategoryChanged:
        'Esta categoria está fora da política original. Crie uma nova solicitação para usar a política atual.',
      standardConfiguration:
        'O padrão de viagem aprovado está incompleto. Peça a um administrador que verifique a configuração.',
      invalid:
        'Verifique o conteúdo do reembolso e os comprovantes obrigatórios.',
      failed: 'A requisição não foi concluída. Tente novamente.',
    },
    standard: {
      title: 'Política de despesas congelada',
      unsubmitted: 'A política é congelada no primeiro envio.',
      frozenHint:
        'Estas classificações salvas e limites de viagem aprovados permanecem inalterados na revisão. Os valores diários são agregados por tipo de padrão.',
      gradeCode: 'Nível de viagem',
      gradeRank: 'Classificação do nível',
      lodging: 'Hospedagem por noite (yuan)',
      allowance: 'Diária por dia (yuan)',
      notApplicable:
        'Nenhum padrão de viagem aprovado se aplica a esta solicitação.',
      kinds: {
        none: 'Sem limite diário de viagem',
        lodging: 'Limite diário de hospedagem',
        allowance: 'Limite diário de diária',
      },
    },
    detail: {
      lines: 'Linhas de despesas',
      failure: 'Falha no processamento',
      voucher: 'Comprovante de pagamento',
      forcedReason: 'Motivo da liquidação administrativa',
      noLines: 'Nenhuma linha de despesa ainda.',
      line: 'Linha de despesa {{number}}',
      financeResult: 'Resultado financeiro',
      lineStates: {
        approved: 'Aprovado',
        returned: 'Devolvido para correção',
        pending: 'Revisão pendente',
      },
    },
    bank: {
      title: 'Conta de pagamento privada',
      bankName: 'Banco',
      bankAccount: 'Conta bancária',
      bankAccountName: 'Titular da conta',
      missing: 'Nenhuma conta de pagamento salva.',
      correct: 'Corrigir conta de pagamento',
      saved: 'Conta de pagamento corrigida',
      denied: 'Acesso à conta de pagamento negado.',
      unavailable:
        'A correção da conta está indisponível. Recarregue este reembolso e verifique a conta salva.',
    },
    authz: {
      resource: 'Reembolsos de despesas',
      submit: 'Criar e enviar meus reembolsos',
      delegate: 'Criar reembolsos para colaboradores',
      view: 'Visualizar reembolsos',
      paymentAccount: 'Ler e corrigir contas de pagamento autorizadas',
    },
  },
};
