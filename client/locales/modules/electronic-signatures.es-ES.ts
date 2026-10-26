export default {
  electronicSignatures: {
    archivedHint:
      'El servicio de firma ha confirmado la finalización. El PDF firmado y verificado se ha archivado con esta solicitud.',
    reference: 'Referencia de firma: {{value}}',
    completedAction: 'Firma electrónica archivada',
    title: 'Firma electrónica',
    readPermission: 'Ver documentos firmados',
    sendPermission: 'Enviar y recuperar firmas',
    channel: 'Canal de ejecución',
    physical: 'Sello físico',
    electronic: 'Firma electrónica',
    channelHint:
      'Elige antes de la aprobación. La firma electrónica requiere un PDF aprobado y no utiliza un número de copias en papel.',
    hint: 'El PDF aprobado se envía al servicio de firma configurado. La finalización solo se confirma después de verificar y archivar el documento firmado.',
    notConfigured:
      'La firma electrónica no está conectada. Contacta con el administrador.',
    notEligible:
      'La firma requiere un documento vigente aprobado en PDF. Las solicitudes de sello electrónico deben contener exactamente un PDF.',
    loadFailed:
      'No se ha podido cargar el estado de firma o no tienes permiso para verlo.',
    actionFailed:
      'No se ha podido completar la acción. Actualiza el estado antes de volver a intentarlo.',
    retry: 'Reintentar',
    send: 'Enviar para firmar',
    refresh: 'Consultar estado / recuperar',
    open: 'Continuar firma',
    download: 'Descargar PDF firmado',
    recovery:
      'El resultado remoto o el archivo requieren confirmación. Consulta el estado para recuperar la misma solicitud de firma.',
    signedAt: 'Firmado el {{at}}',
    confirmTitle: '¿Enviar este PDF aprobado para su firma?',
    confirmHint:
      'El servicio de firma configurado recibe el documento aprobado. Los reintentos utilizan la misma solicitud de firma.',
    cancel: 'Cancelar',
    states: {
      not_sent: 'No enviado',
      pending: 'Pendiente de envío',
      sending: 'Enviando',
      accepted: 'Aceptado por el servicio de firma',
      signing: 'Pendiente de firmas',
      unknown: 'Resultado pendiente de confirmación',
      archivePending: 'Firmado; es necesario recuperar el archivo',
      archived: 'Documento firmado archivado',
      rejected: 'Rechazado por el servicio de firma',
      cancelled: 'Cancelado por el servicio de firma',
    },
  },
};
