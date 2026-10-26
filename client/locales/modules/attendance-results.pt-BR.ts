export default {
  attendanceResults: {
    title: 'Resultados de ponto',
    description:
      'Revise o ponto diário, resolva registros ausentes e verifique seu resumo mensal.',
    month: 'Mês',
    employee: 'Colaborador',
    department: 'Departamento',
    date: 'Data',
    status: 'Status',
    dailyResult: 'Ponto diário',
    normalDays: 'Dias normais',
    exceptionDays: 'Dias com exceções',
    blockedDays: 'Dias que precisam de revisão',
    restDays: 'Dias de descanso',
    lateMinutes: 'Atraso (min)',
    earlyMinutes: 'Saída antecipada (min)',
    missingPunches: 'Pontos ausentes',
    absentMinutes: 'Ausência não coberta (min)',
    approvedOvertimeMinutes: 'Horas extras aprovadas (min)',
    statuses: {
      normal: 'Normal',
      exception: 'Exceção',
      blocked: 'Precisa de revisão',
      rest: 'Dia de descanso',
    },
    timeZone: 'As datas do ponto seguem o fuso horário da empresa: {{zone}}.',
    refresh: 'Atualizar',
    clear: 'Limpar filtros',
    empty: 'Nenhum resultado de ponto ainda',
    noResults: 'Nenhum resultado correspondente',
    emptyDescription:
      'Os resultados aparecem após o cálculo diário. Você pode calcular um dia encerrado ou pedir ao RH que verifique a escala.',
    unnamed: 'Nome do colaborador indisponível',
    denied: 'Você não tem acesso a esta operação de ponto.',
    calculate: 'Calcular meu ponto',
    recalculate: 'Recalcular',
    calculateDescription:
      'Selecione um dia encerrado e explique o motivo. Os resultados existentes permanecem no histórico de cálculos.',
    reason: 'Motivo',
    cancel: 'Cancelar',
    confirmCalculate: 'Calcular',
    calculating: 'Calculando…',
    calculated: 'Cálculo de ponto concluído.',
    calculateFailed:
      'Não foi possível calcular o ponto. Verifique se o turno terminou e há uma escala válida e tente novamente.',
    correctIn: 'Solicitar correção de entrada',
    correctOut: 'Solicitar correção de saída',
    export: 'Exportar mês',
    exporting: 'Exportando…',
    exported: 'Exportação de ponto baixada.',
    needsReview: 'Peça ao RH que verifique a escala e os registros de ponto.',
    prefillUnavailable:
      'Este ponto ausente não está mais disponível para correção. Selecione outro registro elegível ou peça ajuda ao RH.',
    reasons: {
      missingPrimaryDepartment:
        'Seu departamento principal precisa ser definido.',
      missingSchedule: 'Nenhuma escala disponível para este dia.',
      missingShiftRevision: 'O turno precisa ser verificado.',
      calendarTimeZoneChanged:
        'As configurações de horário do ponto mudaram. Peça ao RH que as confirme.',
      unresolvableLocalTime: 'O horário do relógio precisa ser verificado.',
      missingCorrectionFact: 'Uma correção aprovada precisa ser conciliada.',
      invalidActivityTime:
        'Uma ausência aprovada possui um intervalo de tempo inválido.',
      unverifiedActivitySource:
        'Uma ausência exige verificação antes de ser usada.',
    },
  },
};
