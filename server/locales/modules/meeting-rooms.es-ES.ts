export default {
  meetingRooms: {
    authz: {
      title: 'Salas de reuniones',
      bookings: 'Reservas de reuniones',
      view: 'Ver',
      manage: 'Gestionar salas de reuniones',
      create: 'Reservar una sala',
      edit: 'Editar reservas',
      cancel: 'Cancelar reservas',
      confirm: 'Confirmar solicitudes administrativas',
      reject: 'Rechazar solicitudes administrativas',
      checkIn: 'Registrar llegada',
      owned: 'Organizadas por mí',
      participating: 'Reuniones a las que asisto',
      readable: 'Reuniones que organizo o a las que asisto',
    },
    notifications: {
      title: 'Actualización de reserva de reunión',
      body: 'Una reserva de reunión en la que participas ha cambiado. Abre tus reservas para consultar los detalles accesibles.',
    },
    errors: {
      SORT_LIMIT_EXCEEDED:
        'Hay demasiados registros coincidentes. Restringe la búsqueda antes de ordenar por nombre.',
      ACCESS_DENIED: 'Esta operación o sus campos están fuera de tus permisos.',
      ACTIVE_EMPLOYEE_REQUIRED: 'Se requiere una ficha de empleado activa.',
      BOOKING_NOT_FOUND: 'La reserva no está disponible.',
      CAPACITY_EXCEEDED:
        'El organizador y los asistentes superan el aforo de la sala.',
      COMMAND_CONFLICT:
        'Este identificador de solicitud pertenece a otra operación o persona responsable.',
      INVALID_BOOKING:
        'Introduce un título y asistentes activos sin duplicados.',
      INVALID_INTERVAL:
        'Elige un intervalo futuro que termine después de su inicio.',
      INVALID_PARTICIPANT: 'Todos los asistentes deben ser empleados activos.',
      INVALID_RECURRENCE:
        'Elige una serie diaria o semanal de entre 1 y 52 reuniones.',
      INVALID_REQUEST_ID: 'Se requiere un identificador de solicitud.',
      INVALID_ROOM:
        'Introduce el nombre de la sala, su aforo y el motivo del cambio.',
      INVALID_SERIES: 'Elige una serie existente.',
      INVALID_STATE:
        'Esta operación no se puede realizar en el estado o intervalo temporal actuales de la reserva.',
      REASON_REQUIRED: 'Introduce un motivo para esta decisión administrativa.',
      ROOM_INACTIVE: 'Esta sala está inactiva.',
      ROOM_NOT_FOUND: 'Esta sala no está disponible.',
      TIME_CONFLICT:
        'Uno o más intervalos solicitados se solapan con un intervalo ocupado.',
      VERSION_CONFLICT:
        'La reserva o la sala han cambiado. Actualiza antes de volver a intentarlo.',
      INVALID_LOCAL_TIME:
        'Introduce una fecha y hora local de empresa válidas.',
      NONEXISTENT_LOCAL_TIME:
        'Esta hora local no existe debido a un cambio de zona horaria. Elige otra hora.',
      AMBIGUOUS_LOCAL_TIME:
        'Esta hora local aparece dos veces debido a un cambio de zona horaria. Elige una hora sin ambigüedad.',
    },
  },
};
