export default {
  workItems: {
    authz: {
      confirmationOwned: 'Tarefas que confirmo',
      handoverConfirmation: 'Transferir responsabilidade de confirmação',

      title: 'Itens de trabalho comuns',
      owned: 'Criados por mim',
      readable: 'Tarefas que crio, possuo ou para as quais sou elegível',
      view: 'visualizar',
      create: 'criar',
      edit: 'editar',
      dispatch: 'despachar',
      claim: 'assumir',
      release: 'liberar',
      complete: 'concluir',
      confirm: 'confirmar',
      return: 'devolver',
      block: 'bloquear',
      resume: 'retomar',
      reassign: 'reatribuir',
      cancel: 'cancelar',
      forceComplete: 'forçar conclusão',
    },
    notifications: {
      title: 'Atualização de item de trabalho',
      body: 'Uma tarefa comum mudou. Abra a aplicação para obter detalhes.',
    },
    errors: {
      ACCESS_DENIED: 'A tarefa ou operação não está acessível.',
      NOT_FOUND: 'Tarefa não encontrada.',
      REASON_REQUIRED: 'É necessário um motivo.',
      RESULT_REQUIRED: 'É necessário um resultado de conclusão.',
      INVALID_INPUT:
        'Os dados ou o estado são inválidos; atualize e tente novamente.',
      INVALID_TARGET:
        'Os dados ou o estado são inválidos; atualize e tente novamente.',
      INVALID_ATTACHMENT:
        'Os dados ou o estado são inválidos; atualize e tente novamente.',
      VERSION_CONFLICT:
        'Os dados ou o estado são inválidos; atualize e tente novamente.',
      COMMAND_CONFLICT:
        'Os dados ou o estado são inválidos; atualize e tente novamente.',
    },
  },
};
