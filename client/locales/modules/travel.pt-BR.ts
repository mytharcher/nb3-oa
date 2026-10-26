export default {
  travel: {
    fieldInvalid: 'Verifique {{field}}.',

    confirmRetryBooking: 'Repetir a reserva desta viagem aprovada?',
    confirmReviseTrip: 'Revisar esta viagem e reiniciar sua aprovação?',
    states: {
      completed: 'Concluído',
      cancelled: 'Cancelado',
      exception: 'Exceção de reserva',
    },
    businessErrors: {
      TRAVEL_ITINERARY_REQUIRED:
        'Viagens internacionais exigem um anexo de itinerário. Envie ou selecione um antes de enviar a solicitação.',
      TRAVEL_OVERLAP:
        'Este período se sobrepõe a uma viagem aprovada. Ajuste as datas da viagem.',
      TRAVEL_COMPANIONS_INVALID:
        'Selecione acompanhantes distintos e diferentes do solicitante.',
      TRAVEL_COMPANION_INACTIVE:
        'Um viajante selecionado não está mais ativo. Selecione colaboradores atuais novamente.',
      TRAVEL_DEPARTMENT_REQUIRED:
        'O solicitante precisa de um departamento principal ativo. Peça ao RH que atualize o cadastro do colaborador.',
      TRAVEL_INVALID_DATE:
        'O término da viagem deve ser posterior ao início. Verifique as datas e os horários.',
      TRAVEL_INVALID_INPUT:
        'Preencha o destino e o motivo e informe custos de viagem não negativos válidos.',
    },

    requestLoan: 'Solicitar empréstimo vinculado',
    reviseTrip: 'Revisar viagem e reiniciar aprovação',
    revisionWarning:
      'A revisão encerra o limite antigo de reembolso e a atividade antiga de frequência antes de nova aprovação. O principal dos empréstimos existentes e as datas originais de vencimento permanecem inalterados; trate os empréstimos separadamente.',
    cancelTrip: 'Solicitar cancelamento de viagem',
    complete: 'Concluir reserva',
    unable: 'Não é possível reservar',
    forceComplete: 'Forçar encerramento da reserva',
    retryBooking: 'Repetir reserva',
    standard: 'Padrão de viagem congelado',
    lodgingPerNight: 'Padrão de hospedagem por noite (yuan)',
    allowancePerDay: 'Padrão de diária por dia (yuan)',
    companions: 'Acompanhantes',
    addCompanion: 'Adicionar acompanhante',
    removeCompanion: 'Remover',
    companionsInvalid: 'Os acompanhantes devem ser distintos',
    peopleUnavailable:
      'Suas permissões não permitem pesquisar colaboradores. Entre em contato com um administrador.',
    destination: 'Destino',
    international: 'Viagem internacional',
    needsBooking: 'Reserva administrativa',
    needsLoan: 'Empréstimo solicitado',
    transportCents: 'Transporte',
    lodgingCents: 'Hospedagem',
    allowanceCents: 'Diária',
    bookingInformation: 'Detalhes da reserva',
    exceptionReason: 'Motivo da exceção',
    cc: 'Adicionar destinatário de cópia',
    authz: {
      resource: 'Solicitações de viagem',
      submit: 'Enviar solicitação de viagem',
      delegate: 'Enviar em nome de um colaborador',
      view: 'Visualizar solicitações de viagem',
    },
    new: 'Nova solicitação de viagem',
    edit: 'Editar solicitação de viagem',
    formDescription: 'Solicite uma viagem a trabalho.',
    name: 'Nome da viagem',
    institution: 'Instituição',
    startAt: 'Início em',
    endAt: 'Fim em',
    usesWorkingTime: 'Utiliza horário de trabalho',
    amount: 'Custo (yuan)',
    yuan: 'yuan',
    yes: 'Sim',
    no: 'Não',
    timeZone: 'Fuso horário da empresa: {{zone}}',
    amountHint:
      'Informe yuan com até duas casas decimais. Custos zero são permitidos.',
    amountInvalid: 'Informe um valor não negativo com até duas casas decimais.',
    dateInvalid: 'Escolha um intervalo válido com término posterior ao início.',
    approvalHint:
      'A aprovação registra a frequência da viagem e cria um limite de reembolso para estimativas positivas. Reserva e desembolso de empréstimos são separados.',
    approvedFacts:
      'A aprovação da viagem está concluída; o progresso da reserva é exibido separadamente.',
    attendanceRecorded: 'A atividade de frequência da viagem foi registrada.',
    authorizationIssued:
      'Limite aprovado de reembolso: {{amount}} yuan. Os pedidos seguem a política do limite.',
    zeroNoAuthorization:
      'Custos estimados zero não criam limite; a revisão financeira continua obrigatória.',
    uncertainCreate:
      'O resultado do salvamento é desconhecido. Verifique Minhas solicitações antes de criar outra solicitação.',
    inactive: 'É necessário um cadastro de colaborador ativo.',
    configuration:
      'Não é possível enviar a aprovação. Entre em contato com um administrador para verificar os prazos de aprovação.',
    invalid:
      'Verifique os campos da solicitação e recarregue o registro mais recente, se necessário.',
    stages: {
      completed: 'Concluído',
      manager: 'Gestor direto',
      head: 'Chefe de departamento',
      finance: 'Financeiro',
      executive: 'Executivo',
      gm: 'Diretor geral',
      booking: 'Reserva administrativa',
    },
  },
};
