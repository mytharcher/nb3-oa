export default {
  // Existing permission titles use the collection name.
  trainingRequests: {
    authz: {
      resource: 'Formación y aprendizaje',
      submit: 'Enviar solicitud de formación',
      delegate: 'Enviar en nombre de un empleado',
      view: 'Ver solicitudes de formación',
    },
  },
  training: {
    actionForm: {
      title: '{{action}} solicitud de formación «{{name}}»',
      completed:
        '{{action}} completada para la solicitud de formación «{{name}}»',
      saved: 'Se ha guardado la solicitud de formación «{{name}}»',
    },
    businessErrors: {
      TRAINING_INVALID_INPUT:
        'Completa el nombre de la formación, la institución y el motivo e introduce costes válidos no negativos.',
      TRAINING_INVALID_DATE:
        'El fin de la formación debe ser posterior a su inicio. Comprueba las fechas y horas.',
      TRAINING_DEPARTMENT_REQUIRED:
        'El solicitante necesita un departamento principal activo. Pide a RR. HH. que actualice la ficha del empleado.',
    },

    cc: 'Añadir destinatario en copia',
    authz: {
      resource: 'Formación y aprendizaje',
      submit: 'Enviar solicitud de formación',
      delegate: 'Enviar en nombre de un empleado',
      view: 'Ver solicitudes de formación',
    },
    new: 'Nueva solicitud de formación',
    edit: 'Editar solicitud de formación',
    formDescription: 'Solicita formación o aprendizaje externo.',
    name: 'Nombre de la formación',
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
      'La aprobación registra la asistencia a formación cuando se utiliza horario laboral. La formación de pago crea una asignación de reembolso aprobada; aún no se ha realizado ningún pago.',
    approvedFacts: 'Esta formación se ha aprobado. RR. HH. recibe una copia.',
    attendanceRecorded:
      'Se ha registrado la actividad de asistencia a formación.',
    authorizationIssued:
      'Asignación de reembolso aprobada: {{amount}} yuanes. Las solicitudes de reembolso siguen la política de asignaciones.',
    zeroNoAuthorization:
      'No se crea asignación de gastos para la formación gratuita.',
    uncertainCreate:
      'Se desconoce el resultado del guardado. Consulta Mis solicitudes antes de crear otra.',
    inactive: 'Se requiere una ficha de empleado activa.',
    configuration:
      'No se puede enviar la aprobación. Contacta con un administrador para comprobar los plazos de aprobación.',
    invalid:
      'Comprueba los campos de la solicitud y vuelve a cargar el registro más reciente si es necesario.',
    stages: {
      manager: 'Responsable directo',
      head: 'Responsable del departamento',
      finance: 'Finanzas',
      executive: 'Dirección',
      gm: 'Director general',
    },
  },
};
