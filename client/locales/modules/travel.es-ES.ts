export default {
  travel: {
    fieldInvalid: 'Comprueba {{field}}.',

    confirmRetryBooking: '¿Reintentar la reserva de este viaje aprobado?',
    confirmReviseTrip: '¿Revisar este viaje y reiniciar su aprobación?',
    states: {
      completed: 'Completado',
      cancelled: 'Cancelado',
      exception: 'Incidencia de reserva',
    },
    businessErrors: {
      TRAVEL_ITINERARY_REQUIRED:
        'Los viajes internacionales requieren un itinerario adjunto. Sube o selecciona uno antes de enviar.',
      TRAVEL_OVERLAP:
        'Este período se solapa con un viaje aprobado. Ajusta las fechas del viaje.',
      TRAVEL_COMPANIONS_INVALID:
        'Selecciona acompañantes diferentes del solicitante y sin duplicados.',
      TRAVEL_COMPANION_INACTIVE:
        'Un viajero seleccionado ya no está activo. Vuelve a seleccionar empleados actuales.',
      TRAVEL_DEPARTMENT_REQUIRED:
        'El solicitante necesita un departamento principal activo. Pide a RR. HH. que actualice la ficha del empleado.',
      TRAVEL_INVALID_DATE:
        'El fin del viaje debe ser posterior al inicio. Comprueba ambas fechas y horas.',
      TRAVEL_INVALID_INPUT:
        'Completa el destino y el motivo e introduce costes de viaje válidos no negativos.',
    },

    requestLoan: 'Solicitar anticipo vinculado',
    reviseTrip: 'Revisar viaje y reiniciar aprobación',
    revisionWarning:
      'La revisión cierra la asignación de reembolso anterior y finaliza la actividad de asistencia anterior antes de una nueva aprobación. El principal de los anticipos existentes y sus vencimientos originales se conservan; gestiona los anticipos por separado.',
    cancelTrip: 'Solicitar cancelación de viaje',
    complete: 'Completar reserva',
    unable: 'No se puede reservar',
    forceComplete: 'Forzar cierre de reserva',
    retryBooking: 'Reintentar reserva',
    standard: 'Normativa de viaje fijada',
    lodgingPerNight: 'Límite de alojamiento por noche (yuanes)',
    allowancePerDay: 'Dieta por día (yuanes)',
    companions: 'Acompañantes',
    addCompanion: 'Añadir acompañante',
    removeCompanion: 'Quitar',
    companionsInvalid: 'Los acompañantes deben ser distintos',
    peopleUnavailable:
      'Tus permisos no permiten buscar empleados. Contacta con un administrador.',
    destination: 'Destino',
    international: 'Viaje internacional',
    needsBooking: 'Reserva administrativa',
    needsLoan: 'Anticipo solicitado',
    transportCents: 'Transporte',
    lodgingCents: 'Alojamiento',
    allowanceCents: 'Dieta',
    bookingInformation: 'Detalles de la reserva',
    exceptionReason: 'Motivo de la incidencia',
    cc: 'Añadir destinatario en copia',
    authz: {
      resource: 'Solicitudes de viaje',
      submit: 'Enviar solicitud de viaje',
      delegate: 'Enviar en nombre de un empleado',
      view: 'Ver solicitudes de viaje',
    },
    new: 'Nueva solicitud de viaje',
    edit: 'Editar solicitud de viaje',
    formDescription: 'Solicita un viaje de trabajo.',
    name: 'Nombre del viaje',
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
      'La aprobación registra la asistencia del viaje y crea una asignación de reembolso para estimaciones positivas. Las reservas y el desembolso de anticipos son procesos separados.',
    approvedFacts:
      'La aprobación del viaje está completa; el progreso de la reserva se muestra por separado.',
    attendanceRecorded:
      'Se ha registrado la actividad de asistencia del viaje.',
    authorizationIssued:
      'Asignación de reembolso aprobada: {{amount}} yuanes. Las solicitudes de reembolso siguen la política de asignaciones.',
    zeroNoAuthorization:
      'Una estimación de coste cero no crea asignación; sigue siendo necesaria la revisión financiera.',
    uncertainCreate:
      'Se desconoce el resultado del guardado. Consulta Mis solicitudes antes de crear otra.',
    inactive: 'Se requiere una ficha de empleado activa.',
    configuration:
      'No se puede enviar la aprobación. Contacta con un administrador para comprobar los plazos de aprobación.',
    invalid:
      'Comprueba los campos de la solicitud y vuelve a cargar el registro más reciente si es necesario.',
    stages: {
      completed: 'Completado',
      manager: 'Responsable directo',
      head: 'Responsable del departamento',
      finance: 'Finanzas',
      executive: 'Dirección',
      gm: 'Director general',
      booking: 'Reserva administrativa',
    },
  },
};
