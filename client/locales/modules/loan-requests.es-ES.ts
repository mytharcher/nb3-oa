export default {
  loanRequests: {
    relatedUnavailable: 'Registro relacionado no disponible',
    rowActions: 'Acciones para {{name}}',
    description: 'Gestiona solicitudes de anticipos, pagos y devoluciones.',

    saved: 'Se ha guardado la solicitud de anticipo «{{name}}»',
    submitted: 'Se ha enviado la solicitud de anticipo «{{name}}»',
    cashRecorded: 'Se ha registrado la devolución en efectivo de «{{name}}»',
    repaymentConfirmed: 'Se ha confirmado la devolución «{{receipt}}»',
    repaymentCancelled: 'Se ha cancelado la devolución «{{receipt}}»',
    confirmRepaymentTitle: '¿Confirmar la devolución «{{receipt}}»?',
    cancelRepaymentTitle: '¿Cancelar la devolución «{{receipt}}»?',

    businessErrors: {
      LOAN_REQUEST_DEPARTMENT_REQUIRED:
        'El solicitante necesita un departamento principal activo. Pide a RR. HH. que actualice la ficha del empleado.',
      LOAN_REQUEST_INVALID_DATE:
        'La fecha de devolución debe ser hoy o posterior en la zona horaria de la empresa.',
      LOAN_REQUEST_INVALID_TRAVEL:
        'Selecciona un viaje propio aprobado y vigente.',
      LOAN_REQUEST_INVALID_INPUT:
        'Introduce un motivo del anticipo y un importe positivo.',
      LOAN_REQUEST_NOT_PAID:
        'Este anticipo no se ha pagado. Solo se puede registrar su devolución después del pago.',
      LOAN_REQUEST_REPAYMENT_INPUT_INVALID:
        'Introduce el recibo de devolución y el motivo.',
    },

    loadLatest: 'Cargar datos actuales',
    latestFacts:
      'Versión {{version}} · {{amount}} yuanes · vence {{date}} · finalidad: {{reason}}',
    adoptVersion: 'Conservar mis datos y utilizar esta versión',
    noLongerEditable: 'Esta solicitud ya no se puede editar.',
    invalidDate: 'Elige una fecha actual o futura del calendario de empresa.',
    number: 'Referencia',
    more: 'Más acciones',
    confirm: 'Confirmar',
    operationLabels: {
      complete: 'Completar pago',
      unable: 'Pago fallido',
      retryCash: 'Reintentar pago',
      claim: 'Asumir gestión',
      release: 'Liberar gestión',
      assign: 'Asignar gestor',
    },
    confirmRetry:
      'Actualiza tus datos bancarios y devuelve esta solicitud aprobada a Caja.',
    confirmPayment:
      'Confirma que el pago se ha completado realmente con este comprobante. Esto crea la deuda del prestatario.',
    confirmUnable:
      'Registra la incidencia de pago y el motivo. El importe aprobado permanece reservado.',
    receipt: 'Referencia del recibo',
    actions: 'Acciones',
    bank: 'Cuenta de pago protegida',
    hideBank: 'Ocultar cuenta de pago',
    showBank: 'Mostrar cuenta de pago',
    bankRestricted:
      'Solo el prestatario y los roles financieros explícitamente autorizados pueden leer la cuenta de pago.',
    bankName: 'Banco',
    bankHolder: 'Titular de la cuenta',
    bankAccount: 'Número de cuenta bancaria',
    loadingBank: 'Cargando cuenta de pago…',
    bankNotSnapshot: 'Aún no se ha registrado ninguna cuenta de pago.',
    recordCash: 'Registrar devolución en efectivo',
    invalidRepaymentAmount:
      'No se han podido leer los importes de devolución. Contacta con Finanzas para comprobar este registro.',
    noRepayments: 'No hay registros de devolución',
    loading: 'Cargando…',
    confirmRepayment: 'Confirmar devolución',
    cancelRepayment: 'Cancelar recibo pendiente',
    confirmReason: 'El prestatario ha confirmado la devolución en efectivo',
    cancelReason: 'Caja ha cancelado el recibo de efectivo pendiente',
    confirmCashWarning:
      'Confirma el recibo {{receipt}} por {{amount}} yuanes. Esto reduce tu deuda y no se puede deshacer.',
    cancelCashWarning:
      'Cancela el recibo {{receipt}} por {{amount}} yuanes. Tu deuda pendiente no cambia.',
    cashRestricted:
      'Solo Caja puede registrar devoluciones de un anticipo pagado.',
    repaymentStates: {
      pending: 'Pendiente de confirmación',
      settled: 'Confirmado',
      cancelled: 'Cancelado',
    },
    department: 'Departamento',
    yuan: 'yuanes',
    inflight: 'Reservado contra el límite de anticipos: {{amount}} yuanes',
    quotaFact:
      'Datos del envío: deuda {{debt}}, otras solicitudes {{inflight}}, total con esta solicitud {{total}} yuanes.',
    principal: 'Principal original',
    repaid: 'Devuelto',
    outstanding: 'Deuda pendiente',
    pendingRepayment: 'Reservas de devolución pendientes',
    pendingHint:
      'Las confirmaciones de efectivo y compensaciones de reembolso pendientes no reducen la deuda pendiente.',
    edit: 'Editar borrador de anticipo',
    invalidAmount:
      'Introduce un importe positivo con un máximo de dos decimales.',
    invalidTravel: 'Elige una solicitud propia de viaje aprobada y activa.',
    readOnly: 'No tienes permiso para editar este borrador.',
    bankMissing:
      'Tu cuenta de pago está incompleta. Actualízala antes de que Caja pueda completar el pago.',
    conflict:
      'La solicitud ha cambiado. Abre los detalles actuales antes de volver a editar.',
    amountHint: 'Los importes utilizan céntimos exactos; máximo dos decimales.',
    companyDate:
      'Fecha del calendario en la zona horaria de la empresa: {{zone}}',
    noTravel: 'Sin viaje vinculado',
    search: 'Número, finalidad o solicitante',
    allStatuses: 'Todos los estados',
    view: 'Lista de trabajo',
    filteredEmpty: 'No hay solicitudes de anticipos coincidentes',
    empty: 'No hay solicitudes de anticipos',
    emptyHint:
      'Crea una solicitud de anticipo para financiar necesidades empresariales aprobadas.',
    clear: 'Borrar filtros',
    states: {
      draft: 'Borrador',
      revision: 'Devuelto para revisión',
      manager: 'Revisión del responsable',
      head: 'Revisión del responsable del departamento',
      finance: 'Revisión financiera',
      executive: 'Revisión de vicepresidencia',
      gm: 'Revisión de la dirección general',
      cashier: 'Pendiente de pago',
      exception: 'Incidencia de pago',
      paid: 'Pagado',
      rejected: 'Rechazado',
      withdrawn: 'Retirado',
      terminated: 'Terminado',
    },
    stages: {
      draft: 'Borrador',
      revision: 'Devuelto para revisión',
      manager: 'Revisión del responsable',
      head: 'Revisión del responsable del departamento',
      finance: 'Revisión financiera',
      executive: 'Revisión de vicepresidencia',
      gm: 'Revisión de la dirección general',
      cashier: 'Pendiente de pago',
      exception: 'Incidencia de pago',
      paid: 'Pagado',
      rejected: 'Rechazado',
      withdrawn: 'Retirado',
      terminated: 'Terminado',
    },
    errors: {
      inactive: 'Se requiere una ficha de empleado activa.',
      configuration:
        'No se puede enviar la aprobación. Contacta con un administrador para comprobar los plazos de aprobación.',
      invalid: 'Comprueba los campos introducidos y vuelve a intentarlo.',
      quota: 'Se superaría el límite personal de anticipos.',
      overdue: 'Devuelve tu deuda vencida antes de solicitar otro anticipo.',
    },
    authz: {
      ownedScope: 'Solicitudes presentadas o creadas por mí',
      resource: 'Solicitudes de anticipos',
      submit: 'Enviar solicitudes propias de anticipos',
      delegate: 'Crear solicitudes de anticipos para empleados',
      view: 'Leer solicitudes de anticipos',
      payment: 'Leer datos protegidos de pago de anticipos',
      cashRepayment: 'Registrar y cancelar devoluciones en efectivo',
      confirmRepayment: 'Confirmar devoluciones propias en efectivo',
      collection: 'Solicitudes de anticipos',
    },
    title: 'Solicitudes de anticipos',
    new: 'Nueva solicitud de anticipo',
    reason: 'Finalidad del anticipo',
    amount: 'Importe del anticipo (yuanes)',
    dueDate: 'Fecha de devolución',
    travel: 'Solicitud de viaje vinculada',
    status: 'Estado',
    refresh: 'Actualizar',
    loan: 'Saldo del anticipo',
    repayment: 'Devolución en efectivo',
    voucher: 'Comprobante de pago',
  },
};
