export default {
  paymentRequests: {
    relatedUnavailable: 'Registro relacionado no disponible',
    businessErrors: {
      PAYMENT_REQUEST_INVALID_INPUT:
        'Completa el motivo, el beneficiario, un importe positivo, el número de factura y sus justificantes.',
      PAYMENT_REQUEST_ACCOUNT_REQUIRED:
        'Completa la cuenta bancaria protegida del beneficiario antes de enviar.',
      PAYMENT_REQUEST_ACCOUNT_STALE:
        'La cuenta del beneficiario ha cambiado. Carga la última cuenta antes de corregirla.',
      PAYMENT_REQUEST_DEPARTMENT_REQUIRED:
        'El solicitante necesita un departamento principal activo. Pide a RR. HH. que actualice la ficha del empleado.',
      PAYMENT_REQUEST_METHOD_INVALID: 'Selecciona un método de pago activado.',
      PAYMENT_REQUEST_SOURCE_REQUIRED:
        'Explica por qué no hay aprobación previa y borra el pedido de compra vinculado.',
      PAYMENT_REQUEST_SOURCE_INVALID:
        'Selecciona un pedido de compra o contrato vigente y su beneficiario original.',
      PAYMENT_REQUEST_SOURCE_STALE:
        'El documento de origen ha cambiado. Actualiza el pago y el origen antes de actuar de nuevo.',
      PAYMENT_REQUEST_CONTRACT_STALE:
        'El contrato ha cambiado. Actualiza su versión y revisa el pago antes de reenviar.',
      PAYMENT_REQUEST_VOUCHER_REQUIRED:
        'Introduce el número de comprobante de pago y sube o selecciona los justificantes de pago.',
      PAYMENT_REQUEST_FORCE_CONFIRMATION_REQUIRED:
        'Confirma el importe aprobado exacto antes de forzar la finalización del pago.',
      PAYMENT_REQUEST_HANDLING_REASON_REQUIRED:
        'Introduce el motivo por el que no se ha podido completar el pago.',
      PAYMENT_REQUEST_ALREADY_PAID:
        'Este pago ya está liquidado. Actualiza para ver el resultado registrado.',
      PAYMENT_REQUEST_CONTRACT_ACTUAL_PAYMENT_REQUIRED:
        'Registra el pago contractual real antes de completar esta operación.',
      PAYMENT_FILE_SIZE: 'Selecciona un adjunto con contenido de hasta 5 MB.',
      PAYMENT_FILE_TYPE:
        'Sube un archivo PDF, JPEG, PNG o WebP cuyo tipo coincida con su contenido.',
      PAYMENT_ATTACHMENT_INVALID:
        'Selecciona justificantes subidos para esta solicitud de pago.',
    },

    title: 'Solicitudes de pago',
    description:
      'Revisa solicitudes de pago, datos de origen fijados y gestión de Caja.',
    new: 'Nueva solicitud de pago',
    edit: 'Editar',
    details: 'Ver detalles',
    number: 'Número',
    reason: 'Motivo',
    vendor: 'Beneficiario',
    amount: 'Importe del pago (yuanes)',
    search: 'Buscar número, motivo, solicitante o beneficiario',
    view: 'Vista de registros',
    allStatuses: 'Todos los estados',
    refresh: 'Actualizar',
    clearFilters: 'Borrar filtros',
    emptyTitle: 'Aún no hay solicitudes de pago',
    emptyDescription:
      'Crea un borrador para solicitar un pago y adjunta sus justificantes de factura.',
    noResults: 'No hay registros coincidentes. Borra o ajusta los filtros.',
    rowActions: 'Acciones para {{name}}',
    yes: 'Sí',
    no: 'No',
    frozenHint:
      'El origen, el beneficiario, el importe y la factura se fijan al enviar.',
    sourceModes: {
      contract: 'Contrato',
      purchase: 'Pedido de compra',
      none: 'Sin aprobación previa',
    },
    views: {
      mine: 'Mías',
      pending: 'Pendiente',
      done: 'Finalizadas',
      copied: 'Copiado',
    },
    statuses: {
      draft: 'Borrador',
      revision: 'Revisión',
      head: 'Revisión del departamento',
      finance: 'Revisión financiera',
      executive: 'Revisión de dirección',
      gm: 'Revisión de la dirección general',
      cashier: 'Gestión de Caja',
      exception: 'Incidencia de gestión',
      paid: 'Pagado',
      forcedPaid: 'Pago forzado registrado',
      rejected: 'Rechazado',
      withdrawn: 'Retirado',
      terminated: 'Terminado',
    },
    errors: {
      forbidden:
        'No tienes acceso. Pide a un administrador que compruebe tus permisos.',
      notFound:
        'Este registro ya no existe o no está disponible. Vuelve a la página de origen.',
      conflict:
        'Este pago ha cambiado. Lee el último registro antes de actuar de nuevo.',
      invalid:
        'Comprueba el contenido del pago y los justificantes requeridos.',
      failed: 'La solicitud no se ha completado. Vuelve a intentarlo.',
    },
    detail: {
      creator: 'Creado por',
      sourceMode: 'Origen',
      order: 'Pedido de compra',
      noPriorReason: 'Motivo de ausencia de aprobación previa',
      invoice: 'Número de factura',
      method: 'Método de pago',
      failure: 'Fallo de gestión',
      voucher: 'Comprobante de pago',
      forcedReason: 'Motivo de pago forzado',
      paidAt: 'Fecha del pago',
      sourceFacts: 'Datos de origen fijados',
      cumulativeHint:
        'Los pagos acumulados enviados incluyen los pendientes. La reserva de la solicitud actual se muestra por separado y no debe sumarse de nuevo. El pago no confirma la entrega ni la recepción.',
      sourceApproved: 'Importe del pedido aprobado (yuanes)',
      sourceCumulative: 'Importe acumulado enviado (yuanes)',
      sourceHeld: 'Reserva de origen actual (yuanes)',
      fullApproval: 'Se requiere aprobación completa',
      attachments: 'Justificantes de factura',
      voucherAttachments: 'Justificantes de pago',
      notSubmitted: 'Las reglas se fijan al enviar.',
    },
    rules: {
      spend_vp: 'Umbral de dirección (yuanes)',
      spend_gm: 'Umbral de dirección general (yuanes)',
      sla_remindHours: 'Horas laborables hasta el recordatorio',
      sla_escalateHours: 'Horas laborables hasta el escalamiento',
      sla_urgeCooldownHours: 'Horas mínimas entre recordatorios',
    },
    authz: {
      voucherEvidence: 'Subir justificantes del comprobante de pago',
      ownScope: 'Pagos propios o creados por mí',
      resource: 'Solicitudes de pago',
      view: 'Ver solicitudes de pago',
      submit: 'Crear y enviar mis pagos',
      delegate: 'Crear pagos para empleados',
      paymentAccount: 'Leer y corregir cuentas de pago autorizadas',
    },
  },
};
