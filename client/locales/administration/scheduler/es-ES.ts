import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  authorization: { title: 'Programaciones', read: 'Leer' },
  nav: { automation: 'Automatización', schedules: 'Tareas programadas' },
  page: {
    refresh: 'Actualizar',
    retry: 'Reintentar',
    clearFilters: 'Borrar filtros',
    saved: 'Se ha actualizado la programación «{{name}}»',
    limitNotice: 'Solo se muestran las {{count}} activaciones más recientes.',
    scheduleNames: {
      annualLeave: 'Acumulación automática de vacaciones anuales',
      assetBorrow: 'Recordatorios de devolución de activos prestados',
      departure: 'Ejecución de bajas laborales',
      probation: 'Recordatorios de fin del período de prueba',
      sealReturn: 'Recordatorios de devolución de sellos',
      vendorQualification:
        'Recordatorios de caducidad de la acreditación de proveedores',
      expenseAuthorization:
        'Liberación de asignaciones de gastos aprobadas y caducadas',
      loan: 'Recordatorios de devolución de anticipos',
    },
    title: 'Tareas programadas',
    description:
      'Supervisa las tareas programadas y gestiona cuándo se ejecutan.',
    filters: {
      searchLabel: 'Buscar programaciones',
      searchPlaceholder: 'Buscar nombre, tipo de destino o programación…',
      statusLabel: 'Filtrar por estado',
      targetLabel: 'Filtrar por tipo de destino',
      allStatuses: 'Todos los estados',
      allTargets: 'Todos los tipos de destino',
    },
    statuses: {
      active: 'Activo',
      paused: 'En pausa',
      inactive: 'Inactivo',
      targetIssue: 'Problema con el destino',
    },
    actions: { enable: 'Activar', disable: 'Desactivar' },
    columns: {
      name: 'Nombre',
      scheduleTimezone: 'Programación / zona horaria',
      triggered: 'Activado',
      nextRun: 'Próxima activación',
      target: 'Destino',
      status: 'Estado',
    },
    targets: {
      workflow: 'Flujo de trabajo',
    },
    targetStates: {
      ready: 'Listo',
      disabled: 'Desactivado',
      missing: 'Ausente',
      invalid: 'No válido',
    },
    pagination: {
      previous: 'Anterior',
      next: 'Siguiente',
      summary: 'Página {{page}} de {{total}}',
    },
    loading: 'Cargando tareas programadas…',
    empty: 'No hay tareas programadas definidas.',
    noMatches: 'No hay tareas programadas que coincidan con estos filtros.',
    details: {
      back: 'Volver a las tareas programadas',
      loading: 'Cargando detalles de la programación…',
      notFound: 'No se ha encontrado la tarea programada.',
      overview: 'Resumen',
      triggers: 'Registros de ejecución',
      schedule: 'Programación',
      frequency: 'Frecuencia',
      timezone: 'Zona horaria',
      nextRun: 'Próxima ejecución',
      lastTrigger: 'Última activación',
      triggerCount: 'Número de activaciones',
      inactiveReason: 'Motivo de inactividad',
      target: 'Destino de ejecución',
      targetName: 'Destino',
      targetType: 'Tipo de destino',
      description: 'Descripción',
      targetIssueTitle: 'El destino de ejecución no está disponible',
      targetIssueBody:
        'Esta programación definida en código no se puede activar hasta que su destino vuelva a estar disponible.',
    },
    triggersLoading: 'Cargando activaciones…',
    triggersEmpty: 'No se ha iniciado ninguna activación.',
    triggerColumns: {
      startedAt: 'Hora de ejecución',
      duration: 'Duración',
      status: 'Estado',
      target: 'Destino de ejecución',
    },
    triggerStatuses: {
      pending: 'Pendiente',
      running: 'En ejecución',
      waiting: 'Esperando al destino',
      succeeded: 'Correcto',
      triggered: 'Activado (resultado desconocido)',
      skipped: 'Omitido',
      failed: 'Fallido',
      cancelled: 'Cancelado',
      timed_out: 'Tiempo agotado',
    },
    reasons: {
      definition_removed: 'Se ha eliminado la definición de la programación',
      'target-not-found': 'No se ha encontrado el destino de ejecución',
      'target-disabled': 'El destino de ejecución está desactivado',
      'target-missing': 'Falta el destino de ejecución',
      'target-invalid': 'El destino de ejecución no es válido',
      'target-unavailable': 'El destino de ejecución no está disponible',
      'invalid-config': 'La configuración del destino no es válida',
      'invalid-input':
        'Los datos de entrada del flujo de trabajo no son válidos',
      'artifact-unavailable':
        'El artefacto del flujo de trabajo no está disponible',
      'dispatch-failed': 'No se ha podido despachar la ejecución',
      'execution-timeout': 'Se ha agotado el tiempo de ejecución',
      'execution-cancelled': 'Se ha cancelado la ejecución',
      'execution-failed': 'La ejecución ha fallado',
      'reference-type-mismatch':
        'El tipo de referencia de ejecución no coincide',
      'run-not-found': 'No se ha encontrado el registro de ejecución',
      'observer-failed': 'No se ha podido consultar el resultado de ejecución',
      'observer-unavailable':
        'El observador del resultado de ejecución no está disponible',
    },
    inProgress: 'En curso',
    viewTarget: 'Ver',
    invalidSchedule: 'Programación no válida',
    unavailable: '—',
  },
  errors: {
    forbidden: 'Se ha retirado el acceso. Contacta con un administrador.',
    notFound:
      'Estos registros no están disponibles. Vuelve al panel de trabajo.',
    toggleFailed:
      'No se ha podido cambiar la programación. Vuelve a intentarlo.',
    loadSchedules: 'No se han podido cargar las tareas programadas.',
    loadOccurrences: 'No se han podido cargar las activaciones.',
  },
};

/** English is the source of truth for this plugin's locale shape. */
export type SchedulerResource = LocaleResource<typeof enUS>;

export default enUS;
