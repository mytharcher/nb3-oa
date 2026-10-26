export default {
  // Existing permission titles use the collection name.
  trainingRequests: {
    authz: {
      resource: 'Treinamento e aprendizagem',
      submit: 'Enviar solicitação de treinamento',
      delegate: 'Enviar em nome de um colaborador',
      view: 'Visualizar solicitações de treinamento',
    },
  },
  training: {
    actionForm: {
      title: '{{action}} a solicitação de treinamento "{{name}}"',
      completed:
        '{{action}} concluída para a solicitação de treinamento "{{name}}"',
      saved: 'Solicitação de treinamento "{{name}}" salva',
    },
    businessErrors: {
      TRAINING_INVALID_INPUT:
        'Preencha nome do treinamento, instituição e motivo e informe custos não negativos válidos.',
      TRAINING_INVALID_DATE:
        'O término do treinamento deve ser posterior ao início. Verifique as datas e os horários.',
      TRAINING_DEPARTMENT_REQUIRED:
        'O solicitante precisa de um departamento principal ativo. Peça ao RH que atualize o cadastro do colaborador.',
    },

    cc: 'Adicionar destinatário de cópia',
    authz: {
      resource: 'Treinamento e aprendizagem',
      submit: 'Enviar solicitação de treinamento',
      delegate: 'Enviar em nome de um colaborador',
      view: 'Visualizar solicitações de treinamento',
    },
    new: 'Nova solicitação de treinamento',
    edit: 'Editar solicitação de treinamento',
    formDescription: 'Solicite treinamento ou aprendizagem externa.',
    name: 'Nome do treinamento',
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
      'A aprovação registra a frequência no treinamento quando utiliza horário de trabalho. Treinamentos pagos criam um limite aprovado de reembolso; nenhum pagamento foi feito.',
    approvedFacts: 'Este treinamento foi aprovado. O RH recebe uma cópia.',
    attendanceRecorded:
      'A atividade de frequência no treinamento foi registrada.',
    authorizationIssued:
      'Limite aprovado de reembolso: {{amount}} yuan. Os pedidos seguem a política do limite.',
    zeroNoAuthorization: 'Nenhum limite é criado para treinamento gratuito.',
    uncertainCreate:
      'O resultado do salvamento é desconhecido. Verifique Minhas solicitações antes de criar outra solicitação.',
    inactive: 'É necessário um cadastro de colaborador ativo.',
    configuration:
      'Não é possível enviar a aprovação. Entre em contato com um administrador para verificar os prazos de aprovação.',
    invalid:
      'Verifique os campos da solicitação e recarregue o registro mais recente, se necessário.',
    stages: {
      manager: 'Gestor direto',
      head: 'Chefe de departamento',
      finance: 'Financeiro',
      executive: 'Executivo',
      gm: 'Diretor geral',
    },
  },
};
