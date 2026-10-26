export default {
  vendors: {
    saved: 'Se ha guardado el proveedor «{{name}}»',

    title: 'Proveedores',
    description:
      'Compras mantiene los proveedores manuales. Los pedidos aprobados conservan los datos de proveedor registrados.',
    new: 'Nuevo proveedor',
    edit: 'Editar proveedor',
    view: 'Detalles del proveedor',
    refresh: 'Actualizar',
    search: 'Buscar nombre, código o categoría',
    clear: 'Borrar filtros',
    rowActions: 'Acciones para {{name}}',
    save: 'Guardar',
    cancel: 'Cancelar',
    loading: 'Cargando proveedores',
    retry: 'Reintentar',
    active: 'Activo',
    status: 'Estado',
    statuses: {
      manual: 'Proveedor manual',
      qualified: 'Acreditado',
      disabled: 'Desactivado',
    },
    updatedAt: 'Actualizado',
    reason: 'Motivo de este cambio',
    formDescription:
      'Se auditan los cambios de proveedores y los datos bancarios. La desactivación impide nuevas compras y pagos.',
    disableHint:
      'Se bloquearán nuevas compras y los datos de las cuentas de pago.',
    required: 'Este campo es obligatorio.',
    invalidCode: 'Utiliza letras, dígitos, puntos, guiones o guiones bajos.',
    invalidEmail: 'Introduce un correo electrónico válido.',
    noChanges: 'Modifica al menos un campo antes de guardar.',
    unknownCreate:
      'Se desconoce el resultado de la creación. Comprueba la lista de proveedores y el código antes de crear otro proveedor.',
    unknownEdit:
      'Se desconoce el resultado. Carga el proveedor más reciente antes de reintentar; los cambios sin confirmar se conservarán.',
    loadLatest: 'Cargar proveedor más reciente',
    fields: {
      code: 'Código',
      name: 'Nombre',
      category: 'Categoría',
      contactName: 'Contacto',
      contactPhone: 'Teléfono',
      contactEmail: 'Correo electrónico',
      bankName: 'Banco',
      bankAccount: 'Cuenta bancaria',
      bankAccountName: 'Titular de la cuenta',
    },
    authz: {
      resource: 'Proveedores',
      view: 'Leer detalles de proveedores',
      manage: 'Mantener proveedores',
      bankRead: 'Leer información bancaria',
      createdScope: 'Proveedores creados por el usuario actual',
    },
    empty: {
      accountsTitle: 'No hay proveedores',
      accountsDescription: 'Añade un proveedor manual para Compras.',
      readonlyTitle: 'No hay proveedores legibles',
      readonlyDescription:
        'No hay proveedores en tu ámbito autorizado. Pide a Compras que añada uno o solicita a un administrador el permiso Mantener proveedores.',
      filteredTitle: 'No hay proveedores coincidentes',
      filteredDescription: 'Modifica o borra la búsqueda.',
    },
    error: {
      forbidden: 'No tienes permiso para acceder a estos proveedores.',
      missing:
        'Este proveedor no está disponible. Actualiza la lista de origen.',
      invalid: 'Comprueba los campos del proveedor.',
      failed:
        'No se han podido cargar o guardar los proveedores. Vuelve a intentarlo.',
      VENDOR_INVALID_INPUT:
        'Comprueba los campos de contacto y bancarios del proveedor.',
      VENDOR_INVALID_COMMAND:
        'Se requieren una persona responsable y un motivo del cambio.',
      VENDOR_CODE_EXISTS: 'Este código ya pertenece a un proveedor.',
      VENDOR_VERSION_CONFLICT:
        'Este proveedor ha cambiado. Carga su última versión antes de reintentar.',
      VENDOR_NOT_FOUND: 'Este proveedor no está disponible.',
      VENDOR_INACTIVE: 'Elige un proveedor activo.',
      VENDOR_FIELDS_RESTRICTED:
        'Los campos del proveedor están fuera de tu ámbito autorizado.',
      VENDOR_ACCESS_DENIED:
        'No tienes permiso para esta acción de proveedores.',
      VENDOR_PAYMENT_ACCOUNT_REQUIRED:
        'Completa los datos bancarios del proveedor antes del pago.',
    },
  },
};
