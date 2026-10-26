export default {
  workItems: {
    authz: {
      confirmationOwned: 'Tareas que confirmo',
      handoverConfirmation: 'Transferir responsabilidad de confirmación',

      title: 'Tareas ordinarias',
      owned: 'Creadas por mí',
      readable: 'Tareas que creo, tengo asignadas o puedo asumir',
      view: 'ver',
      create: 'crear',
      edit: 'editar',
      dispatch: 'asignar',
      claim: 'asumir',
      release: 'liberar',
      complete: 'completar',
      confirm: 'confirmar',
      return: 'devolver',
      block: 'bloquear',
      resume: 'reanudar',
      reassign: 'reasignar',
      cancel: 'cancelar',
      forceComplete: 'forzar finalización',
    },
    notifications: {
      title: 'Actualización de tarea',
      body: 'Una tarea ordinaria ha cambiado. Abre la aplicación para consultar los detalles.',
    },
    errors: {
      ACCESS_DENIED: 'No tienes acceso a la tarea o a la operación.',
      NOT_FOUND: 'No se ha encontrado la tarea.',
      REASON_REQUIRED: 'Se requiere un motivo.',
      RESULT_REQUIRED: 'Se requiere un resultado de finalización.',
      INVALID_INPUT:
        'Los datos o el estado no son válidos; actualiza y vuelve a intentarlo.',
      INVALID_TARGET:
        'Los datos o el estado no son válidos; actualiza y vuelve a intentarlo.',
      INVALID_ATTACHMENT:
        'Los datos o el estado no son válidos; actualiza y vuelve a intentarlo.',
      VERSION_CONFLICT:
        'Los datos o el estado no son válidos; actualiza y vuelve a intentarlo.',
      COMMAND_CONFLICT:
        'Los datos o el estado no son válidos; actualiza y vuelve a intentarlo.',
    },
  },
};
