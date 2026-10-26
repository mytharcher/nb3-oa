export default {
  // Existing permission titles use the collection name.
  travelCancellations: {
    authz: {
      resource: 'Solicitações de cancelamento de viagem',
      submit: 'Enviar solicitação de cancelamento de viagem',
      delegate: 'Enviar em nome de um colaborador',
      view: 'Visualizar solicitações de cancelamento de viagem',
    },
  },
  travelCancellation: {
    fieldInvalid: 'Verifique {{field}}.',

    sourceUnavailable: 'Viagem de origem indisponível',
    exceptionReason: 'Motivo da exceção',
    exception: 'Exceção de cancelamento de reserva',
    businessErrors: {
      TRAVEL_CANCELLATION_REASON_REQUIRED:
        'Informe o motivo do cancelamento da viagem.',
      TRAVEL_CANCELLATION_ALREADY_PENDING:
        'Um cancelamento já está pendente para esta viagem. Abra a solicitação existente.',
      TRAVEL_CANCELLATION_BASELINE_CHANGED:
        'A viagem aprovada mudou. Atualize-a e revise o cancelamento antes de reenviar.',
      TRAVEL_CANCELLATION_INVALID_SOURCE:
        'A viagem original não é mais elegível para cancelamento. Selecione uma viagem aprovada vigente.',
    },

    retryUnbooking: 'Repetir cancelamento administrativo',
    bookingInformation: 'Cancelamento de pedido e providências de reembolso',
    unbookingHint:
      'A viagem original é revogada após aprovação do chefe de departamento. A Administração deve registrar o cancelamento e as providências de reembolso; isto não confirma o pagamento de reembolso.',
    complete: 'Concluir cancelamento administrativo',
    unable: 'Não é possível cancelar a reserva',
    forceComplete: 'Forçar encerramento do cancelamento',
    source: 'Viagem original',
    chooseSource: 'Escolher uma viagem aprovada',
    effectHint:
      'O chefe de departamento original deve aprovar antes de a frequência e a autorização de reembolso serem revogadas. Empréstimos vinculados são tratados conforme seu estado de desembolso.',
    cc: 'Adicionar destinatário de cópia',
    authz: {
      resource: 'Solicitações de cancelamento de viagem',
      submit: 'Enviar solicitação de cancelamento de viagem',
      delegate: 'Enviar em nome de um colaborador',
      view: 'Visualizar solicitações de cancelamento de viagem',
    },
    new: 'Nova solicitação de cancelamento de viagem',
    edit: 'Editar solicitação de cancelamento de viagem',
    formDescription: 'Solicite o cancelamento de uma viagem aprovada.',
    name: 'Nome do cancelamento de viagem',
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
      'A aprovação registra a frequência do cancelamento de viagem quando utiliza horário de trabalho. Cancelamentos pagos criam um limite aprovado de reembolso; nenhum pagamento foi feito.',
    approvedFacts:
      'Este cancelamento de viagem foi aprovado. O RH recebe uma cópia.',
    attendanceRecorded:
      'A atividade de frequência do cancelamento de viagem foi registrada.',
    authorizationIssued:
      'Limite aprovado de reembolso: {{amount}} yuan. Os pedidos seguem a política do limite.',
    zeroNoAuthorization:
      'Nenhum limite é criado para cancelamentos de viagem gratuitos.',
    uncertainCreate:
      'O resultado do salvamento é desconhecido. Verifique Minhas solicitações antes de criar outra solicitação.',
    inactive: 'É necessário um cadastro de colaborador ativo.',
    configuration:
      'Não é possível enviar a aprovação. Entre em contato com um administrador para verificar os prazos de aprovação.',
    invalid:
      'Verifique os campos da solicitação e recarregue o registro mais recente, se necessário.',
    stages: {
      unbooking: 'Cancelamento administrativo de reserva',
      manager: 'Gestor direto',
      head: 'Chefe de departamento',
      finance: 'Financeiro',
      executive: 'Executivo',
      gm: 'Diretor geral',
    },
  },
};
