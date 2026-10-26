export default {
  wecomAttendance: {
    title: 'Origen de asistencia de WeCom',
    description:
      'Importa los fichajes de los empleados vinculados y revisa las últimas 30 ejecuciones de sincronización.',
    sync: 'Sincronizar',
    refresh: 'Actualizar',
    runs: 'Ejecuciones de sincronización',
    retry: 'Reintentar',
    counts: 'Registros confirmados: {{records}} · Lotes: {{batches}}',
    runFailed:
      'Algunos registros no se han podido importar. Comprueba las correspondencias de empleados, las asignaciones de turnos y el acceso al origen antes de reintentar. Los lotes completados se conservan.',
    denied: 'No tienes acceso a la sincronización de asistencia.',
    disabled:
      'El origen está desactivado. Pide a un administrador que configure la aplicación específica de asistencia.',
    unconfigured:
      'El origen necesita credenciales y correspondencias explícitas de empleados antes de sincronizar.',
    ready_one: 'Listo para sincronizar {{count}} empleado vinculado.',
    ready_other: 'Listo para sincronizar {{count}} empleados vinculados.',
    startedAt: 'Iniciado {{time}}',
    empty: 'Aún no hay ejecuciones de sincronización.',
    rangeHint:
      'Selecciona hasta siete días naturales completos en la zona horaria de la empresa. Los registros de origen repetidos no se duplican.',
    start: 'Fecha de inicio',
    end: 'Fecha de fin',
    reason: 'Motivo',
    cancel: 'Cancelar',
    syncing: 'Sincronizando…',
    states: {
      running: 'En curso',
      completed: 'Completado',
      failed: 'Requiere atención',
    },
  },
};
