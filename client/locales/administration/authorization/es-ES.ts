import optionMessages from './options/es-ES.js';
import type { LocaleResource } from '@nocobase/i18n';

const messages = {
  navigation: {
    authorization: 'Autorización',
    permissionSets: 'Conjuntos de permisos',
    inspector: 'Inspector de permisos',
  },
  feedback: {
    saved: 'Se ha guardado «{{name}}»',
    deleted: 'Se ha eliminado «{{name}}»',
    assigned: 'Se han asignado los permisos de «{{name}}»',
    revoked: 'Se han revocado los permisos de «{{name}}»',
  },
  common: {
    actionsFor: 'Acciones para «{{name}}»',
    clearFilters: 'Borrar filtros',
    all: 'Todas',
    allFields: 'Todos los campos',
    cancel: 'Cancelar',
    close: 'Cerrar',
    delete: 'Eliminar',
    edit: 'Editar',
    key: 'Clave',
    keyHint: 'Identificador estable utilizado por las API.',
    loading: 'Cargando…',
    noFields: 'No hay campos',
    remove: 'Quitar',
    removeNamed: 'Quitar {{label}}',
    resource: 'Recurso',
    retry: 'Reintentar',
    ruleSections: 'Secciones de la regla',
    search: 'Buscar',
    selectNamed: 'Seleccionar {{label}}',
    signedInUsers: 'Todos los usuarios con sesión iniciada',
    type: 'Tipo',
    view: 'Ver',
  },
  page: {
    loadFailed: 'No se ha podido cargar esta página.',
  },
  pagination: {
    navLabel: 'Paginación de {{label}}',
    next: 'Página siguiente',
    page: 'Página {{number}}',
    previous: 'Página anterior',
    range: '{{first}}–{{last}} de {{total}}',
    empty: '0 de 0',
  },
  filters: {
    clear: 'Borrar filtro',
    clearSearch: 'Borrar {{label}}',
  },
  errors: {
    requestFailed: 'La solicitud de autorización ha fallado.',
    lastAssignment:
      'Este conjunto de permisos debe mantener una persona activa asignada. Asígnalo a otra cuenta habilitada antes de quitar esta asignación.',
    protectedSet:
      'La aplicación mantiene este conjunto de permisos y no se puede modificar aquí.',
    subjectNotAllowed:
      'Este conjunto de permisos no admite el tipo de sujeto seleccionado. Elige un tipo permitido por la aplicación.',
    completePermissions: 'Completa todos los permisos antes de guardar.',
    completeRule: 'Completa la regla antes de guardar.',
    selectAnAction: 'Selecciona al menos una acción.',
  },
  marks: {
    labels: {
      all: 'Acceso completo',
      scoped: 'Acceso limitado',
      none: 'Sin acceso',
      bypass: 'Sin restricciones',
    },
    descriptions: {
      all: 'Acceso completo',
      scoped: 'Acceso limitado',
      none: 'Sin acceso',
      bypass: 'Sin restricciones: no se consultan las concesiones',
    },
  },
  filterEditor: {
    logic: 'Lógica del grupo',
    all: 'Todas las condiciones (Y)',
    any: 'Cualquier condición (O)',
    addGroup: 'Añadir grupo',
    removeGroup: 'Quitar grupo',
    valueType: 'Tipo de valor',
    text: 'Texto',
    number: 'Número',
    boolean: 'Booleano',
    unsupported:
      'Esta condición se conserva, pero no se puede editar visualmente.',
    invalid:
      'No se ha encontrado un nodo de filtro editable. Al empezar de nuevo se sustituirá el filtro actual.',
    start: 'Configurar condiciones',
  },
  filterOperators: {
    $includes: 'Contiene',
    $notIncludes: 'No contiene',
    $startsWith: 'Empieza por',
    $endsWith: 'Termina en',
    $empty: 'Está vacío',
    $notEmpty: 'No está vacío',
    $isTruly: 'Es verdadero',
    $isFalsy: 'Es falso',

    $eq: 'Es igual a',
    $ne: 'Es distinto de',
    $in: 'Está en',
    $notIn: 'No está en',
    $gt: 'Mayor que',
    $gte: 'Como mínimo',
    $lt: 'Menor que',
    $lte: 'Como máximo',
  },
  labels: {
    allRecords: 'Todos los registros',
    selectedRecords: '{{count}} registros seleccionados',
    unknownScope: 'Ámbito desconocido',
    actionScope: '{{action}}: {{scope}}',
  },
  subjects: {
    matchAny:
      'Se aplica cuando coincide cualquiera de los sujetos seleccionados.',
    search: 'Buscar sujetos',
    empty: 'No hay sujetos coincidentes',
    previous: 'Anterior',
    next: 'Siguiente',
    selected: 'Sujetos seleccionados · {{count}}',
    unresolved: '{{id}} (sin resolver)',
    none: 'No hay sujetos seleccionados',
  },
  editors: {
    resourceGroup: 'Grupo de recursos',
    actions: 'Acciones',
    addCondition: 'Añadir condición',
    assignments: 'Asignaciones',
    assignmentsSelected: {
      one: '{{count}} asignación seleccionada',
      other: '{{count}} asignaciones seleccionadas',
    },
    audienceHint:
      'Se aplica a todos los usuarios con una sesión válida iniciada.',
    filterConditions: 'Condiciones del filtro',
    records: 'Registros',
    recordsSelected: {
      one: '{{count}} registro seleccionado',
      other: '{{count}} registros seleccionados',
    },
    recordAccessPolicy: 'Política de acceso a registros',
    recordScope: 'Ámbito de registros',
    resource: 'Recurso',
    resourceType: 'Tipo de recurso',
    searchPeople: 'Buscar personas',
    searchPeoplePlaceholder: 'Buscar nombre, usuario o correo',
    searchRecords: 'Buscar registros',
    selectUser: 'Seleccionar un usuario',
    specificRecordIds: 'Identificadores de registros concretos',
    specificUser: 'Usuario concreto',
    user: 'Usuario',
    who: 'Quién',
  },
  permissionWorkspace: {
    businessModules: 'Módulos empresariales',
    allModules: 'Todas',
    otherModules: 'Otros',
    clearFilters: 'Borrar filtros',
    noModuleMatches: 'No hay permisos coincidentes en este módulo',
    moduleCount: '{{module}}: {{configured}} configurados / {{total}} recursos',

    pageAccessHint:
      'El acceso a páginas controla la entrada. Los permisos empresariales controlan las operaciones con datos.',
    specifyScope: 'Especificar ámbito: {{scope}}',
    inheritScope:
      'Si no se especifica, siguen aplicándose los ámbitos predeterminados y las reglas de uso compartido y de restricción configurados.',
    configurePermission: 'Configurar permiso',
    noOperationGrant:
      'Este conjunto de permisos no concede esta operación. Elige Configurar permiso para establecer su ámbito de datos.',
    features: 'Permisos de funciones',
    dataScope: 'Ámbito de datos',
    dataScopeHelp:
      'Filtra los permisos de este conjunto, incluidos los registros compartidos. Sin restricción no añade ningún filtro ni concede acceso a registros.',
    appliesTo: 'Se aplica a',
    moduleGranted: 'Acceso completo',
    modulePartial: 'Acceso limitado',
    moduleNotGranted: 'Sin acceso',

    selectAll: 'Seleccionar todo',
    selectFiltered: 'Seleccionar recursos coincidentes',
    selectGroup: 'Seleccionar todo en {{group}}',

    expandSets: 'Expandir conjuntos de permisos',
    collapseSets: 'Contraer conjuntos de permisos',
    userAssignments: 'Personas asignadas',
    chooseSet: 'Elige un conjunto de permisos o crea uno.',
    clickScope: 'Pulsa un icono de ámbito para cambiar el acceso.',
    mode: {
      none: 'Sin acceso',
      all: 'Acceso completo',
      custom: 'Ámbito personalizado',
    },
    unavailableSet: 'Este conjunto de permisos no existe o no se puede editar.',
    description:
      'Configura los recursos de este conjunto de permisos. Los cambios se aplican al guardar.',
    sections: 'Secciones del conjunto de permisos',
    permissions: 'Permisos',
    details: 'Información básica',
    unsaved: 'Cambios sin guardar',
    showMore: 'Mostrar más',
    development: {
      pages:
        'No se han definido páginas que requieran autorización. Pide a la IA que añada permisos de acceso a tus páginas empresariales y configúralos aquí.',
      business:
        'No se han definido permisos empresariales. Pide a la IA que diseñe operaciones, campos y ámbitos de registros para tu empresa y configúralos aquí.',
    },
    configuredOnly: 'Solo recursos configurados',
    configured: 'Configurados en este conjunto',
    backResources: 'Volver a los recursos',
    discardTitle: '¿Descartar los cambios sin guardar?',
    discard: 'Descartar cambios',
    discardBody: 'Los cambios de permisos no se han guardado.',
    configureScope: 'Configurar ámbito de registros',
  },
  databasePolicy: {
    addCondition: 'Añadir condición',
    filterField: 'Campo del filtro',
    filterOperator: 'Operador del filtro',
    filterValue: 'Valor del filtro',
    removeCondition: 'Quitar condición',
    conditionRequired: 'Añade al menos una condición.',
  },
  inspector: {
    summary: {
      all: 'Esta operación está permitida.',
      scoped:
        'Esta operación solo está permitida dentro de los límites de registros y campos aplicables.',
      none: 'Esta operación no está permitida. Conceder acceso a registros no concede por sí solo la operación.',
      error:
        'No se ha podido completar la comprobación. No se trata de una denegación de permisos.',
      context: 'Selecciona un usuario concreto para evaluar este ámbito.',
    },
    dataAccess: 'Datos accesibles',
    subjectHint: '«Yo» se refiere a la persona cuyos permisos se inspeccionan.',
    scopeAndFields: 'Ver condiciones y campos efectivos',
    technicalHint:
      'Resultado de autorización sin procesar para el diagnóstico, incluidas las comprobaciones subyacentes de páginas y tablas.',
    selectedRecords: '{{count}} registros seleccionados',
    databaseActions: {
      read: 'Leer',
      create: 'Crear',
      update: 'Actualizar',
      delete: 'Eliminar',
    },

    subjectType: 'Tipo de sujeto',
    subject: 'Sujeto',
    selectSubject: 'Seleccionar un sujeto',
    searchSubjects: 'Buscar sujetos',
    inheritsFrom: 'Hereda de:',
    grantedVia: 'a través de {{label}}',
    grantedDirectly: 'asignado directamente',
    inheritedSubject: '{{name}} ({{type}})',
    listSeparator: ', ',
    noRegisteredResources: 'Aún no hay recursos registrados para este tipo.',
    status: {
      context: 'Se requiere contexto de usuario',
      all: 'Permitido',
      scoped: 'Permitido con límites',
      none: 'No permitido',
      error: 'La inspección ha fallado',
    },
    reasonCodes: {
      NO_MATCHING_GRANT: 'Ningún permiso concede esta operación',
      RESOURCE_ACTION_NOT_SUPPORTED: 'Este recurso no ofrece esta operación',
      USER_CONTEXT_REQUIRED:
        'Este ámbito depende de un usuario concreto y no se puede resolver solo a partir de este sujeto.',
      GRANT_MATCHED: 'Esta operación está concedida',
      SELECTION_EXPANDED: 'Amplía los registros accesibles',
      SELECTION_RESTRICTED: 'Restringe los registros accesibles',
      NO_OBJECT_PERMISSION: 'Esta operación no está concedida',
      NO_RECORD_ACCESS: 'No hay un ámbito de registros accesible',
      EMPTY_RECORD_ACCESS: 'El ámbito no coincide con ningún registro',
      UNRESTRICTED_ACCESS: 'Acceso sin restricciones',
    },
    inputFields: 'Campos editables',
    outputFields: 'Campos devueltos',
    allFields: 'Todos los campos',

    refresh: 'Actualizar',
    failed: 'La inspección ha fallado',
    noResources: 'No hay recursos coincidentes',
    recordScope: 'Ámbito de registros efectivo',
    fields: 'Campos permitidos',
    fieldSearch: 'Buscar campos',
    technicalDetails: 'Detalles técnicos',
    allConditions: 'Cumplir todas las condiciones',
    anyCondition: 'Cumplir cualquier condición',

    page: {
      title: 'Inspector de permisos',
      description:
        'Consulta el acceso concedido a un sujeto de autorización e inspecciona los motivos.',
    },
    person: 'Persona',
    selectPerson: 'Seleccionar una persona',
    searchPeople: 'Buscar personas',
    searchPeoplePlaceholder: 'Buscar nombre, usuario o correo',
    action: 'Acción',
    selectAction: 'Seleccionar una acción',
    inspect: 'Inspeccionar',
    inspecting: 'Inspeccionando…',
    empty:
      'Selecciona un sujeto de autorización para ver sus permisos sobre recursos.',
    decision: 'Decisión',
    effects: {
      permit: 'Permitido',
      deny: 'Denegado',
      conditional: 'Permitido con condiciones',
    },
    reasons: 'Motivos',
    noReasons: 'La decisión no incluye motivos.',
    reasonFrom: 'De {{plugin}}',
    reasonFromCore: 'Del núcleo de autorización',
    conditions: 'Condiciones',
    conditionsHint:
      'La decisión solo se aplica a lo seleccionado por estas condiciones, que se muestran tal como las devolvió el núcleo.',
  },
  permissionSets: {
    builtIn: { root: 'Administrador del sistema', member: 'Miembro' },
    page: {
      title: 'Conjuntos de permisos',
      description:
        'Los conjuntos de permisos conceden acceso: agrupa los recursos y las acciones que las personas necesitan y asígnales el conjunto.',
    },
    unknownPage: 'Página desconocida',
    assignmentCount: {
      one: '{{count}} asignación',
      other: '{{count}} asignaciones',
    },
    list: {
      search: 'Buscar por nombre o clave del conjunto',
      create: 'Nuevo conjunto de permisos',
      nameHeader: 'Conjunto de permisos',
      system: 'Sistema',
      custom: 'Personalizado',
      emptyNone:
        'Aún no hay conjuntos de permisos. Crea uno para agrupar los recursos y las acciones necesarios.',
      emptySearch: 'No hay conjuntos de permisos coincidentes con la búsqueda.',
      pagerLabel: 'Conjuntos de permisos',
    },
    detail: {
      untitled: 'Nuevo conjunto de permisos',
      unrestrictedTitle:
        'Este conjunto de permisos concede acceso sin restricciones.',
      unrestrictedBody:
        'Este conjunto concede acceso sin restricciones, independientemente de otros conjuntos y de las reglas de uso compartido o restricción. No es necesario configurar permisos individuales. Gestiona las asignaciones en Personas asignadas.',
      confirmDeleteTitle: '¿Eliminar el conjunto de permisos «{{title}}»?',
      confirmDeleteBody:
        'Elimina «{{title}}» y sus asignaciones. Los demás conjuntos de permisos y reglas seguirán vigentes.',
      confirmDelete: 'Eliminar',
    },
    assignments: {
      search: 'Buscar asignaciones',
      searchPlaceholder: 'Buscar por nombre o identificador del sujeto',
      kindLabel: 'Tipo de asignación',
      kindAll: 'Todas las asignaciones',
      kindUsers: 'Usuarios',
      kindAudiences: 'Destinatarios',
      revokeSelected: 'Revocar seleccionadas ({{count}})',
      add: 'Añadir asignaciones',
      assignedTo: 'Asignado a',
      subjectType: 'Tipo de sujeto',
      selectAllVisible: 'Seleccionar todas las asignaciones visibles',
      audience: 'Destinatarios',
      user: 'Usuario',
      revoke: 'Revocar',
      emptyNone:
        'Aún no hay asignaciones. Añade una para conceder este conjunto de permisos.',
      emptyFiltered: 'No hay asignaciones que coincidan con estos filtros.',
      pagerLabel: 'Asignaciones',
      confirmRevokeTitleOne: '¿Revocar la asignación de «{{name}}»?',
      confirmRevokeTitleMany: '¿Revocar las asignaciones de «{{name}}»?',
      confirmRevokeBody:
        '{{label}} dejará de tener este conjunto de permisos. Las demás asignaciones seguirán vigentes y este conjunto podrá asignarse de nuevo.',
      confirmRevoke: 'Revocar',
      pickerDescription:
        'Selecciona los sujetos que recibirán este conjunto de permisos.',
      audienceDescription:
        'Todas las personas con una sesión válida. Se gestiona por separado de los usuarios individuales.',
      usersHeading: 'Usuarios',
      usersHint: 'Los usuarios ya asignados están ocultos.',
      selectedCount: '{{count}} seleccionadas',
      selectAllResults: 'Seleccionar todos los resultados',
      userCount: '{{count}} usuarios',
      noAvailableUsers:
        'No hay usuarios disponibles que coincidan con la búsqueda.',
      assigning: 'Asignando…',
    },
    editor: {
      nameRequired: 'Introduce el nombre del conjunto de permisos.',
      keyRequired: 'Introduce la clave del conjunto de permisos.',
      resourceRequired: 'Elige un recurso para este permiso.',
      actionsRequired: 'Elige al menos una acción para este recurso.',
      editTitle: 'Editar conjunto de permisos',
      newTitle: 'Nuevo conjunto de permisos',
      description: 'Agrupa el acceso en una asignación reutilizable.',
      name: 'Nombre',
      permissions: 'Permisos',
      permissionsHint:
        'Elige los recursos y las acciones que concede este conjunto.',
      addPermission: 'Añadir permiso',
      searchResources: 'Buscar recursos o acciones',
      resourceTypeLabel: 'Tipo de recurso del permiso',
      allResourceTypes: 'Todos los tipos de recurso',
      visibleCount: '{{visible}} de {{total}} recursos',
      noActions: 'No hay acciones',
      unknownPageNotice:
        'Ninguna ruta declara ya esta página, por lo que este permiso no concede acceso. La página se ha renombrado o eliminado. Quita el permiso o añade uno para la página que la sustituye.',
      emptyFiltered: 'No hay permisos que coincidan con estos filtros.',
      addFirst: 'Añadir el primer permiso',
      addFirstHint: 'Selecciona recursos por tipo y configura sus acciones.',
      saving: 'Guardando…',
      save: 'Guardar conjunto de permisos',
      confirmRemoveTitle: '¿Quitar este permiso?',
      confirmRemoveBody:
        'Se quitarán {{resource}} y todas sus acciones configuradas de este conjunto de permisos. No se podrá deshacer una vez guardado el conjunto.',
      confirmRemove: 'Quitar permiso',
      thisResource: 'Este recurso',
    },
    picker: {
      title: 'Añadir permisos',
      description:
        'Selecciona recursos y configura su acceso desde un mismo espacio.',
      resourceTypes: 'Tipos de recurso',
      resources: 'Recursos',
      selectResourceHint: 'Selecciona un recurso para configurarlo.',
      searchResources: 'Buscar recursos',
      added: 'Añadido',
      noResources: 'No hay recursos que coincidan con la búsqueda.',
      emptyTitle: 'Selecciona un recurso para configurar',
      emptyHint:
        'Aquí aparecerán sus acciones y la configuración de acceso específica del recurso.',
      readyCount: {
        one: '{{count}} recurso listo para añadir',
        other: '{{count}} recursos listos para añadir',
      },
      incomplete: ' · Selecciona al menos una acción para cada recurso',
      add: 'Añadir permisos',
    },
  },
  ruleWorkspace: {
    unset: 'Sin establecer',
    unsetHint:
      'No se ha definido un ámbito de registros adicional para esta acción.',
    clearDefaults: 'Quitar configuración predeterminada',
    setDefault: 'Establecer ámbito predeterminado',
  },
};

const enUS: typeof messages & typeof optionMessages = {
  ...messages,
  ...optionMessages,
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type AuthorizationResource = LocaleResource<typeof enUS>;

export default enUS;
