export default {
  contracts: {
    errors: {
      CONTRACT_SEAL_EVIDENCE_REQUIRED:
        'Se requieren justificantes de sellado efectivamente completado.',
      CONTRACT_SEAL_EVIDENCE_CONFLICT:
        'Este justificante de sellado corresponde a otros datos contractuales.',
      CONTRACT_ACCESS_DENIED:
        'Este contrato está fuera de tu ámbito de acceso.',
      CONTRACT_ACTION_NOT_ALLOWED:
        'Esta acción no está disponible para el contrato.',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        'El importe del contrato no puede ser inferior a la suma de los pagos realizados y reservados.',
      CONTRACT_ATTACHMENT_DENIED:
        'El campo de adjuntos o el registro del contrato están fuera de tu ámbito de acceso.',
      CONTRACT_ATTACHMENT_INVALID:
        'Elige adjuntos válidos de esta solicitud de contrato.',
      CONTRACT_CANDIDATE_REMOVED:
        'Este contrato propuesto sin publicar se ha eliminado. Crea una solicitud nueva.',
      CONTRACT_CATEGORY_INACTIVE: 'Elige un tipo de contrato activo.',
      CONTRACT_CORRUPT_BALANCE:
        'Los totales de pagos del contrato son incoherentes. Contacta con un administrador.',
      CONTRACT_EMPLOYEE_REQUIRED:
        'Se requiere un empleado activo con un departamento principal.',
      CONTRACT_FIELDS_RESTRICTED:
        'Los campos requeridos del contrato están fuera de tu ámbito de acceso.',
      CONTRACT_FILE_SIZE:
        'Elige un archivo de contrato no vacío de hasta 5 MiB.',
      CONTRACT_FILE_TYPE:
        'El texto del contrato debe ser PDF; los justificantes pueden ser PDF, JPEG, PNG o WebP, con contenido acorde al formato.',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        'Esta clave de solicitud ya se ha utilizado con otros datos. Actualiza antes de volver a enviar.',
      CONTRACT_INACTIVE_SOURCE:
        'Elige un contrato de origen aprobado y vigente.',
      CONTRACT_INCOMPLETE_PROPOSAL:
        'Completa el motivo del contrato, las condiciones de pago y la versión inmutable del texto.',
      CONTRACT_INPUT_INVALID:
        'Comprueba los campos de entrada declarados del contrato.',
      CONTRACT_INVALID_AMOUNT:
        'Introduce un importe no negativo en céntimos enteros exactos dentro del intervalo admitido.',
      CONTRACT_INVALID_ID:
        'Se requiere un identificador válido dentro de los límites admitidos.',
      CONTRACT_INVALID_TIME: 'La fecha y hora del contrato no son válidas.',
      CONTRACT_LIMIT_EXCEEDED:
        'Los importes pendientes y pagados superan el límite del contrato.',
      CONTRACT_NOT_CANDIDATE:
        'Solo se puede eliminar el contrato propuesto sin publicar de esta solicitud.',
      CONTRACT_NOT_FOUND: 'No se ha encontrado el contrato de origen.',
      CONTRACT_OUTSTANDING_PAYMENTS:
        'Libera los pagos pendientes antes de terminar el contrato.',
      CONTRACT_REASON_REQUIRED:
        'Introduce un motivo dentro de la longitud admitida.',
      CONTRACT_REBASE_NOT_ALLOWED:
        'Solo el solicitante puede actualizar explícitamente la versión de base de un cambio devuelto.',
      CONTRACT_REQUEST_KEY_REQUIRED:
        'Se requiere una clave estable de solicitud.',
      CONTRACT_RESERVATION_CLOSED: 'La reserva de pago ya se ha cerrado.',
      CONTRACT_RULE_INVALID:
        'La política de aprobación de contratos no existe o no es válida. Contacta con un administrador.',
      CONTRACT_SLA_UNSUPPORTED:
        'El adaptador de aprobación instalado solo admite los plazos configurados de 24/48 horas.',
      CONTRACT_SOURCE_CONFLICT:
        'Esta referencia pertenece a otro contrato de origen.',
      CONTRACT_STORED_ID_INVALID:
        'Un identificador de contrato guardado no es válido. Contacta con un administrador.',
      CONTRACT_SUPPLIER_INVALID:
        'El proveedor debe estar activo y tener su acreditación aprobada. Actualiza su acreditación antes de aprobar.',
      CONTRACT_TARGET_MISMATCH:
        'El destino de aprobación pertenece a otra solicitud de contrato.',
      CONTRACT_TEXT_INVALID:
        'Elige una versión de texto PDF inmutable de esta solicitud.',
      CONTRACT_TEXT_NOT_EDITABLE:
        'Solo se pueden añadir versiones de texto contractual a borradores propios o revisiones devueltas.',
      CONTRACT_TEXT_REQUIRED:
        'Selecciona una versión de texto contractual inmutable válida.',
      CONTRACT_TRANSITION_NOT_ALLOWED:
        'Utiliza la operación específica de contrato con controles de validación.',
      CONTRACT_VERSION_CONFLICT:
        'El contrato aprobado ha cambiado. Devuelve la solicitud, actualiza explícitamente su versión de base y envíala de nuevo a revisión.',
    },
    authz: {
      resource: 'Contratos y modificaciones',
      view: 'Ver solicitudes de contratos',
      submit: 'Crear y editar solicitudes de contratos propias',
      ledger:
        'Leer el registro de contratos aprobados y sus versiones inmutables',
      historicalEntry:
        'Registrar un contrato histórico con constancia jurídica auditada',
    },
  },
};
