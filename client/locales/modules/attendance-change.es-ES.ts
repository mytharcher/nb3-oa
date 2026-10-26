export default {
  attendanceChange: {
    authz: { resource: 'Correcciones de fichajes' },
    navigation: 'Correcciones de fichajes',
    new: 'Nueva corrección de fichaje',
    edit: 'Editar corrección de fichaje',
    emptyMissing:
      'No hay fichajes ausentes aptos. Contacta con RR. HH. si los justificantes de asistencia importados son incorrectos.',
    uploadAfterDraft:
      'Guarda el borrador y después abre Editar para subir justificantes.',
    formDescription:
      'Comprueba los justificantes y envía a revisión o guarda un borrador.',
    description:
      'Indica la hora del fichaje ausente y los justificantes para que tu responsable lo revise.',
    date: 'Fecha del fichaje ausente',
    original: 'Fichaje ausente original',
    correctionAt: 'Hora corregida del fichaje',
    proof: 'Declaración justificativa',
    attachments: 'Justificantes adjuntos',
    punchKinds: { in: 'Entrada', out: 'Salida' },
    missing: 'Seleccionar un fichaje ausente',
    policyHint:
      'El fichaje ausente debe estar dentro de los últimos siete días naturales. Las solicitudes pendientes y aprobadas cuentan para el límite mensual.',
    errors: {
      ATTENDANCE_CHANGE_BASELINE_CHANGED:
        'El registro del fichaje ausente ha cambiado. Actualiza y vuelve a seleccionarlo.',
      ATTENDANCE_CHANGE_TOO_OLD:
        'Solo se pueden solicitar fichajes ausentes de los últimos siete días naturales. Contacta con RR. HH. para registros anteriores.',
      ATTENDANCE_CHANGE_INVALID_TIME:
        'La corrección debe corresponder a la fecha del fichaje ausente y no puede ser futura.',
      ATTENDANCE_CHANGE_MONTHLY_LIMIT:
        'Las correcciones pendientes y aprobadas han alcanzado el límite mensual.',
      ATTENDANCE_CHANGE_DUPLICATE:
        'Ya existe una corrección pendiente o aprobada para este fichaje ausente.',
      ATTENDANCE_CHANGE_PROOF_REQUIRED:
        'Proporciona una declaración justificativa o sube justificantes.',
      ATTENDANCE_CHANGE_EMPLOYEE_INACTIVE:
        'El solicitante debe ser un empleado activo. Contacta con RR. HH. para comprobar la ficha.',
      ATTENDANCE_CHANGE_REASON_REQUIRED: 'Indica el motivo de la corrección.',
      ATTENDANCE_CHANGE_SLA_CONFIGURATION_UNSUPPORTED:
        'No se puede enviar la aprobación. Contacta con un administrador para comprobar los plazos de aprobación.',
      ATTENDANCE_CHANGE_FILE_SIZE:
        'Los adjuntos deben tener contenido y ocupar como máximo 5 MB.',
      ATTENDANCE_CHANGE_FILE_TYPE:
        'Utiliza archivos PDF, JPEG, PNG o WebP cuyo contenido coincida con el formato.',
      ATTENDANCE_CHANGE_ATTACHMENT_DENIED:
        'No tienes permiso para ver o subir estos justificantes.',
      ATTENDANCE_CHANGE_ATTACHMENT_INVALID:
        'El enlace del adjunto no es válido. Selecciona justificantes subidos a este borrador.',
      ATTENDANCE_BASELINE_CHANGED:
        'Los justificantes originales de asistencia han cambiado. La aprobación se ha revertido; actualiza para revisarla.',
    },
  },
};
