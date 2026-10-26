import actionCopy from './reimbursement-actions.es-ES.js';
import formCopy from './reimbursement-forms.es-ES.js';
export default {
  reimbursementRequests: {
    relatedUnavailable: 'Registro relacionado no disponible',
    categoryUnavailable: 'Categoría no disponible',

    businessErrors: {
      REIMBURSEMENT_INVALID_LINE_AMOUNT:
        'Cada línea de gasto debe tener un importe positivo dentro del intervalo admitido.',
      REIMBURSEMENT_INVALID_LINE_DATE:
        'Selecciona una fecha de gasto válida para cada línea.',
      REIMBURSEMENT_VOUCHER_REQUIRED:
        'Introduce el número de comprobante de pago antes de confirmar el pago.',
      REIMBURSEMENT_PAYMENT_CONFIRMATION_REQUIRED:
        'Introduce un motivo y confirma el total exacto del reembolso, la compensación del anticipo y el pago en efectivo.',
      REIMBURSEMENT_HANDLING_REASON_REQUIRED:
        'Introduce el motivo por el que no se ha podido completar el pago.',
      REIMBURSEMENT_PAYMENT_ACCOUNT_STALE:
        'La cuenta de pago ha cambiado. Carga la última cuenta antes de corregirla.',
      REIMBURSEMENT_AUTHORIZATION_CHANGED:
        'La asignación aprobada ha cambiado. Actualízala y comprueba el total del reembolso.',
      REIMBURSEMENT_INVOICES_CHANGED:
        'Los justificantes de factura han cambiado. Actualiza la solicitud y vuelve a seleccionar facturas disponibles.',
      REIMBURSEMENT_LOAN_CHANGED:
        'La compensación del anticipo ha cambiado. Actualiza el anticipo y confirma el importe a compensar.',
      REIMBURSEMENT_TOTAL_TOO_LARGE:
        'El gasto total supera el importe admitido. Reduce el total o divide la solicitud.',
      REIMBURSEMENT_FILE_SIZE:
        'Selecciona un adjunto con contenido de hasta 5 MB.',
      REIMBURSEMENT_FILE_TYPE:
        'Sube un archivo PDF, JPEG, PNG o WebP cuyo tipo coincida con su contenido.',
    },

    ...formCopy,
    ...actionCopy,
    title: 'Reembolsos de gastos',
    description:
      'Revisa los justificantes de gastos y sigue las aprobaciones por línea y la gestión del pago.',
    new: 'Nuevo reembolso',
    edit: 'Editar reembolso',
    details: 'Ver detalles',
    number: 'Número',
    reason: 'Motivo',
    gross: 'Reembolso bruto',
    offset: 'Compensación de anticipo',
    net: 'Efectivo neto',
    search: 'Buscar número, motivo o solicitante',
    view: 'Vista de registros',
    allStatuses: 'Todos los estados',
    refresh: 'Actualizar reembolsos',
    clearFilters: 'Borrar filtros',
    emptyTitle: 'Aún no hay reembolsos',
    emptyDescription:
      'Crea un borrador y añade líneas de gasto y justificantes.',
    noResults: 'No hay reembolsos coincidentes. Ajusta los filtros.',
    rowActions: 'Acciones para {{name}}',
    views: {
      mine: 'Mías',
      pending: 'Pendiente',
      done: 'Finalizadas',
      copied: 'Copiado',
    },
    statuses: {
      draft: 'Borrador',
      revision: 'Revisión',
      manager: 'Revisión del responsable',
      head: 'Revisión del departamento',
      finance: 'Revisión financiera',
      executive: 'Revisión de dirección',
      gm: 'Revisión de la dirección general',
      cashier: 'Gestión de Caja',
      exception: 'Incidencia de gestión',
      paid: 'Pagado',
      forcedPaid: 'Liquidación registrada administrativamente',
      rejected: 'Rechazado',
      withdrawn: 'Retirado',
      terminated: 'Terminado',
    },
    errors: {
      invoiceDuplicate:
        'Los números de factura deben ser únicos dentro de este reembolso. Comprueba cada línea de gasto.',
      overrunReasonRequired:
        'Las solicitudes acumuladas superan la asignación aprobada vinculada en más del 20 %. Introduce una explicación del exceso.',
      invoiceUnavailable:
        'La factura está reservada o utilizada por otro reembolso. Comprueba el número de factura y la solicitud.',
      paymentAccountRequired:
        'La cuenta de pago del empleado está incompleta. Pide a RR. HH. que complete el nombre del banco, el número y el titular de la cuenta antes de enviar.',
      employeeInactive:
        'El solicitante necesita un perfil de empleado activo. Contacta con RR. HH. para comprobarlo.',
      departmentRequired:
        'El solicitante no tiene un departamento principal activo. Pide a RR. HH. o a un administrador de la organización que lo asigne.',
      categoryInvalid:
        'Una categoría de gasto está inactiva o no está disponible. Elige una categoría activa para cada línea.',
      sourceInvalid:
        'La asignación vinculada no está disponible, no está aprobada o pertenece a otro solicitante. Comprueba la solicitud vinculada.',
      sourceRebind:
        'Un reembolso enviado no puede cambiar su asignación o anticipo vinculados. Conserva los vínculos originales.',
      loanRequired:
        'Selecciona un anticipo para compensar o introduce 0 si no se compensará ninguno.',
      loanInvalid:
        'El anticipo seleccionado no está disponible o pertenece a otro solicitante. Elige otro.',
      loanInsufficient:
        'El saldo disponible del anticipo es insuficiente. Reduce la compensación y comprueba el saldo.',
      invalidOffset:
        'La compensación del anticipo no puede superar el total del reembolso. Comprueba los importes.',
      attachmentInvalid:
        'Algunos justificantes no están disponibles o pertenecen a otro reembolso. Selecciona o sube justificantes de esta solicitud.',
      slaConfiguration:
        'Los plazos de aprobación no son compatibles. Contacta con el administrador del proceso.',
      inputInvalid:
        'Introduce un motivo de reembolso y completa líneas de gasto distintas con justificantes.',
      configuration:
        'La estructura de datos del reembolso está incompleta. Pide al administrador del sistema que la repare antes de reintentar.',
      forbidden: 'No tienes acceso a este reembolso.',
      notFound: 'Este reembolso ya no existe.',
      conflict:
        'Este reembolso ha cambiado. Vuelve a cargarlo y revísalo antes de actuar.',
      standardReason:
        'Explica cada línea de los días que superen el límite aprobado.',
      standardCategoryChanged:
        'Esta categoría está fuera de la política original. Crea una nueva solicitud para utilizar la política actual.',
      standardConfiguration:
        'La normativa de viaje aprobada está incompleta. Pide a un administrador que revise la configuración.',
      invalid:
        'Comprueba el contenido del reembolso y los justificantes obligatorios.',
      failed: 'La solicitud no se ha completado. Vuelve a intentarlo.',
    },
    standard: {
      title: 'Política de gastos fijada',
      unsubmitted: 'La política se fija en el primer envío.',
      frozenHint:
        'Estas clasificaciones guardadas y límites de viaje aprobados se conservan al revisar. Los importes diarios se suman por tipo de límite.',
      gradeCode: 'Nivel de viaje',
      gradeRank: 'Orden del nivel',
      lodging: 'Alojamiento por noche (yuanes)',
      allowance: 'Dieta por día (yuanes)',
      notApplicable:
        'No se aplica ninguna normativa de viaje aprobada a esta solicitud.',
      kinds: {
        none: 'Sin límite diario de viaje',
        lodging: 'Límite diario de alojamiento',
        allowance: 'Límite diario de dieta',
      },
    },
    detail: {
      lines: 'Líneas de gasto',
      failure: 'Fallo de gestión',
      voucher: 'Comprobante de pago',
      forcedReason: 'Motivo de liquidación administrativa',
      noLines: 'Aún no hay líneas de gasto.',
      line: 'Línea de gasto {{number}}',
      financeResult: 'Resultado financiero',
      lineStates: {
        approved: 'Aprobado',
        returned: 'Devuelto para corrección',
        pending: 'Pendiente de revisión',
      },
    },
    bank: {
      title: 'Cuenta de pago privada',
      bankName: 'Banco',
      bankAccount: 'Cuenta bancaria',
      bankAccountName: 'Titular de la cuenta',
      missing: 'No hay cuenta de pago guardada.',
      correct: 'Corregir cuenta de pago',
      saved: 'Cuenta de pago corregida',
      denied: 'Acceso a la cuenta de pago denegado.',
      unavailable:
        'La corrección de cuenta no está disponible. Vuelve a cargar este reembolso y comprueba su cuenta guardada.',
    },
    authz: {
      resource: 'Reembolsos de gastos',
      submit: 'Crear y enviar mis reembolsos',
      delegate: 'Crear reembolsos para empleados',
      view: 'Ver reembolsos',
      paymentAccount: 'Leer y corregir cuentas de pago autorizadas',
    },
  },
};
