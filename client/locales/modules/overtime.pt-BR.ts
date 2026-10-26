export default {
  overtime: {
    businessErrors: {
      OVERTIME_INVALID_DATE: 'Selecione uma data válida para horas extras.',
    },

    authz: { resource: 'Solicitações de horas extras' },
    navigation: 'Solicitações de horas extras',
    description:
      'Solicite horas extras e acompanhe sua aprovação e liquidação.',
    new: 'Nova solicitação de horas extras',
    edit: 'Editar solicitação de horas extras',
    date: 'Data das horas extras',
    minutes: 'Duração (minutos)',
    monthlyMinutes: 'Total mensal (minutos)',
    settlement: 'Liquidação',
    compensatory: 'Folga compensatória',
    pay: 'Pagamento de horas extras',
    durationInvalid: 'Informe um número inteiro entre 1 e 1.440 minutos.',
    formDescription: 'Revise a solicitação e envie-a ou salve um rascunho.',
    policyHint:
      'Uma solicitação por data. Solicitações tardias exigem revisão de RH. A folga compensatória é liquidada após a aprovação final.',
    emptyDescription:
      'Complete uma solicitação de horas extras e envie-a ou salve um rascunho.',
    uncertainCreate:
      'O resultado do salvamento é incerto. Feche este formulário e verifique Minhas solicitações antes de criar outro rascunho.',
    duplicate:
      'Já existe uma solicitação de horas extras ativa ou aprovada para esta data.',
    inactive: 'O solicitante deve ser um colaborador ativo.',
    configuration:
      'Não é possível enviar a aprovação. Entre em contato com um administrador para verificar os prazos de aprovação.',
    invalid:
      'Revise a data das horas extras, a duração, a liquidação e o motivo.',
    schemaUnavailable:
      'O esquema de banco de dados de horas extras precisa ser atualizado. Esta operação ainda não pode ser concluída. Entre em contato com um administrador.',
  },
};
