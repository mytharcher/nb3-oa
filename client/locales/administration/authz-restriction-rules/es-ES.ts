export default {
  resourceTitle: 'Reglas de restricción',
  navigation: { title: 'Reglas de restricción' },
  restrictionRules: {
    noResources:
      'No se han definido recursos empresariales que admitan ámbitos de registros. Pide a la IA que defina los permisos empresariales y los ámbitos de registros antes de configurar reglas aquí.',
    page: {
      title: 'Reglas de restricción',
      description:
        'Las reglas de restricción reducen el acceso y limitan los registros a los que llegan los usuarios seleccionados, sin conceder acceso por sí mismas.',
    },
    notice:
      'Las reglas de restricción solo reducen el acceso existente. Nunca conceden permisos por sí mismas.',
    search: 'Buscar por nombre, clave o recurso de la regla',
    create: 'Nueva regla de restricción',
    ruleHeader: 'Regla',
    appliesToHeader: 'Se aplica a',
    restrictedActionsHeader: 'Acciones restringidas',
    allowedScopeHeader: 'Ámbito permitido',
    emptyNone:
      'Aún no hay reglas de restricción. Crea una para limitar el acceso de los usuarios seleccionados.',
    emptySearch: 'No hay reglas de restricción coincidentes con la búsqueda.',
    pagerLabel: 'Reglas de restricción',
    editTitle: 'Editar regla de restricción',
    newTitle: 'Nueva regla de restricción',
    editorDescription:
      'Limita el ámbito de registros efectivo de los destinatarios.',
    ruleHeading: 'Información básica',
    ruleDescription:
      'Asigna un nombre a la regla y elige el recurso que se restringirá.',
    ruleName: 'Nombre de la regla',
    assignmentsHeading: 'Se aplica a',
    assignmentsDescription: 'Elige a quién se aplica esta restricción.',
    reason: 'Descripción',
    accessHeading: 'Acciones y ámbito de registros',
    accessDescription:
      'Establece el ámbito máximo de registros de forma independiente para cada acción.',
    deleteRule: 'Eliminar regla',
    save: 'Guardar regla de restricción',
    confirmDeleteTitle: '¿Eliminar la regla «{{title}}»?',
    confirmDeleteBody:
      'Elimina la regla de restricción «{{title}}». El acceso lo determinarán los conjuntos de permisos y las reglas restantes.',
  },
};
