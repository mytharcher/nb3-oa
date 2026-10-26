export default {
  general: {
    authz: {
      resource: 'Solicitudes generales',
      submit: 'Enviar solicitud general propia',
      delegate: 'Enviar solicitud general para un empleado',
      view: 'Leer solicitudes generales',
    },
    navigation: 'Solicitudes generales',
    new: 'Nueva solicitud general',
    edit: 'Editar solicitud general',
    title: 'Título',
    body: 'Detalles de la solicitud',
    extraApprovers: 'Aprobadores adicionales',
    extraStage: 'Revisión adicional',
    extraHint:
      'Elige entre una y tres personas. Revisarán en este orden después de tu responsable.',
    addApprover: 'Añadir aprobador',
    removeApprover: 'Quitar aprobador {{number}}',
    approver: 'Aprobador adicional {{number}}',
    formDescription: 'Describe un asunto que no cubra otro tipo de solicitud.',
    approversInvalid:
      'Elige entre una y tres personas activas distintas del solicitante.',
    invalid:
      'Introduce un título y los detalles de la solicitud dentro de la longitud permitida.',
    inactive: 'El solicitante debe ser un empleado activo.',
    configuration:
      'No se puede enviar la aprobación. Contacta con un administrador para comprobar los plazos de aprobación.',
    uncertainCreate:
      'No se conoce con certeza el resultado del guardado. Cierra y consulta Mis solicitudes antes de crear otro borrador.',
    attachmentInvalid: 'Algunos adjuntos no pertenecen a esta solicitud.',
    attachmentDenied: 'No tienes acceso a estos adjuntos.',
    attachmentType:
      'Utiliza un archivo PDF, JPEG, PNG o WebP cuyo contenido coincida con su formato.',
    attachmentSize:
      'Los adjuntos deben tener contenido y ocupar como máximo 5 MB.',
  },
};
