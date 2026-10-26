export default {
  financeAssignments: {
    create: 'Crear',

    saved: 'Se ha guardado la asignación de contable de «{{name}}»',
    saveFailed:
      'No se ha podido guardar la asignación. Comprueba los datos y vuelve a intentarlo.',
    disableTitle: '¿Desactivar la asignación de «{{name}}»?',

    loadLatest: 'Cargar asignación más reciente',
    latestSummary:
      'Última versión: {{name}} / {{status}}. Los valores del formulario se conservan.',
    adoptVersion: 'Utilizar esta versión con mis cambios',
    uncertain:
      'No se conoce con certeza el resultado de la creación. Comprueba este departamento antes de reintentar.',
    checkExisting: 'Consultar asignación del departamento',
    viewExisting: 'Abrir asignación existente',
    required: 'Este campo es obligatorio.',
    title: 'Contables de departamentos',
    description:
      'Asigna el revisor financiero de cada departamento. Si falta la asignación o está inactiva, se utiliza la del superior activo más cercano y, en último término, el responsable de finanzas.',
    new: 'Asignar contable',
    edit: 'Editar asignación',
    view: 'Detalles de la asignación',
    department: 'Departamento',
    accountant: 'Contable',
    status: 'Estado',
    active: 'Activo',
    inactive: 'Desactivado',
    updatedAt: 'Actualizado',
    refresh: 'Actualizar',
    clear: 'Borrar filtros',
    rowActions: 'Acciones para {{name}}',
    save: 'Guardar',
    cancel: 'Cancelar',
    loading: 'Cargando asignaciones',
    retry: 'Reintentar',
    accountantPlaceholder: 'Buscar contables aptos',
    noAccountants: 'No hay miembros activos con funciones financieras',
    reason: 'Motivo',
    formDescription:
      'Solo se pueden asignar miembros activos con funciones financieras. Los cambios se auditan.',
    departmentPermission:
      'Se requiere permiso de lectura de departamentos para elegir uno. Pide a un administrador que lo conceda.',
    conflictAdvice:
      'Conserva tus cambios como referencia. Cierra y vuelve a abrir este formulario para revisar la última asignación antes de reintentar.',
    disable: 'Desactivar asignación',
    disableDescription:
      'Las aprobaciones futuras utilizarán la asignación del superior activo más cercano y, en último término, al responsable de finanzas. Las tareas de aprobación existentes conservan sus revisores registrados.',
    authz: {
      title: 'Contables de departamentos',
      read: 'Leer asignaciones',
      update: 'Gestionar asignaciones',
      permissionSet:
        'Configuración de contables por el responsable de finanzas',
    },
    empty: {
      accountsTitle: 'No hay contables asignados',
      accountsDescription:
        'Asigna un contable a un departamento para dirigir las revisiones financieras.',
      readonlyTitle: 'No hay asignaciones',
      readonlyDescription:
        'Un responsable de finanzas puede configurar los contables de departamentos.',
      filteredTitle: 'No hay asignaciones coincidentes',
      filteredDescription:
        'Borra el filtro de departamento para ver todas las asignaciones.',
    },
    error: {
      forbidden: 'No tienes permiso para acceder a estas asignaciones.',
      missing: 'Esta asignación ya no existe.',
      invalid: 'Revisa los valores del formulario.',
      failed: 'No se han podido cargar las asignaciones. Vuelve a intentarlo.',
      FINANCE_ASSIGNMENT_NOT_FOUND: 'Esta asignación ya no existe.',
      FINANCE_ASSIGNMENT_VERSION_CONFLICT:
        'Esta asignación ha cambiado. Vuelve a abrir el formulario para revisar la última versión.',
      FINANCE_ASSIGNMENT_ALREADY_EXISTS:
        'Este departamento ya tiene una asignación. Edita esa asignación.',
      FINANCE_ASSIGNMENT_INVALID_DEPARTMENT: 'Elige un departamento activo.',
      FINANCE_ASSIGNMENT_INVALID_ACCOUNTANT:
        'Elige un miembro activo con funciones financieras.',
      FINANCE_ASSIGNMENT_INVALID_COMMAND:
        'Se requieren una persona responsable y un motivo.',
    },
  },
};
