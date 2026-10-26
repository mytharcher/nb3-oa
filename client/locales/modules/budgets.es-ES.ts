export default {
  budgets: {
    create: 'Crear',

    title: 'Gestión presupuestaria',
    description:
      'Finanzas registra presupuestos anuales y cambios manuales auditados; los fondos reservados y utilizados proceden de documentos empresariales.',
    new: 'Nuevo presupuesto anual',
    newDescription:
      'Crea una cuenta presupuestaria por departamento, año y partida.',
    adjustTitle: 'Ajustar presupuesto',
    adjustDescription:
      'Registra un cambio manual de asignación con un motivo. Las reservas y los gastos existentes permanecen en el registro.',
    detail: 'Cuenta presupuestaria',
    detailDescription:
      'Revisa los saldos y los cambios presupuestarios inmutables.',
    accountTitle: '{{department}} · {{year}} · {{subject}}',
    department: 'Departamento',
    year: 'Año',
    subject: 'Sujeto',
    allocatedCents: 'Asignado',
    heldCents: 'Reservado',
    usedCents: 'Utilizado',
    availableCents: 'Disponible',
    amount: 'Asignación anual',
    changeAmount: 'Cambio de asignación',
    amountHint:
      'Unidades monetarias positivas, con un máximo de dos decimales.',
    deltaHint:
      'Un importe positivo añade fondos; uno negativo los reduce. No se pueden retirar fondos reservados o utilizados.',
    reason: 'Motivo',
    ledger: 'Cambios presupuestarios',
    kind: 'Tipo de cambio',
    at: 'Hora',
    reference: 'Origen',
    actor: 'Operador',
    allocatedDelta: 'Cambio de asignación',
    heldDelta: 'Cambio de reserva',
    usedDelta: 'Cambio de uso',
    allSubjects: 'Todas las partidas',
    selectSubject: 'Seleccionar un sujeto',
    yearPlaceholder: 'Filtrar por año',
    refresh: 'Actualizar',
    clear: 'Borrar filtros',
    cancel: 'Cancelar',
    save: 'Guardar',
    adjust: 'Ajustar',
    view: 'Ver',
    retry: 'Reintentar',
    loading: 'Cargando',
    rowActions: 'Acciones para {{name}}',
    saved: 'Se ha guardado el presupuesto de «{{name}}»',
    currentAccount:
      '{{department}} · {{year}} · {{subject}} · asignado {{amount}}',
    openExisting: 'Abrir cuenta existente',
    required: 'Rellena este campo obligatorio.',
    invalidYear: 'Introduce un año entre 1900 y 9999.',
    invalidAmount:
      'Introduce un importe distinto de cero con un máximo de dos decimales dentro del límite seguro de céntimos enteros.',
    positiveAmount:
      'Introduce un importe positivo con un máximo de dos decimales dentro del límite seguro de céntimos enteros.',
    longReason: 'Limita el motivo a 4000 caracteres.',
    invalidField: 'Comprueba este campo y vuelve a intentarlo.',
    kinds: {
      consume: 'Liquidación parcial',
      allocate: 'Asignación',
      hold: 'Reserva',
      release: 'Liberado',
      settle: 'Liquidación',
      transferOut: 'Transferencia saliente',
      transferIn: 'Transferencia entrante',
    },
    empty: {
      accountsTitle: 'Aún no hay presupuestos',
      accountsDescription:
        'Crea asignaciones anuales para activar el control presupuestario.',
      readonlyTitle: 'Aún no hay presupuestos',
      readonlyDescription:
        'Pide a Finanzas que introduzca los presupuestos anuales.',
      filteredTitle: 'No hay presupuestos coincidentes',
      filteredDescription:
        'Borra o modifica los filtros para encontrar una cuenta.',
      ledgerTitle: 'Aún no hay cambios',
      ledgerDescription:
        'Los cambios presupuestarios aparecerán aquí cuando se registren.',
    },
    error: {
      failed:
        'No se ha podido cargar o guardar el presupuesto. Reintenta con los mismos datos.',
      forbidden:
        'No tienes permiso de presupuestos. Contacta con un administrador.',
      missing: 'Este presupuesto ya no existe. Vuelve a la lista.',
      BUDGET_NOT_FOUND: 'Este presupuesto ya no existe. Vuelve a la lista.',
      BUDGET_ALREADY_EXISTS:
        'Ya existe un presupuesto para esta cuenta. Ábrelo y utiliza Ajustar.',
      BUDGET_IDEMPOTENCY_CONFLICT:
        'Esta clave de solicitud ya identifica otro cambio. Revisa los datos y vuelve a guardar.',
      BUDGET_INSUFFICIENT:
        'El ajuste dejaría un presupuesto disponible insuficiente. Reduce la disminución.',
      BUDGET_INVALID_DEPARTMENT: 'Selecciona un departamento activo.',
      BUDGET_INVALID_SUBJECT: 'Selecciona una partida presupuestaria activa.',
      BUDGET_INVALID_AMOUNT:
        'Comprueba el importe y utiliza como máximo dos decimales.',
      BUDGET_INVALID_COMMAND:
        'Comprueba el motivo obligatorio y los detalles de la solicitud.',
      BUDGET_INVALID_ACCOUNT: 'Comprueba el departamento, el año y la partida.',
      BUDGET_INVALID_PAGE: 'Comprueba la página y su tamaño.',
      invalid:
        'Comprueba los campos obligatorios y corrige los valores resaltados.',
    },
    authz: {
      title: 'Gestión presupuestaria',
      read: 'Leer cuentas y cambios presupuestarios',
      update: 'Crear presupuestos y registrar ajustes manuales',
      permissionSet: 'Gestión presupuestaria de Finanzas',
    },
  },
};
