export default {
  leaveBalances: {
    navigationDiscardDescription:
      'Descarta estos cambios y vuelve a la lista de saldos. La navegación original no continuará.',
    navigationDiscard: 'Descartar y volver a los saldos',
    clearFilters: 'Borrar filtros',
    clearSearch: 'Borrar búsqueda',
    title: 'Saldos de ausencias',
    adminTitle: 'Administración de saldos de ausencias',
    description:
      'Consulta ausencias disponibles, días retenidos e historial de saldos.',
    adminDescription:
      'Revisa los saldos de ausencias de empleados y registra ajustes justificados.',
    employee: 'Empleado',
    employeePlaceholder: 'Buscar empleados por nombre o código',
    type: 'Tipo de ausencia',
    selectType: 'Seleccionar un tipo de ausencia',
    availableUnits: 'Días disponibles',
    heldUnits: 'Días retenidos',
    availableDelta: 'Cambio disponible (días)',
    heldDelta: 'Cambio retenido (días)',
    at: 'Hora',
    kind: 'Tipo',
    reference: 'Origen',
    actor: 'Responsable',
    reason: 'Motivo',
    days: 'Días de ajuste',
    actions: 'Acciones para «{{name}}»',
    adjust: 'Ajustar',
    adjustBalance: 'Ajustar saldo',
    refresh: 'Actualizar',
    retry: 'Reintentar',
    loading: 'Cargando',
    noResults: 'No hay empleados coincidentes. Modifica la búsqueda.',
    searchCap:
      'Solo se muestran los primeros 20 empleados. Restringe la búsqueda.',
    noTypes:
      'No hay tipos de ausencia con saldo disponibles. Pide a un administrador que los configure.',
    unopened:
      '«{{type}}» aún no tiene cuenta: {{available}} días disponibles y {{held}} días retenidos. Añade un saldo para abrirla.',
    ledgerTitle: '{{type}} · Historial de saldo',
    adjustTitle: 'Ajustar saldo de ausencia',
    adjustDescription: 'Ajusta el saldo de {{type}} de «{{name}}».',
    currentBalance:
      'Actualmente hay {{available}} días disponibles y {{held}} días retenidos.',
    afterBalance:
      'Disponible tras el ajuste: {{amount}} días, sujeto a validación del servidor.',
    noExpiry:
      'Los saldos añadidos no caducan. Las reducciones conservan las reglas de caducidad existentes.',
    daysInvalid:
      'Introduce un número de días distinto de cero en incrementos de media jornada.',
    reasonRequired: 'Introduce el motivo del ajuste.',
    reasonLong: 'Limita el motivo a 2000 caracteres.',
    adjusted: 'Se ha ajustado el saldo de «{{name}}».',
    cancel: 'Cancelar',
    uncertain:
      'El resultado es incierto. Reintenta el mismo ajuste; sus valores están bloqueados para evitar registros duplicados.',
    retryAdjustment: 'Reintentar ajuste',
    discardTitle: 'Descartar ajuste de saldo',
    discardDescription: 'Se perderá el ajuste sin guardar.',
    keepEditing: 'Seguir editando',
    discard: 'Descartar',
    kinds: {
      grant: 'Conceder',
      hold: 'Retener',
      deduct: 'Descontar',
      release: 'Liberar',
      expire: 'Caducar',
      refund: 'Devolver',
    },
    error: {
      insufficient: 'El saldo disponible es insuficiente. Reduce el descuento.',
      forbidden:
        'No tienes permiso para ver o ajustar estos datos. Consulta a un administrador; las búsquedas de empleados también requieren acceso a las fichas.',
      notFound:
        'La ficha de empleado no existe o no está vinculada. Consulta a RR. HH. o selecciona otro empleado.',
      invalid:
        'El ajuste no es válido. Comprueba los días, el tipo de ausencia y el motivo.',
      failed: 'No se ha podido completar la solicitud. Vuelve a intentarlo.',
    },
    empty: {
      readonlyAccountsTitle: 'Aún no hay saldos de ausencias',
      readonlyAccountsDescription:
        'Pide a un administrador autorizado de RR. HH. que conceda saldos de ausencias.',
      employeeTitle: 'Seleccionar un empleado',
      employeeDescription:
        'Busca por nombre o código para consultar los saldos de ausencias.',
      accountsTitle: 'Aún no hay saldos de ausencias',
      accountsDescription:
        'Selecciona un tipo de ausencia y añade saldo mediante un ajuste.',
      mineTitle: 'Aún no hay saldos de ausencias',
      mineDescription:
        'RR. HH. concede tus saldos de ausencias. Contacta con RR. HH. si necesitas consultarlos.',
      ledgerTitle: 'Aún no hay historial de saldo',
      ledgerDescription:
        'Aquí aparecerán las concesiones, retenciones y deducciones.',
    },
    authz: {
      section: 'Gestión de ausencias',
      title: 'Saldos de ausencias',
      read: 'Leer saldos de ausencias de empleados',
      update: 'Ajustar saldos de ausencias de empleados',
      permissionSet: 'Administración de saldos de ausencias por RR. HH.',
    },
  },
};
