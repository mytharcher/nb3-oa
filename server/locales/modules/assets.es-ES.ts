export default {
  authz: {
    returnHeld: 'Confirmar devolución física de activos históricos en custodia',
    resource: 'Registro de activos',
    view: 'Leer registro de activos y valor original',
    viewHeld: 'Leer activos en mi custodia',
    manage: 'Registrar y corregir descripciones de activos',
    heldScope: 'Activos en mi custodia',
  },
  errors: {
    ASSET_RETURN_FORBIDDEN:
      'Un administrador de activos activo debe confirmar la devolución física.',
    ASSET_REQUEST_REUSED:
      'Esta clave de solicitud de devolución ya identifica otra recepción.',
    ASSET_RETURN_INELIGIBLE:
      'Confirma el artículo real en custodia, el empleado y el número de serie.',
    ASSET_RETURN_FLOW_REQUIRED:
      'Gestiona este activo mediante su solicitud real antes de confirmar la devolución.',

    ASSET_ACCESS_DENIED: 'No tienes permiso para esta operación de activos.',
    ASSET_NOT_FOUND: 'No se ha encontrado el activo.',
    ASSET_INVALID_INPUT:
      'Introduce un código de activo, un nombre y un valor exacto no negativo en céntimos.',
    ASSET_CATEGORY_INACTIVE: 'Elige una categoría de activos activa.',
    ASSET_INVALID_COMMAND:
      'Se requiere una persona responsable y un motivo de corrección.',
    ASSET_INVALID_VERSION: 'Introduce la versión actual del activo.',
    ASSET_VERSION_CONFLICT: 'Este activo ha cambiado. Carga su última versión.',
    ASSET_CODE_EXISTS: 'Este código de activo ya existe.',
    ASSET_INVALID_STORED_AMOUNT:
      'El valor del activo guardado está fuera del intervalo exacto admitido.',
    ASSET_WRITE_UNCONFIRMED:
      'No se ha podido confirmar la escritura del activo.',
    ASSET_DEPARTURE_NOT_CLEARED:
      'Los activos asignados, prestados o reservados deben devolverse antes de completar la baja laboral.',
  },
};
