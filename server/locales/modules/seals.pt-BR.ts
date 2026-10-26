export default {
  seals: {
    authz: {
      requests: 'Solicitações de carimbos',
      view: 'Visualizar',
      create: 'Criar',
      edit: 'Editar',
      operate: 'Operar',
      actualReturn: 'Devolução excepcional real',
      ledger: 'Registro de carimbos',
      instances: 'Instâncias de carimbos',
      manage: 'Gerenciar metadados de carimbos',
      owned: 'Registros próprios',
      readable: 'Registros próprios e com participação',
    },
    errors: {
      REVIEWER_REQUIRED:
        'O revisor realmente atribuído deve manter o papel de responsabilidade ativo obrigatório.',
      APPROVAL_REFUSED:
        'As regras atuais de aprovação ou processamento recusam esta operação.',
      ACCESS_DENIED:
        'Você não pode acessar estes registros ou campos de carimbos.',
      ACTIVE_EMPLOYEE_REQUIRED: 'É necessária uma conta de colaborador ativa.',
      ADMIN_KEEPER_REQUIRED:
        'Devoluções excepcionais reais exigem os papéis de administrador e responsável pelos carimbos.',
      ADMIN_REQUIRED:
        'É necessário um papel de responsabilidade administrativa ativo.',
      BODY_TOO_LARGE: 'O anexo excede o limite de tamanho para envio.',
      COMMAND_CONFLICT:
        'Esta chave de requisição já foi usada para outro conteúdo.',
      CONTRACT_ACCESS_DENIED: 'Você não pode visualizar o contrato vinculado.',
      CONTRACT_NOT_EFFECTIVE: 'O contrato vinculado não está vigente.',
      CONTRACT_VERSION_CONFLICT: 'O contrato vinculado mudou após a aprovação.',
      DEPARTMENT_REQUIRED: 'O solicitante deve ter um departamento principal.',
      INVALID_COMMAND: 'É necessária uma chave de requisição válida.',
      INVALID_COPIES:
        'As cópias realmente carimbadas devem ser positivas e não superiores à quantidade aprovada.',
      INVALID_FILE: 'O anexo está ausente, inseguro ou fora desta solicitação.',
      INVALID_INPUT: 'Os campos da solicitação de carimbo são inválidos.',
      INVALID_OUTPUT: 'O resultado do processamento físico é inválido.',
      INVALID_RETURN:
        'A devolução real exige uma retirada externa encerrada administrativamente e um motivo.',
      INVALID_SEAL_TYPE:
        'O tipo de carimbo está inativo ou não corresponde à solicitação aprovada.',
      INVALID_TIME:
        'Os horários físicos ou o prazo de devolução são inválidos.',
      KEEPER_REQUIRED:
        'É necessário um papel ativo de responsável pelos carimbos.',
      OUTSTANDING_CUSTODY: 'Este carimbo tem custódia física pendente.',
      PHYSICAL_ALREADY_REGISTERED:
        'O uso físico ou a devolução já foi registrado.',
      REQUEST_NOT_FOUND: 'A solicitação está indisponível.',
      SEAL_EVIDENCE_REQUIRED:
        'São necessários comprovantes reais imutáveis de aplicação de carimbo.',
      SEAL_NOT_FOUND: 'O carimbo está indisponível.',
      SEAL_UNAVAILABLE: 'Este carimbo está retirado no momento.',
      SLA_UNSUPPORTED:
        'O agendamento de lembretes configurado não é suportado.',
      TARGET_MISMATCH: 'A tarefa oferecida não pertence a esta solicitação.',
      VERSION_CONFLICT: 'O registro mudou. Atualize antes de tentar novamente.',
    },
    schedule: {
      title: 'Lembretes de devolução de carimbos',
      description:
        'Lembrar diariamente a custódia pendente de carimbos no horário da empresa.',
    },
    notifications: {
      overdue: 'Um carimbo emprestado está com a devolução atrasada.',
    },
  },
};
