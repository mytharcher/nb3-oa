/**
 * English wording of the `org` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `org.zh-CN.ts` is checked against this shape.
 *
 * `authz`, `subjects`, `scopes` and `dutyRoleTitles` are rendered from `{ key, ns }` descriptors the server stores or
 * registers (settings items, subject types, record accesses, seeded duty-role titles), in the application namespace.
 */
const orgEnUS = {
  org: {
    navigation: {
      departments: 'Departamentos',
      positions: 'Puestos',
      grades: 'Niveles',
      dutyRoles: 'Funciones',
    },
    authz: {
      section: 'Organización y personas',
      departments: 'Departamentos',
      positions: 'Puestos',
      grades: 'Niveles',
      dutyRoles: 'Funciones',
      read: 'Ver',
      update: 'Gestionar',
    },
    subjects: {
      departments: 'Departamentos',
      heads: 'Responsables de departamentos',
      dutyRoles: 'Funciones',
      disabled: 'Desactivado',
    },
    scopes: {
      mine: 'Mis departamentos',
      mineHint:
        'Registros pertenecientes a miembros de los departamentos a los que pertenezco o que dirijo.',
      mineAndBelow: 'Mis departamentos y sus subdepartamentos',
      mineAndBelowHint:
        'Registros pertenecientes a miembros de mis departamentos y todos sus subdepartamentos.',
      headed: 'Departamentos que dirijo y sus subdepartamentos',
      headedHint:
        'Registros pertenecientes a miembros de los departamentos que dirijo y todos sus subdepartamentos.',
    },
    dutyRoleTitles: {
      gm: 'Director general',
      cfo: 'CFO',
      hr: 'Especialista de RR. HH.',
      hrbp: 'HRBP',
      hrDirector: 'Director de RR. HH.',
      admin: 'Administración',
      sealKeeper: 'Responsable del sello',
      finance: 'Contable',
      financeManager: 'Responsable de finanzas',
      cashier: 'Cajero',
      legal: 'Asesoría jurídica',
      purchasing: 'Compras',
      it: 'TI',
      committeeTech: 'Comité de revisión (representante técnico)',
    },
    common: {
      active: 'Activado',
      inactive: 'Desactivado',
      allStatuses: 'Todos los estados',
      noResults: 'Nada coincide con los filtros.',
      clearFilters: 'Borrar filtros',
      clearSearch: 'Borrar búsqueda',
      searchByTitleOrCode: 'Buscar por nombre o código',
      askAdministrator: 'Pide a un administrador que lo configure.',
      fields: {
        title: 'Nombre',
        code: 'Código',
        status: 'Estado',
        name: 'Nombre',
        email: 'Correo electrónico',
        user: 'Persona',
      },
      actions: {
        label: 'Acciones',
        more: 'Acciones para {{name}}',
        edit: 'Editar',
        enable: 'Activar',
        disable: 'Desactivar',
      },
      form: {
        titleRequired: 'Introduce un nombre.',
        titleTooLong: 'Utiliza como máximo {{max}} caracteres.',
        codeRequired: 'Introduce un código.',
        codeFormat:
          'Utiliza letras, dígitos, «.», «_» y «-», empezando por letra o dígito, hasta 64 caracteres.',
        codeHint:
          'Identificador estable utilizado en importaciones y otros sistemas.',
        integer: 'Introduce un número entero.',
        userRequired: 'Elige una persona.',
      },
    },
    errors: {
      executiveTopLevelOnly:
        'Solo los departamentos superiores pueden designar un directivo; los subdepartamentos lo heredan.',
      codeTaken: 'Este código ya se utiliza. Elige otro.',
      parentCycle:
        'Un departamento no se puede mover dentro de sí mismo ni de uno de sus subdepartamentos.',
      parentNotFound: 'El departamento superior ya no existe. Elige otro.',
      userNotFound: 'Esta persona no existe o está desactivada.',
      notFound: 'Este registro no existe o se ha eliminado.',
      forbidden: 'No tienes permiso para hacer esto.',
      requestFailed: 'La solicitud ha fallado. Vuelve a intentarlo.',
    },
    departmentPicker: {
      placeholder: 'Buscar departamentos',
      empty: 'No hay departamentos coincidentes',
      loadFailed: 'No se han podido cargar los departamentos.',
      inactivePath: '{{path}} (desactivado)',
    },
    departments: {
      title: 'Departamentos',
      description:
        'Mantén la estructura de departamentos, sus responsables y miembros. Desactivar un departamento desactiva todos sus subdepartamentos.',
      create: 'Nuevo departamento',
      createChild: 'Nuevo subdepartamento',
      editTitle: 'Editar departamento',
      formDescription:
        'Cambiar el superior mueve el departamento y todo lo que contiene.',
      created: 'Se ha creado el departamento «{{name}}»',
      saved: 'Se ha guardado el departamento «{{name}}»',
      enabled: 'Se ha activado el departamento «{{name}}»',
      disabled: 'Se ha desactivado el departamento «{{name}}»',
      disableTitle: '¿Desactivar el departamento «{{name}}»?',
      disableDescription:
        'Sus subdepartamentos también dejan de contar y los miembros dejan de heredar sus permisos. No se elimina nada; puedes activarlo de nuevo cuando quieras.',
      loadFailed: 'No se han podido cargar los departamentos',
      emptyTitle: 'Aún no hay departamentos',
      emptyDescription:
        'Crea el nivel superior de la organización y añade departamentos debajo.',
      noResults: 'Ningún departamento coincide con la búsqueda.',
      searchPlaceholder: 'Buscar por nombre o código de departamento',
      treeLabel: 'Estructura de departamentos',
      choose: 'Elige un departamento a la izquierda para ver sus detalles.',
      notFound: 'Este departamento no existe o se ha eliminado.',
      backToTree: 'Volver a la estructura',
      topLevel: 'Departamento de nivel superior',
      inheritedFrom: '(heredado de «{{name}}»)',
      inactiveByAncestor: 'Desactivado junto con «{{name}}»',
      fields: {
        parent: 'Departamento superior',
        manager: 'Responsable del departamento',
        executive: 'Directivo responsable',
        sortOrder: 'Orden',
      },
      form: {
        codeHint:
          'Opcional. Las importaciones actualizan departamentos por código.',
        parentPlaceholder: 'Nivel superior (sin superior)',
        parentHint: 'Déjalo vacío para un departamento de nivel superior.',
        managerHint:
          'Las aprobaciones se dirigen a esta persona; no es necesario que sea miembro. Vacío: responsable del departamento superior.',
        executiveHint:
          'Solo se establece en departamentos de nivel superior. Seleccionar un superior borra este campo; los subdepartamentos lo heredan.',
        sortOrderHint:
          'Los números menores aparecen primero entre departamentos del mismo nivel.',
      },
      members: {
        title: 'Miembros ({{count}})',
        description:
          'Miembros directos. Cada persona tiene un departamento principal, utilizado en aprobaciones y presupuestos.',
        add: 'Añadir miembro',
        addTitle: 'Añadir miembro a «{{name}}»',
        added: 'Se ha añadido «{{name}}» a «{{department}}»',
        primary: 'Tipo de departamento',
        primaryBadge: 'Principal',
        secondaryBadge: 'Secundario',
        makePrimary: 'Establecer departamento principal',
        primarySet: 'Este es ahora el departamento principal de «{{name}}»',
        makePrimaryField: 'Establecerlo como su departamento principal',
        makePrimaryHint:
          'Sustituye su departamento principal actual. Sin marcar, solo será principal si no tiene ninguno.',
        remove: 'Quitar del departamento',
        removeTitle: '¿Quitar a «{{name}}» de «{{department}}»?',
        removeDescription:
          'Dejará de heredar los permisos de este departamento. Si era su departamento principal, no tendrá ninguno hasta que establezcas otro.',
        removed: 'Se ha quitado a «{{name}}» de «{{department}}»',
        loadFailed: 'No se han podido cargar los miembros',
        emptyTitle: 'Aún no hay miembros',
        emptyDescription:
          'Añade a las personas que trabajan en este departamento.',
      },
    },
    positions: {
      title: 'Puestos',
      description:
        'Puestos a los que se refieren las fichas de empleados. Desactiva un puesto en lugar de eliminarlo.',
      create: 'Nuevo puesto',
      editTitle: 'Editar puesto',
      formDescription: 'El código se conserva al cambiar el nombre.',
      created: 'Se ha creado el puesto «{{name}}»',
      saved: 'Se ha guardado el puesto «{{name}}»',
      enabled: 'Se ha activado el puesto «{{name}}»',
      disabled: 'Se ha desactivado el puesto «{{name}}»',
      disableTitle: '¿Desactivar el puesto «{{name}}»?',
      disableDescription:
        'Ya no se ofrecerá para nuevas asignaciones. Los empleados que lo tengan lo conservarán.',
      loadFailed: 'No se han podido cargar los puestos',
      notFound: 'Este puesto no existe o se ha eliminado.',
      emptyTitle: 'Aún no hay puestos',
      emptyDescription:
        'Añade los puestos para los que se contrata, como «Comprador».',
      fields: { number: 'Orden' },
      form: {
        numberRequired: 'Introduce un orden.',
        numberHint: 'Opcional. Los números menores aparecen primero.',
      },
    },
    grades: {
      title: 'Niveles',
      description:
        'Niveles como P5 o M2. El orden determina la categoría en las normas de viaje y los niveles de aprobación.',
      create: 'Nuevo nivel',
      editTitle: 'Editar nivel',
      formDescription: 'El código se conserva al cambiar el nombre.',
      created: 'Se ha creado el nivel «{{name}}»',
      saved: 'Se ha guardado el nivel «{{name}}»',
      enabled: 'Se ha activado el nivel «{{name}}»',
      disabled: 'Se ha desactivado el nivel «{{name}}»',
      disableTitle: '¿Desactivar el nivel «{{name}}»?',
      disableDescription:
        'Ya no se ofrecerá para nuevas asignaciones. Los empleados que lo tengan lo conservarán.',
      loadFailed: 'No se han podido cargar los niveles',
      notFound: 'Este nivel no existe o se ha eliminado.',
      emptyTitle: 'Aún no hay niveles',
      emptyDescription:
        'Añade niveles con un orden; los valores mayores indican mayor categoría.',
      fields: { number: 'Orden jerárquico' },
      form: {
        numberRequired: 'Introduce un orden jerárquico.',
        numberHint: 'Un número entero; un valor mayor indica mayor categoría.',
      },
    },
    dutyRoles: {
      title: 'Funciones',
      description:
        'Las aprobaciones y etapas de gestión encuentran personas mediante estas funciones. Asigna lo que cada función puede hacer en la configuración de autorización.',
      viewMembers: 'Ver miembros',
      drawerDescription:
        'Personas que desempeñan esta función. Reciben las etapas de aprobación asignadas a ella.',
      enabled: 'Se ha activado la función «{{name}}»',
      disabled: 'Se ha desactivado la función «{{name}}»',
      disableTitle: '¿Desactivar la función «{{name}}»?',
      disableDescription:
        'Los miembros dejan de desempeñar la función: las etapas de aprobación no encontrarán personas y los permisos asignados a ella dejarán de aplicarse. Se conservan los miembros.',
      loadFailed: 'No se han podido cargar las funciones',
      detailFailed: 'No se ha podido cargar la función',
      notFound:
        'Esta función no existe. Cierra este panel para volver a la lista.',
      emptyTitle: 'No hay funciones',
      emptyDescription:
        'Las funciones se instalan con la aplicación. Pide a un administrador que compruebe la instalación.',
      fields: {
        code: 'Código',
        memberCount: 'Miembros',
        description: 'Descripción',
      },
      members: {
        title: 'Miembros ({{count}})',
        add: 'Añadir miembro',
        addTitle: 'Añadir miembro a «{{role}}»',
        added: 'Se ha añadido «{{name}}» a «{{role}}»',
        remove: 'Quitar',
        removeTitle: '¿Quitar a «{{name}}» de «{{role}}»?',
        removeDescription:
          'Dejará de recibir aprobaciones para esta función y los permisos asignados a ella.',
        removed: 'Se ha quitado a «{{name}}» de «{{role}}»',
        alreadyRemoved: 'Esta persona ya se había eliminado.',
        emptyTitle: 'Aún no hay miembros',
        emptyDescription:
          'Añade a las personas que desempeñan esta función. Sus etapas de aprobación esperan hasta que se añada a alguien.',
      },
    },
  },
};

export type OrgLocale = typeof orgEnUS;

export default orgEnUS;
