export default {
  access: {
    guide: {
      title: 'Cómo funcionan los roles y permisos',
      roles:
        'Configura aquí operaciones por departamento, puesto o responsabilidad. Los miembros reciben estos permisos junto con sus asignaciones directas.',
      setsTitle: 'Conjuntos de permisos',
      sets: 'Las concesiones guardadas de los roles, disponibles para inspección y reutilización. Utiliza la página del rol para los cambios diarios.',
      defaultTitle: 'Acceso predeterminado a registros',
      default:
        'Proporciona el ámbito básico cuando una operación no tiene uno específico. No concede la propia operación.',
      sharingTitle: 'Reglas de uso compartido',
      sharing:
        'Amplía los registros disponibles para quienes ya tienen el permiso de operación.',
      restrictionTitle: 'Reglas de restricción',
      restriction: 'Limita aún más los registros autorizados accesibles.',
      inspectTitle: 'Inspector de permisos',
      inspect:
        'Comprueba las concesiones efectivas y sus orígenes cuando una página o registro no estén disponibles.',
    },
    permissionColumn: 'Permiso',
    personalGranted: 'Concedido personalmente',
    personalTarget: 'Elegir destino de concesión personal',
    rowSaving: 'Guardando…',
    rowSaved: 'Guardado',
    rowFailed:
      'El cambio no se ha guardado. Se ha restaurado la configuración actual; revísala y reintenta.',
    rowUncertain:
      'No se ha podido confirmar el guardado. Actualiza antes de realizar más cambios.',
    inlinePermissionsHelp:
      'Los cambios se guardan inmediatamente. Las concesiones personales se añaden al acceso heredado; desactivarlas no elimina permisos heredados.',
    configuredOnly: 'Solo permisos configurados',

    personalGrantEnabled: 'Conceder esta operación personalmente',
    systemScope: 'Utilizar reglas del sistema',
    systemScopeHelp:
      'Los ámbitos sin especificar siguen el acceso predeterminado y las reglas de uso compartido. Esto no significa todos los registros.',
    grantSources: 'Concedido por',
    scopeForAction: '{{action}}: ámbito {{scope}}',
    personalGrantAction: 'Conceder personalmente «{{action}}»',
    personalGrantScope:
      'Conceder personalmente «{{action}}». Ámbito de datos: {{scope}}',
    personalGrantOff:
      'Sin concesión personal; los permisos heredados permanecen.',
    personalGrantPending: 'Cambio sin guardar. Se aplica después de guardar.',
    editPersonalCard: 'Editar permisos personales de {{name}}',
    userPermissions: 'Permisos',
    inheritedPermissions: 'Permisos heredados',
    inheritedUnavailable: 'No tienes acceso a los permisos heredados.',
    personalOnly: 'Solo excepciones personales',
    notGranted: 'Sin conceder',
    notSet: 'Sin establecer',
    adjustPersonalPermissions: 'Ajustar permisos personales',
    unifiedPermissionsHelp:
      'Permisos configurados por origen. Los cambios personales no eliminan concesiones heredadas; el acceso real también sigue las restricciones aplicables.',
    sourceGroups: {
      baseline: 'Acceso básico para todos',
      duties: 'Roles funcionales',
      organization: 'Relaciones de organización',
      direct: 'Concesiones personales',
      system: 'Administrador del sistema',
    },
    noPersonalExceptions: 'Sin excepciones personales',
    membershipChanged:
      'La pertenencia ha cambiado en otra operación. Se ha recargado el estado actual; confirma los cambios restantes.',
    username: 'Nombre de usuario',
    personalExceptions: 'Excepciones personales',
    adjustExceptions: 'Ajustar excepciones personales',
    exceptionsHelp:
      'Solo se modifican los permisos concedidos directamente a esta persona. Los de roles u organización pueden seguir aplicándose al quitarlos.',
    editDenied:
      'No puedes editar esta configuración. Se muestra la vista de solo lectura.',
    permissionSources: 'Orígenes de permisos',
    frozenConfiguration:
      'Esta cuenta está suspendida. La configuración de autorización se conserva y se aplica según las reglas vigentes al activarla.',
    frozenRoles:
      'Esta cuenta está suspendida. Actívala antes de añadir roles funcionales; los existentes se pueden quitar.',
    roleInactive: 'Inactivo',
    roleAdditionBlocked:
      'La cuenta está suspendida o un rol seleccionado está inactivo o no disponible. Cancela estas incorporaciones o recarga el estado antes de confirmar.',
    membershipUnverified:
      'El resultado no está verificado. Recarga las pertenencias antes de continuar; no repitas el envío.',
    dutyRolesHelp:
      'Aquí aparecen los roles funcionales asignados directamente a esta persona.',
    noPrimaryDepartment: 'Sin departamento principal actual',
    primaryDepartment: 'Departamento principal',
    departmentPath: 'Ruta del departamento',
    organizationHelp:
      'Los administradores de la organización mantienen las pertenencias.',
    roleFilterInvalid:
      'Este rol funcional no está disponible. Se ha borrado el filtro de rol.',
    roleFilterTooLarge:
      'Este rol tiene más de 500 miembros. No se admite filtrar por él; borra el filtro de rol.',
    organizationState: {
      'inactive-chain':
        'El departamento principal o un superior están inactivos. Esta relación de organización no se aplica actualmente.',
      'invalid-chain':
        'Esta relación de organización no es válida. Contacta con un administrador de la organización.',
    },

    scopeNumber: 'Ámbito de registros {{number}}',
    scopeLabels: {
      paymentRequests: 'Solicitudes de pago',
      reimbursementRequests: 'Solicitudes de reembolso',
      leaveRequests: 'Solicitudes de ausencia',
      contractRequests: 'Solicitudes de aprobación de contratos',
      certificateRequests: 'Solicitudes de certificados',
      sealRequests: 'Solicitudes de sellos',
      printTemplates: 'Plantillas',
      printTemplateRevisions: 'Versiones de plantillas',
      knowledgeDocuments: 'Documentos',
      knowledgeVersions: 'Versiones de documentos',
      knowledgeFolders: 'Carpetas',
      sealLedger: 'Registros de sellado',
      sealReceipts: 'Recibos de sellos',
      contracts: 'Contratos',
      contractVersions: 'Versiones de contratos',
      contractChanges: 'Modificaciones de contratos',
      contractPayments: 'Pagos de contratos',
    },
    sourceNumber: 'Origen {{number}}',
    more: 'Más',
    userRoles: 'Roles',
    permissionOverview: 'Resumen de permisos',
    noRoles: 'Ninguno',
    organization: 'Organización',
    moreFor: 'Más · {{name}}',
    addModules: 'Añadir módulos',
    userDetails: 'Detalles del usuario',
    information: 'Información',
    email: 'Correo electrónico',
    accountStatus: 'Estado de la cuenta',
    enabled: 'Activo',
    disabled: 'Suspendido',
    organizationReadOnly:
      'Los departamentos, puestos y relaciones jerárquicas se mantienen en Organización.',
    advancedExceptions: 'Avanzado: concesiones excepcionales',
    partialSave:
      'Se han guardado {{count}} cambios. Se conservan los restantes; reintenta para continuar.',
    addedRoles: 'Añadir: {{names}}',
    removedRoles: 'Quitar: {{names}}',
    compareRole: 'Comparar rol',
    copyRole: 'Copiar de la comparación',
    copyHelp:
      'Copia las concesiones ordinarias a este borrador. Las políticas especiales se conservan. Revisa todos los cambios antes de guardar.',
    advanced: 'Avanzado',
    addRoles: 'Añadir roles a la comparación',

    directAudience: 'Asignaciones individuales',
    dutyAudience: 'Miembros de funciones',

    targetSet: 'Conjunto de permisos de destino',
    chooseTarget: 'Elegir un conjunto de permisos para esta operación',
    targetRequired:
      'Elige un destino para esta nueva operación antes de guardar.',
    roleGrantTitle:
      '{{module}} ({{role}} · concesión independiente {{number}})',

    assignmentSearch: 'Buscar permisos, acciones o ámbitos de registros',
    assignmentOnlySelected: 'Solo seleccionados',
    assignmentCount:
      'Se muestran {{visible}} de {{total}} · {{selected}} seleccionados en todos los módulos',
    assignmentChoicesHelp:
      'Filtra por módulo y compara acciones y ámbitos de registros. Los conjuntos con el mismo nombre siguen siendo independientes. Los filtros conservan las selecciones de otros módulos.',
    assignmentBusiness: 'Operaciones empresariales',
    assignmentOther: 'Administración / otros',
    pageAccess: 'Acceso a páginas',
    configuredGrant: 'Concedido',
    dutyMembershipTitle: '¿{{action}} función «{{role}}» para «{{name}}»?',
    exceptionSummary: 'Concesiones excepcionales: {{names}}',
    noExceptions: 'Ninguno',
    baseOnlyDepartment:
      'El acceso por departamento alcanza a miembros de subdepartamentos. Prioriza funciones para operaciones especializadas.',

    adminMembersHelp:
      'Gestiona administradores en cuentas de usuario. Mantén al menos un administrador activo.',
    openUsers: 'Ver cuentas de usuario',
    ruleLinks: 'Reglas de acceso',
    rulesHelp:
      'El acceso predeterminado y las reglas de uso compartido y restricción siguen afectando al acceso efectivo.',
    defaultRules: 'Acceso predeterminado',
    sharingRules: 'Reglas de uso compartido',
    restrictionRules: 'Reglas de restricción',

    modules: 'Explorar por módulo',
    onlyConfigured: 'Solo configurados',
    baselineValue: 'Todos tienen acceso básico: {{value}}',
    advancedEdit: 'Editor avanzado',
    changedCount: '{{count}} cambios',
    roleImpact: 'Miembros afectados de «{{name}}»: {{count}}',
    sharedObjects:
      'Los conjuntos de permisos también están asignados a: {{names}}',
    changeShared: 'Modificar todos estos sujetos',
    splitDefault:
      'Por defecto, divide los conjuntos compartidos en copias independientes para este rol.',
    userPermissionsTitle: 'Permisos de {{name}}',
    unionHelp:
      'Los ámbitos de registros de varios orígenes se combinan; las reglas de acceso siguen aplicándose.',
    assignedRoles: 'Roles asignados',
    preferRoles:
      'Prioriza las funciones; las concesiones directas son para excepciones.',
    exceptionGrant: 'Gestionar concesiones excepcionales',
    configurationDenied:
      'Se requiere acceso de lectura a conjuntos de permisos para ver los detalles de configuración. Contacta con un administrador.',
    checkOperation: 'Comprobar una operación',
    notConfigured: 'Sin configurar',
    applicable: 'Se aplica a',
    modulesCount: 'Módulos configurados',
    personalAudience: 'Asignación directa · {{count}} personas',
    maintainedAudience: 'Miembros gestionados · {{count}} personas',
    automaticAudience: 'Calculado desde las relaciones de organización',
    departmentAudience: 'Miembros del departamento y subdepartamentos',
    positionAudience: 'Personas que ocupan este puesto',
    allAuthenticated: 'Todas las personas con sesión iniciada',
    organizationMembersHelp:
      'Los miembros se mantienen en la organización y se calculan a partir de relaciones activas.',
    openOrganization: 'Ver organización',
    adjustDutyRoles: 'Ajustar funciones',
    membersUnknown: 'Número de miembros no disponible',

    labelValue: '{{label}}: {{value}}',
    clearModuleFilters: 'Borrar filtros',
    noModuleMatches: 'No hay permisos coincidentes en este módulo',

    businessModules: 'Módulos empresariales',
    allModules: 'Todas',
    otherModules: 'Otros',
    noModulePermissions: 'No hay permisos configurados en este módulo',
    moduleCount: '{{module}}: {{configured}} configurados / {{total}} recursos',

    actionsFor: 'Acciones para «{{name}}»',
    configuredScopes: 'Ámbitos configurados',

    lastAdmin:
      'Debe quedar al menos un administrador del sistema activo. Asigna primero un sustituto.',
    subjectNotAllowed:
      'Este acceso no se puede asignar a este tipo de sujeto. Elige otro acceso empresarial.',

    title: 'Gestión de acceso',
    description:
      'Configura operaciones empresariales y ámbitos de registros por rol.',
    roles: 'Acceso de roles',
    baseline: 'Acceso básico con sesión iniciada',
    baselineHelp:
      'El acceso básico se aplica a cuentas con sesión iniciada. La pertenencia a funciones también afecta a los candidatos de aprobación.',
    name: 'Nombre',
    type: 'Tipo',
    all: 'Todos los tipos',
    dutyRoles: 'Roles funcionales',
    positions: 'Puestos',
    departments: 'Departamentos',
    automatic: 'Acceso automático',
    members: 'Miembros',
    permissions: 'Permisos empresariales',
    missingMembers: 'No hay miembros asignados',
    memberDenied: 'Acceso a miembros no disponible',
    membersFailed: 'No se han podido cargar los miembros',
    byMembership: 'Aplicado por pertenencia',
    none: 'Sin acceso empresarial asignado',
    noneHelp:
      'Asigna acceso empresarial existente tras confirmar las responsabilidades. El acceso heredado permanece vigente.',
    searchRoles: 'Buscar roles, puestos o departamentos…',
    clear: 'Borrar filtros',
    noResults: 'No hay resultados coincidentes',
    clearHelp: 'Modifica la búsqueda o borra los filtros.',
    loading: 'Cargando',
    refresh: 'Actualizar',
    denied:
      'No tienes acceso a esta operación. Contacta con un administrador de acceso.',
    missing: 'Este elemento ya no existe. Vuelve a la lista.',
    conflict:
      'La configuración de acceso ha cambiado. Recarga y revisa antes de guardar.',
    failed:
      'No se ha podido completar esta operación. Reintenta o contacta con un administrador.',
    reload: 'Volver a cargar',
    retry: 'Reintentar',
    roleHelp:
      'Revisa los miembros, las operaciones empresariales y los ámbitos de registros de esta responsabilidad.',
    rules:
      'Pueden aplicarse reglas de acceso adicionales. Comprueba el acceso de la persona y la operación empresarial real.',
    actions: 'Acciones',
    addMember: 'Añadir miembro',
    remove: 'Quitar',
    memberImpact:
      'La pertenencia a funciones afecta al acceso heredado y a candidatos de aprobación. Los demás orígenes de acceso permanecen tras quitarla.',
    assign: 'Asignar acceso empresarial',
    usedBy:
      'Este acceso está asignado a {{count}} sujetos. Editarlo afecta a todos ellos.',
    edit: 'Editar',
    special: 'Configuración personalizada existente',
    specialReadOnly:
      'La configuración personalizada es de solo lectura y se conservará al guardar.',
    noScope: 'Sin ámbito de registros configurado',
    systemAdmin: 'Administrador del sistema',
    unrestricted: 'Administrador del sistema: acceso sin restricciones',
    removeTitle: '¿Quitar al miembro «{{name}}»?',
    cancel: 'Cancelar',
    removed: 'Se ha eliminado «{{name}}»',
    added: 'Se ha añadido «{{name}}»',
    addMemberTitle: 'Añadir miembro de {{name}}',
    add: 'Añadir',
    person: 'Persona',
    selectPerson: 'Selecciona a la persona que asumirá esta responsabilidad.',
    userDenied:
      'No puedes ver el directorio de usuarios. Contacta con un administrador.',
    direct: 'Asignado directamente',
    inherited: 'Acceso heredado',
    personUnknown: 'Persona (nombre no disponible)',
    back: 'Volver a la lista',
    pageActionHelp:
      'El acceso a páginas controla el menú y la entrada. Concede por separado cada operación empresarial y sus ámbitos de registros; abrir una página no concede sus acciones.',
    emptyDirectory: 'No hay sujetos disponibles',
    emptyHelp: 'No hay registros disponibles actualmente en este directorio.',
    deniedAction: 'No autorizado',
    sensitive: 'Acceso sensible',
    impactUnavailable:
      'No se puede verificar todo el impacto. Comprueba los sujetos afectados y su visibilidad antes de modificar este acceso compartido.',
    conditional: 'Acceso condicional',
    permitted: 'Acceso incondicional',
    assignTitle: 'Cambiar acceso de «{{name}}»',
    assignHelp:
      'Selecciona el acceso empresarial directo de este sujeto. Los demás orígenes se conservan.',
    noAssignable: 'No hay acceso empresarial asignable',
    preserveInherited:
      'Aquí solo cambian las asignaciones directas. El acceso heredado de departamentos, puestos, funciones y del acceso básico permanece.',
    save: 'Guardar',
    saved: 'Se ha guardado el acceso de «{{name}}»',
    confirmTitle: '¿Guardar cambios de acceso de «{{name}}»?',
    assignmentImpact:
      'Revisa el acceso añadido y eliminado. Los demás orígenes permanecen; debe quedar un administrador del sistema activo.',
    discardTitle: '¿Descartar los cambios sin guardar?',
    discard: 'Descartar',
    discardHelp: 'Tus cambios no se han guardado. Descartarlos los elimina.',
    editTitle: 'Editar acceso empresarial de «{{name}}»',
    editorHelp:
      'Selecciona operaciones y ámbitos individualmente. Las operaciones sensibles se separan; revisa el impacto antes de guardar.',
    impact: 'Sujetos afectados',
    searchActions: 'Buscar funciones empresariales u operaciones…',
    multipleScopes:
      'Configura cada uno de los siguientes ámbitos de esta operación.',
    levelFor: 'Ámbito de registros de «{{name}}»',
    protected: 'Este acceso está protegido',
    protectedHelp:
      'La protección del sistema permanece. Gestiona la pertenencia de administradores mediante cuentas de usuario.',
    sharedHelp:
      'Este cambio afecta a todos los sujetos enumerados arriba. Revisa las operaciones y los ámbitos.',
    system: 'Responsabilidades del sistema',
  },
};
