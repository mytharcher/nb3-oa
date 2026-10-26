export default {
  knowledge: {
    notifications: {
      title: 'Documento normativo actualizado',
      body: 'Un documento normativo vinculado tiene una versión nueva. Ábrelo para leer la versión actual.',
    },
    authz: {
      knowledgeDocuments: 'Documentos de conocimiento',
      knowledgeFolders: 'Carpetas de conocimiento',
      knowledgeVersions: 'Versiones de documentos',
      view: 'Ver',
      manage: 'Gestionar',
    },
    errors: {
      ACCESS_DENIED: 'No tienes acceso a este documento o esta operación.',
      DOCUMENT_NOT_FOUND: 'El documento no existe o no es accesible.',
      FOLDER_NOT_FOUND: 'La carpeta no existe o no es accesible.',
      INVALID_INPUT: 'Los datos del documento no son válidos.',
      INVALID_CONTENT: 'El contenido del documento no es válido.',
      INVALID_AUDIENCE:
        'Los destinatarios incluyen un departamento o un rol no disponibles.',
      INVALID_FILE: 'El archivo no es válido o no está disponible.',
      VERSION_CONFLICT:
        'El documento se ha actualizado. Actualiza y vuelve a intentarlo.',
      COMMAND_CONFLICT:
        'La clave de solicitud ya se ha utilizado para otro contenido.',
      FOLDER_CYCLE: 'Una carpeta no se puede mover dentro de sí misma.',
      TREE_UNINITIALIZED: 'El directorio de documentos no se ha inicializado.',
      BODY_TOO_LARGE: 'El archivo subido supera el tamaño permitido.',
    },
  },
};
