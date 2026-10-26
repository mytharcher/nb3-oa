export default {
  recruitment: {
    authz: {
      reviewEdit: 'Modificar campos permitidos del revisor',
      resource: 'Solicitudes de contratación',
      requisitions: 'Asignaciones de contratación',
      view: 'Ver contrataciones',
      submit: 'Crear y enviar solicitudes de contratación',
      operate: 'Procesar aprobaciones de contratación',
      viewSalary: 'Ver intervalo salarial privado',
      close: 'Cerrar asignación restante de contratación',
    },
    identityUnavailable: 'Nombre de organización no disponible',
    catalogRequired:
      'Carga los nombres del departamento y del puesto antes de cerrar esta asignación.',
    requisitionName:
      '{{year}} / {{department}} / {{position}} solicitud de contratación',
    preciseAllocationName:
      '{{year}} / {{department}} / {{position}} asignación de contratación',

    savedRecord: 'Se ha guardado la contratación de «{{name}}»',

    allocationName: 'Asignación de contratación de {{year}}',

    yearInvalid: 'Introduce un año entero entre 1900 y 9999.',
    businessErrors: {
      RECRUITMENT_INVALID_QUANTITY:
        'Introduce un número entero positivo de contrataciones dentro del intervalo admitido.',
      RECRUITMENT_INVALID_SALARY:
        'Introduce un intervalo salarial válido cuyo mínimo no supere el máximo.',
      RECRUITMENT_INVALID_REPLACEMENTS:
        'Selecciona sustituciones de empleados en proceso de baja o ya dados de baja que coincidan con la cantidad de contratación.',
      RECRUITMENT_REPLACEMENT_UNAVAILABLE:
        'Una sustitución ya no es apta. Actualiza y selecciona una sustitución apta.',
      RECRUITMENT_ACCOUNT_MISMATCH:
        'La cuenta de plantilla debe coincidir con el departamento, el puesto y el año.',
      RECRUITMENT_YEAR_MISMATCH:
        'El año de plantilla ha cambiado. Selecciona la cuenta anual correspondiente.',
      RECRUITMENT_DEPARTMENT_UNAVAILABLE: 'Selecciona un departamento activo.',
      RECRUITMENT_POSITION_UNAVAILABLE:
        'Selecciona un puesto activo del departamento elegido.',
      RECRUITMENT_GRADE_UNAVAILABLE: 'Selecciona un nivel activado.',
      RECRUITMENT_GRADE_SNAPSHOT_MISMATCH:
        'El nivel ha cambiado. Actualiza y comprueba el intervalo salarial antes de reenviar.',
      RECRUITMENT_RESERVATION_UNAVAILABLE:
        'No hay una reserva utilizable de plantilla disponible. Actualiza la cuenta y comprueba la capacidad.',
      RECRUITMENT_REQUISITION_ALREADY_PUBLISHED:
        'Esta solicitud de contratación ya está publicada. Actualiza para ver su estado.',
      RECRUITMENT_INVALID_INPUT:
        'Completa departamento, puesto, nivel, plantilla, fecha de inicio, descripción del puesto y motivo.',
    },

    capacityEmpty:
      'No hay plantilla anual inicializada coincidente. Pide a RR. HH. que la cree e inicialice.',
    capacitySelectTarget: 'Selecciona primero departamento, puesto y año.',
    capacityLedger: 'Ver registro de plantilla',

    title: 'Solicitudes de contratación',
    requisitions: 'Peticiones',
    new: 'Nueva solicitud de contratación',
    detailTitle: 'Solicitud de contratación · {{name}}',
    detail: 'Solicitud de contratación',
    search: 'Buscar descripción del puesto o motivo',
    all: 'Todos los estados',
    clear: 'Borrar filtros',
    empty: 'Aún no hay solicitudes de contratación',
    filteredEmpty: 'Ninguna solicitud coincide con estos filtros',
    emptyRequisitions: 'No hay peticiones autorizadas',
    cancel: 'Cancelar',
    save: 'Guardar solicitud de contratación',
    saved: 'Operación de contratación guardada',
    refresh: 'Actualizar',
    retry: 'Reintentar',
    loadLatest: 'Cargar datos actuales',
    noAccess: 'No tienes acceso a este registro.',
    fieldsRestricted: 'Los campos obligatorios están restringidos.',
    missing: 'Este registro no está disponible.',
    conflict:
      'Este registro ha cambiado. Carga los datos actuales y vuelve a intentarlo.',
    invalid:
      'Completa los campos obligatorios y selecciona una cuenta de capacidad inicializada. Comprueba la cantidad de sustituciones y el intervalo salarial.',
    failed: 'La operación ha fallado. Vuelve a intentarlo.',
    notAvailable:
      'Esta operación ya no está disponible con tus permisos actuales.',
    commandReason: 'Motivo de esta operación',
    replacementNote:
      'Solo se muestran identificadores actualmente autorizados de empleados en proceso de baja o dados de baja. El envío verifica la aptitud real de capacidad.',
    unknown:
      'El resultado es incierto. Reintenta exactamente el mismo comando para confirmarlo.',
    retryExact: 'Reintentar comando exacto',
    progress: 'Progreso de aprobación',
    timeline: 'Cronología',
    recipient: 'Destinatario',
    candidatesFailed:
      'No se han podido cargar los destinatarios. Reintenta o actualiza los detalles de aprobación y vuelve a intentarlo.',
    noCandidates:
      'Ningún destinatario cumple los requisitos actuales de aprobación.',
    actionInvalid:
      'Introduce un motivo y selecciona el destinatario, la etapa de devolución, el modo de firma o el puesto requeridos para esta acción.',
    recipientSearch: 'Buscar destinatarios aptos',
    moreCandidates: 'Cargar más destinatarios',
    returnTarget: 'Devolver a etapa',
    signerMode: 'Orden de firmantes',
    place: 'Plaza sin asignar',
    confirmAction: '¿{{action}} para {{id}}?',
    actionConsequence:
      'Esta operación modifica la aprobación o asignación actual.',
    closeConsequence:
      'Solo se libera la asignación de contratación restante sin consumir. Se conserva el historial de empleados ya consumido.',
    discard: '¿Descartar los cambios sin guardar?',
    discardDescription: 'Se perderán los cambios de este formulario.',
    discardConfirm: 'Descartar cambios',
    fields: {
      requisitionTitle: 'Título de la petición',
      id: 'Identificador',
      requisitionId: 'Identificador de petición',
      requestId: 'Identificador de solicitud de origen',
      departmentId: 'Departamento',
      positionId: 'Puesto',
      gradeId: 'Nivel',
      accountId: 'Plantilla anual',
      year: 'Año de capacidad',
      quantity: 'Cantidad',
      kind: 'Tipo de contratación',
      replacementEmployeeIds: 'Empleados sustituidos',
      minimumCents: 'Salario mínimo',
      maximumCents: 'Salario máximo',
      expectedStartDate: 'Fecha prevista de incorporación',
      jobDescription: 'Descripción del puesto',
      reason: 'Motivo empresarial',
      applicant: 'Solicitante',
      status: 'Estado',
      createdAt: 'Fecha de creación',
      statusChangedAt: 'Fecha de actualización del estado',
      sourceYear: 'Año de origen',
      sourceVersion: 'Versión de origen',
      originalQuantity: 'Cantidad aprobada',
      remaining: 'Restante',
      consumed: 'Consumido',
    },
    actions: {
      submit: 'Enviar',
      withdraw: 'Retirar',
      terminate: 'Terminar',
      edit: 'Editar borrador',
      reviewEdit: 'Modificar campos del revisor',
      approve: 'Aprobar',
      reject: 'Rechazar',
      return: 'Devolver',
      comment: 'Comentar',
      appoint: 'Designar',
      reassign: 'Reasignar',
      read: 'Marcar leído',
      transfer: 'Transferir',
      addSigner: 'Añadir firmante',
      urge: 'Reclamar',
      cc: 'Destinatario en copia',
      close: 'Cerrar asignación restante',
    },
    status: {
      draft: 'Borrador',
      revision: 'Revisión',
      head: 'Responsable del departamento',
      hrbp: 'HRBP',
      hrDirector: 'Director de RR. HH.',
      executive: 'Dirección',
      gm: 'Director general',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      withdrawn: 'Retirado',
      terminated: 'Terminado',
      recruiting: 'En contratación',
      full: 'Contratación completada',
      closed: 'Cerrado',
    },
    kinds: {
      additional: 'Ampliación de plantilla',
      replacement: 'Sustitución',
    },
    modes: {
      before: 'Antes',
      after: 'Después',
      alongside: 'En paralelo',
    },
  },
};
