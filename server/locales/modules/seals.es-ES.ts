export default {
  seals: {
    authz: {
      requests: 'Solicitudes de sellos',
      view: 'Ver',
      create: 'Crear',
      edit: 'Editar',
      operate: 'Operar',
      actualReturn: 'Devolución física excepcional',
      ledger: 'Registro de sellos',
      instances: 'Ejemplares de sellos',
      manage: 'Gestionar datos de sellos',
      owned: 'Registros propios',
      readable: 'Registros propios y de participación',
    },
    errors: {
      REVIEWER_REQUIRED:
        'El revisor asignado debe conservar la función activa requerida.',
      APPROVAL_REFUSED:
        'Las reglas actuales de aprobación o gestión rechazan esta operación.',
      ACCESS_DENIED: 'No tienes acceso a estos registros o campos de sellos.',
      ACTIVE_EMPLOYEE_REQUIRED: 'Se requiere una cuenta de empleado activa.',
      ADMIN_KEEPER_REQUIRED:
        'Las devoluciones físicas excepcionales requieren las funciones de administrador y responsable del sello.',
      ADMIN_REQUIRED: 'Se requiere una función administrativa activa.',
      BODY_TOO_LARGE: 'El adjunto supera el límite de tamaño de subida.',
      COMMAND_CONFLICT:
        'Esta clave de solicitud ya se ha utilizado para otro contenido.',
      CONTRACT_ACCESS_DENIED: 'No puedes ver el contrato vinculado.',
      CONTRACT_NOT_EFFECTIVE: 'El contrato vinculado no está vigente.',
      CONTRACT_VERSION_CONFLICT:
        'El contrato vinculado ha cambiado después de la aprobación.',
      DEPARTMENT_REQUIRED:
        'El solicitante debe tener un departamento principal.',
      INVALID_COMMAND: 'Se requiere una clave de solicitud válida.',
      INVALID_COPIES:
        'El número real de copias selladas debe ser positivo y no superar la cantidad aprobada.',
      INVALID_FILE:
        'El adjunto no existe, no es seguro o no pertenece a esta solicitud.',
      INVALID_INPUT: 'Los campos de la solicitud de sello no son válidos.',
      INVALID_OUTPUT: 'El resultado de la gestión física no es válido.',
      INVALID_RETURN:
        'La devolución física requiere una salida externa cerrada administrativamente y un motivo.',
      INVALID_SEAL_TYPE:
        'El tipo de sello está inactivo o no coincide con la solicitud aprobada.',
      INVALID_TIME:
        'Las horas de gestión física o el plazo de devolución no son válidos.',
      KEEPER_REQUIRED:
        'Se requiere una función activa de responsable del sello.',
      OUTSTANDING_CUSTODY:
        'Este sello tiene una entrega en custodia pendiente de devolución.',
      PHYSICAL_ALREADY_REGISTERED:
        'El uso físico o la devolución ya se han registrado.',
      REQUEST_NOT_FOUND: 'La solicitud no está disponible.',
      SEAL_EVIDENCE_REQUIRED:
        'Se requieren justificantes inmutables del sellado real.',
      SEAL_NOT_FOUND: 'El sello no está disponible.',
      SEAL_UNAVAILABLE: 'Este sello está actualmente prestado.',
      SLA_UNSUPPORTED:
        'La programación de recordatorios configurada no es compatible.',
      TARGET_MISMATCH: 'La tarea ofrecida no pertenece a esta solicitud.',
      VERSION_CONFLICT:
        'El registro ha cambiado. Actualiza antes de volver a intentarlo.',
    },
    schedule: {
      title: 'Recordatorios de devolución de sellos',
      description:
        'Envía recordatorios diarios de sellos en custodia pendientes de devolución en la zona horaria de la empresa.',
    },
    notifications: {
      overdue: 'Ha vencido el plazo de devolución de un sello prestado.',
    },
  },
};
