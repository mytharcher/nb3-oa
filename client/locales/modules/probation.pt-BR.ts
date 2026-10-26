export default {
  probationRequests: {
    businessErrors: {
      PROBATION_SELF_EVALUATION_REQUIRED:
        'Informe a autoavaliação do colaborador antes de enviar.',
      PROBATION_CONCLUSION_REQUIRED:
        'Informe a conclusão do gestor antes de aprovar.',
      PROBATION_COMPENSATION_REQUIRED:
        'Preencha as informações protegidas de nível e salário no formulário de aprovação de RH.',
      PROBATION_INVALID_GRADE: 'Selecione um nível habilitado.',
      PROBATION_ALREADY_ACTIVE:
        'Este colaborador já possui uma solicitação de experiência ativa. Abra a solicitação existente.',
      PROBATION_STALE_EMPLOYEE:
        'As informações de experiência do colaborador mudaram. Atualize antes de agir novamente.',
      PROBATION_DEPARTMENT_REQUIRED:
        'O colaborador precisa de um departamento principal ativo. Peça ao RH que atualize o registro.',
    },

    title: 'Solicitações de experiência',
    description:
      'Revise avaliações de experiência e acompanhe a decisão de efetivação.',
    new: 'Nova solicitação de experiência',
    edit: 'Editar',
    details: 'Visualizar detalhes',
    number: 'Número',
    employee: 'Colaborador',
    probationEndDate: 'Fim do período de experiência',
    conclusion: 'Conclusão',
    search: 'Pesquisar número, nome do colaborador ou autoavaliação',
    view: 'Visualização do registro',
    allStatuses: 'Todos os status',
    refresh: 'Atualizar',
    clearFilters: 'Limpar filtros',
    emptyTitle: 'Nenhuma solicitação de experiência ainda',
    emptyDescription:
      'Os colaboradores recebem rascunhos do sistema perto do vencimento. O RH pode criar uma avaliação para um colaborador em experiência.',
    noResults: 'Nenhuma solicitação correspondente',
    rowActions: 'Ações de {{name}}',
    views: {
      mine: 'Minhas',
      pending: 'Pendente',
      done: 'Concluído',
      copied: 'Copiado',
    },
    conclusions: {
      regular: 'Efetivar',
      deferred: 'Prorrogar experiência',
      declined: 'Recusar efetivação',
    },
    statuses: {
      draft: 'Rascunho',
      revision: 'Revisão',
      manager: 'Revisão do gestor',
      head: 'Revisão do departamento',
      hr: 'Revisão de RH',
      gm: 'Revisão da direção geral',
      approved: 'Aprovado',
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
        'Esta avaliação mudou. Leia o registro mais recente antes de agir novamente.',
      invalid: 'Verifique o conteúdo da avaliação e os campos obrigatórios.',
      failed: 'A requisição não foi concluída. Tente novamente.',
      departureUnavailable:
        'O fluxo de desligamento está indisponível; esta ação não foi concluída. A revisão da direção geral permanece pendente.',
    },
    detail: {
      creator: 'Criado por',
      selfEvaluation: 'Autoavaliação',
      evaluation: 'Avaliação do gestor',
      deferredTo: 'Nova data final da experiência',
      grade: 'Nível',
      manager: 'Revisor gestor',
      head: 'Revisor do departamento',
      hr: 'Revisor de RH',
      gm: 'Revisor da direção geral',
      rules: 'Regras congeladas',
      unsubmitted: 'As regras são congeladas no envio.',
    },
    rules: {
      grade_managerRank: 'Limite do nível gerencial',
      sla_remindHours: 'Horas úteis para lembrete',
      sla_escalateHours: 'Horas úteis para escalonamento',
      sla_urgeCooldownHours: 'Horas de intervalo entre lembretes',
    },
    compensation: {
      title: 'Proposta privada de remuneração',
      denied: 'Você não pode visualizar a remuneração.',
      missing: 'Nenhuma proposta de remuneração foi salva.',
      grade: 'Nível proposto',
      salary: 'Salário base (yuan)',
    },
    authz: {
      resource: 'Avaliações de experiência',
      submit: 'Editar e enviar avaliação de experiência',
      delegate: 'RH cria avaliações de experiência',
      view: 'Ler avaliações de experiência autorizadas',
      compensation: 'Acessar remuneração privada da experiência',
    },
    schedule: {
      title: 'Lembretes do fim do período de experiência',
      description:
        'Concilie as datas de experiência no horário da empresa, crie rascunhos de autoavaliação 14 dias antes do vencimento e notifique os colaboradores.',
    },
  },
};
