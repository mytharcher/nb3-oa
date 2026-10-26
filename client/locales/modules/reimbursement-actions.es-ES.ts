export default {
  actionForm: {
    uncertain:
      'El resultado está sin confirmar. Conserva estos datos y reintenta la misma operación; no envíes una solicitud modificada.',
    replay: 'Reintentar la misma operación',
    ownedScope: 'Reembolsos propios o creados por mí',
    title: '{{action}} reembolso «{{name}}»',
    unavailable: 'Esta acción ya no está disponible. Lee el último reembolso.',
    unsupported:
      'Esta acción necesita un contrato de entrada que esta página no admite.',
    submitRequirements:
      'La aprobación utiliza el motivo y las líneas de gasto guardados en el borrador. Edita el reembolso para introducir el motivo, las categorías, las fechas, los importes y los números de factura y seleccionar archivos justificativos para cada línea.',
    reasonRequired:
      'El borrador no tiene motivo de reembolso. Edita primero el reembolso.',
    linesRequired:
      'El borrador no tiene líneas de gasto. Edita el reembolso y sube primero los archivos justificativos.',
    lineIncomplete:
      'La línea de gasto {{number}} está incompleta. Añade categoría, fecha, importe positivo, número de factura y archivos justificativos.',
    duplicateLines:
      'Hay líneas de gasto duplicadas. Edita el reembolso y revisa las líneas.',
    editDraft: 'Editar reembolso',
    comment: 'Opinión o motivo',
    person: 'Destinatario',
    mode: 'Posición del firmante',
    place: 'Puesto de aprobación',
    returnTarget: 'Destino de devolución',
    voucher: 'Número de comprobante de pago',
    voucherHint:
      'Déjalo vacío solo al registrar administrativamente una liquidación sin comprobante.',
    grossConfirm: 'Confirmar reembolso bruto',
    offsetConfirm: 'Confirmar compensación de anticipo',
    netConfirm: 'Confirmar efectivo neto',
    exactAmount: 'Introduce el importe exacto mostrado arriba.',
    confirm: 'Confirmar {{action}}',
    confirmDescription:
      'Confirma esta operación en «{{name}}». Bruto {{gross}}, compensación de anticipo {{offset}}, efectivo neto {{net}}. {{consequence}}',
    releaseConsequence:
      'Esto libera las reservas sin liquidar y no se puede deshacer aquí.',
    returnConsequence:
      'La solicitud se devuelve para corregirla y se cierra el trabajo pendiente actual.',
    paymentConsequence:
      'Registra un pago realmente completado utilizando su comprobante.',
    forcedConsequence:
      'Registra una liquidación administrativa; esto no inicia una transferencia bancaria.',
    unableConsequence: 'La solicitud entra en una incidencia de gestión.',
    submitConsequence:
      'La solicitud entra en aprobación con sus datos de envío fijados.',
    genericConsequence:
      'El servidor aplica la operación ofrecida al destino de aprobación seleccionado.',
    line: 'Línea de gasto seleccionada',
    noLine: 'La línea de aprobación seleccionada no está disponible.',
    latest: 'Leer última versión',
    conflict:
      'El reembolso ha cambiado. Los datos introducidos se conservan. Lee la última versión, revísala y confirma de nuevo.',
    completed: '{{action}} completada para «{{name}}»',
    committed:
      'La operación se ha completado. Actualiza el reembolso antes de realizar otra acción.',
    before: 'Antes',
    after: 'Después',
    alongside: 'En paralelo',
    revision: 'Corrección del solicitante',
    required: 'Completa este campo.',
    labels: {
      approve: 'Aprobar',
      reject: 'Rechazar',
      return: 'Devolver para corrección',
      returnTo: 'Devolver para corrección',
      returnItem: 'Devolver línea de gasto',
      submit: 'Enviar a aprobación',
      withdraw: 'Retirar',
      terminate: 'Terminar',
      retryCash: 'Reintentar en caja',
      retryCashAsAdmin: 'Reintento administrativo en caja',
      forcePayException: 'Registrar liquidación excepcional',
      forceComplete: 'Liquidación administrativa',
      reviseBusiness: 'Modificar para aprobación',
      claim: 'Asumir',
      release: 'Liberar',
      assign: 'Asignar',
      complete: 'Confirmar pago',
      unable: 'No se puede pagar',
      transfer: 'Transferir',
      addSigner: 'Añadir firmante',
      cc: 'Copiar',
      appoint: 'Designar',
      reassign: 'Reasignar',
      comment: 'Comentar',
      read: 'Marcar leído',
      urge: 'Recordar',
    },
  },
};
