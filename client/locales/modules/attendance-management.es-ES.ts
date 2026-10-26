export default {
  attendanceManagement: {
    savedSchedule:
      'Se ha guardado el calendario de «{{department}}» del {{date}}',
    savedShift: 'Se ha guardado el turno «{{name}}»',

    editAction: 'Editar',
    errors: {
      NOT_FOUND: 'Este turno ya no existe.',
      ACCESS_DENIED: 'No tienes acceso a esta configuración de asistencia.',
      ATTENDANCE_ACCESS_DENIED:
        'Los permisos actuales del registro o del campo no permiten este cambio.',
      ATTENDANCE_VERSION_CONFLICT:
        'La configuración ha cambiado. Vuelve a cargarla antes de guardar.',
      ATTENDANCE_SHIFT_INVALID:
        'Introduce una definición explícita de turno válida.',
      ATTENDANCE_SHIFT_NOT_FOUND: 'El turno no existe o está desactivado.',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE:
        'No se puede modificar el código de un turno.',
      ATTENDANCE_SHIFT_CODE_CONFLICT: 'Este código de turno ya existe.',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED:
        'Utiliza una revisión en la zona horaria actual de la empresa.',
      ATTENDANCE_SCHEDULE_INVALID:
        'Elige una fecha real y un turno o día de descanso explícito.',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE:
        'Este departamento no está disponible.',
      ATTENDANCE_SCHEDULE_NOT_READABLE:
        'No se puede leer la revisión actual del calendario.',
      ATTENDANCE_LIST_INVALID: 'Los parámetros de la página no son válidos.',
      ATTENDANCE_LOCAL_TIME_INVALID:
        'El cambio de horario de verano omite o repite esta hora local. Elige límites sin ambigüedad.',
    },
    authz: {
      resource: 'Configuración de asistencia',
      view: 'Ver configuración de asistencia',
      manage: 'Gestionar configuración de asistencia',
      attendanceShifts: 'Turnos de asistencia',
      attendanceShiftRevisions: 'Revisiones de turnos',
      attendanceSchedules: 'Calendarios de departamentos',
      attendanceScheduleRevisions: 'Revisiones de calendarios',
    },
    nameTooLong: 'Utiliza como máximo 200 caracteres.',
    reasonTooLong: 'Utiliza como máximo 2000 caracteres.',
    title: 'Configuración de asistencia',
    description:
      'Configura turnos explícitos y calendarios de departamentos. La falta de configuración bloquea la evaluación de asistencia.',
    shifts: 'Turnos',
    schedules: 'Calendarios de departamentos',
    create: 'Añadir turno',
    edit: 'Editar turno',
    view: 'Ver revisión',
    save: 'Guardar',
    saving: 'Guardando…',
    cancel: 'Cancelar',
    refresh: 'Actualizar',
    retry: 'Reintentar',
    loading: 'Cargando configuración de asistencia',
    denied: 'No tienes acceso a esta configuración de asistencia.',
    notFound:
      'Esta configuración ya no existe. Vuelve a la lista de configuraciones.',
    failed:
      'No se ha podido cargar o guardar la configuración de asistencia. Vuelve a intentarlo.',
    conflict:
      'La configuración ha cambiado. Vuelve a cargarla antes de guardar. Los datos introducidos se conservan.',
    code: 'Código de turno',
    name: 'Nombre del turno',
    enabled: 'Activado',
    disabled: 'Desactivado',
    status: 'Estado',
    version: 'Revisión',
    revisionLabel: 'Revisión {{revision}}',
    actions: 'Acciones para {{name}}',
    all: 'Todos los estados',
    clearFilters: 'Borrar filtros',
    search: 'Buscar por código o nombre de turno',
    empty:
      'No hay turnos configurados. Añade un turno explícito de empresa para empezar.',
    noMatches: 'No hay turnos que coincidan con los filtros.',
    department: 'Departamento',
    date: 'Fecha del calendario',
    chooseDepartmentDate:
      'Elige un departamento y una fecha para consultar su calendario.',
    unconfigured:
      'No hay un calendario configurado para este departamento y fecha. La evaluación de asistencia sigue bloqueada.',
    restDay: 'Día de descanso explícito',
    workingDay: 'Día laborable programado',
    configure: 'Configurar calendario',
    history: 'Historial',
    shiftRevision: 'Revisión exacta del turno',
    reason: 'Motivo del cambio',
    createdBy: 'Modificado por',
    createdAt: 'Fecha de modificación',
    timeZone: 'Zona horaria actual de la empresa',
    basic: 'Datos básicos',
    intervals: 'Intervalos de trabajo',
    rules: 'Reglas de asistencia',
    addInterval: 'Añadir intervalo',
    removeInterval: 'Quitar intervalo {{index}}',
    start: 'Hora de inicio (HH:mm)',
    end: 'Hora de fin (HH:mm)',
    startDayOffset: 'Día de inicio',
    endDayOffset: 'Día de fin',
    sameDay: 'Mismo día',
    nextDay: 'Día siguiente',
    lateToleranceMinutes: 'Tolerancia de retraso (minutos)',
    earlyToleranceMinutes: 'Tolerancia de salida anticipada (minutos)',
    absenceThresholdMinutes: 'Umbral de ausencia (minutos)',
    required: 'Este campo es obligatorio.',
    invalidShift:
      'Utiliza intervalos HH:mm válidos en orden creciente, dentro de 24 horas; introduce tolerancias enteras inferiores a la duración del trabajo y un umbral de ausencia dentro de ella.',
    invalidNumber: 'Introduce un entero válido no negativo.',
    invalidCode:
      'Utiliza entre 1 y 64 letras, dígitos, guiones bajos o guiones.',
    saved: 'Configuración de asistencia guardada.',
    disableTitle: '¿Desactivar el turno «{{name}}»?',
    disableDescription:
      'Se conserva el historial de calendarios existente. Los calendarios nuevos no podrán seleccionar este turno.',
    disableConfirm: 'Desactivar y guardar',
    leaveTitle: '¿Descartar los cambios sin guardar?',
    leaveDescription: 'Los cambios de este formulario no se han guardado.',
    discard: 'Descartar cambios',
    continueEditing: 'Seguir editando',
    revisionReadonly:
      'Revisión histórica inmutable. Los cambios crean una nueva revisión.',
    noEnabledShifts:
      'No hay turnos activados en la zona horaria actual de la empresa. Configura un turno primero o selecciona explícitamente un día de descanso.',
    shiftOptionsCap:
      'Solo se muestran los primeros 100 turnos activados. Busca por código o nombre para restringir las opciones.',
    oldTimeZone:
      'Esta revisión histórica utiliza otra zona horaria de empresa. Al guardar se publica una nueva revisión en la zona horaria actual.',
    selectShift: 'Elegir un turno activado',
    chooseRevision: 'Elegir una revisión inmutable',
    intervalHint:
      'Utiliza intervalos separados para los descansos. Especifica los desplazamientos al día siguiente para el trabajo nocturno. No se proporcionan horarios laborales predeterminados.',
    restHint:
      'Un día de descanso es un dato explícito, distinto de una configuración ausente.',
    reload: 'Volver a cargar la configuración más reciente',
    back: 'Volver a la configuración',
  },
};
