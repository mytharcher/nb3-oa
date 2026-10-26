export default {
  attendanceManagement: {
    savedSchedule: 'Escala de "{{department}}" em {{date}} salva',
    savedShift: 'Turno "{{name}}" salvo',

    editAction: 'Editar',
    errors: {
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
      resource: 'Configuração de ponto',
      view: 'Visualizar configuração de ponto',
      manage: 'Gerenciar configuração de ponto',
      attendanceShifts: 'Turnos de trabalho',
      attendanceShiftRevisions: 'Revisões de turnos',
      attendanceSchedules: 'Escalas de departamentos',
      attendanceScheduleRevisions: 'Revisões de escalas',
    },
    nameTooLong: 'Use no máximo 200 caracteres.',
    reasonTooLong: 'Use no máximo 2000 caracteres.',
    title: 'Configuração de ponto',
    description:
      'Configure turnos e escalas de departamentos explícitos. A ausência de configuração impede a avaliação do ponto.',
    shifts: 'Turnos',
    schedules: 'Escalas de departamentos',
    create: 'Adicionar turno',
    edit: 'Editar turno',
    view: 'Visualizar revisão',
    save: 'Salvar',
    saving: 'Salvando…',
    cancel: 'Cancelar',
    refresh: 'Atualizar',
    retry: 'Tentar novamente',
    loading: 'Carregando configuração de ponto',
    denied: 'Você não tem acesso a esta configuração de ponto.',
    notFound:
      'Esta configuração não existe mais. Volte à lista de configurações.',
    failed:
      'Não foi possível carregar ou salvar a configuração de ponto. Tente novamente.',
    conflict:
      'A configuração mudou. Recarregue antes de salvar. Seus dados foram mantidos.',
    code: 'Código do turno',
    name: 'Nome do turno',
    enabled: 'Habilitado',
    disabled: 'Desativada',
    status: 'Status',
    version: 'Revisão',
    revisionLabel: 'Revisão {{revision}}',
    actions: 'Ações de {{name}}',
    all: 'Todos os status',
    clearFilters: 'Limpar filtros',
    search: 'Pesquisar por código ou nome do turno',
    empty:
      'Nenhum turno configurado. Adicione um turno explícito da empresa para começar.',
    noMatches: 'Nenhum turno corresponde aos filtros.',
    department: 'Departamento',
    date: 'Data da escala',
    chooseDepartmentDate:
      'Escolha um departamento e uma data para verificar a escala.',
    unconfigured:
      'Nenhuma escala configurada para este departamento e data. A avaliação do ponto continua bloqueada.',
    restDay: 'Dia de descanso explícito',
    workingDay: 'Dia de trabalho programado',
    configure: 'Configurar escala',
    history: 'Histórico',
    shiftRevision: 'Revisão exata do turno',
    reason: 'Motivo da alteração',
    createdBy: 'Alterado por',
    createdAt: 'Alterado em',
    timeZone: 'Fuso horário atual da empresa',
    basic: 'Detalhes básicos',
    intervals: 'Intervalos de trabalho',
    rules: 'Regras de ponto',
    addInterval: 'Adicionar intervalo',
    removeInterval: 'Remover intervalo {{index}}',
    start: 'Horário inicial (HH:mm)',
    end: 'Horário final (HH:mm)',
    startDayOffset: 'Dia inicial',
    endDayOffset: 'Dia final',
    sameDay: 'Mesmo dia',
    nextDay: 'Dia seguinte',
    lateToleranceMinutes: 'Tolerância de atraso (minutos)',
    earlyToleranceMinutes: 'Tolerância de saída antecipada (minutos)',
    absenceThresholdMinutes: 'Limite de ausência (minutos)',
    required: 'Este campo é obrigatório.',
    invalidShift:
      'Use intervalos HH:mm válidos em ordem crescente, dentro de 24 horas; informe tolerâncias inteiras menores que a jornada e um limite de ausência dentro dela.',
    invalidNumber: 'Informe um inteiro não negativo válido.',
    invalidCode: 'Use de 1 a 64 letras, dígitos, sublinhados ou hífens.',
    saved: 'Configuração de ponto salva.',
    disableTitle: 'Desabilitar o turno “{{name}}”?',
    disableDescription:
      'O histórico de escalas existente é mantido. Novas escalas não podem selecionar este turno.',
    disableConfirm: 'Desabilitar e salvar',
    leaveTitle: 'Descartar alterações não salvas?',
    leaveDescription: 'As alterações deste formulário não foram salvas.',
    discard: 'Descartar alterações',
    continueEditing: 'Continuar editando',
    revisionReadonly:
      'Revisão histórica imutável. As alterações criam uma nova revisão.',
    noEnabledShifts:
      'Nenhum turno habilitado disponível no fuso horário atual da empresa. Configure um turno primeiro ou selecione explicitamente um dia de descanso.',
    shiftOptionsCap:
      'Somente os primeiros 100 turnos habilitados são exibidos. Pesquise por código ou nome para restringir as opções.',
    oldTimeZone:
      'Esta revisão histórica usa outro fuso horário da empresa. Salvar publica uma nova revisão no fuso atual.',
    selectShift: 'Escolher um turno habilitado',
    chooseRevision: 'Escolher uma revisão imutável',
    intervalHint:
      'Use intervalos separados para pausas. Especifique deslocamentos para o dia seguinte em trabalhos noturnos. Nenhum horário comercial é fornecido por padrão.',
    restHint:
      'Um dia de descanso é um fato explícito, diferente da ausência de configuração.',
    reload: 'Recarregar configuração mais recente',
    back: 'Voltar à configuração',
  },
};
