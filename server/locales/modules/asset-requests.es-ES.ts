export default {
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
    ASSET_PHOTO_SIZE: 'Cada foto debe ocupar como máximo 5 MiB.',
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
      'Esta versión solo admite los plazos de aprobación predeterminados de 24/48 horas laborables.',
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
