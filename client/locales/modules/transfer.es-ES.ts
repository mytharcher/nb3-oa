export default {
  recordName: 'Cambio de personal de «{{name}}»',
  namedAction: '¿{{action}} para «{{name}}»?',
  savedRecord: 'Se ha guardado el cambio de personal de «{{name}}»',

  businessErrors: {
    TRANSFER_INVALID_DATE:
      'Selecciona una fecha de efecto válida para el cambio de personal.',
    TRANSFER_NO_CHANGE:
      'No se han modificado datos empresariales. Modifica al menos un campo permitido.',
    TRANSFER_SALARY_INVALID:
      'Introduce un salario válido dentro del intervalo admitido.',
    TRANSFER_RATIO_INVALID:
      'Comprueba el porcentaje de ajuste salarial respecto al límite configurado.',
    TRANSFER_INVALID_PROMOTION:
      'El nivel seleccionado no constituye un ascenso. Comprueba los niveles actual y de destino.',
    TRANSFER_TARGET_DEPARTMENT_UNAVAILABLE:
      'Selecciona un departamento de destino activo.',
    TRANSFER_TARGET_POSITION_UNAVAILABLE:
      'Selecciona un puesto activo del departamento de destino.',
    TRANSFER_ACCOUNT_UNAVAILABLE:
      'Selecciona una cuenta de capacidad de plantilla coincidente, inicializada y con capacidad suficiente.',
    TRANSFER_YEAR_REBIND_REQUIRED:
      'El año ha cambiado. Vuelve a vincular la solicitud a la cuenta anual de plantilla correspondiente.',
    TRANSFER_SOURCE_CHANGED:
      'La asignación actual del empleado ha cambiado. Actualiza y revisa la propuesta.',
    TRANSFER_COMPENSATION_CHANGED:
      'El salario del empleado ha cambiado. Actualiza antes de revisar la remuneración.',
    TRANSFER_NOT_DUE:
      'Aún no ha llegado la fecha de efecto. Espera hasta la fecha programada.',
    TRANSFER_INVALID_KINDS:
      'Elige los tipos de cambio de personal que correspondan a los campos modificados.',
  },

  moreActions: 'Más acciones',
  return: 'Devolver',
  destructiveConsequence:
    'Esta acción finaliza o modifica la aprobación actual. Revisa las consecuencias antes de confirmar.',
  searchPeople: 'Buscar nombre del candidato',
  title: 'Cambios de personal',
  description:
    'Sigue la aprobación y la entrada en vigor de cambios de personal.',
  create: 'Nueva solicitud',
  search: 'Buscar por motivo o identificador de solicitud',
  searchEmployees: 'Buscar nombre o código de empleado',
  empty: 'No hay solicitudes de cambios de personal',
  noResults: 'No hay solicitudes coincidentes',
  refresh: 'Actualizar',
  clear: 'Borrar filtros',
  allStatuses: 'Todos los estados',
  employeeInDetail: 'Ver detalle',
  salary: 'Salario privado',
  currentSalary: 'Salario actual',
  salaryDenied: 'No puedes ver el salario de esta solicitud',
  failedToExecute:
    'Ha fallado la entrada en vigor. Resuelve los datos del empleado o las cuentas de capacidad antes de reintentar.',
  loading: 'Cargando…',
  saved: 'Operación completada',
  saving: 'Guardando…',
  save: 'Guardar',
  cancel: 'Cancelar',
  confirm: 'Confirmar acción',
  retry: 'Reintentar',
  loadLatest: 'Cargar última versión',
  reviewEditWarning:
    'Los cambios reinician la aprobación y cierran las tareas existentes.',
  cancelConsequence:
    'La capacidad sigue asignada hasta que una persona independiente de RR. HH. confirme la cancelación.',
  rebindConsequence:
    'Vuelve a vincular las cuentas reales del año actual. La entrada en vigor seguirá pendiente de mantenimiento.',
  confirmAction: 'Revisa la solicitud y la acción actuales e indica un motivo.',
  unavailable:
    'La tarea o el permiso han cambiado. Vuelve a los detalles y actualiza.',
  recipient: 'Destinatario',
  select: 'Selecciona una opción',
  none: 'Ninguno',
  required: 'Este campo es obligatorio',
  tooLong: 'El contenido es demasiado largo',
  noChanges: 'Modifica al menos un campo permitido',
  capacityResolved:
    'Se han resuelto los identificadores de las cuentas de capacidad. La reserva se valida en la transacción de aprobación.',
  capacityRequired:
    'Selecciona empleado, departamento de destino, puesto y fecha de efecto para resolver las cuentas reales de capacidad.',
  previous: 'Anterior',
  next: 'Siguiente',
  discardTitle: '¿Descartar los cambios sin guardar?',
  discardDescription: 'Al salir se descartarán los datos introducidos.',
  keepEditing: 'Seguir editando',
  discard: 'Descartar cambios',

  fields: {
    id: 'Identificador de solicitud',
    employeeId: 'Empleado',
    kinds: 'Tipos de cambio',
    targetDepartmentId: 'Departamento de destino',
    targetPositionId: 'Puesto de destino',
    targetGradeId: 'Nivel de destino',
    targetManagerId: 'Responsable de destino',
    effectiveDate: 'Fecha de efecto',
    targetSalary: 'Salario de destino (CNY)',
    reason: 'Motivo',
    status: 'Estado',
    applicantId: 'Solicitante',
    createdAt: 'Fecha de creación',
  },
  factFields: {
    employee: 'Empleado',
    department: 'Departamento de destino',
    position: 'Puesto de destino',
    grade: 'Nivel de destino',
    manager: 'Responsable de destino',
  },
  status: {
    completed: 'Vigente',
    draft: 'Borrador',
    revision: 'Devuelto para revisión',
    manager: 'Revisión del responsable',
    sourceHead: 'Revisión del departamento de origen',
    targetHead: 'Revisión del departamento de destino',
    hr: 'Revisión de RR. HH.',
    executive: 'Revisión de dirección',
    gm: 'Revisión de la dirección general',
    pendingEffective: 'Pendiente de entrada en vigor',
    cancellationReview: 'Cancelación pendiente de confirmación',
    executed: 'Vigente',
    cancelled: 'Cancelado',
    rejected: 'Rechazado',
    withdrawn: 'Retirado',
    terminated: 'Terminado',
  },
  operations: {
    submit: 'Enviar',
    edit: 'Editar solicitud',
    reviewEdit: 'Modificar campos de revisión',
    withdraw: 'Retirar',
    terminate: 'Terminar',
    requestCancellation: 'Solicitar cancelación',
    rebind: 'Volver a vincular capacidad del año actual',
  },
  kinds: {
    transfer: 'Transferir',
    salaryChange: 'Cambio salarial',
    promotion: 'Ascenso',
  },
  authz: {
    rebind: 'Volver a vincular la capacidad al año actual',
    resource: 'Cambios de personal',
    view: 'Ver solicitudes',
    operate: 'Ejecutar acciones de aprobación',
    viewSalary: 'Ver salario',
    submit: 'Enviar y editar solicitudes',
    reviewEdit: 'Modificar campos de revisión permitidos',
    cancel: 'Solicitar cancelación antes de su entrada en vigor',
    readable: 'Solicitudes propias y de participación',
  },
  errors: {
    missing:
      'Esta solicitud no está disponible. Vuelve a la lista y actualiza.',
    conflict:
      'La solicitud ha cambiado. Carga el detalle más reciente y vuelve a intentarlo.',
    precondition:
      'Las condiciones empresariales no están disponibles. Comprueba los datos del empleado y las cuentas de capacidad.',
    salary:
      'Introduce un salario dentro del intervalo permitido con un máximo de dos decimales.',

    denied: 'No tienes permiso para este cambio de personal.',
    failed:
      'No se ha podido completar el cambio de personal. Actualiza y vuelve a intentarlo.',
  },
};
