export default {
  overtime: {
    businessErrors: {
      OVERTIME_INVALID_DATE: 'Selecciona una fecha válida de horas extra.',
    },

    authz: { resource: 'Solicitudes de horas extra' },
    navigation: 'Solicitudes de horas extra',
    description: 'Solicita horas extra y sigue su aprobación y liquidación.',
    new: 'Nueva solicitud de horas extra',
    edit: 'Editar solicitud de horas extra',
    date: 'Fecha de horas extra',
    minutes: 'Duración (minutos)',
    monthlyMinutes: 'Total mensual (minutos)',
    settlement: 'Liquidación',
    compensatory: 'Descanso compensatorio',
    pay: 'Pago de horas extra',
    durationInvalid: 'Introduce un número entero entre 1 y 1440 minutos.',
    formDescription: 'Revisa la solicitud y envíala o guarda un borrador.',
    policyHint:
      'Una solicitud por fecha. Las solicitudes tardías requieren revisión de RR. HH. El descanso compensatorio se asigna tras la aprobación final.',
    emptyDescription:
      'Completa una solicitud de horas extra y envíala o guarda un borrador.',
    uncertainCreate:
      'No se conoce con certeza el resultado del guardado. Cierra este formulario y consulta Mis solicitudes antes de crear otro borrador.',
    duplicate:
      'Ya existe una solicitud de horas extra activa o aprobada para esta fecha.',
    inactive: 'El solicitante debe ser un empleado activo.',
    configuration:
      'No se puede enviar la aprobación. Contacta con un administrador para comprobar los plazos de aprobación.',
    invalid:
      'Revisa la fecha de horas extra, la duración, la liquidación y el motivo.',
    schemaUnavailable:
      'Es necesario actualizar el esquema de la base de datos de horas extra. Esta operación todavía no se puede completar. Contacta con un administrador.',
  },
};
