export default {
  outings: {
    authz: { resource: 'Solicitudes de salida' },
    navigation: 'Solicitudes de salida',
    new: 'Nueva solicitud de salida',
    edit: 'Editar solicitud de salida',
    formDescription:
      'Comprueba el período y envía a revisión o guarda un borrador.',
    description:
      'Registra el período, el lugar y la finalidad de la salida para que tu responsable la revise.',
    startAt: 'Hora de inicio',
    endAt: 'Hora de fin',
    location: 'Ubicación',
    reason: 'Finalidad',
    timeZone: 'Las horas se registran en {{zone}}',
    policyHint:
      'Una vez iniciada la salida, solo tu supervisor puede terminarla indicando un motivo.',
    nonexistentTime:
      'Esta hora local no existe debido a un cambio horario. Elige otra hora.',
    daylightSavingPolicy:
      'Si un cambio horario repite esta hora local, se utiliza la primera aparición.',
    errors: {
      OUTING_EMPLOYEE_INACTIVE:
        'El solicitante debe ser un empleado activo. Contacta con RR. HH. para comprobar la ficha.',
      OUTING_INVALID_PERIOD:
        'El fin debe ser posterior al inicio. Comprueba el período de la salida.',
      OUTING_REQUIRED_FIELDS: 'Indica una ubicación y una finalidad.',
      OUTING_SLA_CONFIGURATION_UNSUPPORTED:
        'No se puede enviar la aprobación. Contacta con un administrador para comprobar los plazos de aprobación.',
      ATTENDANCE_ACTIVITY_CHANGED:
        'Los datos de asistencia han cambiado. Actualiza para revisarlos.',
    },
  },
};
