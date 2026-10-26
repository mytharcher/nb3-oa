export default {
  discardTitle: '¿Descartar los cambios de «{{name}}»?',
  discardDescription:
    'Se perderán los cambios sin guardar. Los justificantes guardados del borrador se conservan.',
  discard: 'Descartar cambios',
  title: 'Solicitudes de activos',
  description:
    'Solicita uso, préstamo y baja de activos y confirma la gestión real.',
  new: 'Nueva solicitud de activos',
  draft: 'Borrador de solicitud de activos',
  source: 'Vista de origen',
  detail: 'Ver',
  detailDescription:
    'Datos de la solicitud y acciones de aprobación disponibles.',
  edit: 'Editar',
  editTitle: 'Editar solicitud de activos',
  number: 'Número',
  operationLabel: 'Operación',
  statusLabel: 'Estado',
  quantity: 'Cantidad',
  purpose: 'Finalidad',
  category: 'Categoría',
  asset: 'Activo',
  borrowDueDate: 'Fecha de devolución',
  updatedAt: 'Actualizado',
  scrapReason: 'Motivo de baja',
  appraisalOpinion: 'Opinión de inspección',
  handlingReason: 'Motivo de recepción',
  exceptionReason: 'Motivo de la incidencia',
  allocation: 'Asignación real',
  photos: 'Fotos justificativas',
  originalValue: 'Valor original del activo',
  companyTimeZone: 'Zona horaria de la empresa: {{timeZone}}',
  search: 'Buscar',
  searchPlaceholder: 'Buscar número o finalidad',
  all: 'Todas',
  clearFilters: 'Borrar filtros',
  refresh: 'Actualizar',
  rowActions: 'Acciones para {{name}}',
  empty: 'Aún no hay solicitudes de activos',
  emptyDescription: 'Crea una solicitud para pedir activos o darlos de baja.',
  emptyReadonly: 'Pide acceso a solicitudes a un administrador.',
  noResults: 'No hay solicitudes coincidentes',
  noResultsDescription:
    'Modifica o borra los filtros para encontrar solicitudes.',
  noAccess: 'Ya no tienes acceso. Contacta con un administrador.',
  missing:
    'Esta solicitud no existe o se ha eliminado. Vuelve a la vista de origen.',
  missingNamed: 'La solicitud «{{name}}» no existe o se ha eliminado.',
  conflict:
    'La solicitud ha cambiado. Carga los datos actuales antes de continuar.',
  invalid:
    'Se ha rechazado esta operación. Comprueba los campos obligatorios y las acciones disponibles.',
  loadFailed: 'No se ha podido cargar. Reintenta cuando haya conexión.',
  retry: 'Reintentar',
  loadLatest: 'Cargar última versión',
  missingFields:
    'No se pueden leer algunos campos obligatorios. La edición completa o la confirmación física están desactivadas.',
  unknownResult:
    'El resultado es desconocido. El comando original completo está fijado; reintenta exactamente esa operación para conciliarlo.',
  retryExact: 'Reintentar operación original',
  cancel: 'Cancelar',
  save: 'Guardar',
  saveDraft: 'Guardar borrador',
  submit: 'Enviar a aprobación',
  saving: 'Guardando…',
  saved: 'Se ha guardado «{{name}}»',
  submitted: 'Se ha enviado «{{name}}»',
  completed: '{{action}} completada para «{{name}}»',
  required: 'Completa este campo obligatorio.',
  quantityInvalid: 'Introduce una cantidad entera entre 1 y 100.',
  textLimit: 'Utiliza como máximo 2000 caracteres.',
  reasonLimit: 'Utiliza como máximo 5000 caracteres.',
  futureDate: 'Elige una fecha futura en la zona horaria de la empresa.',
  photoRequired: 'Selecciona al menos una foto justificativa.',
  photoLimit: 'Hasta 10 fotos JPEG, PNG o WebP de un máximo de 5 MB cada una.',
  removeSelection: 'Quitar selección',
  selectPhoto: 'Seleccionar justificantes existentes',
  uploadUnknown:
    'La subida «{{name}}» necesita conciliación. Revisa los justificantes guardados y selecciónalos; no subas otro archivo hasta conciliarla.',
  noEligibleEmployee:
    'El envío requiere una ficha activa de empleado en prueba o confirmado.',
  noDepartment: 'El envío requiere un departamento principal activo.',
  noActiveHead: 'El envío requiere un responsable de departamento activo.',
  searchCandidates: 'Buscar candidatos aptos',
  selectAsset: 'Seleccionar un activo apto',
  noEligibleAssets: 'No hay activos aptos disponibles.',
  previous: 'Página anterior',
  next: 'Página siguiente',
  comment: 'Opinión / motivo',
  person: 'Destinatario',
  signerMode: 'Posición del firmante adicional',
  place: 'Puesto de aprobación',
  fullBatch:
    'Confirma cada unidad reservada y su número de serie real. Las recepciones físicas parciales no pueden completar este lote.',
  serialFor: 'Número de serie real de {{code}}',
  serialLimit: 'Utiliza como máximo 200 caracteres.',
  serialMismatch:
    'El número de serie real debe coincidir con el activo asignado.',
  actionUnavailable:
    'Esta acción ya no está disponible. Actualiza la solicitud actual.',
  actionTitle: '{{action}} solicitud de activos «{{name}}»',
  confirmDanger:
    'Esto modifica la solicitud o registra una entrega física. Confirma los datos y el motivo antes de continuar.',
  operations: {
    use: 'Uso permanente',
    borrow: 'Préstamo',
    scrap: 'Baja',
  },
  statuses: {
    draft: 'Borrador',
    revision: 'Devuelto para revisión',
    head: 'Revisión del responsable del departamento',
    appraisal: 'Inspección',
    finance: 'Revisión financiera',
    gm: 'Revisión de la dirección general',
    issuing: 'Pendiente de entrega',
    borrowed: 'Prestado',
    returning: 'Pendiente de devolución física',
    issued: 'Entregado',
    returned: 'Devuelto',
    scrapped: 'Dado de baja',
    unable: 'No se puede gestionar',
    rejected: 'Rechazado',
    withdrawn: 'Retirado',
    terminated: 'Terminado',
    exception: 'Incidencia de gestión',
  },
  actions: {
    submit: 'Enviar a aprobación',
    withdraw: 'Retirar',
    terminate: 'Terminar',
    approve: 'Aprobar',
    reject: 'Rechazar',
    return: 'Devolver para revisión',
    complete: 'Confirmar gestión física',
    unable: 'No se puede gestionar',
    returnIssued: 'Confirmar devolución de activo entregado',
    transfer: 'Transferir',
    addSigner: 'Añadir firmante',
    cc: 'Copiar',
    assign: 'Asignar',
    appoint: 'Designar',
    reassign: 'Reasignar',
    urge: 'Reclamar',
    read: 'Marcar leído',
    comment: 'Comentar',
    claim: 'Asumir',
    release: 'Liberar',
  },
  tabs: {
    mine: 'Mías',
    pending: 'Pendiente',
    done: 'Gestionado',
    copied: 'Copiado',
  },
  modes: {
    before: 'Antes',
    alongside: 'En paralelo',
    after: 'Después',
  },
  authz: {
    ownedScope: 'Solicitudes de activos propias',
    resource: 'Solicitudes de activos',
    view: 'Leer solicitudes de activos',
    viewValue: 'Leer valores originales de activos',
    create: 'Crear solicitudes de activos propias',
    edit: 'Editar solicitudes de activos propias',
    operate: 'Ejecutar acciones autorizadas de aprobación y gestión de activos',
    returnIssued:
      'Confirmar devolución física de activos entregados para su uso',
  },
  errors: {
    ASSET_RETURN_REASON_REQUIRED: 'Introduce el motivo de la recepción física.',
    ASSET_ACCESS_DENIED: 'No tienes acceso a esta solicitud de activos.',
    ASSET_ACTION_INVALID: 'Esta acción no está disponible para la solicitud.',
    ASSET_REQUEST_NOT_FOUND: 'No se ha encontrado la solicitud de activos.',
    ASSET_INVALID_COMMAND:
      'Introduce un identificador estable de solicitud y el motivo requerido.',
    ASSET_REQUEST_REUSED:
      'Este identificador de solicitud está vinculado a otra operación.',
    ASSET_REQUIRED_FIELDS:
      'Completa la finalidad, la cantidad y la selección de activos.',
    ASSET_CATEGORY_INACTIVE: 'Elige una categoría de activos activa.',
    ASSET_EMPLOYEE_INACTIVE:
      'El solicitante debe tener una ficha de empleado activa.',
    ASSET_DEPARTMENT_MISSING:
      'El solicitante necesita un departamento principal activo.',
    ASSET_HEAD_MISSING:
      'El departamento necesita un responsable aprobador activo.',
    ASSET_BORROW_DATE_INVALID:
      'Elige una fecha de devolución futura válida en la zona horaria de la empresa.',
    ASSET_SCRAP_REQUIRED:
      'Selecciona un activo, introduce el motivo del desecho y adjunta una foto.',
    ASSET_SCRAP_INELIGIBLE:
      'Solo se pueden desechar activos en custodia aptos o artículos en existencias controlados por un administrador.',
    ASSET_PHOTO_DENIED:
      'No tienes acceso a la solicitud o a su campo de fotos.',
    ASSET_PHOTO_INVALID:
      'Elige como máximo diez fotos válidas vinculadas a esta solicitud.',
    ASSET_PHOTO_SIZE: 'Cada foto debe ocupar como máximo 5 MB.',
    ASSET_PHOTO_TYPE: 'Sube una imagen JPEG, PNG o WebP válida.',
    ASSET_STOCK_SHORTAGE:
      'No hay suficientes unidades disponibles para atender toda la solicitud.',
    ASSET_INVALID_QUANTITY: 'Confirma una cantidad entera entre 1 y 100.',
    ASSET_INVALID_AMOUNT:
      'El valor del activo guardado está fuera del intervalo exacto admitido.',
    ASSET_NOT_FOUND: 'No se ha encontrado un activo de esta solicitud.',
    ASSET_INVALID_VERSION: 'Carga la versión actual del activo.',
    ASSET_VERSION_CONFLICT:
      'El activo ha cambiado. Vuelve a cargarlo antes de confirmar.',
    ASSET_ALREADY_RESERVED: 'Otra solicitud ha reservado un activo.',
    ASSET_EXISTING_HOLD:
      'Resuelve la reserva existente antes de modificar las existencias.',
    ASSET_HOLD_MISMATCH: 'La reserva real no coincide con esta solicitud.',
    ASSET_BASELINE_CONFLICT:
      'Los datos del activo han cambiado tras la aprobación. Devuelve la solicitud para revisión antes de ejecutarla.',
    ASSET_UNITS_INCOMPLETE:
      'Confirma cada unidad asignada y su número de serie real.',
    ASSET_SERIAL_MISMATCH:
      'El número de serie no coincide con el del activo real.',
    ASSET_RETURN_MISMATCH:
      'Los artículos devueltos no coinciden con los que se entregaron en custodia.',
    ASSET_ALREADY_RETURNED: 'Este activo ya se ha devuelto.',
    ASSET_RETURN_FORBIDDEN:
      'Un administrador de activos activo debe confirmar la devolución física.',
    ASSET_RETURN_INELIGIBLE:
      'Esta solicitud no es una solicitud de uso entregada apta para esta operación.',
    ASSET_ALLOCATION_MISSING: 'Falta la asignación real completa.',
    ASSET_SOURCE_UNAVAILABLE:
      'El origen de la solicitud de activos no está disponible.',
    ASSET_SOURCE_MISSING:
      'La solicitud de activos correspondiente ya no existe.',
    ASSET_SOURCE_FORBIDDEN:
      'El origen no ha autorizado esta operación de existencias.',
    ASSET_SOURCE_MISMATCH:
      'El origen de las existencias no coincide con la solicitud real.',
    ASSET_TARGET_MISMATCH:
      'El destino de aprobación pertenece a otra solicitud.',
    ASSET_DIRECTORY_UNAVAILABLE:
      'Se requiere un directorio de aprobación actualizado.',
    ASSET_SLA_UNSUPPORTED:
      'No se puede enviar la aprobación. Pide a un administrador que establezca los plazos en 24/48 horas laborables.',
  },
  schedule: {
    title: 'Recordatorios de devolución de activos prestados',
    description:
      'Recordatorios diarios de vencimiento y semanales de retraso en la zona horaria de la empresa. Una entrega pendiente se registra como ejecución fallida.',
  },
  reminders: {
    before:
      'Solicitud de activos {{number}}: {{quantity}} artículos prestados deben devolverse el {{date}}. Organiza su devolución física.',
    overdue:
      'Solicitud de activos {{number}}: {{quantity}} artículos prestados vencieron el {{date}} y siguen sin devolverse.',
  },
};
