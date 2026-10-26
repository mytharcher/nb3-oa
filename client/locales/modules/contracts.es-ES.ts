export default {
  contracts: {
    title: 'Solicitudes de contratos',
    ledgerTitle: 'Contratos',
    description: 'Inicia la revisión de contratos y sigue su progreso',
    ledgerDescription: 'Leer contratos aprobados y versiones inmutables',
    source: 'Página de origen',
    detail: 'Detalles del contrato',
    new: 'Nuevo contrato',
    edit: 'Editar',
    save: 'Guardar',
    saveDraft: 'Guardar borrador',
    cancel: 'Cancelar',
    submit: 'Enviar a aprobación',
    appendText: 'Añadir texto',
    rebase: 'Actualizar versión de base',
    historicalEntry: 'Registrar contrato histórico',
    number: 'Número',
    contractType: 'Tipo de contrato',
    operation: 'Operación',
    counterparty: 'Contraparte',
    counterpartyKind: 'Tipo de contraparte',
    customer: 'Cliente',
    vendor: 'Proveedor acreditado',
    amountCents: 'Importe del contrato (yuanes)',
    startsOn: 'Fecha de inicio',
    endsOn: 'Fecha de fin',
    paymentTerms: 'Condiciones de pago',
    standardTemplate: 'Plantilla estándar',
    reason: 'Motivo',
    textVersionId: 'Texto del contrato',
    attachments: 'Adjuntos',
    versions: 'Versiones inmutables',
    version: 'Versión',
    baseVersion: 'Versión de base',
    nonStandard: 'Opinión jurídica no estándar',
    selectOpinion: 'Seleccionar una opinión jurídica',
    yes: 'Sí',
    no: 'No',
    search: 'Buscar número o contraparte',
    ledgerSearch: 'Buscar número de contrato',
    empty: 'No hay solicitudes de contratos',
    emptyDescription: 'Crea una solicitud para iniciar la revisión',
    emptyReadOnly:
      'Contacta con un administrador para obtener acceso al envío de contratos',
    ledgerEmpty: 'No hay contratos',
    ledgerEmptyDescription: 'Aquí aparecen los contratos aprobados',
    noResults: 'Sin coincidencias',
    clear: 'Borrar filtros',
    retry: 'Reintentar',
    refresh: 'Actualizar',
    allStatuses: 'Todos los estados',
    status: 'Estado',
    createdAt: 'Fecha de creación',
    updatedAt: 'Fecha de actualización',
    view: 'Ver',
    noAccess:
      'No tienes acceso a este contrato. Contacta con un administrador.',
    fieldsRestricted:
      'No se pueden leer todos los campos del contrato. Contacta con un administrador.',
    missing: 'El contrato ya no existe. Vuelve a la página de origen.',
    failed: 'No se han podido cargar los datos del contrato. Reintenta.',
    invalid:
      'Comprueba los detalles del contrato y los requisitos de la acción actual.',
    conflict: 'El contrato ha cambiado. Carga la última versión y compruébala.',
    loadLatest: 'Cargar última versión',
    textDenied: 'No se puede leer el texto del contrato',
    unknown:
      'El resultado requiere comprobación. Los datos están bloqueados; reintenta la operación original.',
    retryExact: 'Reintentar operación original',
    required: 'Rellena este campo',
    amountInvalid:
      'Introduce un importe no negativo con un máximo de dos decimales',
    dateInvalid: 'La fecha de fin no puede ser anterior a la de inicio',
    tooLong: 'Este valor es demasiado largo',
    textRequired: 'Sube y vincula el texto del contrato antes de enviar',
    actionsFor: 'Acciones para «{{name}}»',
    rebaseTitle: '¿Actualizar la versión de base del contrato «{{name}}»?',
    rebaseDescription:
      'Conserva esta propuesta, actualiza la versión de base y repite la revisión completa.',
    saved: 'Se ha guardado «{{name}}»',
    submitted: 'Se ha enviado «{{name}}»',
    completed: 'Acción completada para «{{name}}»',
    draftName: 'Borrador de contrato',
    confirmation: '¿{{action}} contrato «{{name}}»?',
    dangerConsequence:
      'Esto finaliza la revisión de la solicitud actual y cierra su trabajo pendiente.',
    historicalConsequence:
      'Publica una versión histórica auditada. Comprueba el texto y la propuesta.',
    notAvailable: 'Esta acción no está disponible. Actualiza para comprobarlo.',
    comment: 'Comentario o motivo',
    recipient: 'Destinatario',
    recipientSearch: 'Buscar destinatarios aptos',
    moreCandidates: 'Más candidatos',
    noCandidates: 'No hay destinatarios aptos',
    place: 'Puesto de aprobación',
    returnTarget: 'Devolver a',
    signerMode: 'Modo de firmantes añadidos',
    sourceContract: 'Contrato aprobado',
    proposal: 'Propuesta de contrato',
    paidCents: 'Importe pagado',
    heldCents: 'Pagos reservados',
    availableCents: 'Disponible para pago',
    actor: 'Responsable',
    request: 'Solicitud',
    openRequest: 'Ver solicitud',
    privateTextHint:
      'El texto del contrato requiere acceso a su solicitud propietaria.',
    selectExisting: 'Elegir archivo subido',
    removeFile: 'Quitar selección «{{name}}»',
    uploadHint:
      'Texto: PDF. Justificantes: PDF, JPEG, PNG o WebP; hasta 5 MB por archivo.',
    fileInvalid: 'Elige un archivo admitido y coherente de hasta 5 MB.',
    uploadUnknown:
      'El resultado de subida requiere comprobación. Elige un archivo subido; no vuelvas a subir.',
    fileMissing:
      'El archivo seleccionado no está disponible. Comprueba el acceso y la versión de texto.',
    noFiles: 'No hay archivos subidos',
    uploaded: 'Se ha subido «{{name}}»',
    bindText: 'Continuar vinculando texto añadido',
    boundText: 'Versión de texto {{version}} vinculada',
    currentVersion: 'Versión actual',
    selectSource: 'Elige un contrato aprobado para cargar su versión completa',
    discard: '¿Descartar los cambios sin guardar?',
    discardDescription:
      'Se descartarán los datos introducidos; los justificantes subidos seguirán guardados.',
    discardConfirm: 'Descartar cambios',
    progress: 'Progreso de revisión',
    timeline: 'Historial de revisión',
    selectFile: 'Elegir archivo',
    sourceVersion: 'Versión de origen',
    operations: {
      new: 'Nuevo contrato',
      change: 'Modificación',
      renew: 'Renovación',
      terminate: 'Terminación',
    },
    statuses: {
      draft: 'Borrador',
      revision: 'Revisión',
      head: 'Revisión del departamento',
      legalFinance: 'Revisión jurídica y financiera',
      standardFinance: 'Revisión financiera',
      executive: 'Revisión de dirección',
      gm: 'Revisión de la dirección general',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      withdrawn: 'Retirado',
      terminated: 'Terminado',
      activePendingSeal: 'Aprobado, pendiente de sellado',
      active: 'Activo',
    },
    views: {
      mine: 'Mías',
      pending: 'Pendiente',
      done: 'Finalizadas',
      copied: 'Copiado',
    },
    actions: {
      edit: 'Editar',
      submit: 'Enviar a aprobación',
      withdraw: 'Retirar',
      terminate: 'Terminar',
      approve: 'Aprobar',
      reject: 'Rechazar',
      return: 'Devolver',
      claim: 'Asumir',
      comment: 'Comentar',
      read: 'Marcar leído',
      transfer: 'Transferir',
      addSigner: 'Añadir firmante',
      urge: 'Reclamar',
      appoint: 'Designar aprobador',
      reassign: 'Reasignar',
      historicalEntry: 'Registrar contrato histórico',
      rebase: 'Actualizar versión de base',
    },
    modes: { before: 'Antes', after: 'Después', alongside: 'En paralelo' },

    errors: {
      CONTRACT_ACCESS_DENIED:
        'Este contrato está fuera de tu ámbito de acceso.',
      CONTRACT_ACTION_NOT_ALLOWED:
        'Esta acción no está disponible para el contrato.',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        'El importe del contrato no puede ser inferior a la suma de los pagos realizados y reservados.',
      CONTRACT_ATTACHMENT_DENIED:
        'El campo de adjuntos o el registro del contrato están fuera de tu ámbito de acceso.',
      CONTRACT_ATTACHMENT_INVALID:
        'Elige adjuntos válidos de esta solicitud de contrato.',
      CONTRACT_CANDIDATE_REMOVED:
        'Este contrato propuesto sin publicar se ha eliminado. Crea una solicitud nueva.',
      CONTRACT_CATEGORY_INACTIVE: 'Elige un tipo de contrato activo.',
      CONTRACT_CORRUPT_BALANCE:
        'Los totales de pagos del contrato son incoherentes. Contacta con un administrador.',
      CONTRACT_EMPLOYEE_REQUIRED:
        'Se requiere un empleado activo con un departamento principal.',
      CONTRACT_FIELDS_RESTRICTED:
        'Los campos requeridos del contrato están fuera de tu ámbito de acceso.',
      CONTRACT_FILE_SIZE:
        'Elige un archivo de contrato con contenido de hasta 5 MB.',
      CONTRACT_FILE_TYPE:
        'El texto del contrato debe ser PDF; los justificantes pueden ser PDF, JPEG, PNG o WebP, con contenido acorde al formato.',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        'Esta clave de solicitud ya se ha utilizado con otros datos. Actualiza antes de volver a enviar.',
      CONTRACT_INACTIVE_SOURCE:
        'Elige un contrato de origen aprobado y vigente.',
      CONTRACT_INCOMPLETE_PROPOSAL:
        'Completa el motivo del contrato, las condiciones de pago y la versión inmutable del texto.',
      CONTRACT_INPUT_INVALID:
        'Comprueba los campos de entrada declarados del contrato.',
      CONTRACT_INVALID_AMOUNT:
        'Introduce un importe no negativo en céntimos enteros exactos dentro del intervalo admitido.',
      CONTRACT_INVALID_ID:
        'Se requiere un identificador válido dentro de los límites admitidos.',
      CONTRACT_INVALID_TIME: 'La fecha y hora del contrato no son válidas.',
      CONTRACT_LIMIT_EXCEEDED:
        'Los importes pendientes y pagados superan el límite del contrato.',
      CONTRACT_NOT_CANDIDATE:
        'Solo se puede eliminar el contrato propuesto sin publicar de esta solicitud.',
      CONTRACT_NOT_FOUND: 'No se ha encontrado el contrato de origen.',
      CONTRACT_OUTSTANDING_PAYMENTS:
        'Libera los pagos pendientes antes de terminar el contrato.',
      CONTRACT_REASON_REQUIRED:
        'Introduce un motivo dentro de la longitud admitida.',
      CONTRACT_REBASE_NOT_ALLOWED:
        'Solo el solicitante puede actualizar explícitamente la versión de base de un cambio devuelto.',
      CONTRACT_REQUEST_KEY_REQUIRED:
        'Se requiere una clave estable de solicitud.',
      CONTRACT_RESERVATION_CLOSED: 'La reserva de pago ya se ha cerrado.',
      CONTRACT_RULE_INVALID:
        'La política de aprobación de contratos no existe o no es válida. Contacta con un administrador.',
      CONTRACT_SLA_UNSUPPORTED:
        'El adaptador de aprobación instalado solo admite los plazos configurados de 24/48 horas.',
      CONTRACT_SOURCE_CONFLICT:
        'Esta referencia pertenece a otro contrato de origen.',
      CONTRACT_STORED_ID_INVALID:
        'Un identificador de contrato guardado no es válido. Contacta con un administrador.',
      CONTRACT_SUPPLIER_INVALID:
        'El proveedor debe estar activo y tener una acreditación aprobada. Actualiza su acreditación antes de aprobar.',
      CONTRACT_TARGET_MISMATCH:
        'El destino de aprobación pertenece a otra solicitud de contrato.',
      CONTRACT_TEXT_INVALID:
        'Elige una versión de texto PDF inmutable de esta solicitud.',
      CONTRACT_TEXT_NOT_EDITABLE:
        'Solo se pueden añadir versiones de texto contractual a borradores propios o revisiones devueltas.',
      CONTRACT_TEXT_REQUIRED:
        'Selecciona una versión de texto contractual inmutable válida.',
      CONTRACT_TRANSITION_NOT_ALLOWED:
        'Utiliza la operación específica de contrato con controles de validación.',
      CONTRACT_VERSION_CONFLICT:
        'El contrato aprobado ha cambiado. Devuelve la solicitud, actualiza explícitamente su versión de base y envíala de nuevo a revisión.',
    },
    authz: {
      resource: 'Contratos y modificaciones',
      view: 'Ver solicitudes de contratos',
      submit: 'Crear y editar solicitudes de contratos propias',
      ledger:
        'Leer el registro de contratos aprobados y sus versiones inmutables',
      historicalEntry:
        'Registrar un contrato histórico con constancia jurídica auditada',
    },
  },
};
