export default {
  certificates: {
    authz: {
      readable: 'Solicitudes propias y de participación',
      requests: 'Solicitudes de certificados',
      view: 'Ver',
      create: 'Crear',
      edit: 'Editar',
      operate: 'Operar',
      issue: 'Emitir',
      income: 'Ingresos',
      owned: 'Propios',
    },
    savedRecord: 'Se ha guardado la solicitud de certificado de «{{name}}»',
    issuedRecord: 'Se ha emitido el certificado de «{{name}}»',
    submittedRecord: 'Se ha enviado la solicitud de certificado de «{{name}}»',

    businessErrors: {
      CERTIFICATE_ACCESS_DENIED:
        'Operación de certificado rechazada: acceso denegado',
      CERTIFICATE_APPROVAL_REFUSED:
        'Operación de certificado rechazada: aprobación denegada',
      CERTIFICATE_ARTIFACT_MISSING:
        'Operación de certificado rechazada: falta el documento generado',
      CERTIFICATE_CLAIM_REQUIRED:
        'Operación de certificado rechazada: se requiere asumir la tarea',
      CERTIFICATE_COMMAND_CONFLICT:
        'Operación de certificado rechazada: conflicto de comandos',
      CERTIFICATE_COMMAND_INVALID:
        'Operación de certificado rechazada: comando no válido',
      CERTIFICATE_DEPARTMENT_REQUIRED:
        'Operación de certificado rechazada: se requiere un departamento',
      CERTIFICATE_EMPLOYEE_REQUIRED:
        'Operación de certificado rechazada: se requiere un empleado',
      CERTIFICATE_HEAD_REQUIRED:
        'Operación de certificado rechazada: se requiere un responsable',
      CERTIFICATE_HR_REQUIRED:
        'Operación de certificado rechazada: se requiere RR. HH.',
      CERTIFICATE_INCOME_DENIED:
        'Operación de certificado rechazada: acceso a ingresos denegado',
      CERTIFICATE_INCOME_INVALID:
        'Operación de certificado rechazada: ingresos no válidos',
      CERTIFICATE_INVALID:
        'Operación de certificado rechazada: datos no válidos',
      CERTIFICATE_PREPARATION_INVALID:
        'Operación de certificado rechazada: preparación no válida',
      CERTIFICATE_PREPARATION_MISSING:
        'Operación de certificado rechazada: falta la preparación',
      CERTIFICATE_PREPARATION_STALE:
        'Operación de certificado rechazada: preparación desactualizada',
      CERTIFICATE_SOURCE_STALE:
        'Operación de certificado rechazada: origen desactualizado',
      CERTIFICATE_TARGET_MISMATCH:
        'Operación de certificado rechazada: el destino no coincide',
      CERTIFICATE_TEMPLATE_DENIED:
        'Operación de certificado rechazada: acceso a la plantilla denegado',
    },

    title: 'Certificados',
    description: 'Solicita y emite certificados de empleados',
    new: 'Nueva solicitud de certificado',
    edit: 'Editar solicitud de certificado',
    detail: 'Detalles del certificado',
    issue: 'Emitir certificado',
    refresh: 'Actualizar',
    clear: 'Borrar filtros',
    search: 'Buscar finalidad',
    all: 'Todos los estados',
    name: 'Certificado',
    recordName: 'Certificado · {{name}}',
    type: 'Tipo',
    purpose: 'Finalidad',
    copies: 'Copias',
    delivery: 'Método de entrega',
    applicant: 'Solicitante',
    createdAt: 'Fecha de solicitud',
    status: 'Estado',
    number: 'Número de certificado',
    issueDate: 'Fecha de emisión',
    oldest: 'Más antiguos primero',
    newest: 'Más recientes primero',
    empty: 'No hay solicitudes de certificados',
    noMatch: 'No hay solicitudes coincidentes',
    failed: 'No se ha podido completar esta operación',
    unavailable: 'Este registro o acción ya no están disponibles',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    save: 'Guardar borrador',
    saved: 'Guardado',
    loading: 'Cargando detalles del certificado',
    moreActions: 'Más acciones',
    backToList: 'Volver a la lista de certificados',
    consequences: {
      withdraw: 'Retira esta solicitud; saldrá de la cola de revisión activa.',
      terminate: 'Termina esta solicitud; el procesamiento normal se detendrá.',
      forceComplete:
        'Finaliza esta solicitud de forma excepcional; no se emitirá ningún certificado.',
      reject: 'Rechaza esta solicitud; no pasará a emisión.',
      return: 'Devuelve esta solicitud al solicitante para que la modifique.',
      unable:
        'Registra que RR. HH. no puede emitir este certificado; la solicitud requerirá resolución.',
    },
    invalidInput: 'Revisa los campos indicados e introduce valores válidos.',
    invalidCopies: 'Introduce un número entero entre 1 y 100.',
    invalidPurpose: 'La finalidad debe tener como máximo 2000 caracteres.',
    required: 'Obligatorio',
    confirm: 'Confirmar',
    discard: 'Descartar cambios',
    discardDescription: 'Se perderán los cambios sin guardar.',
    confirmDescription:
      '¿Aplicar esta acción al certificado solicitado por {{name}}? Esto modifica la solicitud actual.',
    history: 'Historial de aprobación',
    mode: 'Posición del revisor',
    modes: {
      before: 'Antes de mi decisión',
      alongside: 'En paralelo con mi decisión',
    },
    recipient: 'Destinatario',
    reason: 'Motivo o comentario',
    download: 'Descargar DOCX',
    income: 'Ingresos mensuales (CNY)',
    template: 'Plantilla',
    selectTemplate: 'Elegir una plantilla',
    revision: 'Revisión fijada',
    previous: 'Anterior',
    next: 'Siguiente',
    prepare: 'Preparar emisión',
    generate: 'Generar documento',
    confirmIssue: 'Confirmar entrega',
    issued: 'Certificado emitido',
    issueDescription:
      'Prepara una revisión fija de plantilla, genera el documento real y confirma la emisión para archivarlo.',
    invalidIssue:
      'Elige una fecha de emisión e introduce unos ingresos válidos con un máximo de dos decimales.',
    generateDescription:
      'La generación puede tardar. Si falla, reintenta esta preparación; aún no se emite ningún certificado.',
    confirmIssueDescription:
      'El documento generado se emitirá y se guardará permanentemente en la ficha del empleado.',
    types: { employment: 'Empleo', income: 'Ingresos', other: 'Otros' },
    deliveries: { pickup: 'Recogida', mail: 'Correo', digital: 'Digital' },
    states: {
      draft: 'Borrador',
      revision: 'Requiere revisión',
      head: 'Revisión del responsable',
      issuing: 'Gestión de RR. HH.',
      issued: 'Entregado',
      rejected: 'Rechazado',
      withdrawn: 'Retirado',
      terminated: 'Terminado',
      issueException: 'Incidencia de entrega',
      administrativelyClosed: 'Cerrado administrativamente',
    },
    actions: {
      edit: 'Editar',
      submit: 'Enviar',
      withdraw: 'Retirar',
      terminate: 'Terminar',
      forceComplete: 'Cierre administrativo',
      retry: 'Reintentar gestión',
      approve: 'Aprobar',
      reject: 'Rechazar',
      return: 'Devolver para revisión',
      claim: 'Asumir',
      release: 'Liberar',
      assign: 'Asignar',
      transfer: 'Transferir',
      appoint: 'Designar',
      reassign: 'Reasignar',
      comment: 'Comentar',
      read: 'Marcar como leído',
      cc: 'Copiar',
      addSigner: 'Añadir revisor',
      addSign: 'Añadir revisor',
      urge: 'Recordar',
      complete: 'Confirmar entrega',
      unable: 'No se puede entregar',
      delegate: 'Delegar',
      recall: 'Recuperar',
    },
  },
};
