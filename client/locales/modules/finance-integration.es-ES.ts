export default {
  financeIntegration: {
    title: 'Sistema financiero',
    readPermission: 'Ver sincronización financiera',
    sendPermission: 'Enviar y conciliar asientos financieros',
    send: 'Enviar al sistema financiero',
    resend: 'Reintentar envío',
    lookup: 'Consultar resultado externo',
    reload: 'Actualizar estado guardado',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    confirmSend: 'Enviar',
    confirmTitle: '¿Enviar esta solicitud pagada al sistema financiero?',
    confirmDescription:
      'Los datos contables aprobados se enviarán al sistema financiero conectado. Esta acción no realiza otro pago. Los reintentos utilizan la misma referencia empresarial.',
    notConfigured:
      'No hay una pasarela financiera conectada. Pide al administrador que complete la conexión.',
    loadFailed:
      'No se ha podido cargar el estado financiero. Comprueba tu acceso o vuelve a intentarlo.',
    actionFailed:
      'No se ha podido confirmar la operación. Actualiza el estado antes de volver a intentarlo.',
    conflict:
      'Los datos contables o el destino han cambiado desde el primer envío. Concilia el asiento existente con Finanzas antes de continuar.',
    confirmBeforeRetry:
      'La recepción no demuestra la contabilización. Consulta el resultado externo y, si es necesario, reintenta la misma solicitud.',
    voucher: 'Comprobante externo: {{number}}',
    states: {
      not_sent: 'No enviado',
      sending: 'Enviando o consultando resultado',
      accepted:
        'Recibido por el sistema financiero; contabilización sin confirmar',
      posted: 'Comprobante creado',
      rejected: 'Rechazado por el sistema financiero',
      unknown: 'El resultado requiere confirmación',
    },
    results: {
      transport: 'La conexión terminó antes de poder confirmar un resultado.',
      unconfirmed: 'El sistema financiero no devolvió un resultado confirmado.',
      invalid_receipt:
        'No se ha podido vincular el acuse de recibo a esta solicitud.',
      not_found:
        'No se ha encontrado un registro externo en esta consulta. Un acuse anterior sigue siendo válido.',
      invalid_mapping:
        'La correspondencia de cuentas financieras o proveedores requiere atención.',
      invalid_document:
        'El sistema financiero ha rechazado los datos del documento.',
      duplicate_source:
        'Ya existe un asiento externo con esta referencia empresarial.',
      accounting_period_closed: 'El período contable está cerrado.',
      other: 'Pide a Finanzas que revise el resultado externo.',
    },
  },
};
