export default {
  budgets: {
    create: 'Criar',

    title: 'Gerenciamento orçamentário',
    description:
      'O financeiro registra orçamentos anuais e alterações manuais auditadas; fundos reservados e utilizados vêm de documentos de negócio.',
    new: 'Novo orçamento anual',
    newDescription:
      'Crie uma conta orçamentária por departamento, ano e rubrica.',
    adjustTitle: 'Ajustar orçamento',
    adjustDescription:
      'Registre uma alteração manual na alocação com um motivo. Reservas e gastos existentes permanecem no razão.',
    detail: 'Conta orçamentária',
    detailDescription: 'Revise saldos e alterações orçamentárias imutáveis.',
    accountTitle: '{{department}} · {{year}} · {{subject}}',
    department: 'Departamento',
    year: 'Ano',
    subject: 'Sujeito',
    allocatedCents: 'Alocado',
    heldCents: 'Reservado',
    usedCents: 'Utilizado',
    availableCents: 'Disponível',
    amount: 'Alocação anual',
    changeAmount: 'Alteração de alocação',
    amountHint: 'Unidades monetárias positivas, com até duas casas decimais.',
    deltaHint:
      'Um valor positivo adiciona fundos; um negativo os reduz. Fundos reservados e utilizados não podem ser removidos.',
    reason: 'Motivo',
    ledger: 'Alterações orçamentárias',
    kind: 'Tipo de alteração',
    at: 'Horário',
    reference: 'Origem',
    actor: 'Operador',
    allocatedDelta: 'Alteração de alocação',
    heldDelta: 'Alteração de reserva',
    usedDelta: 'Alteração de utilização',
    allSubjects: 'Todas as rubricas',
    selectSubject: 'Selecionar um sujeito',
    yearPlaceholder: 'Filtrar por ano',
    refresh: 'Atualizar',
    clear: 'Limpar filtros',
    cancel: 'Cancelar',
    save: 'Salvar',
    adjust: 'Ajustar',
    view: 'Visualizar',
    retry: 'Tentar novamente',
    loading: 'Carregando',
    rowActions: 'Ações de {{name}}',
    saved: 'Orçamento de "{{name}}" salvo',
    currentAccount:
      '{{department}} · {{year}} · {{subject}} · alocado {{amount}}',
    openExisting: 'Abrir conta existente',
    required: 'Preencha este campo obrigatório.',
    invalidYear: 'Informe um ano de 1900 a 9999.',
    invalidAmount:
      'Informe um valor diferente de zero com até duas casas decimais dentro do limite seguro de centavos inteiros.',
    positiveAmount:
      'Informe um valor positivo com até duas casas decimais dentro do limite seguro de centavos inteiros.',
    longReason: 'Mantenha o motivo em até 4.000 caracteres.',
    invalidField: 'Verifique este campo e tente novamente.',
    kinds: {
      consume: 'Liquidação parcial',
      allocate: 'Alocação',
      hold: 'Reserva',
      release: 'Liberado',
      settle: 'Liquidação',
      transferOut: 'Transferido para fora',
      transferIn: 'Transferido para dentro',
    },
    empty: {
      accountsTitle: 'Nenhum orçamento ainda',
      accountsDescription:
        'Crie alocações anuais para habilitar o controle orçamentário.',
      readonlyTitle: 'Nenhum orçamento ainda',
      readonlyDescription:
        'Peça ao financeiro que informe os orçamentos anuais.',
      filteredTitle: 'Nenhum orçamento correspondente',
      filteredDescription:
        'Limpe ou altere os filtros para encontrar uma conta.',
      ledgerTitle: 'Nenhuma alteração ainda',
      ledgerDescription:
        'As alterações orçamentárias aparecerão aqui quando registradas.',
    },
    error: {
      failed:
        'Não foi possível carregar ou salvar o orçamento. Tente novamente com os mesmos dados.',
      forbidden:
        'Você não tem permissão de orçamento. Entre em contato com um administrador.',
      missing: 'Este orçamento não existe mais. Volte à lista.',
      BUDGET_NOT_FOUND: 'Este orçamento não existe mais. Volte à lista.',
      BUDGET_ALREADY_EXISTS:
        'Já existe um orçamento para esta conta. Abra-o e use Ajustar.',
      BUDGET_IDEMPOTENCY_CONFLICT:
        'Esta chave de requisição já identifica outra alteração. Revise seus dados e salve novamente.',
      BUDGET_INSUFFICIENT:
        'O ajuste deixaria um orçamento disponível insuficiente. Reduza a diminuição.',
      BUDGET_INVALID_DEPARTMENT: 'Selecione um departamento ativo.',
      BUDGET_INVALID_SUBJECT: 'Selecione uma rubrica orçamentária ativa.',
      BUDGET_INVALID_AMOUNT:
        'Verifique o valor e use no máximo duas casas decimais.',
      BUDGET_INVALID_COMMAND:
        'Verifique o motivo obrigatório e os detalhes da solicitação.',
      BUDGET_INVALID_ACCOUNT: 'Verifique o departamento, o ano e a rubrica.',
      BUDGET_INVALID_PAGE: 'Verifique a página e o tamanho da página.',
      invalid:
        'Verifique os campos obrigatórios e corrija os valores destacados.',
    },
    authz: {
      title: 'Gerenciamento orçamentário',
      read: 'Ler contas e alterações orçamentárias',
      update: 'Criar orçamentos e registrar ajustes manuais',
      permissionSet: 'Gerenciamento financeiro de orçamentos',
    },
  },
};
