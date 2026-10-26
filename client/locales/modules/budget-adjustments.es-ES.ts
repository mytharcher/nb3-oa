export default {
  budgetAdjustments: {
    businessErrors: {
      BUDGET_ADJUSTMENT_INVALID_ACCOUNT:
        'Selecciona un departamento activo y un año presupuestario válido.',
      BUDGET_ADJUSTMENT_INVALID_AMOUNT:
        'Introduce un importe positivo de ajuste y un motivo.',
      BUDGET_ADJUSTMENT_INVALID_SUBJECT:
        'Selecciona una partida presupuestaria activada.',
      BUDGET_ADJUSTMENT_INVALID_TRANSFER:
        'Para transferencias, utiliza partidas de origen y destino diferentes. Para aumentos, borra la partida de origen.',
      BUDGET_ADJUSTMENT_INACTIVE_HEAD:
        'El responsable del departamento no está disponible. Pide a un administrador que actualice la asignación del departamento.',
    },

    authz: {
      resource: 'Ajustes presupuestarios',
      submit: 'Enviar ajuste presupuestario',
      delegate: 'Enviar ajuste presupuestario para un empleado',
      view: 'Leer ajustes presupuestarios',
    },
    new: 'Nuevo ajuste presupuestario',
    edit: 'Editar ajuste presupuestario',
    formDescription:
      'Propón una transferencia entre partidas o un presupuesto adicional.',
    department: 'Departamento presupuestario',
    yearInvalid: 'Introduce un año entero entre 1900 y 9999.',
    year: 'Año presupuestario',
    type: 'Tipo de ajuste',
    transfer: 'Transferencia entre partidas',
    increase: 'Presupuesto adicional',
    targetSubject: 'Partida de destino',
    sourceSubject: 'Partida de origen',
    amount: 'Importe (yuanes)',
    yuan: 'yuanes',
    reason: 'Motivo',
    amountInvalid:
      'Introduce un importe decimal positivo con un máximo de dos decimales dentro del límite seguro.',
    sourceInvalid: 'Elige partidas de origen y destino diferentes.',
    amountHint:
      'Utiliza yuanes con decimales. Los importes se guardan como céntimos enteros exactos.',
    reserveHint:
      'El envío reserva los fondos de origen para la transferencia. El presupuesto solo entra en vigor tras la aprobación final.',
    revisionHold:
      'La reserva original se mantiene mientras la solicitud esté devuelta. Modificar la propuesta solo libera y sustituye la reserva al reenviarla.',
    retainedHold:
      'Reserva original actual: {{subject}} · {{amount}} yuanes. Es independiente de la propuesta modificada.',
    actualHold: 'Reserva de origen actual',
    frozenThreshold:
      'Umbral de dirección general enviado para un aumento: {{amount}} yuanes (solo si lo supera estrictamente).',
    applied: 'La aprobación final ha aplicado este ajuste presupuestario.',
    reserved:
      'Los fondos de origen están reservados; este ajuste aún no ha entrado en vigor.',
    awaitingEffect:
      'Esta propuesta aún no ha entrado en vigor. El presupuesto adicional solo se aplica tras la aprobación final.',
    insufficient:
      'El presupuesto de origen no tiene fondos disponibles suficientes. Revisa el importe y el origen; los datos introducidos se conservan.',
    subjectInactive:
      'Esta partida está desactivada. Elige una partida activa antes de enviar.',
    disabled: 'Desactivado',
    inactive: 'El solicitante debe ser un empleado activo.',
    configuration:
      'No se puede enviar la aprobación. Contacta con un administrador para comprobar los plazos de aprobación.',
    invalid: 'Revisa la cuenta, el tipo de ajuste, el importe y el motivo.',
    uncertainCreate:
      'No se conoce con certeza el resultado del guardado. Cierra y consulta Mis solicitudes antes de crear otro borrador.',
    stages: {
      head: 'Responsable del departamento',
      finance: 'Responsable de finanzas',
      cfo: 'Director financiero',
      gm: 'Director general',
    },
  },
};
