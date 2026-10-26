export default {
  jobGrades: {
    authz: {
      resource: 'Tablas de niveles salariales',
      view: 'Ver historial de publicaciones',
      viewSalary: 'Leer intervalos salariales',
      manage: 'Publicar tabla de niveles salariales',
    },

    title: 'Tablas de niveles salariales',
    description:
      'Consulta el historial de publicaciones inmutable y publica intervalos salariales completos.',
    publish: 'Publicar nueva versión',
    publishing: 'Publicando…',
    search: 'Buscar número exacto de versión',
    empty: 'No hay tabla salarial publicada',
    emptyDescription:
      'Publica la primera tabla completa de niveles salariales.',
    emptyReadonly:
      'Pide a RR. HH. que publique la primera tabla de niveles salariales.',
    noMatches: 'No hay versiones coincidentes',
    noMatchesDescription:
      'Borra la búsqueda de versión para ver el historial de publicaciones.',
    replacement:
      'La publicación sustituye toda la tabla actual. Los documentos enviados anteriormente conservan su versión.',
    privateDenied:
      'No puedes leer los intervalos salariales. Pide acceso a un administrador.',
    publishDenied:
      'No puedes publicar tablas de niveles salariales. Pide acceso a un administrador.',
    unknown:
      'El resultado de publicación está sin confirmar. Reintenta la publicación original.',
    conflict:
      'La tabla actual ha cambiado. Carga la última tabla antes de publicar.',
    inactive: 'Este nivel no está disponible. Quítalo o elige un nivel activo.',
    success: 'Se ha publicado la tabla salarial «Versión {{version}}»',
    version: 'Versión {{version}}',
    versionColumn: 'Versión',
    publisher: 'Publicado por',
    publishedAt: 'Fecha de publicación',
    refresh: 'Actualizar',
    retry: 'Reintentar',
    retryPublication: 'Reintentar publicación original',
    clear: 'Borrar filtros',
    loading: 'Cargando tablas de niveles salariales',
    view: 'Ver versión',
    rowActions: 'Acciones para la versión {{version}}',
    grade: 'Nivel',
    gradeCode: 'Código de nivel',
    gradeTitle: 'Nombre del nivel',
    rank: 'Orden fijado',
    minimum: 'Mínimo',
    maximum: 'Máximo',
    reason: 'Motivo de publicación',
    addGrade: 'Añadir nivel',
    remove: 'Quitar nivel {{index}}',
    selectGrade: 'Seleccionar un nivel activo',
    removeDescription:
      'Quitar una fila solo modifica la nueva tabla propuesta. Las versiones históricas se conservan.',
    cancel: 'Cancelar',
    loadLatest: 'Cargar última tabla',
    currentVersion: 'Versión de origen: {{version}}',
    notFound:
      'Esta tabla de niveles salariales no está disponible. Vuelve al historial de publicaciones.',
    failed:
      'No se han podido cargar las tablas de niveles salariales. Vuelve a intentarlo.',
    writeFailed:
      'Se ha rechazado la publicación. Comprueba los campos y vuelve a intentarlo.',
    storageFailure:
      'La publicación original no se puede guardar de forma segura en esta pestaña. La publicación está bloqueada; comprueba el almacenamiento del navegador y vuelve a cargar.',
    unsavedTitle: '¿Descartar los cambios de la tabla salarial?',
    unsavedDescription: 'Se perderán los cambios sin publicar.',
    discard: 'Descartar cambios',
    stay: 'Seguir editando',
    replaceTitle: '¿Sustituir la tabla propuesta?',
    replaceDescription:
      'Al cargar la última tabla se descarta esta propuesta y se empieza con la tabla actual completa.',
    confirmReplace: 'Sustituir y cargar la última',
    noGrades:
      'No hay niveles activos disponibles. Pide a un administrador de la organización que configure los niveles.',
    reasonHint:
      'Explica la publicación de la tabla completa (hasta 2000 caracteres).',
    immutable:
      'Esta versión publicada es inmutable. Los identificadores de sus niveles e intervalos están fijados.',
    validation: {
      required: 'Este campo es obligatorio.',
      amount:
        'Introduce un importe no negativo con un máximo de dos decimales dentro del intervalo admitido.',
      range: 'El máximo debe ser mayor o igual que el mínimo.',
      duplicate: 'Cada nivel solo puede aparecer una vez.',
      inactive:
        'Este nivel no está disponible. Quítalo o elige un nivel activo.',
      nonempty: 'Incluye al menos un nivel activo.',
      reasonLength: 'Utiliza como máximo 2000 caracteres.',
      server: 'Comprueba este campo y vuelve a intentarlo.',
    },
  },
};
