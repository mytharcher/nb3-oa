export default {
  supplies: {
    namedRowActions: 'Acciones para {{name}}',

    businessErrors: {
      SUPPLY_REQUIRED_FIELDS:
        'Añade al menos un artículo e indica su finalidad.',
      SUPPLY_ITEM_UNAVAILABLE:
        'Un artículo seleccionado no está disponible. Vuelve a seleccionar un artículo activado.',
      SUPPLY_CONTENT_CHANGED:
        'Los artículos aprobados han cambiado. Actualiza la solicitud antes de registrar la entrega.',
    },

    rowActions: 'Acciones del registro',
    number: 'Número de petición',
    unknownEdit:
      'No se conoce con certeza el resultado del guardado. Carga la última solicitud antes de volver a editar.',
    emptyCatalog:
      'No hay artículos de oficina activos configurados. Contacta con Administración.',
    ledgerDetail: 'Registro de entrega',
    ledgerDescription:
      'Cantidades registradas y cierres administrativos. Las cantidades sin confirmar no acreditan la entrega.',
    entryMissing: 'Este registro de entrega no está disponible.',
    authz: {
      resource: 'Peticiones de material',
      ledger: 'Leer registro de entregas de material',
    },
    navigation: 'Registro de material',
    new: 'Nueva petición de material',
    edit: 'Editar petición de material',
    formDescription:
      'Elige artículos y cantidades. Tu responsable aprueba la solicitud antes de que Administración los entregue.',
    purpose: 'Finalidad',
    item: 'Artículo',
    items: 'Artículos solicitados',
    quantity: 'Cantidad',
    quantityValue: 'Cantidad: {{quantity}}',
    chooseItem: 'Elegir un artículo',
    line: 'Artículo {{number}}',
    remove: 'Quitar artículo {{number}}',
    addItem: 'Añadir artículo',
    quantityInvalid: 'Introduce una cantidad entera entre 1 y 100 000.',
    duplicate: 'Elige cada artículo una sola vez.',
    emailInvalid: 'Introduce un correo electrónico válido.',
    printRequired:
      'Completa los datos obligatorios de impresión de tarjetas de visita.',
    print: {
      name: 'Nombre',
      title: 'Cargo',
      phone: 'Teléfono',
      email: 'Correo electrónico',
      address: 'Dirección',
      department: 'Departamento (opcional)',
    },
    approvedAt: 'Hora de aprobación del responsable',
    issuingStage: 'Entrega administrativa',
    resubmitHint:
      'Si se reenvían los mismos artículos y finalidad, la solicitud vuelve a Administración. Si se modifican, requiere otra aprobación del responsable. La aprobación anterior se conserva en el historial.',
    forcedHint:
      'Un administrador de aprobación ha cerrado esta solicitud sin confirmar la entrega física. Las cantidades reales están sin confirmar.',
    uncertainCreate:
      'No se conoce con certeza el resultado del guardado. Cierra y consulta Mis solicitudes antes de crear otro borrador.',
    invalid:
      'Comprueba la finalidad, los artículos elegidos y las cantidades enteras.',
    itemUnavailable:
      'Un artículo está desactivado o no existe. Actualiza antes de enviar contenido modificado.',
    inactive: 'Se requiere una ficha de empleado activa.',
    configuration:
      'No se puede enviar la aprobación. Contacta con un administrador para comprobar los plazos de aprobación.',
    contentChanged:
      'El contenido ya no coincide con la solicitud aprobada. Carga la última versión.',
    reasonRequired: 'Indica un motivo.',
    actions: {
      claim: 'Asumir entrega',
      release: 'Liberar tarea asumida',
      assign: 'Asignar gestor',
      complete: 'Confirmar entrega',
      unable: 'No se puede entregar',
      forceComplete: 'Forzar cierre',
    },
    actionHints: {
      complete:
        'Confirma que se han entregado físicamente todos los artículos en la cantidad total solicitada. Esto registra la entrega.',
      unable:
        'Explica la falta de existencias u otro motivo por el que no se puede completar la entrega. La aprobación del responsable se conserva.',
      release:
        'Libera esta tarea para que otro gestor administrativo pueda asumirla.',
      forceComplete:
        'Cierra por decisión administrativa sin confirmar la entrega. Las cantidades reales se registrarán como sin confirmar. Se requiere un motivo.',
    },
    states: {
      issuing: 'Pendiente de entrega',
      exception: 'Incidencia de entrega',
      issued: 'Entregado',
      forcedClosed: 'Cerrado administrativamente',
    },
    ledgerTitle: 'Registro de entregas de material',
    requestedQuantity: 'Cantidad solicitada',
    actualQuantity: 'Cantidad real',
    outcome: 'Resultado',
    recipient: 'Destinatario',
    issuer: 'Gestor',
    unconfirmed: 'Sin confirmar',
    reason: 'Motivo',
    emptyLedger: 'No hay registros de entrega',
    viewRequest: 'Ver petición',
  },
};
