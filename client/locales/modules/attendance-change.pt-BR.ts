export default {
  attendanceChange: {
    authz: { resource: 'Correções de ponto' },
    navigation: 'Correções de ponto',
    new: 'Nova correção de ponto',
    edit: 'Editar correção de ponto',
    emptyMissing:
      'Nenhum ponto ausente elegível. Entre em contato com RH se os comprovantes importados estiverem incorretos.',
    uploadAfterDraft:
      'Salve o rascunho e abra Editar para enviar comprovantes.',
    formDescription:
      'Verifique os comprovantes e envie para revisão ou salve um rascunho.',
    description:
      'Informe o horário do ponto ausente e os comprovantes para revisão do gestor.',
    date: 'Data do ponto ausente',
    original: 'Ponto ausente original',
    correctionAt: 'Horário corrigido do ponto',
    proof: 'Declaração comprobatória',
    attachments: 'Anexos comprobatórios',
    punchKinds: { in: 'Entrada', out: 'Saída' },
    missing: 'Selecionar um ponto ausente',
    policyHint:
      'O ponto ausente deve estar dentro de sete dias corridos. Solicitações pendentes e aprovadas contam no limite mensal.',
    errors: {
      ATTENDANCE_CHANGE_BASELINE_CHANGED:
        'O registro do ponto ausente mudou. Atualize e selecione-o novamente.',
      ATTENDANCE_CHANGE_TOO_OLD:
        'Somente pontos ausentes dentro de sete dias corridos podem ser enviados. Entre em contato com RH para registros anteriores.',
      ATTENDANCE_CHANGE_INVALID_TIME:
        'A correção deve ocorrer na data do ponto ausente e não pode estar no futuro.',
      ATTENDANCE_CHANGE_MONTHLY_LIMIT:
        'As correções pendentes e aprovadas atingiram o limite mensal.',
      ATTENDANCE_CHANGE_DUPLICATE:
        'Já existe uma correção pendente ou aprovada para este ponto ausente.',
      ATTENDANCE_CHANGE_PROOF_REQUIRED:
        'Forneça uma declaração ou envie comprovantes.',
      ATTENDANCE_CHANGE_EMPLOYEE_INACTIVE:
        'O solicitante deve ser um colaborador ativo. Peça ao RH que verifique o cadastro.',
      ATTENDANCE_CHANGE_REASON_REQUIRED: 'Informe um motivo para a correção.',
      ATTENDANCE_CHANGE_SLA_CONFIGURATION_UNSUPPORTED:
        'Não é possível enviar a aprovação. Entre em contato com um administrador para verificar os prazos de aprovação.',
      ATTENDANCE_CHANGE_FILE_SIZE:
        'Os anexos devem ser não vazios e ter no máximo 5 MB.',
      ATTENDANCE_CHANGE_FILE_TYPE:
        'Use arquivos PDF, JPEG, PNG ou WebP com conteúdo e formato correspondentes.',
      ATTENDANCE_CHANGE_ATTACHMENT_DENIED:
        'Você não tem permissão para visualizar ou enviar estes comprovantes.',
      ATTENDANCE_CHANGE_ATTACHMENT_INVALID:
        'O link do anexo é inválido. Selecione comprovantes enviados para este rascunho.',
      ATTENDANCE_BASELINE_CHANGED:
        'O comprovante original de ponto mudou. A aprovação foi revertida; atualize para revisá-lo.',
    },
  },
};
