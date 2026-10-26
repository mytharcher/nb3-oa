export default {
  resourceTitle: 'Ámbito de datos predeterminado',
  navigation: { title: 'Ámbito de datos predeterminado' },
  defaultAccess: {
    supportedScope:
      'Solo se muestran los tipos de recurso que admiten ámbitos de datos. Configura aquí el ámbito de registros predeterminado de cada acción.',
    groupFilter: 'Grupo de recursos',
    allGroups: 'Todos los grupos',
    inlineHint:
      'Los cambios sencillos se guardan inmediatamente. Configura y guarda ámbitos concretos en el panel lateral.',
    saved: 'Guardado',
    editScope: 'Editar ámbito',
    back: 'Volver al acceso predeterminado',

    configureResource: 'Configurar recurso',
    configure: 'Configurar',
    chooseResource:
      'Elige un recurso para configurar sus ámbitos de registros predeterminados.',
    configured: 'Configurado',
    noDefault: 'Sin ámbito predeterminado',
    customScope: 'Ámbito específico',

    page: {
      title: 'Ámbito de datos predeterminado',
      description:
        'El ámbito de datos predeterminado amplía el ámbito básico de registros para los usuarios con el permiso de acción correspondiente. No concede permisos de acción ni de campos; también se aplican las reglas de uso compartido y restricción.',
    },
    search: 'Buscar por nombre o clave del recurso',
    create: 'Establecer acceso predeterminado',
    recordAccessHeader: 'Acceso predeterminado a registros',
    allowedActions: 'Acciones permitidas',
    emptyNone:
      'No hay acceso predeterminado configurado. El acceso lo determinan los conjuntos de permisos y las demás reglas.',
    emptySearch:
      'No hay reglas de acceso predeterminado que coincidan con la búsqueda.',
    pagerLabel: 'Reglas del ámbito de datos predeterminado',
    editTitle: 'Editar acceso predeterminado',
    newTitle: 'Establecer acceso predeterminado',
    editorDescription:
      'Define la visibilidad básica de los registros antes de aplicar el uso compartido y las restricciones.',
    resourceHeading: 'Recurso',
    resourceDescription:
      'Elige la colección cuyo acceso básico quieres establecer.',
    accessHeading: 'Acceso por acción',
    accessDescription:
      'Establece el ámbito de registros de forma independiente para cada acción.',
    deleteRule: 'Eliminar regla',
    save: 'Guardar acceso predeterminado',
    confirmDeleteTitle:
      '¿Quitar los valores predeterminados de «{{resource}}»?',
    confirmDeleteBody:
      'Elimina la regla de acceso predeterminado de «{{resource}}». El acceso lo determinarán los conjuntos de permisos y las reglas restantes.',
  },
};
