/**
 * English wording of the `employees` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `employees.zh-CN.ts` is checked against this shape.
 */
const employeesEnUS = {
  employees: {
    refresh: 'Actualizar',
    personal: {
      title: 'Ficha personal',
      description:
        'Consulta tus datos de empleado; contacta con RR. HH. para corregir errores.',
      identity: '{{name}} · {{code}}',
      basic: 'Información básica',
      profile: 'Datos personales',
      bank: 'Cuenta de pago',
      emptyTitle: 'Aún no hay ficha de empleado',
      emptyDescription:
        'Contacta con RR. HH. para crear una ficha de empleado para tu cuenta.',
      profileMissing:
        'No se han encontrado datos personales; contacta con RR. HH. para comprobar tu ficha.',
      forbidden:
        'No se puede acceder a tu ficha; pide a un administrador que compruebe el acceso.',
      refresh: 'Actualizar',
    },
    authz: {
      section: 'Empleados',
      settings: 'Página de fichas de empleados',
      settingsRead: 'Abrir',
      collections: {
        employees: 'Fichas de empleados',
        employeeProfiles: 'Información restringida de empleados',
        employeeCompensation: 'Remuneración de empleados',
      },
      archive: {
        title: 'Ficha de empleado',
        view: 'Ver',
        manage: 'Crear y editar',
        correctStatus: 'Corregir estado',
      },
      profile: {
        title: 'Información restringida de empleados',
        view: 'Ver todo',
        viewBank: 'Ver cuenta bancaria',
        update: 'Editar',
      },
      compensation: {
        title: 'Remuneración de empleados',
        view: 'Ver',
      },
      directory: {
        title: 'Directorio',
        view: 'Ver personas',
        viewContact: 'Ver teléfono y correo',
      },
      scopes: {
        reports: 'Mis subordinados (todos los niveles)',
        selfAndReports: 'Yo y mis subordinados',
        reportsHint:
          'Personas situadas por debajo del usuario en la jerarquía, a cualquier profundidad; un responsable intermedio inactivo no interrumpe la relación.',
      },
      subjects: {
        position: 'Puestos',
        reportingManager: 'Responsables directos',
      },
    },
    permissionSets: {
      hr: 'RR. HH.: fichas de empleados',
      compensation:
        'Remuneración de empleados (dirección general y financiera)',
      bank: 'Cuentas bancarias de empleados (Finanzas)',
      manager: 'Responsable directo: fichas de subordinados',
      head: 'Responsable de departamento: fichas del departamento',
      admin: 'Corrección de datos de fichas de empleados',
      directory: 'Directorio',
    },
    navigation: {
      archive: 'Empleados',
      directory: 'Directorio',
    },
    title: 'Empleados',
    description:
      'Mantén la cuenta, la jerarquía, el puesto y la información restringida de cada empleado.',
    fields: {
      name: 'Nombre',
      code: 'Código de empleado',
      user: 'Cuenta',
      primaryDepartment: 'Departamento principal',
      position: 'Puesto',
      grade: 'Nivel',
      manager: 'Responsable directo',
      status: 'Estado',
      careerStartDate: 'Fecha del primer empleo',
      hireDate: 'Fecha de contratación',
      probationEndDate: 'Fecha de fin del período de prueba',
      lastWorkingDay: 'Último día de trabajo',
      phone: 'Teléfono',
      email: 'Correo electrónico',
      workLocation: 'Lugar de trabajo',
      emergencyContact: 'Contacto de emergencia',
      active: 'Activo',
      updatedAt: 'Actualizado',
      idType: 'Tipo de documento de identidad',
      idNumber: 'Número de documento de identidad',
      birthDate: 'Fecha de nacimiento',
      address: 'Dirección',
      education: 'Formación académica',
      school: 'Centro educativo',
      major: 'Especialidad',
      bankName: 'Banco',
      bankAccount: 'Cuenta bancaria',
      bankAccountName: 'Titular de la cuenta',
      effectiveFrom: 'Vigente desde',
      baseSalary: 'Salario base',
      sourceApplication: 'Solicitud de origen',
      note: 'Nota',
      kind: 'Modificación',
      effectiveAt: 'Fecha de efecto',
      changes: 'Cambios',
    },
    status: {
      probation: 'En período de prueba',
      regular: 'Confirmado',
      leaving: 'En proceso de baja',
      left: 'Baja definitiva',
    },
    historyKind: {
      hire: 'Contratación',
      regularization: 'Confirmación de empleo',
      transfer: 'Transferir',
      salaryChange: 'Cambio salarial',
      departure: 'Baja laboral',
      correction: 'Corrección de datos',
    },
    boolean: {
      yes: 'Sí',
      no: 'No',
    },
    search: {
      placeholder: 'Buscar por nombre o código de empleado',
      label: 'Buscar empleados',
    },
    filters: {
      department: 'Departamento',
      allDepartments: 'Todos los departamentos',
      status: 'Estado',
      allStatuses: 'Todos los estados',
      clear: 'Borrar filtros',
    },
    empty: {
      title: 'Aún no hay fichas de empleados',
      description:
        'Crea una ficha para vincular una cuenta, un responsable y un puesto.',
      descriptionReadOnly:
        'Aún no tienes fichas visibles. Consulta a RR. HH. si esperabas encontrar alguna.',
      noResults: 'Ningún empleado coincide con los filtros.',
    },
    error: {
      title: 'No se han podido cargar los empleados',
      requestFailed:
        'La solicitud ha fallado. Comprueba la conexión y vuelve a intentarlo.',
      forbidden: 'No tienes permiso para ver esto.',
      notFound: 'Esta ficha de empleado no existe o se ha eliminado.',
      tabForbidden: 'No tienes permiso para ver esta sección.',
    },
    actions: {
      label: 'Acciones',
      more: 'Acciones para {{name}}',
      edit: 'Editar',
      correctStatus: 'Corregir estado',
      editProfile: 'Editar',
      moreActions: 'Más acciones',
    },
    create: {
      action: 'Nuevo empleado',
      title: 'Nuevo empleado',
      description: 'Vincula una cuenta y completa la ficha.',
      submit: 'Crear',
      success: 'Se ha creado el empleado «{{name}}»',
    },
    edit: {
      title: 'Editar empleado',
      success: 'Se ha guardado el empleado «{{name}}»',
    },
    form: {
      basicSection: 'Información básica',
      contactSection: 'Contacto',
      nameRequired: 'Introduce un nombre.',
      codeRequired: 'Introduce un código de empleado.',
      userRequired: 'Elige la cuenta que quieres vincular.',
      careerStartInvalid: 'Elige una fecha válida del primer empleo.',
      careerStartFuture: 'La fecha del primer empleo no puede ser futura.',
      careerStartAfterHire:
        'La fecha del primer empleo no puede ser posterior a la fecha de contratación.',
      hireDateRequired: 'Elige la fecha de contratación.',
      tooLong: 'Utiliza como máximo {{max}} caracteres.',
      emailInvalid: 'El formato del correo no es válido.',
      userTaken: 'Esta cuenta ya tiene una ficha.',
      codeTaken: 'Este código de empleado ya se utiliza.',
      userInvalid: 'Esta cuenta no existe o está desactivada.',
      managerInvalid:
        'Elige un empleado activo que no esté por debajo de este.',
      positionInvalid: 'Este puesto no existe o está desactivado.',
      gradeInvalid: 'Este nivel no existe o está desactivado.',
      initialStatus: 'Estado inicial',
      managerPlaceholder: 'Buscar por nombre o código de empleado',
      managerEmpty: 'No hay empleados coincidentes',
      none: 'Ninguno',
      positionPlaceholder: 'Elegir un puesto',
      gradePlaceholder: 'Elegir un nivel',
      optionsFailed: 'No se han podido cargar las opciones.',
      userPlaceholder: 'Buscar cuentas por nombre o correo',
    },
    page: {
      title: 'Empleado',
      tabsLabel: 'Secciones del empleado',
    },
    tabs: {
      basic: 'Información básica',
      profile: 'Información restringida',
      compensation: 'Remuneración',
      history: 'Historial de cambios',
    },
    profile: {
      title: 'Información restringida',
      description:
        'Identidad, dirección, formación y cuenta bancaria; visibles solo para roles autorizados.',
      bankOnly: 'Solo puedes ver la cuenta bancaria.',
      editTitle: 'Editar información restringida',
      success: 'Se ha guardado la información restringida de «{{name}}»',
      identitySection: 'Identidad',
      educationSection: 'Formación académica',
      bankSection: 'Cuenta bancaria',
    },
    compensation: {
      title: 'Remuneración',
      description:
        'Cada confirmación de empleo y cambio salarial añade una fila; las filas nunca se editan.',
      empty: 'Aún no hay registros de remuneración.',
    },
    history: {
      referenceNotice:
        'Los nombres de referencia utilizan el directorio actual; no se guardaron los nombres del momento del cambio.',
      sources: {
        onboarding: 'Incorporación',
        departure: 'Baja laboral',
        transfer: 'Cambio de personal',
        probation: 'Confirmación de empleo',
        other: 'Otra operación empresarial',
      },
      referenceUnavailable: 'Referencia histórica no disponible',
      personUnavailable: 'Persona histórica no disponible',
      otherField: 'Otro cambio',
      title: 'Historial de cambios',
      description:
        'Contrataciones, confirmaciones de empleo, traslados, bajas y correcciones de datos.',
      empty: 'Aún no hay cambios registrados.',
    },
    correction: {
      title: 'Corregir estado',
      description:
        'Una corrección de datos fuera de los procesos de aprobación. Se audita con tu motivo.',
      reason: 'Motivo',
      reasonPlaceholder: 'Por qué es incorrecto el estado registrado',
      reasonRequired: 'Introduce el motivo de la corrección.',
      submit: 'Corregir',
      unchanged: 'La corrección no modifica nada.',
      success: 'Se ha corregido el estado de «{{name}}»',
    },
    directory: {
      title: 'Directorio',
      description:
        'Encuentra compañeros por departamento o nombre y consulta sus datos de contacto.',
      searchPlaceholder: 'Buscar por nombre o código de empleado',
      searchLabel: 'Buscar en el directorio',
      contactHidden: 'No visible',
      emptyTitle: 'El directorio está vacío',
      emptyDescription:
        'Las personas aparecen aquí cuando RR. HH. crea sus fichas.',
      noResults: 'Ningún compañero coincide con los filtros.',
      errorTitle: 'No se ha podido cargar el directorio',
    },
  },
};

export type EmployeesLocale = typeof employeesEnUS;

export default employeesEnUS;
