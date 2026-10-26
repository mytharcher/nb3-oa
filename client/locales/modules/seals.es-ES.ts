export default {
  seals: {
    authz: {
      requests: 'Solicitudes de sellos',
      view: 'Ver',
      create: 'Crear',
      edit: 'Editar',
      operate: 'Operar',
      actualReturn: 'Devolución física excepcional',
      ledger: 'Registro de sellos',
      instances: 'Ejemplares de sellos',
      manage: 'Gestionar datos de sellos',
      owned: 'Registros propios',
      readable: 'Registros propios y de participación',
    },
    registrationSource: 'Registro de la solicitud {{number}}',
    relatedUnavailable: 'Registro relacionado no disponible',
    copiesRange: 'Introduce un número entero entre 1 y {{max}}.',
    actionSaved: '{{action}} completada para la solicitud de sello «{{name}}»',
    requestSaved: 'Se ha guardado la solicitud de sello «{{name}}»',

    noLongerEditable:
      'Esta solicitud ya no se puede editar. Ciérrala y actualiza la lista.',

    businessErrors: {
      REVIEWER_REQUIRED:
        'El revisor asignado debe conservar la función activa requerida.',
      APPROVAL_REFUSED:
        'Las reglas actuales de aprobación o gestión rechazan esta operación.',
      ACCESS_DENIED: 'No tienes acceso a estos registros o campos de sellos.',
      ACTIVE_EMPLOYEE_REQUIRED: 'Se requiere una cuenta de empleado activa.',
      ADMIN_KEEPER_REQUIRED:
        'Las devoluciones físicas excepcionales requieren las funciones de administrador y responsable del sello.',
      ADMIN_REQUIRED: 'Se requiere una función administrativa activa.',
      BODY_TOO_LARGE: 'El adjunto supera el límite de tamaño de subida.',
      COMMAND_CONFLICT:
        'Esta clave de solicitud ya se ha utilizado para otro contenido.',
      CONTRACT_ACCESS_DENIED: 'No puedes ver el contrato vinculado.',
      CONTRACT_NOT_EFFECTIVE: 'El contrato vinculado no está vigente.',
      CONTRACT_VERSION_CONFLICT:
        'El contrato vinculado ha cambiado después de la aprobación.',
      DEPARTMENT_REQUIRED:
        'El solicitante debe tener un departamento principal.',
      INVALID_COMMAND: 'Se requiere una clave de solicitud válida.',
      INVALID_COPIES:
        'El número real de copias selladas debe ser positivo y no superar la cantidad aprobada.',
      INVALID_FILE:
        'El adjunto no existe, no es seguro o no pertenece a esta solicitud.',
      INVALID_INPUT: 'Los campos de la solicitud de sello no son válidos.',
      INVALID_OUTPUT: 'El resultado de la gestión física no es válido.',
      INVALID_RETURN:
        'La devolución física requiere una salida externa cerrada administrativamente y un motivo.',
      INVALID_SEAL_TYPE:
        'El tipo de sello está inactivo o no coincide con la solicitud aprobada.',
      INVALID_TIME:
        'Las horas de gestión física o el plazo de devolución no son válidos.',
      KEEPER_REQUIRED:
        'Se requiere una función activa de responsable del sello.',
      OUTSTANDING_CUSTODY:
        'Este sello tiene una entrega en custodia pendiente de devolución.',
      PHYSICAL_ALREADY_REGISTERED:
        'El uso físico o la devolución ya se han registrado.',
      REQUEST_NOT_FOUND: 'La solicitud no está disponible.',
      SEAL_EVIDENCE_REQUIRED:
        'Se requieren justificantes inmutables del sellado real.',
      SEAL_NOT_FOUND: 'El sello no está disponible.',
      SEAL_UNAVAILABLE: 'Este sello está actualmente prestado.',
      SLA_UNSUPPORTED:
        'La programación de recordatorios configurada no es compatible.',
      TARGET_MISMATCH: 'La tarea ofrecida no pertenece a esta solicitud.',
      VERSION_CONFLICT:
        'El registro ha cambiado. Actualiza antes de volver a intentarlo.',
    },

    disableInstance: '¿Desactivar el sello «{{name}}»?',
    disableInstanceDescription:
      'Los sellos desactivados no se pueden seleccionar para nuevas gestiones físicas. Se conservan los registros inmutables y los justificantes de custodia existentes.',
    disable: 'Desactivar sello',
    instanceSaved: 'Sello «{{name}}» guardado',

    reloadInstance: '¿Volver a cargar los datos del sello?',
    reloadInstanceDescription:
      'Al recargar se descartan los datos sin guardar y se utiliza la versión actual. Debes introducir de nuevo el motivo del cambio.',

    save: 'Guardar sello',
    forbidden: 'Acceso denegado. Contacta con un administrador',
    missing: 'Este sello no está disponible',

    instances: 'Gestión de sellos',
    instanceNotice:
      'Gestiona los datos de sellos. La custodia física y los registros solo se establecen mediante gestiones reales.',
    instanceCode: 'Código de sello',
    instanceName: 'Nombre del sello',
    instanceActive: 'Activo',
    instanceVersion: 'Versión',
    newInstance: 'Nuevo sello',
    editInstance: 'Editar sello',
    emptyInstances: 'Aún no hay sellos',

    returnTarget: 'Destino de devolución',
    title: 'Solicitudes de sellos',
    description:
      'Solicita el uso de sellos y consulta los datos actuales de aprobación y gestión física.',
    confirmations: {
      confirmed: 'Confirmado',
      notApplicable: 'No aplicable',
      unconfirmed: 'Sin confirmar',
    },
    confirmedBy: 'Devolución confirmada por',
    contractConfirmation: 'Confirmación de justificantes contractuales',
    ledger: 'Registro de sellos',
    number: 'Número de solicitud',
    purpose: 'Finalidad',
    applicant: 'Solicitante',
    sealType: 'Tipo de sello',
    copies: 'Copias aprobadas',
    status: 'Estado',
    refresh: 'Actualizar',
    new: 'Nueva solicitud de sello',
    edit: 'Editar solicitud',
    search: 'Buscar número, finalidad o solicitante',
    all: 'Todos los estados',
    clear: 'Borrar filtros',
    oldest: 'Creación: más antiguos primero',
    newest: 'Creación: más recientes primero',
    draft: 'Borrador',
    noMatch: 'No hay solicitudes coincidentes',
    empty: 'Aún no hay solicitudes de sellos',
    emptyLedger: 'Aún no hay registro físico',
    sealId: 'Sello real',
    actualCopies: 'Copias reales',
    borrowedAt: 'Hora real de salida',
    sealedAt: 'Hora real de sellado',
    returnedAt: 'Hora real de devolución',
    registeredBy: 'Registrado por',
    physicalNotice:
      'La aprobación o el cierre administrativo no acreditan el sellado ni la devolución físicos. La salida solo registra la custodia física.',
    detail: 'Detalles de la solicitud de sello',
    moreActions: 'Más acciones',
    contractId: 'Contrato vinculado',
    contractVersion: 'Versión contractual fijada',
    contact: 'Contacto y notas',
    external: 'Salida externa',
    returnDueAt: 'Hora prevista de devolución',
    ledgerId: 'Identificador de registro inmutable',
    exceptionReason: 'Incidencia de gestión',
    administrativeReason: 'Motivo de cierre administrativo',
    yes: 'Sí',
    no: 'No',
    files: 'Archivos de la solicitud',
    history: 'Historial de acciones',
    download: 'Descargar',
    cancel: 'Cancelar',
    saveDraft: 'Guardar borrador',
    submit: 'Guardar y enviar',
    confirm: 'Confirmar acción',
    saved: 'Solicitud de sello guardada',
    required: 'Este campo es obligatorio',
    futureReturn: 'La devolución prevista debe ser futura',
    sourceRequired: 'Elige un contrato o sube un archivo antes de enviar',
    fileSource: 'Utilizar archivos de la solicitud',
    uploadNotice:
      'Completa primero los campos obligatorios. Subir guarda un borrador; guardar o enviar vincula los archivos subidos.',
    remove: 'Quitar',
    discard: 'Descartar cambios',
    discardDescription:
      'Se perderán los cambios sin guardar. Los archivos subidos y los borradores guardados se conservan.',
    unavailable:
      'Este registro o acción no están disponibles. Vuelve a la lista y actualiza.',
    failed:
      'La operación ha fallado. Comprueba los datos o actualiza y vuelve a intentarlo.',
    retry: 'Reintentar',
    backToList: 'Volver a la lista',
    loading: 'Cargando',
    invalidInput:
      'Completa los campos obligatorios y comprueba las cantidades y horas reales.',
    checkoutNotice:
      'Confirma la salida real del sello. La salida no registra la hora de sellado ni las copias reales.',
    exceptionalNotice:
      'El cierre administrativo conserva las custodias pendientes. La devolución excepcional conserva la versión contractual original y no activa el contrato.',
    recipient: 'Destinatario',
    reason: 'Motivo o comentario',
    mode: 'Modo de firmantes',
    confirmDescription:
      'Esto modifica el resultado de la solicitud. Confirma la solicitud y la acción seleccionada.',
    states: {
      draft: 'Borrador',
      revision: 'Revisión',
      head: 'Aprobación del departamento',
      legal: 'Aprobación jurídica',
      financeManager: 'Aprobación financiera',
      gm: 'Aprobación de dirección general',
      stamping: 'Registro de sellado',
      returning: 'Confirmación de devolución',
      exception: 'Incidencia de gestión',
      returnException: 'Incidencia de devolución',
      completed: 'Completado',
      administrativelyClosed: 'Cerrado administrativamente',
      rejected: 'Rechazado',
      withdrawn: 'Retirado',
      terminated: 'Terminado',
    },
    actions: {
      edit: 'Editar',
      submit: 'Enviar',
      withdraw: 'Retirar',
      terminate: 'Terminar',
      retry: 'Reintentar gestión',
      forceComplete: 'Cerrar administrativamente',
      actualReturn: 'Confirmar devolución física excepcional',
      approve: 'Aprobar',
      reject: 'Rechazar',
      return: 'Devolver para revisión',
      comment: 'Comentar',
      read: 'Marcar leído',
      claim: 'Asumir',
      release: 'Liberar',
      complete: 'Completar gestión real',
      unable: 'No se puede gestionar',
      transfer: 'Transferir',
      assign: 'Asignar',
      cc: 'Añadir destinatarios',
      addSigner: 'Añadir firmante',
      urge: 'Reclamar',
      appoint: 'Designación por administrador',
      reassign: 'Reasignación por administrador',
    },
    types: {
      official: 'Oficial',
      contract: 'Contrato',
      legalRepresentative: 'Representante legal',
      finance: 'Finanzas',
    },
    modes: {
      before: 'Antes',
      parallel: 'Paralelo',
    },
  },
};
