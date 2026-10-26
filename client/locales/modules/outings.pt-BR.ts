export default {
  outings: {
    authz: { resource: 'Solicitações de saída externa' },
    navigation: 'Solicitações de saída externa',
    new: 'Nova solicitação de saída externa',
    edit: 'Editar solicitação de saída externa',
    formDescription:
      'Verifique o período e envie para revisão ou salve um rascunho.',
    description:
      'Registre o período, o local e a finalidade da saída externa para revisão do gestor.',
    startAt: 'Horário inicial',
    endAt: 'Horário final',
    location: 'Localização',
    reason: 'Finalidade',
    timeZone: 'Os horários são registrados em {{zone}}',
    policyHint:
      'Após o início da saída externa, somente seu supervisor pode encerrá-la com um motivo.',
    nonexistentTime:
      'Este horário local não existe devido à mudança do relógio. Escolha outro horário.',
    daylightSavingPolicy:
      'Se uma mudança do relógio repetir este horário local, será usada a primeira ocorrência.',
    errors: {
      OUTING_EMPLOYEE_INACTIVE:
        'O solicitante deve ser um colaborador ativo. Peça ao RH que verifique o cadastro.',
      OUTING_INVALID_PERIOD:
        'O término deve ser posterior ao início. Verifique o período da saída externa.',
      OUTING_REQUIRED_FIELDS: 'Informe um local e uma finalidade.',
      OUTING_SLA_CONFIGURATION_UNSUPPORTED:
        'Não é possível enviar a aprovação. Entre em contato com um administrador para verificar os prazos de aprovação.',
      ATTENDANCE_ACTIVITY_CHANGED:
        'Os dados de ponto mudaram. Atualize para revisá-los.',
    },
  },
};
