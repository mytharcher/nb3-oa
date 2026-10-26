export default {
  announcements: {
    authz: {
      title: 'Anuncios',
      owned: 'Publicados por mí',
      readable: 'Mis publicaciones y avisos recibidos',
      view: 'Leer anuncios',
      create: 'Crear borradores de anuncios',
      edit: 'Editar borradores propios',
      publish: 'Publicar anuncios propios',
      revoke: 'Retirar anuncios propios',
      remind: 'Recordar a destinatarios sin confirmar',
      receipts: 'Consultar destinatarios de anuncios propios',
      confirm: 'Confirmar recepción propia',
    },
    notifications: {
      title: 'Anuncio de empresa',
      body: 'Hay un anuncio disponible. Abre la aplicación para leerlo.',
    },
    errors: {
      ACCESS_DENIED: 'No tienes acceso a este anuncio o esta operación.',
      NOT_FOUND: 'No se ha encontrado el anuncio.',
      INVALID_INPUT:
        'Los datos del anuncio o su período de validez no son válidos.',
      INVALID_AUDIENCE:
        'Los destinatarios incluyen un departamento o una función no disponibles.',
      EMPTY_AUDIENCE: 'El anuncio no tiene destinatarios activos.',
      INVALID_ATTACHMENT: 'El adjunto no es válido o no está disponible.',
      INVALID_STATE: 'Esta operación no está disponible en el estado actual.',
      VERSION_CONFLICT:
        'El anuncio ha cambiado. Vuelve a cargarlo e inténtalo de nuevo.',
      COMMAND_CONFLICT:
        'Este identificador de solicitud ya se ha utilizado con datos diferentes.',
      KNOWLEDGE_UNAVAILABLE:
        'El documento vinculado no está disponible o no se puede leer.',
    },
  },
};
