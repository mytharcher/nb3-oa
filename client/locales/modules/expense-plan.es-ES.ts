export default {
  expensePlans: {
    relatedUnavailable: 'Registro relacionado no disponible',
    businessErrors: {
      EXPENSE_PLAN_DEPARTMENT_REQUIRED:
        'El solicitante necesita un departamento principal activo. Pide a RR. HH. que actualice la ficha del empleado.',
      EXPENSE_PLAN_INVALID_DATE:
        'Selecciona una fecha prevista del gasto válida.',
      EXPENSE_PLAN_INVALID_DICTIONARY:
        'Selecciona un tipo de asunto y una partida presupuestaria activados.',
      EXPENSE_PLAN_INVALID_INPUT:
        'Introduce un importe positivo, los participantes y el motivo del gasto.',
    },

    new: 'Nueva preaprobación de gastos',
    edit: 'Editar preaprobación de gastos',
    formDescription:
      'Planifica atenciones, actividades de equipo o eventos antes de gastar.',
    matterType: 'Tipo de asunto',
    subject: 'Partida presupuestaria',
    amount: 'Gasto estimado (yuanes)',
    yuan: 'yuanes',
    participants: 'Participantes',
    eventDate: 'Fecha del evento',
    budgetYear: 'Año presupuestario enviado',
    department: 'Departamento principal enviado',
    primaryDepartment:
      'Departamento principal actual: {{department}}. Se vuelve a comprobar al enviar.',
    departmentMissing: 'Sin configurar',
    departmentPending: 'Se determina al enviar',
    departmentUnavailable: 'El departamento no está disponible actualmente',
    year: 'Año presupuestario: {{year}} · calendario de empresa: {{timeZone}}',
    amountHint:
      'Introduce yuanes con decimales; los importes se guardan como céntimos enteros exactos.',
    amountInvalid:
      'Introduce un importe positivo con un máximo de dos decimales dentro del límite seguro.',
    participantsInvalid: 'Introduce un entero entre 1 y 100000.',
    dateInvalid: 'Elige una fecha válida.',
    disabled: 'Desactivado',
    subjectInactive:
      'Elige un tipo de asunto y una partida presupuestaria activos.',
    optionsEmpty:
      'Es necesario configurar un tipo de asunto y una partida presupuestaria activos antes de guardar.',
    reserveHint:
      'El envío reserva presupuesto. La aprobación final concede una cuota para reembolsos.',
    revisionHold:
      'La reserva presupuestaria original se conserva durante la revisión. Solo cambia al reenviar.',
    retainedHold:
      'Reserva original: {{subject}} · {{amount}} yuanes. Es independiente de la propuesta modificada.',
    actualHold: 'Reserva en la aprobación',
    holdFactHint:
      'Es el dato de la reserva de origen, no el saldo restante tras reembolsos posteriores.',
    frozenThreshold:
      'Umbrales enviados: dirección > {{vp}} yuanes; dirección general > {{gm}} yuanes.',
    applied:
      'Se ha emitido una cuota aprobada. Esto no indica que se haya realizado un reembolso o pago.',
    reserved:
      'El presupuesto está reservado mientras esta solicitud espera aprobación.',
    awaitingEffect: 'No se ha emitido una cuota aprobada para esta solicitud.',
    uncertainCreate:
      'No se conoce con certeza el resultado del guardado. Cierra y consulta Mis solicitudes antes de crear otro borrador.',
    unknownEdit:
      'No se conoce con certeza el resultado del guardado. Los datos están bloqueados hasta que se cargue el último registro.',
    authorization: 'Cuota aprobada',
    quotaId: 'Referencia de cuota',
    grantedAmount: 'Importe concedido',
    quotaState: 'Estado de la cuota',
    deadline: 'Fecha de caducidad',
    quotaHint:
      'Los reembolsos liquidan esta cuota. Su cierre o caducidad no revocan esta aprobación.',
    mergedTitle: 'Unificación por misma persona',
    quotaStates: { open: 'Abrir', closed: 'Cerrado', expired: 'Caducado' },
    createdBy: 'Creado por',
    authz: {
      resource: 'Preaprobación de gastos',
      submit: 'Enviar preaprobación de gastos',
      delegate: 'Enviar preaprobación de gastos para un empleado',
      view: 'Leer preaprobaciones de gastos',
    },
    stages: {
      head: 'Responsable del departamento',
      finance: 'Finanzas',
      executive: 'Directivo responsable',
      gm: 'Director general',
    },
    states: { approved: 'Cuota aprobada emitida' },
    merged:
      'Se han unificado dirección y dirección general: la misma persona ha aprobado en nombre propio.',
    errors: {
      invalid:
        'Revisa la fecha, los participantes, el importe, el tipo de asunto y la partida.',
      department: 'El solicitante necesita un departamento principal activo.',
      insufficient:
        'Esta cuenta presupuestaria no tiene fondos disponibles suficientes.',
      inactive: 'El solicitante debe tener una ficha de empleado activa.',
      configuration:
        'No se puede enviar la aprobación. Contacta con un administrador para comprobar los plazos de aprobación.',
    },
  },
};
