export default {
  budgetAdjustments: {
    businessErrors: {
      BUDGET_ADJUSTMENT_INVALID_ACCOUNT:
        'Selecione um departamento ativo e um exercício orçamentário válido.',
      BUDGET_ADJUSTMENT_INVALID_AMOUNT:
        'Informe um valor positivo para o ajuste e um motivo.',
      BUDGET_ADJUSTMENT_INVALID_SUBJECT:
        'Selecione uma rubrica orçamentária habilitada.',
      BUDGET_ADJUSTMENT_INVALID_TRANSFER:
        'Para uma transferência, use rubricas de origem e destino diferentes. Para um aumento, limpe a rubrica de origem.',
      BUDGET_ADJUSTMENT_INACTIVE_HEAD:
        'O chefe do departamento está indisponível. Peça a um administrador que atualize a atribuição do departamento.',
    },

    authz: {
      resource: 'Ajustes orçamentários',
      submit: 'Enviar um ajuste orçamentário',
      delegate: 'Enviar um ajuste orçamentário por um colaborador',
      view: 'Ler ajustes orçamentários',
    },
    new: 'Novo ajuste orçamentário',
    edit: 'Editar ajuste orçamentário',
    formDescription:
      'Proponha uma transferência entre rubricas ou um orçamento adicional.',
    department: 'Departamento do orçamento',
    yearInvalid: 'Informe um ano inteiro de 1900 a 9999.',
    year: 'Exercício orçamentário',
    type: 'Tipo de ajuste',
    transfer: 'Transferência entre rubricas',
    increase: 'Orçamento adicional',
    targetSubject: 'Rubrica de destino',
    sourceSubject: 'Rubrica de origem',
    amount: 'Valor (yuan)',
    yuan: 'yuan',
    reason: 'Motivo',
    amountInvalid:
      'Informe um valor decimal positivo com até duas casas decimais dentro do limite seguro.',
    sourceInvalid: 'Escolha rubricas de origem e destino diferentes.',
    amountHint:
      'Use yuan decimal. Os valores são armazenados como centavos inteiros exatos.',
    reserveHint:
      'O envio reserva os fundos da origem para uma transferência. O orçamento entra em vigor somente após a aprovação final.',
    revisionHold:
      'A reserva original permanece durante a devolução. Alterar a proposta só a libera e substitui no reenvio.',
    retainedHold:
      'Reserva original atual: {{subject}} · {{amount}} yuan. Esta é separada da proposta revisada.',
    actualHold: 'Reserva atual da origem',
    frozenThreshold:
      'Limite da direção geral enviado para um aumento: {{amount}} yuan (somente estritamente acima dele).',
    applied: 'A aprovação final aplicou este ajuste orçamentário.',
    reserved:
      'Os fundos da origem estão reservados; este ajuste não entrou em vigor.',
    awaitingEffect:
      'Esta proposta não entrou em vigor. O orçamento adicional é aplicado somente após a aprovação final.',
    insufficient:
      'O orçamento da origem tem fundos disponíveis insuficientes. Revise o valor e a origem; seus dados foram mantidos.',
    subjectInactive:
      'Esta rubrica está desabilitada. Escolha uma rubrica ativa antes de enviar.',
    disabled: 'Desativada',
    inactive: 'O solicitante deve ser um colaborador ativo.',
    configuration:
      'Não é possível enviar a aprovação. Entre em contato com um administrador para verificar os prazos de aprovação.',
    invalid: 'Revise a conta, o tipo de ajuste, o valor e o motivo.',
    uncertainCreate:
      'O resultado do salvamento é incerto. Feche e verifique Minhas solicitações antes de criar outro rascunho.',
    stages: {
      head: 'Chefe de departamento',
      finance: 'Gerente financeiro',
      cfo: 'Diretor financeiro',
      gm: 'Diretor geral',
    },
  },
};
