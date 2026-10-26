export default {
  attendanceManagement: {
    errors: {
      ATTENDANCE_INVALID_INPUT: 'Comprovantes brutos de ponto inválidos.',
      ATTENDANCE_INVALID_TIME:
        'O ponto deve pertencer à data de ponto da empresa.',
      ATTENDANCE_INVALID_BATCH:
        'Forneça de 1 a 1000 linhas dentro do limite de tamanho dos comprovantes.',
      ATTENDANCE_SOURCE_CONFLICT:
        'A chave de origem identifica comprovantes imutáveis diferentes.',
      ATTENDANCE_IDENTITY_UNAVAILABLE:
        'Cada linha exige uma pessoa real com cadastro de colaborador.',

      NOT_FOUND: 'Este turno não existe mais.',
      ACCESS_DENIED: 'Você não tem acesso a esta configuração de ponto.',
      ATTENDANCE_ACCESS_DENIED:
        'A permissão atual de registro ou campo não permite esta alteração.',
      ATTENDANCE_VERSION_CONFLICT:
        'A configuração mudou. Recarregue antes de salvar.',
      ATTENDANCE_SHIFT_INVALID:
        'Informe uma definição de turno explícita válida.',
      ATTENDANCE_SHIFT_NOT_FOUND: 'O turno não existe ou está desabilitado.',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE:
        'O código de um turno não pode ser alterado.',
      ATTENDANCE_SHIFT_CODE_CONFLICT: 'Este código de turno já existe.',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED:
        'Use uma revisão no fuso horário atual da empresa.',
      ATTENDANCE_SCHEDULE_INVALID:
        'Escolha uma data real e um turno ou dia de descanso explícito.',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE: 'Este departamento está indisponível.',
      ATTENDANCE_SCHEDULE_NOT_READABLE:
        'A revisão atual da escala não é legível.',
      ATTENDANCE_LIST_INVALID: 'Os parâmetros da página são inválidos.',
      ATTENDANCE_LOCAL_TIME_INVALID:
        'O horário local é omitido ou repetido pelo horário de verão. Escolha limites sem ambiguidade.',
    },
    authz: {
      importResource: 'Importação de ponto bruto',
      ingest: 'Importar comprovantes imutáveis',
      attendanceRecords: 'Registros brutos de ponto',

      resource: 'Configuração de ponto',
      view: 'Visualizar configuração de ponto',
      manage: 'Gerenciar configuração de ponto',
      attendanceShifts: 'Turnos de trabalho',
      attendanceShiftRevisions: 'Revisões de turnos',
      attendanceSchedules: 'Escalas de departamentos',
      attendanceScheduleRevisions: 'Revisões de escalas',
    },
  },
};
