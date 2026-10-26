export default {
  headcounts: {
    technicalDetails: 'Detalles técnicos',
    copyId: 'Copiar identificador interno',
    copyFailed: 'No se ha podido copiar el identificador interno.',

    name: '{{department}} / {{position}} / {{year}}',
    createSubmit: 'Crear',
    idCopied: 'Identificador de cuenta copiado',
    title: 'Registro de plantilla',
    description:
      'Capacidad anual y ocupación real de empleados. Inicializa una cuenta antes de contratar.',
    account: 'Plantilla anual',
    state: 'Estado de inicialización',
    create: 'Nueva plantilla anual',
    adjust: 'Ajustar límite',
    alreadyInitialized:
      'Esta cuenta ya está inicializada. Su ocupación real no se puede recalcular aquí.',
    reconcile: 'Verificar e inicializar',
    confirmInitialize: 'Confirmar inicialización',
    initialized: 'Inicializado',
    uninitialized: 'Sin inicializar',
    view: 'Ver plantilla',
    refresh: 'Actualizar',
    cancel: 'Cancelar',
    save: 'Guardar',
    clearFilters: 'Borrar filtros',
    allPositions: 'Todos los puestos',
    rowActions: 'Acciones para «{{name}}»',
    empty: 'No hay plantilla anual',
    noResults: 'No hay plantilla anual coincidente',
    filterHelp: 'Modifica los filtros.',
    emptyManage: 'Crea una cuenta y verifica su plantilla.',
    emptyRead: 'Pide a RR. HH. que introduzca la plantilla anual.',
    journal: 'Diario de orígenes',
    noJournal: 'Aún no hay eventos de origen',
    noJournalPermission: 'No tienes permiso para leer el diario de orígenes.',
    uninitializedHelp:
      'Esta cuenta no está inicializada y no se puede utilizar para contratación. Verifica la plantilla completa.',
    rosterHelp:
      'Verifica la plantilla completa, incluidos empleados en prueba, confirmados y en proceso de baja.',
    rosterEmpty:
      'Ningún empleado coincidente ocupa actualmente esta cuenta. Confirma que la plantilla real está vacía.',
    rosterCount: '{{count}} empleados',
    confirmRoster: 'He verificado la plantilla completa de empleados',
    created:
      'Se ha creado «{{name}}». A continuación, verifícala e inicialízala.',
    adjusted: 'Se ha actualizado el límite de «{{name}}».',
    reconciled: 'Se ha inicializado «{{name}}» para contratación.',
    invalidYear: 'Introduce un año entero entre 1900 y 9999.',
    invalidLimit: 'Introduce un número entero entre 0 y 1 000 000.',
    reasonRequired: 'Introduce un motivo de entre 1 y 5000 caracteres.',
    selectRequired:
      'Selecciona un departamento y un puesto actualmente autorizados.',
    rosterConfirmationRequired:
      'Confirma que has verificado la plantilla completa.',
    noAccess: 'No tienes permiso para leer esta plantilla.',
    missing: 'Esta cuenta de plantilla no existe o no es accesible.',
    failed: 'No se ha podido completar la solicitud. Vuelve a intentarlo.',
    loadLatest: 'Cargar datos actuales',
    unknownOutcome:
      'El resultado no está confirmado. Conserva este comando y reintenta.',
    retryCommand: 'Reintentar esta operación',
    reduceTitle: '¿Reducir el límite de plantilla de «{{account}}»?',
    reduceDescription:
      'El límite cambiará de {{previous}} a {{next}}. Debe seguir cubriendo la ocupación y las reservas existentes.',
    reduceConfirm: 'Confirmar reducción',
    minimumLimit:
      'La ocupación y las reservas actuales suman {{count}}. El nuevo límite no puede ser inferior.',
    discard: '¿Descartar los cambios sin guardar?',
    discardDescription: 'Al cerrar se descartarán estos cambios sin guardar.',
    discardConfirm: 'Descartar cambios',
    noTargets:
      'No hay departamentos ni puestos de destino autorizados. Pide a un administrador que compruebe los permisos de gestión de plantilla.',
    recruitmentSource: 'Ver solicitud de contratación',
    transferSource: 'Ver solicitud de traslado',
    fields: {
      department: 'Departamento',
      position: 'Puesto',
      year: 'Año de plantilla',
      limit: 'Límite autorizado',
      used: 'Ocupación de empleados',
      pending: 'Reservas pendientes',
      allocated: 'Aprobados, sin incorporar',
      available: 'Capacidad disponible',
      id: 'Identificador interno',
      version: 'Versión',
      updatedAt: 'Última actualización',
      reason: 'Motivo',
      replacementPending: 'Sustituciones futuras pendientes',
      replacementAllocated: 'Sustituciones futuras aprobadas',
      replacementBlocked: 'Plazas de sustitución bloqueadas',
    },
    journalActions: {
      create: 'Crear cuenta',
      reconcile: 'Verificar e inicializar',
      adjustLimit: 'Ajustar límite',
      hold: 'Reservar capacidad',
      reviseHold: 'Revisar reserva',
      allocate: 'Asignar capacidad aprobada',
      close: 'Cerrar origen',
      consume: 'Consumir para incorporación',
      releaseEmployee: 'Liberar ocupación de empleado',
      invalidateReplacement: 'Invalidar sustitución',
      rebindOut: 'Desvinculación saliente',
      rebindIn: 'Nueva vinculación entrante',
      transferOut: 'Traslado saliente',
      transferIn: 'Traslado entrante',
      claimReplacement: 'Asumir sustitución',
      cancelReplacement: 'Cancelar sustitución',
      fulfillReplacement: 'Completar sustitución',
      other: 'Cambio de plantilla',
    },
    journalColumns: {
      time: 'Hora',
      actor: 'Responsable',
      action: 'Acción',
      source: 'Origen empresarial',
    },
    employeeStatus: {
      probation: 'En prueba',
      regular: 'Confirmado',
      leaving: 'En proceso de baja',
    },
    authz: {
      title: 'Capacidad de plantilla',
      view: 'Ver capacidad',
      manage: 'Gestionar capacidad anual',
      viewJournal: 'Ver diario de orígenes',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        'No se puede leer la plantilla completa de empleados. Pide a un administrador que compruebe los permisos de lectura de empleados.',
      HEADCOUNT_ACCESS_DENIED:
        'No tienes permiso para realizar esta operación de plantilla.',
      HEADCOUNT_FIELD_ACCESS_DENIED:
        'Los campos de resumen de capacidad están fuera de tus permisos.',
      HEADCOUNT_NOT_FOUND:
        'La cuenta de capacidad de plantilla no está disponible.',
      HEADCOUNT_ALREADY_EXISTS:
        'Ya existe una cuenta para este departamento, puesto y año.',
      HEADCOUNT_NOT_INITIALIZED:
        'Concilia la plantilla completa de empleados antes de reservar capacidad.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        'Selecciona la plantilla real completa de empleados en prueba, fijos y en proceso de baja.',
      HEADCOUNT_ROSTER_DRIFT:
        'La plantilla real de empleados ha cambiado. Concilia sus datos de origen antes de continuar.',
      HEADCOUNT_VERSION_CONFLICT:
        'La cuenta ha cambiado. Actualízala antes de guardar.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT:
        'Este identificador de solicitud ya pertenece a otra operación.',
      HEADCOUNT_INSUFFICIENT:
        'El límite anual no cubre la plantilla realmente ocupada y reservada.',
      HEADCOUNT_INVALID_NUMBER:
        'Introduce un número entero de personas dentro de los límites admitidos.',
      HEADCOUNT_INVALID_ACCOUNT:
        'Selecciona un departamento, un puesto y un año reales.',
      HEADCOUNT_INVALID_IDENTITY:
        'Selecciona un departamento y un puesto activos de la organización.',
      HEADCOUNT_INVALID_COMMAND:
        'Se requieren una persona responsable, un identificador de solicitud y un motivo.',
      HEADCOUNT_INVALID_SOURCE:
        'Se requieren un tipo y un identificador de origen reales.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        'Cada plaza de sustitución necesita un empleado distinto en proceso de baja.',
      HEADCOUNT_INVALID_REPLACEMENT:
        'El origen de sustitución debe coincidir con una ocupación real en proceso de baja o ya finalizada.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'Esta ocupación de sustitución no existe o ya se ha reclamado.',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        'La reincorporación del empleado de origen bloquea esta sustitución.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND: 'La ficha del empleado no está disponible.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        'El empleado real no coincide con el departamento y el puesto asignados.',
      HEADCOUNT_ALREADY_OCCUPIED:
        'Este empleado ya ocupa una plaza en esta cuenta anual.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        'Vuelve a vincular explícitamente al año actual de la empresa antes de consumir capacidad.',
      HEADCOUNT_SOURCE_NOT_FOUND: 'El origen de capacidad no está disponible.',
      HEADCOUNT_SOURCE_EXISTS: 'Este origen ya tiene una reserva.',
      HEADCOUNT_SOURCE_STATE: 'El estado del origen no permite esta operación.',
      HEADCOUNT_SOURCE_CLOSED: 'El origen de capacidad ya está cerrado.',
      HEADCOUNT_SEAT_STATE: 'La plaza reservada no está pendiente.',
      HEADCOUNT_STATE_CONFLICT: 'La plaza reservada ha cambiado.',
      HEADCOUNT_NO_ALLOCATION: 'No quedan plazas aprobadas disponibles.',
      HEADCOUNT_NOT_LEFT:
        'Se requiere la baja efectiva antes de liberar capacidad ocupada.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        'Se requiere una ocupación real de empleado aún no liberada.',
      HEADCOUNT_NOT_RESTORED:
        'Se requiere una reincorporación efectiva antes de bloquear sustituciones futuras.',
      HEADCOUNT_INVALID_REBIND:
        'La nueva vinculación anual debe conservar el departamento y el puesto y avanzar a un año posterior.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        'Los créditos de sustitución requieren orígenes explícitos del año de destino.',
      HEADCOUNT_INVALID_TRANSFER:
        'Se requiere una reserva de destino aprobada y distinta.',
      HEADCOUNT_INVALID_PAGE: 'Selecciona un tamaño de página entre 1 y 100.',
      HEADCOUNT_GUARD_UNAVAILABLE:
        'El control de transacciones de capacidad no está disponible.',
    },
  },
};
