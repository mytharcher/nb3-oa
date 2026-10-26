export default {
  expensePlans: {
    relatedUnavailable: 'Registro relacionado indisponível',
    businessErrors: {
      EXPENSE_PLAN_DEPARTMENT_REQUIRED:
        'O solicitante precisa de um departamento principal ativo. Peça ao RH que atualize o cadastro do colaborador.',
      EXPENSE_PLAN_INVALID_DATE:
        'Selecione uma data prevista de despesa válida.',
      EXPENSE_PLAN_INVALID_DICTIONARY:
        'Selecione um tipo de assunto e uma rubrica orçamentária habilitados.',
      EXPENSE_PLAN_INVALID_INPUT:
        'Informe um valor positivo, os participantes e o motivo da despesa.',
    },

    new: 'Nova pré-aprovação de despesas',
    edit: 'Editar pré-aprovação de despesas',
    formDescription:
      'Planeje recepções, integração de equipe ou eventos antes de gastar.',
    matterType: 'Tipo de assunto',
    subject: 'Rubrica orçamentária',
    amount: 'Despesa estimada (yuan)',
    yuan: 'yuan',
    participants: 'Participantes',
    eventDate: 'Data do evento',
    budgetYear: 'Exercício orçamentário enviado',
    department: 'Departamento principal enviado',
    primaryDepartment:
      'Departamento principal atual: {{department}}. Será verificado novamente no envio.',
    departmentMissing: 'Não configurado',
    departmentPending: 'Determinado no envio',
    departmentUnavailable: 'Departamento indisponível no momento',
    year: 'Exercício orçamentário: {{year}} · calendário da empresa: {{timeZone}}',
    amountHint:
      'Informe yuan decimal; os valores são armazenados como centavos inteiros exatos.',
    amountInvalid:
      'Informe um valor positivo com até duas casas decimais dentro do limite seguro.',
    participantsInvalid: 'Informe um inteiro de 1 a 100000.',
    dateInvalid: 'Escolha uma data válida.',
    disabled: 'Desativada',
    subjectInactive:
      'Escolha um tipo de assunto e uma rubrica orçamentária ativos.',
    optionsEmpty:
      'Um tipo de assunto e uma rubrica orçamentária ativos devem ser configurados antes de salvar.',
    reserveHint:
      'O envio reserva orçamento. A aprovação final concede um limite para reembolso.',
    revisionHold:
      'A reserva orçamentária original é mantida durante a revisão. Só muda no reenvio.',
    retainedHold:
      'Reserva original: {{subject}} · {{amount}} yuan. Esta é separada da proposta revisada.',
    actualHold: 'Reserva na aprovação',
    holdFactHint:
      'Este é o dado da reserva original, não o saldo restante após reembolsos posteriores.',
    frozenThreshold:
      'Limites enviados: executivo > {{vp}} yuan; diretor geral > {{gm}} yuan.',
    applied:
      'Um limite aprovado foi emitido. Isto não indica reembolso ou pagamento.',
    reserved:
      'O orçamento fica reservado enquanto esta solicitação aguarda aprovação.',
    awaitingEffect: 'Nenhum limite aprovado foi emitido para esta solicitação.',
    uncertainCreate:
      'O resultado do salvamento é incerto. Feche e verifique Minhas solicitações antes de criar outro rascunho.',
    unknownEdit:
      'O resultado do salvamento é incerto. Seus dados ficam bloqueados até carregar o registro mais recente.',
    authorization: 'Limite aprovado',
    quotaId: 'Referência do limite',
    grantedAmount: 'Valor concedido',
    quotaState: 'Status do limite',
    deadline: 'Data de vencimento',
    quotaHint:
      'Os reembolsos liquidam este limite. O encerramento ou vencimento não desfaz esta aprovação.',
    mergedTitle: 'Unificação da mesma pessoa',
    quotaStates: { open: 'Abrir', closed: 'Encerrado', expired: 'Expirada' },
    createdBy: 'Criado por',
    authz: {
      resource: 'Pré-aprovação de despesas',
      submit: 'Enviar uma pré-aprovação de despesas',
      delegate: 'Enviar pré-aprovação de despesas por um colaborador',
      view: 'Ler pré-aprovação de despesas',
    },
    stages: {
      head: 'Chefe de departamento',
      finance: 'Financeiro',
      executive: 'Executivo responsável',
      gm: 'Diretor geral',
    },
    states: { approved: 'Limite aprovado emitido' },
    merged:
      'Executivo e diretor geral unificados: a mesma pessoa aprovou em sua própria qualidade.',
    errors: {
      invalid:
        'Revise a data, os participantes, o valor, o tipo de assunto e a rubrica.',
      department: 'O solicitante precisa de um departamento principal ativo.',
      insufficient:
        'Esta conta orçamentária tem fundos disponíveis insuficientes.',
      inactive: 'O solicitante deve ter um cadastro de colaborador ativo.',
      configuration:
        'Não é possível enviar a aprovação. Entre em contato com um administrador para verificar os prazos de aprovação.',
    },
  },
};
