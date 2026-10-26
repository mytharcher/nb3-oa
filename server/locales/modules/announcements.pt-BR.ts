export default {
  announcements: {
    authz: {
      title: 'Comunicados',
      owned: 'Publicados por mim',
      readable: 'Minhas publicações e avisos recebidos',
      view: 'Ler comunicados',
      create: 'Criar rascunhos de comunicados',
      edit: 'Editar o próprio rascunho',
      publish: 'Publicar o próprio comunicado',
      revoke: 'Retirar o próprio comunicado',
      remind: 'Lembrar destinatários sem confirmação',
      receipts: 'Ler a própria lista de destinatários',
      confirm: 'Confirmar o próprio recebimento',
    },
    notifications: {
      title: 'Comunicado da empresa',
      body: 'Um comunicado está disponível. Abra a aplicação para lê-lo.',
    },
    errors: {
      ACCESS_DENIED: 'Este comunicado ou operação não está acessível.',
      NOT_FOUND: 'Comunicado não encontrado.',
      INVALID_INPUT: 'Dados ou intervalo de validade do comunicado inválidos.',
      INVALID_AUDIENCE:
        'O público contém um departamento ou papel de responsabilidade indisponível.',
      EMPTY_AUDIENCE: 'O comunicado não possui destinatários ativos.',
      INVALID_ATTACHMENT: 'Anexo inválido ou indisponível.',
      INVALID_STATE: 'Esta operação está indisponível no estado atual.',
      VERSION_CONFLICT: 'O comunicado mudou. Recarregue e tente novamente.',
      COMMAND_CONFLICT:
        'Este identificador de requisição já foi usado com outros dados.',
      KNOWLEDGE_UNAVAILABLE:
        'O documento vinculado está indisponível ou não é legível.',
    },
  },
};
