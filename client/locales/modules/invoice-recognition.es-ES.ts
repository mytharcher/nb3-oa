export default {
  invoiceRecognition: {
    currentValues: 'Valores actuales sin guardar',
    reload: 'Actualizar resultado guardado',
    receivedAt: 'Resultado recibido: {{time}}',
    notConfigured:
      'La pasarela de facturas no está conectada. Puedes seguir introduciendo los datos de las facturas manualmente.',
    title: 'Reconocimiento y verificación de facturas',
    readPermission: 'Leer resultados de facturas',
    recognizePermission: 'Reconocer adjuntos de facturas editables',
    verifyPermission: 'Verificar líneas de factura autorizadas',
    recognizeAttachment: 'Reconocer adjunto {{index}}',
    verifyAttachment: 'Verificar factura · adjunto {{index}}',
    processing: 'Procesando la factura…',
    failed:
      'No se ha podido completar esta operación. Comprueba tu acceso y la configuración de la pasarela y vuelve a intentarlo. Los valores introducidos se conservan.',
    changed:
      'Esta línea ha cambiado. Ejecuta la operación de nuevo antes de aplicar o utilizar este resultado.',
    unconfirmed: 'El resultado no se ha confirmado.',
    recover: 'Consultar resultado externo',
    reference: 'Referencia de verificación: {{reference}}',
    confirmTitle: 'Revisar factura reconocida',
    confirmDescription:
      'Compara estas sugerencias con el adjunto original. Aplicarlas solo modifica esta línea sin guardar; no guarda, envía ni verifica la factura.',
    number: 'Número de factura',
    date: 'Fecha de factura',
    amount: 'Total con impuestos',
    cancel: 'Cancelar',
    apply: 'Aplicar a esta línea',
    states: {
      not_checked: 'Sin comprobar',
      pending: 'Pendiente de procesar',
      running: 'Procesando',
      recognized: 'Reconocido; revisar antes de aplicar',
      multiple:
        'Se han encontrado varias facturas. Divide el adjunto o introduce esta línea manualmente.',
      unreadable:
        'No se ha podido reconocer esta factura. Introduce los datos manualmente.',
      rejected: 'El servicio externo no ha podido procesar esta factura.',
      valid:
        'La verificación externa coincide con los datos actuales de la factura.',
      mismatch:
        'Los datos de la factura no coinciden con la verificación externa.',
      not_found:
        'No se ha encontrado una factura coincidente. Pide a Finanzas que la revise.',
      unknown:
        'Resultado sin confirmar. Consulta el resultado externo antes de reintentar.',
    },
  },
};
