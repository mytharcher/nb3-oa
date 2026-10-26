export default {
  recruitment: {
    authz: {
      reviewEdit: 'Modificar campos permitidos do revisor',
      resource: 'Solicitações de recrutamento',
      requisitions: 'Alocações de recrutamento',
      view: 'Visualizar recrutamento',
      submit: 'Criar e enviar recrutamento',
      operate: 'Atuar nas aprovações de recrutamento',
      viewSalary: 'Visualizar faixa salarial privada',
      close: 'Encerrar alocação restante de recrutamento',
    },
    identityUnavailable: 'Nome da organização indisponível',
    catalogRequired:
      'Carregue os nomes do departamento e do cargo antes de encerrar esta alocação.',
    requisitionName:
      '{{year}} / {{department}} / {{position}} requisição de recrutamento',
    preciseAllocationName:
      '{{year}} / {{department}} / {{position}} alocação de recrutamento',

    savedRecord: 'Recrutamento de "{{name}}" salvo',

    allocationName: 'Alocação de recrutamento de {{year}}',

    yearInvalid: 'Informe um ano inteiro entre 1900 e 9999.',
    businessErrors: {
      RECRUITMENT_INVALID_QUANTITY:
        'Informe uma quantidade inteira positiva de contratações dentro do intervalo suportado.',
      RECRUITMENT_INVALID_SALARY:
        'Informe uma faixa salarial válida com mínimo não superior ao máximo.',
      RECRUITMENT_INVALID_REPLACEMENTS:
        'Selecione substituídos em desligamento ou desligados correspondentes à quantidade de recrutamento.',
      RECRUITMENT_REPLACEMENT_UNAVAILABLE:
        'Um substituído não é mais elegível. Atualize e selecione um substituído elegível.',
      RECRUITMENT_ACCOUNT_MISMATCH:
        'A conta do quadro de pessoal deve corresponder ao departamento, cargo e ano.',
      RECRUITMENT_YEAR_MISMATCH:
        'O ano do quadro de pessoal mudou. Selecione a conta anual correspondente.',
      RECRUITMENT_DEPARTMENT_UNAVAILABLE: 'Selecione um departamento ativo.',
      RECRUITMENT_POSITION_UNAVAILABLE:
        'Selecione um cargo ativo no departamento escolhido.',
      RECRUITMENT_GRADE_UNAVAILABLE: 'Selecione um nível habilitado.',
      RECRUITMENT_GRADE_SNAPSHOT_MISMATCH:
        'O nível mudou. Atualize e verifique a faixa salarial antes de reenviar.',
      RECRUITMENT_RESERVATION_UNAVAILABLE:
        'Nenhuma reserva de quadro de pessoal utilizável disponível. Atualize a conta e verifique a capacidade.',
      RECRUITMENT_REQUISITION_ALREADY_PUBLISHED:
        'Esta requisição de recrutamento já foi publicada. Atualize para ver o status.',
      RECRUITMENT_INVALID_INPUT:
        'Preencha departamento, cargo, nível, quantidade, data inicial, descrição do cargo e motivo.',
    },

    capacityEmpty:
      'Nenhum quadro anual de pessoal inicializado correspondente. Peça ao RH que o crie e inicialize.',
    capacitySelectTarget: 'Selecione primeiro um departamento, cargo e ano.',
    capacityLedger: 'Visualizar quadro de pessoal',

    title: 'Solicitações de recrutamento',
    requisitions: 'Requisições',
    new: 'Nova solicitação de recrutamento',
    detailTitle: 'Solicitação de recrutamento · {{name}}',
    detail: 'Solicitação de recrutamento',
    search: 'Pesquisar descrição do cargo ou motivo',
    all: 'Todos os status',
    clear: 'Limpar filtros',
    empty: 'Nenhuma solicitação de recrutamento ainda',
    filteredEmpty: 'Nenhuma solicitação corresponde a estes filtros',
    emptyRequisitions: 'Nenhuma requisição autorizada',
    cancel: 'Cancelar',
    save: 'Salvar solicitação de recrutamento',
    saved: 'Operação de recrutamento salva',
    refresh: 'Atualizar',
    retry: 'Tentar novamente',
    loadLatest: 'Carregar dados mais recentes',
    noAccess: 'Você não tem acesso a este registro.',
    fieldsRestricted: 'Os campos obrigatórios são restritos.',
    missing: 'Este registro está indisponível.',
    conflict:
      'Este registro mudou. Carregue os dados mais recentes e tente novamente.',
    invalid:
      'Preencha os campos obrigatórios e selecione uma conta de capacidade inicializada. Verifique a quantidade de reposições e a faixa salarial.',
    failed: 'A operação falhou. Tente novamente.',
    notAvailable:
      'Esta operação não está mais disponível com suas permissões atuais.',
    commandReason: 'Motivo desta operação',
    replacementNote:
      'Somente identidades autorizadas atuais em desligamento/desligadas são listadas. O envio verifica a elegibilidade real de capacidade.',
    unknown:
      'O resultado é incerto. Repita o comando exato para confirmar o resultado.',
    retryExact: 'Repetir comando exato',
    progress: 'Progresso da aprovação',
    timeline: 'Linha do tempo',
    recipient: 'Destinatário',
    candidatesFailed:
      'Não foi possível carregar destinatários. Tente novamente ou atualize os detalhes da aprovação e repita.',
    noCandidates:
      'Nenhum destinatário atende aos requisitos atuais de aprovação.',
    actionInvalid:
      'Informe um motivo e selecione o destinatário, a etapa de devolução, o modo de assinatura ou a posição exigida por esta ação.',
    recipientSearch: 'Pesquisar destinatários elegíveis',
    moreCandidates: 'Carregar mais destinatários',
    returnTarget: 'Devolver à etapa',
    signerMode: 'Ordem de assinatura',
    place: 'Assento não atribuído',
    confirmAction: '{{action}} para {{id}}?',
    actionConsequence: 'Esta operação altera a aprovação ou alocação atual.',
    closeConsequence:
      'Somente a alocação de recrutamento restante não consumida é liberada. O histórico de colaboradores consumido permanece.',
    discard: 'Descartar alterações não salvas?',
    discardDescription: 'As alterações deste formulário serão perdidas.',
    discardConfirm: 'Descartar alterações',
    fields: {
      requisitionTitle: 'Título da requisição',
      id: 'Identificador',
      requisitionId: 'ID da requisição',
      requestId: 'ID da solicitação de origem',
      departmentId: 'Departamento',
      positionId: 'Cargo',
      gradeId: 'Nível',
      accountId: 'Quadro anual de pessoal',
      year: 'Ano da capacidade',
      quantity: 'Quantidade',
      kind: 'Tipo de contratação',
      replacementEmployeeIds: 'Colaboradores substituídos',
      minimumCents: 'Salário mínimo',
      maximumCents: 'Salário máximo',
      expectedStartDate: 'Data prevista de início',
      jobDescription: 'Descrição do cargo',
      reason: 'Motivo de negócio',
      applicant: 'Solicitante',
      status: 'Status',
      createdAt: 'Criado em',
      statusChangedAt: 'Status atualizado em',
      sourceYear: 'Ano de origem',
      sourceVersion: 'Versão de origem',
      originalQuantity: 'Quantidade aprovada',
      remaining: 'Restante',
      consumed: 'Consumido',
    },
    actions: {
      submit: 'Enviar',
      withdraw: 'Retirar',
      terminate: 'Encerrar',
      edit: 'Editar rascunho',
      reviewEdit: 'Alterar campos do revisor',
      approve: 'Aprovar',
      reject: 'Rejeitar',
      return: 'Devolver',
      comment: 'Comentário',
      appoint: 'Designar',
      reassign: 'Reatribuir',
      read: 'Marcar como lido',
      transfer: 'Transferir',
      addSigner: 'Adicionar signatário',
      urge: 'Cobrar',
      cc: 'Destinatário da cópia',
      close: 'Encerrar alocação restante',
    },
    status: {
      draft: 'Rascunho',
      revision: 'Revisão',
      head: 'Chefe de departamento',
      hrbp: 'Parceiro de negócios de RH',
      hrDirector: 'Diretor de RH',
      executive: 'Executivo',
      gm: 'Diretor geral',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      withdrawn: 'Retirado',
      terminated: 'Encerrado',
      recruiting: 'Recrutando',
      full: 'Recrutamento concluído',
      closed: 'Encerrado',
    },
    kinds: {
      additional: 'Quadro de pessoal adicional',
      replacement: 'Reposição',
    },
    modes: {
      before: 'Antes',
      after: 'Depois',
      alongside: 'Em paralelo',
    },
  },
};
