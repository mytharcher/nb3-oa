export default {
  purchases: {
    businessErrors: {
      PURCHASE_INVALID_ITEMS:
        'Cada artículo de compra necesita nombre, unidad y cantidad positiva. Comprueba que no haya duplicados.',
      PURCHASE_INVALID_DATE:
        'Selecciona una fecha prevista de recepción válida.',
      PURCHASE_INVALID_PRICE:
        'Introduce un precio real positivo, selecciona un proveedor y adjunta su presupuesto.',
      PURCHASE_INVALID_QUOTES:
        'Un archivo de presupuesto no puede reutilizarse para distintos proveedores. Selecciona justificantes separados.',
      PURCHASE_QUOTES_REQUIRED:
        'Este importe requiere presupuestos de tres proveedores distintos, cada uno con un adjunto.',
      PURCHASE_PRICE_CONFIRMATION_REQUIRED:
        'Ajusta el presupuesto estimado al precio ofertado confirmado antes de reenviar.',
      PURCHASE_INVALID_INPUT:
        'Añade artículos de compra y una finalidad e introduce un importe estimado positivo.',
      PURCHASE_DEPARTMENT_REQUIRED:
        'El solicitante necesita un departamento principal activo. Pide a RR. HH. que actualice la ficha del empleado.',
      INVALID_RECEIPT:
        'Selecciona la fecha real de recepción e introduce un motivo de confirmación.',
    },

    discardThenNavigate:
      '¿Descartar estos cambios sin guardar? Tras confirmar, selecciona de nuevo tu destino.',
    localInputsRetained:
      'Se ha cargado la última versión. Los datos introducidos se conservan; revísalos antes de volver a guardar.',
    chooseForceMode: 'Elige un método de gestión',
    confirmForceClose: '¿Cerrar la compra {{name}}?',
    confirmPricing: '¿Confirmar el presupuesto de {{name}}?',
    confirmCancelOrder: '¿Cancelar el pedido {{name}}?',
    priceWillReturn:
      'El precio supera la estimación en más del 20 %. Esto devuelve la solicitud al solicitante para confirmar antes de la revisión financiera.',
    pricingSubmitConsequence:
      'El envío fija este presupuesto para la siguiente etapa de aprobación y ajusta la retención presupuestaria.',

    new: 'Nueva compra',
    edit: 'Editar compra',
    saved: 'Compra guardada',
    formDescription:
      'Describe los artículos, la finalidad y la estimación. El envío reserva el presupuesto del departamento principal para el año actual del calendario de empresa.',
    primaryDepartment: 'Departamento principal: {{department}}',
    yearHint: 'El año de envío sigue el calendario de empresa ({{timeZone}}).',
    departmentMissing: 'Sin departamento principal',
    department: 'Departamento',
    departmentPending: 'Se determina al enviar',
    departmentUnavailable: 'Departamento no disponible',
    budgetYear: 'Año presupuestario',
    purpose: 'Finalidad',
    subject: 'Partida presupuestaria',
    selectSubject: 'Seleccionar partida presupuestaria',
    estimated: 'Importe estimado',
    actual: 'Precio real',
    actualAmount: 'Precio real (yuanes)',
    yuan: 'yuanes',
    expectedDate: 'Fecha prevista de entrega',
    suggestedVendor: 'Proveedor sugerido',
    selectedVendor: 'Proveedor seleccionado',
    vendor: 'Proveedor',
    vendorUnavailable: 'Proveedor no disponible',
    noSuggestedVendor: 'Sin proveedor sugerido',
    vendorInactive: 'Elegir un proveedor activo',
    subjectInactive: 'Elegir una partida presupuestaria activa',
    disabled: 'Desactivado',
    inactive: 'Inactivo',
    fieldInvalid: 'Comprueba este campo',
    amountInvalid:
      'Introduce un importe positivo con un máximo de dos decimales',
    amountHint: 'Utiliza como máximo dos decimales.',
    dateInvalid: 'Elige una fecha válida',
    items: 'Artículos de compra',
    itemName: 'Nombre del artículo',
    itemNumber: 'Artículo {{number}}',
    specification: 'Especificación',
    quantity: 'Cantidad',
    unit: 'Unidad',
    quantityInvalid: 'Introduce una cantidad positiva; se admiten decimales',
    quantityHint: 'Se admiten cantidades decimales, por ejemplo 1,5 kg.',
    addItem: 'Añadir artículo',
    removeItem: 'Quitar artículo',
    reserveHint:
      'Los borradores no reservan presupuesto. El envío crea la retención.',
    loadLatest: 'Cargar última solicitud',
    unknownCreate:
      'El resultado del guardado es incierto. Se bloquean nuevas creaciones. Busca el borrador en el centro de tareas.',
    unknownEdit:
      'El resultado del guardado es incierto. Carga la última solicitud antes de continuar.',
    unknownPricing:
      'El resultado es incierto y el formulario está bloqueado. El reintento envía los mismos datos e identificador de solicitud.',
    quotes: 'Justificantes de presupuesto',
    quoteEvidence: 'Justificantes de presupuestos de proveedores',
    quoteEvidenceDescription:
      'Sube justificantes de cada proveedor. Los existentes se pueden reutilizar si los requisitos se conservan. Por encima del umbral fijado se requieren justificantes de tres proveedores distintos.',
    addQuote: 'Añadir presupuesto de proveedor',
    removeQuote: 'Quitar selección de presupuesto',
    threeQuotesRequired:
      'Por encima del umbral de presupuestos, proporciona adjuntos de tres proveedores distintos.',
    selectExistingQuote: 'Seleccionar presupuesto existente: {{filename}}',
    refreshQuotes: 'Actualizar presupuestos existentes',
    completePricing: 'Completar precio',
    forcePricing: 'Acción administrativa de compras',
    forceMode: 'Modo de acción',
    forcePriced: 'Enviar resultados completos a aprobación financiera',
    forceClose: 'Forzar cierre sin pedido',
    forceCloseDescription:
      'El cierre forzado libera la retención presupuestaria y registra el motivo del administrador. No declara completadas la compra ni la recepción y no crea un pedido.',
    priceConfirmationDescription:
      'Los precios superiores al 120 % de la estimación vuelven al solicitante para confirmar. Los demás resultados pasan a aprobación financiera.',
    confirmPriceHint:
      'El precio supera el 120 % de la estimación. Revísalo y reenvía para confirmar.',
    handler: 'Gestor de compras',
    forcedClosedHint:
      'Un administrador ha forzado el cierre de esta solicitud. Se ha liberado la retención y no se ha creado pedido ni recepción.',
    actualHold: 'Retención presupuestaria actual',
    holdHint:
      'La aprobación conserva la retención presupuestaria. El presupuesto se liquida cuando el solicitante confirma la recepción.',
    order: 'Pedido de compra',
    orderHint:
      'El pedido fija el precio aprobado, el proveedor y los artículos. La recepción y el pago se siguen por separado.',
    openOrder: 'Abrir pedido',
    mergedTitle: 'Aprobaciones consecutivas unificadas',
    merged:
      '{{name}} completó personalmente la etapa consecutiva; se ha unificado la aprobación por la misma persona.',
    authz: {
      orderScope: 'Pedidos de compras que este usuario puede leer',
      resource: 'Compras',
      submit: 'Enviar compras',
      view: 'Ver compras',
      orders: 'Ver pedidos de compra',
      accept: 'Confirmar recepción',
    },
    errors: {
      insufficient:
        'El presupuesto disponible es insuficiente. Contacta con su responsable.',
      inactive: 'El solicitante está inactivo.',
      configuration:
        'La configuración de aprobación no es compatible. Contacta con un administrador.',
      invalid: 'Comprueba los campos resaltados.',
    },
    states: {
      draft: 'Borrador',
      revision: 'Revisión',
      head: 'Aprobación del departamento',
      purchasing: 'Gestión de compras',
      exception: 'Incidencia de compras',
      finance: 'Aprobación financiera',
      executive: 'Aprobación de dirección',
      gm: 'Aprobación de dirección general',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      withdrawn: 'Retirado',
      terminated: 'Terminado',
      forcedClosed: 'Cierre forzado',
    },
    stages: {
      draft: 'Borrador',
      revision: 'Revisión',
      head: 'Aprobación del departamento',
      purchasing: 'Gestión de compras',
      exception: 'Incidencia de compras',
      finance: 'Aprobación financiera',
      executive: 'Aprobación de dirección',
      gm: 'Aprobación de dirección general',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      withdrawn: 'Retirado',
      terminated: 'Terminado',
      forcedClosed: 'Cierre forzado',
    },
    actions: {
      claim: 'Asumir',
      release: 'Liberar tarea asumida',
      complete: 'Completar precio',
      unable: 'No se puede comprar',
      forceComplete: 'Acción del administrador',
      cc: 'Copiar',
    },
    ledgerTitle: 'Registro de pedidos de compra',
    ledgerDescription:
      'Consulta pedidos de compra aprobados, estado de recepción y registros de pagos. La recepción liquida el presupuesto; los pagos se registran por separado.',
    orderNumber: 'Número de pedido',
    emptyOrders: 'No hay pedidos de compra en tu ámbito',
    pendingPayments: 'Pagos pendientes (yuanes)',
    paidPayments: 'Importe pagado (yuanes)',
    receiptDate: 'Fecha de recepción',
    acceptedBy: 'Recepción confirmada por',
    receiptReason: 'Notas de recepción',
    confirmReceipt: 'Confirmar recepción',
    cancelOrder: 'Cancelar pedido',
    orderSaved: 'Pedido actualizado',
    unknownOrderAction:
      'El resultado es incierto. El formulario está bloqueado; el reintento envía los mismos datos e identificador de solicitud.',
    receiptSettlementHint:
      'La confirmación liquida la retención presupuestaria del pedido. No significa que se haya pagado al proveedor. La recepción confirmada es inmutable.',
    cancelOrderHint:
      'Solo los administradores de aprobación pueden cancelar un pedido sin recibir y sin importes pendientes o pagados. La cancelación libera la retención presupuestaria y registra el motivo.',
    orderStates: {
      awaitingReceipt: 'Pendiente de recepción',
      accepted: 'Recibido',
      cancelled: 'Cancelado',
    },
    actionTitle: '{{action}} compra «{{name}}»',
    completed: '{{action}} completada para la compra «{{name}}»',
    quoteBasisChanged:
      'Los requisitos de compra han cambiado. Los datos del borrador se conservan, pero los justificantes de presupuesto deben cumplir los requisitos actuales.',
    frozenRules: 'Reglas aplicadas al enviar',
    frozenRulesHint:
      'Solo los importes estrictamente superiores a estos umbrales requieren los justificantes de presupuesto o etapas de aprobación correspondientes. Los cambios posteriores de reglas no modifican este envío.',
    ruleLabels: {
      purchase_quotes: 'Umbral de presupuestos de tres proveedores',
      spend_vp: 'Umbral de aprobación de dirección',
      spend_gm: 'Umbral de aprobación de dirección general',
    },
    staleQuoteUpload:
      'La versión de gestión ha cambiado. Actualiza la solicitud antes de subir justificantes de presupuesto.',
    ordersTitle: 'Pedidos de compra',
  },
};
