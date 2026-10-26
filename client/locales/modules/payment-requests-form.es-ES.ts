export default {
  paymentRequestsForm: {
    new: 'Nueva solicitud de pago',
    edit: 'Editar solicitud de pago',
    description:
      'Envía la solicitud completada o guarda un borrador. Los datos empresariales obligatorios se vuelven a comprobar al enviar.',
    save: 'Guardar borrador',
    saved: 'Borrador de pago guardado',
    draft: 'Borrador',
    maxFiles: 'Selecciona como máximo 10 archivos justificativos.',
    limit: 'Este texto supera el límite de longitud.',
    required: 'Este campo es obligatorio.',
    amountInvalid:
      'Introduce un importe no negativo con un máximo de dos decimales dentro del intervalo exacto admitido en céntimos.',
    invalid: 'Comprueba este campo.',
    notEditable: 'Este registro ya no está disponible para editar.',
    inactive: 'No disponible; elige una opción apta',
    select: 'Elige una opción',
    unknown:
      'El resultado está sin confirmar. Conserva los datos y reintenta exactamente la misma solicitud.',
    replay: 'Conciliar la solicitud original',
    latest:
      'Se ha cargado la última versión. Los datos introducidos se conservan; compáralos con las últimas opciones de origen antes de guardar de nuevo.',
    leaveReady:
      'Vuelve a pulsar tu destino original para salir. Seguir editando cancela esta confirmación.',
    applicantId: 'Solicitante',
    reason: 'Motivo del pago',
    sourceMode: 'Origen de aprobación previa',
    contract: 'Contrato',
    contractVersion: 'Versión del contrato',
    contractId: 'Contrato',
    counterparty: 'Contraparte del contrato',
    customerAccountHint:
      'Los contratos de clientes no tienen cuenta bancaria de proveedor. Si es necesario, se puede corregir la cuenta protegida después de que Caja notifique una incidencia.',
    purchase: 'Pedido de compra aprobado',
    none: 'Sin aprobación previa',
    purchaseOrderId: 'Pedido de compra',
    noPriorApprovalReason: 'Explicación del pago sin aprobación previa',
    vendorId: 'Beneficiario',
    amount: 'Importe (yuanes)',
    invoiceNumber: 'Número de factura',
    paymentMethod: 'Método de pago',
    orderStatus: 'Estado del pedido',
    approved: 'Importe aprobado',
    paid: 'Ya pagado',
    pending: 'Pagos pendientes',
    available: 'Importe disponible',
    cents: 'céntimos',
    overApproval:
      'Los importes superiores al límite acumulado aprobado, incluidos los pagos pendientes, requieren aprobación completa. Se permiten solicitudes de pago en exceso.',
    frozenHint:
      'El origen, el beneficiario, el importe y la factura se fijan al enviar.',
    voucherAttachments: 'Justificantes de pago',
    attachments: 'Justificantes de factura',
    uploadHint:
      'PDF, JPEG, PNG o WebP; hasta 5 MB. Quitar una selección conserva los justificantes guardados.',
    fileSize: 'Elige un archivo con contenido de hasta 5 MB.',
    fileType:
      'Elige un archivo PDF, JPEG, PNG o WebP con la extensión correspondiente.',
    selectEvidence: 'Seleccionar justificantes guardados / conciliar subida',
    uploading: 'Subiendo o leyendo justificantes…',
    uploadUnknown:
      'El resultado de subida está sin confirmar. Lee los justificantes guardados e inspecciónalos antes de volver a subir. La subida no se reintenta automáticamente.',
    emptyEvidence: 'No hay justificantes guardados.',
    evidenceMissing:
      'Algunos justificantes ya no son accesibles. Actualiza o comprueba tus permisos.',
    removeEvidence: 'Quitar {{name}} de esta selección',
    bank: {
      title: 'Cuenta privada del beneficiario',
      denied: 'No tienes acceso a esta cuenta de pago.',
      missing: 'No se ha registrado ninguna cuenta de pago.',
      correct: 'Corregir cuenta de pago',
      unavailable:
        'Solo el solicitante o creador puede corregir la cuenta durante la gestión de una incidencia.',
      bankName: 'Banco',
      bankAccount: 'Número de cuenta',
      bankAccountName: 'Titular de la cuenta',
      reason: 'Motivo de corrección',
      saved: 'Cuenta de pago corregida',
      unknown:
        'El resultado de escritura está sin confirmar. Lee la última cuenta y compárala antes de enviarla de nuevo explícitamente.',
      conflict:
        'La cuenta o la versión del pago han cambiado. Carga los datos actuales; tus cambios se conservan.',
      reconciled:
        'Se han cargado los datos actuales. Compara los datos conservados y confirma explícitamente cualquier nueva escritura.',
    },
  },
};
