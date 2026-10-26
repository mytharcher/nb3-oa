export default {
  vehicles: {
    authz: {
      requests: 'Solicitudes de vehículos',
      garage: 'Parque de vehículos',
      manage: 'Gestionar listado de vehículos',
      viewCost: 'Ver coste de combustible privado',
    },
    errors: {
      VEHICLE_SORT_LIMIT:
        'Restringe la búsqueda antes de ordenar tantos registros.',
      VEHICLE_ACCESS_DENIED:
        'La actualización del conductor está fuera de la política autorizada.',
      VEHICLE_ALREADY_DISPATCHED:
        'Este origen ya tiene un registro inmutable de asignación de vehículo.',
      VEHICLE_APPROVAL_REFUSED:
        'La operación de vehículos no está disponible; actualiza la solicitud y comprueba tus permisos.',
      VEHICLE_CONTENT_CHANGED:
        'La asignación requiere contenido aprobado sin cambios y los datos privados de su acción.',
      VEHICLE_COST_NOT_FOUND: 'No se puede leer el coste de uso.',
      VEHICLE_DISPATCH_NOT_OFFERED:
        'Se requiere una tarea de asignación real autorizada.',
      VEHICLE_DRIVER_INACTIVE:
        'El conductor no reúne los requisitos actualmente.',
      VEHICLE_DRIVER_REQUIRED:
        'La selección del conductor debe coincidir con la solicitud aprobada.',
      VEHICLE_EMPLOYEE_INACTIVE: 'Se requiere una ficha de empleado activa.',
      VEHICLE_FIELDS_RESTRICTED:
        'La interfaz de aprobación requiere todos los campos no financieros de la solicitud.',
      VEHICLE_GARAGE_DENIED:
        'Se requiere un miembro activo con funciones administrativas.',
      VEHICLE_INTERVAL_CONFLICT:
        'El vehículo o el conductor ya están asignados durante este intervalo.',
      VEHICLE_INVALID_COMMAND:
        'Se requieren un origen y una clave estable de solicitud.',
      VEHICLE_INVALID_INPUT:
        'Proporciona la identificación del vehículo, una capacidad positiva y un estado válido.',
      VEHICLE_INVALID_INTERVAL:
        'Proporciona un intervalo temporal ordenado y un número positivo de pasajeros.',
      VEHICLE_INVALID_USAGE:
        'El kilometraje y el combustible deben ser enteros exactos no negativos.',
      VEHICLE_INVALID_VERSION: 'La versión guardada no puede avanzar.',
      VEHICLE_NOT_DISPATCHED:
        'No existe una asignación real de vehículo para esta solicitud.',
      VEHICLE_NOT_FOUND: 'No se ha encontrado el vehículo o el conductor.',
      VEHICLE_NO_AVAILABLE_CAPACITY:
        'Ningún vehículo actual tiene suficiente capacidad durante este intervalo. El envío no realiza una reserva.',
      VEHICLE_OUTSTANDING_USE:
        'Completa el uso real antes de desactivar a este conductor.',
      VEHICLE_PRIVATE_INPUT_REQUIRED:
        'Los datos de ejecución empresarial deben utilizar la interfaz privada.',
      VEHICLE_REQUEST_KEY_REQUIRED:
        'Se requiere una clave estable de solicitud.',
      VEHICLE_REQUEST_REUSED:
        'Esta clave de solicitud está vinculada a otra persona responsable o a otros datos.',
      VEHICLE_SLA_UNSUPPORTED:
        'Esta versión requiere los plazos de aprobación predeterminados en horas laborables.',
      VEHICLE_SOURCE_DENIED:
        'Se requiere una operación de aprobación real autorizada dentro de su transacción.',
      VEHICLE_SOURCE_MISMATCH:
        'El comando no coincide con su origen de aprobación.',
      VEHICLE_SOURCE_UNAVAILABLE:
        'El adaptador del origen de aprobación real no está disponible.',
      VEHICLE_TARGET_MISMATCH:
        'El destino de la acción pertenece a otra solicitud.',
      VEHICLE_TYPE_INACTIVE: 'Elige un tipo de vehículo activo.',
      VEHICLE_UNAVAILABLE: 'Elige un vehículo activo con capacidad suficiente.',
      VEHICLE_USAGE_OWNER: 'Solo el solicitante real puede registrar el uso.',
      VEHICLE_VERSION_CONFLICT: 'Carga la versión actual del vehículo.',
    },
  },
};
