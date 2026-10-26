/**
 * English wording of the `import` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `import.zh-CN.ts` is checked against this shape.
 */
const importEnUS = {
  import: {
    navigation: { title: 'Importación de datos' },
    // Titles the server registers in the permission workspace (`server/providers/import/index.ts`).
    authz: {
      settings: 'Importación de datos',
      read: 'Ver historial y plantillas',
      update: 'Importar',
    },
    title: 'Importación de datos',
    description:
      'Importa departamentos, puestos, niveles, fichas de empleados y miembros de funciones desde plantillas de Excel.',
    kinds: {
      departments: 'Departamentos',
      positions: 'Puestos',
      grades: 'Niveles',
      employees: 'Fichas de empleados',
      dutyRoleMembers: 'Miembros de funciones',
    },
    kindHints: {
      departments:
        'Se identifica por código de departamento. Los superiores pueden definirse más abajo en la hoja.',
      positions: 'Se identifica por código de puesto.',
      grades: 'Se identifica por código de nivel.',
      employees:
        'Se identifica por número de empleado. Importa primero departamentos, puestos y niveles; los responsables pueden definirse en la misma hoja.',
      dutyRoleMembers:
        'Se identifica por código de función y cuenta. «No» en la columna de actividad elimina al miembro.',
    },
    actions: {
      new: 'Nueva importación',
      templates: 'Descargar plantilla',
      templateFor: 'Descargar plantilla de {{kind}}',
      check: 'Comprobar',
      checking: 'Comprobando…',
      confirm: 'Importar',
      importing: 'Importando…',
      chooseAgain: 'Elegir otro archivo',
      back: 'Volver',
      chooseFile: 'Elegir archivo',
      downloadFile: 'Descargar archivo original',
      refresh: 'Actualizar',
      clearFilters: 'Borrar filtros',
    },
    fields: {
      kind: 'Tipo',
      file: 'Archivo',
      createdAt: 'Iniciado',
      finishedAt: 'Finalizado',
      status: 'Resultado',
      summary: 'Resumen',
      actor: 'Por',
      rowCount: 'Filas leídas',
      createdCount: 'Creado',
      updatedCount: 'Actualizado',
      unchangedCount: 'Sin cambios',
      errorCount: 'Problemas',
      row: 'Fila',
      column: 'Columna',
      problem: 'Problema',
    },
    filters: { allKinds: 'Todos los tipos' },
    status: { succeeded: 'Correcto', failed: 'Fallido' },
    summary: {
      succeeded:
        '{{created}} creados · {{updated}} actualizados · {{unchanged}} sin cambios',
      failed: 'Problemas: {{count}}',
    },
    noFile: 'Ningún archivo seleccionado',
    templateFile: 'Plantilla de importación de {{kind}}.xlsx',
    fileHint: 'Un libro .xlsx de hasta 5 MB con la estructura de la plantilla.',
    notice: {
      title: 'Antes de importar',
      accounts:
        'Las importaciones nunca crean cuentas: todas las cuentas indicadas en el archivo (usuario o correo) deben existir y estar habilitadas; de lo contrario se informa de su fila.',
      atomic:
        'Primero se comprueba todo el archivo y después se escribe de una vez: si cualquier fila tiene un problema, no se guarda nada.',
    },
    validation: {
      kindRequired: 'Elige el contenido del archivo.',
      fileRequired: 'Elige un archivo .xlsx.',
      fileType: 'Solo se pueden importar libros .xlsx.',
      fileSize: 'El archivo supera los 5 MB. Divídelo en varios archivos.',
    },
    report: {
      invalidTitle:
        'Problemas encontrados: {{count}}. No se ha importado nada.',
      invalidDescription:
        'Corrige las siguientes filas del archivo y vuelve a comprobarlo.',
      truncated:
        'Solo se muestran los primeros {{shown}} de {{count}} problemas.',
      okTitle: 'El archivo ha superado la comprobación',
      okDescription:
        '{{rows}} filas leídas: se crearán {{created}}, se actualizarán {{updated}} y se conservarán {{unchanged}} sin cambios.',
      wholeFile: 'Archivo',
    },
    toast: {
      imported: 'Se ha importado «{{name}}»',
      templateFailed:
        'No se ha podido descargar la plantilla. Vuelve a intentarlo.',
    },
    failure: {
      forbidden: 'No tienes permiso para importar.',
      tooLarge: 'El archivo supera los 5 MB. Divídelo en varios archivos.',
      invalidFile: 'No se ha podido enviar el archivo. Elige un libro .xlsx.',
      generic:
        'La solicitud ha fallado. Comprueba la conexión y vuelve a intentarlo.',
    },
    empty: {
      title: 'Aún no hay importaciones',
      description:
        'Descarga una plantilla, rellénala e impórtala para incorporar departamentos, personas y funciones.',
      readOnly:
        'Aún no hay importaciones. Pide a un administrador que importe los datos de la organización.',
    },
    noResults: 'Ninguna importación coincide con el filtro.',
    loadFailedTitle: 'No se ha podido cargar el historial de importaciones',
    detail: {
      title: 'Detalles de importación · {{name}}',
      titleLoading: 'Detalles de importación',
      notFound: 'Esta importación no existe o se ha eliminado.',
      problems: 'Problemas',
    },
    common: {
      forbidden: 'No tienes permiso para ver esto.',
      notFound: 'Este registro no existe o se ha eliminado.',
      loadFailed:
        'No se han podido cargar los datos. Comprueba la conexión y vuelve a intentarlo.',
    },
    // One sentence per problem code the server reports; {{value}} is the cell, {{header}} its column.
    errors: {
      FILE_UNREADABLE:
        'El archivo no es un libro .xlsx legible. Guárdalo como libro de Excel y vuelve a intentarlo.',
      SHEET_EMPTY:
        'La primera hoja no tiene filas de datos. Rellena las filas debajo de la cabecera.',
      TOO_MANY_ROWS:
        'El archivo tiene más de {{max}} filas. Divídelo en varios archivos.',
      HEADER_MISSING:
        'Falta la columna obligatoria «{{header}}» en la cabecera.',
      HEADER_DUPLICATE: 'La columna «{{header}}» aparece más de una vez.',
      REQUIRED: 'Obligatorio.',
      INVALID_CODE:
        '«{{value}}» no es un código válido: utiliza letras, dígitos, «.», «_» y «-», hasta 64 caracteres.',
      TOO_LONG: 'Supera los {{max}} caracteres.',
      INVALID_INTEGER: '«{{value}}» no es un número entero.',
      INVALID_BOOLEAN: '«{{value}}» no es 是 / 否 (sí / no).',
      CAREER_START_FUTURE:
        'La fecha del primer empleo no puede ser posterior a hoy en la zona horaria del calendario laboral.',
      CAREER_START_AFTER_HIRE:
        'La fecha del primer empleo no puede ser posterior a la fecha de contratación.',
      INVALID_DATE:
        '«{{value}}» no es una fecha válida. Utiliza una celda de fecha o YYYY-MM-DD.',
      INVALID_STATUS:
        '«{{value}}» no es un estado: utiliza 试用, 正式, 离职中 o 已离职.',
      INVALID_EMAIL: '«{{value}}» no es un correo electrónico.',
      DUPLICATE_IN_FILE: '«{{value}}» ya aparece en la fila {{firstRow}}.',
      USER_NOT_FOUND:
        'No existe la cuenta «{{value}}». Las importaciones nunca crean cuentas: créala primero en la página Usuarios.',
      USER_DISABLED:
        'La cuenta «{{value}}» está desactivada. Actívala primero en la página Usuarios.',
      USER_TAKEN: 'La cuenta «{{value}}» ya pertenece al empleado {{code}}.',
      USER_MISMATCH:
        'Este número de empleado está vinculado a otra cuenta; la ficha conserva su cuenta.',
      PARENT_NOT_FOUND:
        'No hay ningún departamento con código «{{value}}» en el archivo ni en el sistema.',
      EXECUTIVE_TOP_LEVEL_ONLY:
        'Solo los departamentos superiores pueden designar un directivo; los subdepartamentos lo heredan.',
      PARENT_CYCLE: 'Los departamentos superiores forman un ciclo.',
      DEPARTMENT_NOT_FOUND:
        'No hay departamento con código «{{value}}». Importa primero los departamentos.',
      DEPARTMENT_INACTIVE: 'El departamento «{{value}}» está desactivado.',
      POSITION_NOT_FOUND: 'No hay puesto con código «{{value}}».',
      POSITION_INACTIVE: 'El puesto «{{value}}» está desactivado.',
      GRADE_NOT_FOUND: 'No hay nivel con código «{{value}}».',
      GRADE_INACTIVE: 'El nivel «{{value}}» está desactivado.',
      MANAGER_NOT_FOUND:
        'No hay número de empleado «{{value}}» en el archivo ni en el sistema.',
      MANAGER_SELF: 'Un empleado no puede ser su propio responsable.',
      MANAGER_INACTIVE: 'El responsable «{{value}}» ha causado baja.',
      MANAGER_CYCLE: 'Los responsables forman un ciclo.',
      DUTY_ROLE_INACTIVE:
        'Esta función está inactiva; no se pueden añadir miembros nuevos.',
      DUTY_ROLE_NOT_FOUND: 'No hay función con código «{{value}}».',
      WRITE_FAILED:
        'No se ha podido guardar esta fila ({{reason}}), por lo que no se ha importado nada. Comprueba la fila y vuelve a intentarlo.',
      unknown: 'Esta fila no se puede importar.',
    },
  },
};

export type ImportLocale = typeof importEnUS;

export default importEnUS;
