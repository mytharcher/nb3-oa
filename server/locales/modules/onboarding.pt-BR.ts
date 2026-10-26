export default {
  onboarding: {
    notifications: {
      overdueTitle: 'Tarefa de admissão atrasada',
      overdueBody:
        'Uma tarefa de admissão está atrasada. Revise seu trabalho atribuído atual.',
    },
    authz: {
      resource: 'Admissão',
      readable: 'Participantes da admissão',
      view: 'Visualizar admissão',
      create: 'Criar admissão',
      cancel: 'Cancelar admissão',
      claim: 'Assumir tarefa',
      reassignMentor: 'Reatribuir chefe de departamento',
      transfer: 'Transferir',
      release: 'Liberar tarefa',
      complete: 'Concluir tarefa',
      forceComplete: 'Forçar conclusão',
      viewSalary: 'Visualizar salário da admissão',
      viewBank: 'Visualizar dados bancários da admissão',
    },
    errors: {
      employeeSourceConflict:
        'A origem da admissão já foi vinculada a outros dados de colaborador.',
      employeeAccountEnabled:
        'A conta de admissão deve permanecer desabilitada enquanto o cadastro do colaborador é criado.',
      forbidden:
        'Você não tem permissão para executar esta operação de admissão.',
      sourceInvalid:
        'A alocação de recrutamento ou os dados de negócio da admissão não são mais válidos.',
      idempotencyConflict:
        'Este identificador de comando já foi usado com outros detalhes.',
    },
  },
};
