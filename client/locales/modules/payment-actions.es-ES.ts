export default {
  actionForm: {
    uncertain:
      'El resultado está sin confirmar. Conserva estos datos y reintenta la misma operación; no envíes una solicitud modificada.',
    replay: 'Reintentar la misma operación',
    title: '{{action}} solicitud de pago «{{name}}»',
    unavailable:
      'Esta acción ya no está disponible. Lee la última solicitud de pago.',
    unsupported:
      'Esta acción necesita un contrato de entrada que esta página no admite.',
    comment: 'Opinión o motivo',
    person: 'Destinatario',
    mode: 'Posición del firmante',
    place: 'Puesto de aprobación',
    returnTarget: 'Destino de devolución',
    voucher: 'Número de comprobante de pago',
    voucherHint:
      'Déjalo vacío solo al registrar administrativamente una liquidación sin comprobante.',
    amount: 'Importe del pago',
    amountConfirm: 'Confirmar importe exacto del pago',
    voucherAttachments: 'Adjuntos del comprobante de pago',
    exactAmount: 'Introduce el importe exacto mostrado arriba.',
    confirm: 'Confirmar {{action}}',
    confirmDescription:
      'Confirma esta operación en «{{name}}». Pago {{amount}}. {{consequence}}',
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
    latest: 'Leer última versión',
    conflict:
      'La solicitud de pago ha cambiado. Los datos introducidos se conservan. Lee la última versión, revísala y confirma de nuevo.',
    completed: '{{action}} completada para «{{name}}»',
    committed:
      'La operación se ha completado. Actualiza la solicitud de pago antes de realizar otra acción.',
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
