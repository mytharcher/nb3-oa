export default {
  recordName: 'Alteração de pessoal de "{{name}}"',
  namedAction: '{{action}} para "{{name}}"?',
  savedRecord: 'Alteração de pessoal de "{{name}}" salva',

  businessErrors: {
    TRANSFER_INVALID_DATE:
      'Selecione uma data de vigência válida para a alteração de pessoal.',
    TRANSFER_NO_CHANGE:
      'Nenhum detalhe de negócio mudou. Modifique pelo menos um campo permitido.',
    TRANSFER_SALARY_INVALID:
      'Informe um salário válido dentro do intervalo suportado.',
    TRANSFER_RATIO_INVALID:
      'Verifique a proporção de ajuste salarial em relação ao limite configurado.',
    TRANSFER_INVALID_PROMOTION:
      'O nível selecionado não se qualifica como promoção. Verifique os níveis atual e pretendido.',
    TRANSFER_TARGET_DEPARTMENT_UNAVAILABLE:
      'Selecione um departamento de destino ativo.',
    TRANSFER_TARGET_POSITION_UNAVAILABLE:
      'Selecione um cargo ativo no departamento de destino.',
    TRANSFER_ACCOUNT_UNAVAILABLE:
      'Selecione uma conta do quadro de pessoal inicializada correspondente com capacidade suficiente.',
    TRANSFER_YEAR_REBIND_REQUIRED:
      'O ano mudou. Vincule novamente a solicitação à conta anual correspondente do quadro de pessoal.',
    TRANSFER_SOURCE_CHANGED:
      'A atribuição atual do colaborador mudou. Atualize e revise a proposta.',
    TRANSFER_COMPENSATION_CHANGED:
      'O salário do colaborador mudou. Atualize antes de revisar a remuneração.',
    TRANSFER_NOT_DUE: 'A data de vigência não chegou. Aguarde a data agendada.',
    TRANSFER_INVALID_KINDS:
      'Escolha os tipos de alteração de pessoal que correspondem aos campos alterados.',
  },

  moreActions: 'Mais ações',
  return: 'Devolver',
  destructiveConsequence:
    'Esta ação encerra ou altera a aprovação atual. Revise as consequências antes de confirmar.',
  searchPeople: 'Pesquisar nome do candidato',
  title: 'Alterações de pessoal',
  description:
    'Acompanhe a aprovação e a efetivação das alterações de pessoal.',
  create: 'Nova solicitação',
  search: 'Pesquisar por motivo ou ID da solicitação',
  searchEmployees: 'Pesquisar nome ou código de colaborador',
  empty: 'Nenhuma solicitação de alteração de pessoal',
  noResults: 'Nenhuma solicitação correspondente',
  refresh: 'Atualizar',
  clear: 'Limpar filtros',
  allStatuses: 'Todos os status',
  employeeInDetail: 'Ver detalhes',
  salary: 'Salário privado',
  currentSalary: 'Salário atual',
  salaryDenied: 'Você não pode visualizar o salário desta solicitação',
  failedToExecute:
    'A efetivação falhou. Resolva os dados do colaborador ou as contas de capacidade antes de tentar novamente.',
  loading: 'Carregando…',
  saved: 'Operação concluída',
  saving: 'Salvando…',
  save: 'Salvar',
  cancel: 'Cancelar',
  confirm: 'Confirmar ação',
  retry: 'Tentar novamente',
  loadLatest: 'Carregar versão mais recente',
  reviewEditWarning:
    'As alterações reiniciam a aprovação e encerram as tarefas existentes.',
  cancelConsequence:
    'A capacidade permanece alocada até que um RH independente confirme o cancelamento.',
  rebindConsequence:
    'Vincule novamente as contas reais do ano atual. A efetivação permanece aguardando manutenção.',
  confirmAction: 'Revise a solicitação e a ação atuais e forneça um motivo.',
  unavailable: 'A tarefa ou a permissão mudou. Volte aos detalhes e atualize.',
  recipient: 'Destinatário',
  select: 'Selecione uma opção',
  none: 'Nenhum',
  required: 'Este campo é obrigatório',
  tooLong: 'O conteúdo é muito longo',
  noChanges: 'Altere pelo menos um campo permitido',
  capacityResolved:
    'Identidades das contas de capacidade resolvidas. A reserva é validada na transação de aprovação.',
  capacityRequired:
    'Selecione o colaborador, departamento de destino, cargo e data de vigência para resolver as contas reais de capacidade.',
  previous: 'Anterior',
  next: 'Próximo',
  discardTitle: 'Descartar alterações não salvas?',
  discardDescription: 'Sair descartará os dados atuais.',
  keepEditing: 'Continuar editando',
  discard: 'Descartar alterações',

  fields: {
    id: 'ID da solicitação',
    employeeId: 'Colaborador',
    kinds: 'Tipos de alteração',
    targetDepartmentId: 'Departamento de destino',
    targetPositionId: 'Cargo de destino',
    targetGradeId: 'Nível pretendido',
    targetManagerId: 'Gestor de destino',
    effectiveDate: 'Data de vigência',
    targetSalary: 'Salário pretendido (CNY)',
    reason: 'Motivo',
    status: 'Status',
    applicantId: 'Solicitante',
    createdAt: 'Criado em',
  },
  factFields: {
    employee: 'Colaborador',
    department: 'Departamento de destino',
    position: 'Cargo de destino',
    grade: 'Nível pretendido',
    manager: 'Gestor de destino',
  },
  status: {
    completed: 'Vigente',
    draft: 'Rascunho',
    revision: 'Devolvido para revisão',
    manager: 'Revisão do gestor',
    sourceHead: 'Revisão do departamento de origem',
    targetHead: 'Revisão do departamento de destino',
    hr: 'Revisão de RH',
    executive: 'Revisão executiva',
    gm: 'Revisão da direção geral',
    pendingEffective: 'Aguardando efetivação',
    cancellationReview: 'Cancelamento aguardando confirmação',
    executed: 'Vigente',
    cancelled: 'Cancelado',
    rejected: 'Rejeitado',
    withdrawn: 'Retirado',
    terminated: 'Encerrado',
  },
  operations: {
    submit: 'Enviar',
    edit: 'Editar solicitação',
    reviewEdit: 'Revisar campos de análise',
    withdraw: 'Retirar',
    terminate: 'Encerrar',
    requestCancellation: 'Solicitar cancelamento',
    rebind: 'Vincular capacidade do ano atual',
  },
  kinds: {
    transfer: 'Transferir',
    salaryChange: 'Alteração salarial',
    promotion: 'Promoção',
  },
  authz: {
    rebind: 'Vincular capacidade para o ano atual',
    resource: 'Alterações de pessoal',
    view: 'Visualizar solicitações',
    operate: 'Executar ações de aprovação',
    viewSalary: 'Visualizar salário',
    submit: 'Enviar e editar solicitações',
    reviewEdit: 'Revisar campos de análise permitidos',
    cancel: 'Solicitar cancelamento antes da efetivação',
    readable: 'Solicitações próprias e com envolvimento',
  },
  errors: {
    missing: 'Esta solicitação está indisponível. Volte à lista e atualize.',
    conflict:
      'A solicitação mudou. Carregue os detalhes mais recentes e tente novamente.',
    precondition:
      'As condições de negócio estão indisponíveis. Verifique os dados do colaborador e as contas de capacidade.',
    salary:
      'Informe um salário dentro do intervalo permitido com até duas casas decimais.',

    denied: 'Você não tem permissão para esta alteração de pessoal.',
    failed:
      'Não foi possível concluir a alteração de pessoal. Atualize e tente novamente.',
  },
};
