export default {
  businessErrors: {
    DEPARTURE_CHECKLIST_REQUIRED:
      'Completa la lista de baja laboral antes de continuar.',
    DEPARTURE_LAST_WORKING_DAY_REQUIRED:
      'Confirma el último día de trabajo del empleado.',
    DEPARTURE_DATE_PAST:
      'El último día de trabajo no puede ser anterior a hoy en la zona horaria de la empresa.',
    DEPARTURE_HANDOVER_INVALID:
      'Selecciona un destinatario de traspaso apto distinto del empleado que causa baja.',
    DEPARTURE_HANDOVER_INCOMPLETE:
      'Completa los elementos de traspaso antes de continuar.',
    DEPARTURE_ORDINARY_WORK_INCOMPLETE:
      'Completa el traspaso ordinario de trabajo antes de liquidar la baja.',
    DEPARTURE_LOAN_UNCLEARED:
      'Liquida los anticipos pendientes del empleado antes de liquidar la baja.',
    DEPARTURE_RECEIPT_REQUIRED:
      'Introduce los justificantes de recepción o liquidación de este elemento de traspaso.',
    DEPARTURE_SETTLEMENT_NOTE_REQUIRED:
      'Introduce la nota de liquidación de baja.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      'Completa la reasignación de tareas pendientes antes de continuar.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      'Elige el último día de trabajo previsto y el destinatario del traspaso.',
    DEPARTURE_TYPE_INVALID: 'Selecciona un tipo de baja activado.',
    DEPARTURE_ALREADY_ACTIVE:
      'Este empleado ya tiene una solicitud de baja activa. Abre la solicitud existente.',
    DEPARTURE_CANCELLATION_PENDING:
      'La cancelación de baja está pendiente. Resuélvela antes de continuar.',
    DEPARTURE_EXECUTION_BASELINE_CHANGED:
      'Los datos del empleado o de la baja han cambiado. Actualiza y verifícalos antes de ejecutar.',
  },

  authz: {
    cancel: 'Cancelar baja laboral',
    resource: 'Baja laboral y traspaso',
    view: 'Ver solicitudes de baja',
    submit: 'Enviar solicitudes de baja',
    delegate: 'Crear solicitudes de baja para empleados',
    work: 'Gestionar traspaso de baja',
    settle: 'Confirmar liquidación de baja',
  },
  schedule: {
    title: 'Ejecución de bajas laborales',
    description:
      'Ejecuta las bajas laborales previstas y reintenta los cambios incompletos de cuentas y pertenencias.',
  },

  title: 'Baja laboral y traspaso',
  description:
    'Revisa bajas laborales, traspasos y ejecución en la fecha de efecto.',
  new: 'Nueva solicitud de baja',
  edit: 'Editar',
  number: 'Número de solicitud',
  refresh: 'Actualizar',
  search: 'Buscar por número de solicitud, empleado o motivo',
  view: 'Ver',
  allTypes: 'Todos los tipos de baja',
  allStatuses: 'Todos los estados',
  clearFilters: 'Borrar filtros',
  emptyTitle: 'No hay solicitudes de baja',
  emptyDescription:
    'Las solicitudes de baja y el progreso del traspaso aparecerán aquí.',
  noResults: 'No hay solicitudes de baja coincidentes',
  departureType: 'Tipo de baja',
  reason: 'Motivo',
  expectedLastWorkingDay: 'Último día de trabajo previsto',
  lastWorkingDay: 'Último día de trabajo confirmado',
  handoverUser: 'Destinatario del traspaso',
  createdBy: 'Creado por',
  application: 'Solicitud',
  settlement: 'Liquidación de RR. HH.',
  settlementDate: 'Fecha de liquidación',
  settlementNote: 'Nota de liquidación',
  execution: 'Ejecución de bajas laborales',
  notSettled: 'La liquidación no está completada.',
  notExecuted:
    'La ejecución de baja está incompleta. La cuenta no se ha desactivado.',
  executionComplete:
    'Se han desactivado la cuenta y las pertenencias a la organización.',
  cancellationReason: 'Motivo de cancelación',
  cancellationGuidance:
    'Tras la entrevista de RR. HH., se puede solicitar la cancelación antes de la baja efectiva. Otra persona de RR. HH. debe confirmar antes de restaurar el empleo.',
  handover: 'Trabajo de traspaso',
  claimant: 'Asumido por',
  receiver: 'Destinatario',
  manager: 'Responsable',
  forcedBy: 'Eximido por',
  forceReason: 'Motivo de exención',
  checklistConfirmed: 'Lista confirmada',
  receiverAcknowledged: 'Recepción reconocida',
  yes: 'Sí',
  no: 'No',
  notReady: 'Los requisitos de envío están incompletos.',
  views: {
    mine: 'Mías',
    pending: 'Pendiente',
    done: 'Finalizadas',
    copied: 'Copiado',
  },
  statuses: {
    cancellationReview: 'Confirmación de cancelación',
    cancelled: 'Cancelado',
    draft: 'Borrador',
    revision: 'Devuelto para revisión',
    manager: 'Revisión del responsable',
    head: 'Revisión del responsable del departamento',
    hr: 'Entrevista de RR. HH.',
    gm: 'Revisión de la dirección general',
    handover: 'Traspaso',
    completed: 'Liquidación completada',
    withdrawn: 'Retirado',
    rejected: 'Rechazado',
    terminated: 'Terminado',
  },
  workKinds: {
    work: 'Traspaso de trabajo',
    it: 'TI y cuentas',
    admin: 'Activos y lugar de trabajo',
    finance: 'Anticipos y reembolsos',
  },
  workStates: {
    cancelled: 'Cancelado',
    open: 'Disponible para asumir',
    claimed: 'En curso',
    completed: 'Completado',
  },
  executionStates: {
    cancelled: 'Cancelado',
    ready: 'Esperando fecha de efecto',
    transferring: 'Transfiriendo aprobaciones pendientes',
    blocked: 'Ejecución bloqueada',
    executed: 'Cuenta desactivada',
  },
  errors: {
    missingUnnamed:
      'Esta solicitud de baja ya no existe. Se ha vuelto a la lista de origen.',
    missingReturned:
      '«{{name}}» ya no está disponible. Se ha vuelto a la lista de origen.',
    forbidden: 'Ya no tienes acceso a este registro.',
    notFound: 'Este registro no existe. Vuelve a la lista.',
    conflict:
      'Este registro ha cambiado. Carga el último registro antes de confirmar de nuevo.',
    invalid:
      'No se cumplen los requisitos de la operación. Revisa el registro actual.',
    failed: 'La solicitud ha fallado. Intenta cargarla de nuevo.',
  },
  form: {
    create: 'Nueva solicitud de baja',
    confirmSubmission: 'Confirmar envío de baja',
    submissionHelp:
      'Confirma el último día de trabajo previsto y el destinatario del traspaso antes de enviar a aprobación.',
    edit: 'Editar solicitud de baja',
    save: 'Guardar borrador',
    saved: 'Se ha guardado «{{name}}»',
    mode: 'Crear para',
    self: 'Mi dimisión',
    manual: 'Solicitud delegada de RR. HH.',
    employee: 'Empleado',
    employeeSearch: 'Buscar empleados',
    chooseEmployee: 'Elegir un empleado activo',
    employeesDenied:
      'Se requiere acceso a fichas de empleados para seleccionar un destinatario.',
    previous: 'Candidatos anteriores',
    next: 'Candidatos siguientes',
    chooseType: 'Elegir un tipo de baja',
    chooseHandover: 'Elegir destinatario del traspaso',
    searchHandover: 'Buscar destinatarios aptos',
    handoverSearchMinimum:
      'Introduce al menos dos caracteres para buscar por nombre o código de empleado.',
    noHandoverCandidates:
      'No hay destinatarios aptos. Prueba otro nombre o código de empleado o pide a RR. HH. que compruebe el estado del empleado y su cuenta.',
    requiredOnSubmit: 'Obligatorio al enviar; opcional al guardar un borrador.',
    handoverHelp:
      'Obligatorio al enviar; opcional para borradores. Elige otro empleado en prueba o confirmado con cuenta habilitada. Busca por nombre o código.',
    refineHandoverSearch:
      'Hay muchos destinatarios coincidentes. Introduce un nombre más específico.',
    required: 'Completa este campo.',
    dateInvalid: 'Elige una fecha de calendario válida.',
    invalid: 'Revisa este campo y vuelve a intentarlo.',
    dateHelp:
      'La fecha confirmada en la entrevista de RR. HH. es el último día de trabajo definitivo.',
    manualHelp:
      'RR. HH. puede crear solicitudes de despido o fin de contrato para empleados.',
    unavailable:
      'No puedes crear esta solicitud. Comprueba tu estado de empleado y tus permisos.',
    unknown:
      'El resultado del guardado está sin confirmar. Comprueba los borradores existentes antes de crear otra solicitud.',
    checkDrafts: 'Consultar borradores existentes',
    noProof:
      'No se ha encontrado un borrador coincidente. Esto no demuestra que el guardado haya fallado. Mantén esta solicitud bloqueada y contacta con RR. HH.',
    openDraft: 'Abrir este borrador para verificarlo',
    confirmDraft: 'Esta es la solicitud guardada',
    storageUnavailable:
      'El almacenamiento del navegador no está disponible. El guardado está desactivado para evitar solicitudes duplicadas tras una interrupción.',
    unknownPersisted:
      'Una solicitud de creación anterior sigue sin confirmar. Este bloqueo persiste al actualizar.',
  },
  actionForm: {
    approveConsequence:
      'La aprobación ofrecida se registra. La aprobación final aplica el resultado de empleo aprobado.',

    uncertain:
      'El resultado está sin confirmar. Conserva estos datos y reintenta la misma operación; no envíes una solicitud modificada.',
    replay: 'Reintentar la misma operación',
    unsupported:
      'Esta acción necesita un contrato de entrada que esta página no admite.',
    person: 'Destinatario',
    mode: 'Posición del firmante',
    place: 'Puesto de aprobación',
    releaseConsequence:
      'Esto libera las tareas de aprobación pendientes y no se puede deshacer aquí.',
    returnConsequence:
      'La solicitud se devuelve para corregirla y se cierra el trabajo pendiente actual.',
    submitConsequence:
      'La solicitud entra en aprobación con sus datos de envío fijados.',
    genericConsequence:
      'El servidor aplica la operación ofrecida al destino de aprobación seleccionado.',
    latest: 'Leer última versión',
    conflict:
      'La solicitud de baja ha cambiado. Los datos introducidos se conservan. Lee la última versión, revísala y confirma de nuevo.',
    completed: '{{action}} completada para «{{name}}»',
    committed:
      'La operación se ha completado. Actualiza la solicitud de baja antes de realizar otra acción.',
    before: 'Antes',
    after: 'Después',
    alongside: 'En paralelo',
    revision: 'Corrección del solicitante',
    required: 'Completa este campo.',
    limit: 'Este valor es demasiado largo.',
    title: '{{action}} baja de «{{name}}»',
    comment: 'Comentario / motivo',
    confirm: 'Confirmar',
    saved: 'Se ha actualizado «{{name}}»',
    unavailable: 'Esta acción ya no está disponible. Carga el último registro.',
    unknown:
      'El resultado está sin confirmar. Carga el último registro antes de continuar.',
    to: 'Destinatario',
    returnTarget: 'Devolver a',
    confirmTitle: '¿{{action}} «{{name}}»?',
    confirmDescription:
      'Esto actualiza la decisión de baja. Confirma el empleado y el registro actual.',
    lastWorkingDay: 'Último día de trabajo confirmado',
    settlementDate: 'Fecha de liquidación',
    settlementNote: 'Nota de liquidación',
    labels: {
      requestCancellation: 'Solicitar cancelación de baja',
      submit: 'Enviar',
      withdraw: 'Retirar',
      terminate: 'Terminar',
      settle: 'Confirmar liquidación',
      approve: 'Aprobar',
      reject: 'Rechazar',
      return: 'Devolver',
      returnTo: 'Devolver',
      comment: 'Comentar',
      read: 'Marcar leído',
      urge: 'Reclamar',
      transfer: 'Transferir',
      addSigner: 'Añadir firmante',
      cc: 'Copiar',
      claim: 'Asumir',
      release: 'Liberar',
      appoint: 'Designar',
      reassign: 'Reasignar',
    },
  },
  work: {
    labels: {
      requestCancellation: 'Solicitar cancelación de baja',
      claim: 'Asumir',
      confirmChecklist: 'Confirmar lista',
      acknowledgeReceipt: 'Reconocer recepción',
      complete: 'Completar',
      forceComplete: 'Forzar finalización',
    },
    title: '{{action}} {{kind}} de «{{name}}»',
    reason: 'Motivo de exención',
    confirmChecklist: 'He completado la lista.',
    acknowledgeReceipt: 'He recibido el traspaso.',
    blocked:
      'La liquidación está incompleta. Resuelve los elementos pendientes indicados.',
    forceWarning:
      'La finalización forzada del traspaso no modifica los registros de activos ni financieros.',
    forceConfirm: '¿Eximir {{kind}} de «{{name}}»?',
    forceDescription:
      'Se omitirán los justificantes normales de liquidación. Se auditarán el motivo y la persona responsable real.',
  },
  blockers: {
    generic:
      'No se cumple un requisito. Actualiza y pide a la persona responsable que lo resuelva.',
    DEPARTURE_ASSET_SERVICE_UNAVAILABLE:
      'La liquidación normal de activos aún no está disponible.',
    DEPARTURE_REIMBURSEMENT_SERVICE_UNAVAILABLE:
      'La liquidación de reembolsos no está disponible.',
    DEPARTURE_LOANS_NOT_CLEARED:
      'No se han liquidado los anticipos o las devoluciones reservadas.',
    REIMBURSEMENT_DEPARTURE_NOT_CLEARED:
      'Siguen abiertas solicitudes de reembolso.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      'Elige la fecha prevista y el destinatario del traspaso.',
    DEPARTURE_DATE_PAST: 'El último día de trabajo previsto está en el pasado.',
    DEPARTURE_REASSIGNMENT_UNAVAILABLE:
      'La transferencia de aprobaciones no está disponible. La cuenta sigue habilitada.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      'Siguen asignadas aprobaciones pendientes a este empleado.',
    DEPARTURE_EXECUTION_FAILED:
      'La ejecución de baja ha fallado y la tarea diaria volverá a intentarla.',
  },
};
