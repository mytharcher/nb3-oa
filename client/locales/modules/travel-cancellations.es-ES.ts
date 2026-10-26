export default {
  // Existing permission titles use the collection name.
  travelCancellations: {
    authz: {
      resource: 'Solicitudes de cancelación de viaje',
      submit: 'Enviar solicitud de cancelación de viaje',
      delegate: 'Enviar en nombre de un empleado',
      view: 'Ver solicitudes de cancelación de viaje',
    },
  },
  travelCancellation: {
    fieldInvalid: 'Comprueba {{field}}.',

    sourceUnavailable: 'Viaje de origen no disponible',
    exceptionReason: 'Motivo de la incidencia',
    exception: 'Incidencia al cancelar reserva',
    businessErrors: {
      TRAVEL_CANCELLATION_REASON_REQUIRED:
        'Introduce el motivo de cancelación del viaje.',
      TRAVEL_CANCELLATION_ALREADY_PENDING:
        'Ya hay una cancelación pendiente para este viaje. Abre la solicitud existente.',
      TRAVEL_CANCELLATION_BASELINE_CHANGED:
        'El viaje aprobado ha cambiado. Actualízalo y revisa la cancelación antes de reenviar.',
      TRAVEL_CANCELLATION_INVALID_SOURCE:
        'El viaje original ya no se puede cancelar. Selecciona un viaje aprobado vigente.',
    },

    retryUnbooking: 'Reintentar cancelación administrativa',
    bookingInformation: 'Acuerdos de cancelación de reservas y devolución',
    unbookingHint:
      'El viaje original se revoca tras la aprobación del responsable del departamento. Administración debe registrar los acuerdos de cancelación y devolución; esto no confirma un pago de devolución.',
    complete: 'Completar cancelación administrativa',
    unable: 'No se puede cancelar la reserva',
    forceComplete: 'Forzar cierre de cancelación',
    source: 'Viaje original',
    chooseSource: 'Elige un viaje aprobado',
    effectHint:
      'El responsable original del departamento debe aprobar antes de revocar la asistencia y la autorización de reembolso. Los anticipos vinculados se gestionan según su estado de desembolso.',
    cc: 'Añadir destinatario en copia',
    authz: {
      resource: 'Solicitudes de cancelación de viaje',
      submit: 'Enviar solicitud de cancelación de viaje',
      delegate: 'Enviar en nombre de un empleado',
      view: 'Ver solicitudes de cancelación de viaje',
    },
    new: 'Nueva solicitud de cancelación de viaje',
    edit: 'Editar solicitud de cancelación de viaje',
    formDescription: 'Solicita la cancelación de un viaje aprobado.',
    name: 'Nombre de la cancelación del viaje',
    institution: 'Institución',
    startAt: 'Inicio',
    endAt: 'Fin',
    usesWorkingTime: 'Utiliza horario laboral',
    amount: 'Coste (yuanes)',
    yuan: 'yuanes',
    yes: 'Sí',
    no: 'No',
    timeZone: 'Zona horaria de la empresa: {{zone}}',
    amountHint:
      'Introduce yuanes con un máximo de dos decimales. Se admiten costes de cero.',
    amountInvalid:
      'Introduce un importe no negativo con un máximo de dos decimales.',
    dateInvalid: 'Elige un intervalo válido cuyo fin sea posterior al inicio.',
    approvalHint:
      'La aprobación registra la actividad de asistencia de cancelación del viaje cuando se utiliza horario laboral. Una cancelación de pago crea una asignación de reembolso aprobada; aún no se ha realizado ningún pago.',
    approvedFacts:
      'Esta cancelación de viaje se ha aprobado. RR. HH. recibe una copia.',
    attendanceRecorded:
      'Se ha registrado la actividad de asistencia de cancelación del viaje.',
    authorizationIssued:
      'Asignación de reembolso aprobada: {{amount}} yuanes. Las solicitudes de reembolso siguen la política de asignaciones.',
    zeroNoAuthorization:
      'No se crea una asignación de gastos para la cancelación de viaje gratuita.',
    uncertainCreate:
      'Se desconoce el resultado del guardado. Consulta Mis solicitudes antes de crear otra.',
    inactive: 'Se requiere una ficha de empleado activa.',
    configuration:
      'No se puede enviar la aprobación. Contacta con un administrador para comprobar los plazos de aprobación.',
    invalid:
      'Comprueba los campos de la solicitud y vuelve a cargar el registro más reciente si es necesario.',
    stages: {
      unbooking: 'Cancelación administrativa de reservas',
      manager: 'Responsable directo',
      head: 'Responsable del departamento',
      finance: 'Finanzas',
      executive: 'Dirección',
      gm: 'Director general',
    },
  },
};
