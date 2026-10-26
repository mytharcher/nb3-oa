/**
 * English wording of the `platform` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `platform.zh-CN.ts` is checked against this shape.
 */
const platformEnUS = {
  platform: {
    navigation: {
      calendar: 'Calendario laboral',
      dictionaries: 'Diccionarios',
      rules: 'Resumen e historial de reglas',
      sequences: 'Numeración de documentos',
      auditLogs: 'Registro de auditoría',
    },
    // Titles the server registers in the permission workspace (`server/providers/platform/index.ts`).
    authz: {
      section: 'Plataforma OA',
      calendar: 'Calendario laboral',
      dictionaries: 'Diccionarios',
      rules: 'Resumen e historial de reglas',
      sequences: 'Numeración de documentos',
      auditLogs: 'Registro de auditoría',
      actions: { read: 'Ver', update: 'Editar' },
    },
    common: {
      actions: 'Acciones',
      actionsFor: 'Acciones para {{name}}',
      edit: 'Editar',
      delete: 'Eliminar',
      refresh: 'Actualizar',
      clearFilters: 'Borrar filtros',
      noResults: 'Nada coincide con los filtros.',
      forbidden: 'No tienes permiso para ver esto.',
      notFound: 'Este registro no existe o se ha eliminado.',
      loadFailed:
        'No se han podido cargar los datos. Comprueba la conexión y vuelve a intentarlo.',
      writeForbidden: 'No tienes permiso para realizar este cambio.',
      saveFailed: 'No se ha podido guardar el cambio. Vuelve a intentarlo.',
    },
    calendar: {
      title: 'Calendario laboral',
      description:
        'Establece el horario laboral y mantén los festivos y días de trabajo compensatorio de cada año.',
      loadFailedTitle: 'No se ha podido cargar la configuración del calendario',
      kinds: {
        holiday: 'Festivo',
        adjustedWorkday: 'Día de trabajo compensatorio',
        workday: 'Día laborable',
        weekend: 'Día libre',
      },
      workHours: {
        title: 'Horario laboral',
        description:
          'Los recordatorios y escalamientos de aprobación solo cuentan estas horas en días laborables.',
        start: 'Inicio',
        end: 'Fin',
        range: '{{start}}–{{end}}',
        invalidTime: 'Introduce una hora como 09:00.',
        endBeforeStart: 'El fin debe ser posterior al inicio.',
        scheduled: 'Desde {{date}}: {{start}}–{{end}}',
        saved: 'Horario laboral guardado',
      },
      timeZone: {
        title: 'Zona horaria',
        description:
          'Zona horaria utilizada por el calendario y la numeración de documentos. El cambio se aplica inmediatamente.',
        label: 'Zona horaria',
        hint: 'Nombre IANA de zona horaria, como Asia/Shanghai.',
        required: 'Introduce una zona horaria.',
        invalid:
          'El servidor no reconoce esta zona horaria. Utiliza un nombre como Asia/Shanghai.',
        saved: 'Zona horaria guardada',
      },
      days: {
        remove: 'Quitar',
        title: 'Días especiales',
        description:
          'Los días no indicados siguen la semana: de lunes a viernes son laborables.',
        previousYear: 'Año anterior',
        nextYear: 'Año siguiente',
        add: 'Añadir día',
        addTitle: 'Añadir día',
        addDescription: 'Si la fecha ya está en la lista, se sustituye.',
        addSubmit: 'Añadir',
        editTitle: 'Editar {{date}}',
        import: 'Importar',
        date: 'Fecha',
        weekday: 'Día de la semana',
        kind: 'Tipo',
        note: 'Nota',
        dateRequired: 'Selecciona una fecha.',
        noteTooLong: 'Utiliza como máximo {{max}} caracteres.',
        emptyTitle: 'Aún no hay días especiales en {{year}}',
        emptyDescription:
          'Importa los festivos y días de trabajo compensatorio del año o añádelos uno a uno.',
        emptyReadOnly:
          'Todos los días siguen la semana. Pide a un administrador que importe los festivos.',
        saved: 'Se ha guardado «{{date}}»',
        removed: 'Se ha eliminado «{{date}}»',
        removeTitle: '¿Eliminar «{{date}}»?',
        removeDescription: 'La fecha vuelve a seguir la semana.',
        notFound: 'Este día ya no está en la lista. Puede haberse eliminado.',
      },
      import: {
        title: 'Importar días especiales de {{year}}',
        description: 'Pega un día por línea: fecha, tipo y nota opcional.',
        lines: 'Días',
        placeholder:
          '{{year}}-10-01,holiday,Día Nacional\n{{year}}-10-10,adjustedWorkday',
        hint: 'Separa con comas o tabulaciones. Tipos: holiday, adjustedWorkday, workday, weekend (o 休 / 班).',
        replace: 'Sustituir el año',
        replacePreview:
          'Según el calendario actual, {{count}} días especiales existentes de {{year}} no están en esta importación y se eliminarán. Otros usuarios pueden modificar el calendario antes de que guardes.',
        previewFailed:
          'No se ha podido cargar el año completo del calendario. Reintenta antes de sustituirlo.',
        confirmReplaceTitle: '¿Sustituir los días especiales de {{year}}?',
        replaceHint:
          'Elimina los días especiales de {{year}} que no estén en la lista.',
        submit: 'Importar',
        emptyText: 'Pega al menos un día.',
        success:
          'Importados: {{created}} añadidos, {{updated}} modificados, {{removed}} eliminados',
        problems: {
          format: 'La línea {{line}} necesita una fecha y un tipo.',
          date: 'La línea {{line}} tiene una fecha no válida.',
          kind: 'La línea {{line}} tiene un tipo desconocido.',
          year: 'La línea {{line}} no pertenece a {{year}}.',
          duplicate: 'La línea {{line}} repite una fecha.',
        },
      },
    },
    dictionaries: {
      title: 'Diccionarios',
      description:
        'Mantén las opciones de los formularios de solicitud. Las entradas se desactivan, nunca se eliminan.',
      loadFailedTitle: 'No se ha podido cargar el diccionario',
      searchPlaceholder: 'Buscar por nombre o código',
      searchLabel: 'Buscar entradas',
      notFound: 'Esta entrada no existe o se ha eliminado.',
      enable: 'Activar',
      enabled: 'Se ha activado «{{name}}»',
      disable: 'Desactivar',
      disabled: 'Se ha desactivado «{{name}}»',
      disableTitle: '¿Desactivar «{{name}}»?',
      disableDescription:
        'Las solicitudes existentes siguen mostrándola, pero las nuevas ya no pueden elegirla. Puedes volver a activarla.',
      extraValue: '{{name}}: {{value}}',
      extraUnlimited: '{{name}}: sin límite',
      fields: {
        type: 'Tipo de diccionario',
        label: 'Nombre',
        labelZh: 'Nombre (chino)',
        labelEn: 'Nombre (inglés)',
        code: 'Código',
        extra: 'Atributos',
        sortOrder: 'Orden',
        status: 'Estado',
      },
      status: {
        all: 'Todos los estados',
        active: 'Activado',
        inactive: 'Desactivado',
      },
      empty: {
        title: 'Aún no hay entradas de este tipo',
        description:
          'Añade la primera entrada para que los formularios puedan ofrecerla.',
        readOnly: 'Pide a un administrador que añada entradas.',
      },
      create: {
        action: 'Nueva entrada',
        title: 'Nueva entrada: {{type}}',
        success: 'Se ha creado la entrada «{{name}}»',
      },
      edit: {
        title: 'Editar entrada',
        success: 'Se ha guardado la entrada «{{name}}»',
      },
      form: {
        description:
          'Entrada de {{type}}. Asígnale un nombre en al menos un idioma.',
        codeHint:
          'Letras, dígitos, _ y -, empezando por una letra. No se podrá cambiar después.',
        codeFixed:
          'Los registros guardan el código, por lo que no se puede modificar.',
        codeInvalid:
          'Utiliza letras, dígitos, _ y -, empezando por una letra (máximo 64).',
        codeTaken: 'Este tipo ya tiene una entrada con este código.',
        labelRequired: 'Introduce un nombre en al menos un idioma.',
        labelTooLong: 'Utiliza como máximo {{max}} caracteres.',
        sortOrderHint:
          'Los números menores aparecen primero en los formularios.',
        sortOrderInvalid: 'Introduce un número entero entre 0 y 1 000 000.',
        numberRequired: 'Introduce un número.',
        numberMin: 'Introduce un número de al menos {{min}}.',
        integerMin: 'Introduce un entero de al menos {{min}}.',
        blankUnlimited: 'Déjalo vacío para no establecer límite.',
        extraInvalid: 'Este valor no se admite.',
      },
      types: {
        expensePlanType: 'Asuntos de solicitudes de gastos',
        officeItem: 'Material de oficina',
        leaveType: 'Tipos de ausencia',
        annualLeaveTier: 'Vacaciones anuales por antigüedad',
        paymentMethod: 'Método de pago',
        expenseCategory: 'Categorías de gastos',
        budgetSubject: 'Partidas presupuestarias',
        sealType: 'Tipos de sellos',
        contractType: 'Tipos de contratos',
        assetCategory: 'Categorías de activos',
        supplierCategory: 'Categorías de proveedores',
        vehicleType: 'Tipos de vehículos',
        departureType: 'Tipo de baja',
        resignationReason: 'Motivos de dimisión',
        recruitmentReason: 'Motivos de contratación',
        certificateType: 'Tipos de certificados',
        travelStandard: 'Normas de viaje',
      },
      travelStandardKindHelp:
        'Utiliza la categoría correspondiente a alojamiento y dieta. Una categoría de viaje agregada no representa ninguna de ellas y no tiene límite diario.',
      invalidStandardKind:
        'Elige una clasificación válida de normativa de viaje.',
      extraOptions: {
        travelStandardKind: {
          none: 'No aplicable',
          lodging: 'Alojamiento por noche',
          allowance: 'Dieta por día',
        },
      },
      extra: {
        travelStandardKind: 'Clasificación de normativa de viaje',
        requiresPrintInfo: 'Requiere datos de impresión',
        deductsBalance: 'Descuenta saldo',
        requiresAttachment: 'Requiere adjunto',
        attachmentAboveDays: 'Adjunto por encima de (días)',
        maxDays: 'Días máximos',
        requiresHr: 'Aprobación de RR. HH.',
        minYears: 'Desde años de antigüedad',
        days: 'Días',
        voluntary: 'Voluntaria',
        replacement: 'Sustituye a una persona de baja',
        involvesSalary: 'Muestra salario',
        minRank: 'Desde orden del nivel',
        lodgingPerNight: 'Alojamiento por noche (yuanes)',
        allowancePerDay: 'Dieta por día (yuanes)',
      },
    },
    rules: {
      relatedFlows: 'Procesos relacionados (editar en el nodo)',
      editAtNode: 'Editar en nodo del proceso',
      title: 'Resumen e historial de reglas',
      description:
        'Consulta reglas actuales, cambios programados e historial. Abre un nodo del proceso relacionado para editar; las reglas compartidas afectan a varios procesos.',
      loadFailedTitle: 'No se han podido cargar las reglas de aprobación',
      notFound: 'Esta regla no existe.',
      change: 'Modificación',
      history: 'Historial',
      changeTitle: 'Cambiar «{{name}}»',
      changeDescription:
        'El nuevo valor se aplica a las solicitudes enviadas desde su entrada en vigor.',
      changed: 'Se ha cambiado «{{name}}»',
      historyTitle: 'Historial de «{{name}}»',
      currentValue: 'Ahora: {{value}}',
      scheduledValue: 'Desde {{date}}: {{value}}',
      defaultVersion: 'Predeterminado',
      withdraw: 'Retirar',
      withdrawn: 'Se ha retirado el cambio programado de «{{name}}»',
      withdrawTitle: '¿Retirar el cambio de «{{name}}» del {{date}}?',
      withdrawDescription: 'El valor programado {{value}} no entrará en vigor.',
      versionStatus: { current: 'Vigente', scheduled: 'Programado' },
      fields: {
        rule: 'Regla',
        current: 'Valor actual',
        scheduled: 'Programado',
        newValue: 'Nuevo valor',
        value: 'Valor',
        note: 'Nota',
        effectiveFrom: 'Entrada en vigor',
        changedBy: 'Modificado por',
      },
      effective: {
        label: 'Entrada en vigor',
        now: 'Inmediatamente',
        fromDate: 'Desde una fecha',
        dateLabel: 'Fecha de efecto',
        hint: 'Desde las 00:00 de ese día.',
        dateRequired: 'Elige la fecha de entrada en vigor.',
        pastError: 'Elige una fecha a partir de mañana.',
      },
      errors: {
        valueRequired: 'Introduce un valor.',
        notANumber: 'Introduce un número.',
        minimum: 'Introduce al menos {{min}}.',
        percentRange: 'Introduce un porcentaje entre {{min}} y {{max}}.',
        integer: 'Introduce un número entero.',
        halfDays: 'Introduce días en incrementos de 0,5.',
        noteTooLong: 'Utiliza como máximo {{max}} caracteres.',
        invalidValue: 'Este valor no se admite.',
        orderViolated:
          'Este valor no mantiene el orden respecto a una regla relacionada (por ejemplo, el umbral de vicepresidencia supera el de dirección general). Modifica primero la regla relacionada.',
        versionExists:
          'Ya hay un cambio que entra en vigor en ese momento. Elige otra fecha.',
        inEffect:
          'Este cambio ya ha entrado en vigor y ahora forma parte del historial.',
      },
      domains: {
        spend: {
          title: 'Gastos',
          description:
            'Umbrales de importes de la escala de gastos y otras aprobaciones monetarias.',
        },
        leave: {
          title: 'Ausencia',
          description:
            'Duraciones de ausencias que requieren al responsable del departamento o a RR. HH.',
        },
        attendance: {
          title: 'Asistencia',
          description: 'Límites de horas extra y correcciones de asistencia.',
        },
        hr: {
          title: 'RR. HH.',
          description: 'Niveles jerárquicos y umbrales de subidas salariales.',
        },
        sla: {
          title: 'Plazos de aprobación',
          description:
            'Recordatorios y escalamientos, contados en horas laborables.',
        },
        committee: {
          title: 'Comités de revisión',
          description: 'Valores predeterminados de votos de comité.',
        },
        calendar: {
          title: 'Calendario laboral',
          description: 'Horario laboral y zona horaria.',
        },
      },
      units: {
        money: '¥{{value}}',
        count: '{{value}} veces',
        integer: '{{value}}',
        days: '{{value}} días',
        hours: '{{value}} horas',
        workingHours: '{{value}} horas laborables',
        rank: 'Nivel {{value}}',
      },
      unitSuffix: {
        money: 'yuanes',
        count: 'veces',
        integer: '',
        days: 'días',
        hours: 'horas',
        workingHours: 'horas laborables',
        ratio: '%',
        rank: 'nivel',
      },
      keys: {
        leave_annualAccrualEnabled: {
          label: 'Acumulación automática de vacaciones anuales',
          description:
            '0 desactiva las concesiones automáticas; 1 activa la acumulación diaria. Completa las fechas de inicio de la vida laboral de los empleados antes de activarla.',
        },
        leave_annualCarryExpiryMonth: {
          label: 'Mes de caducidad de vacaciones arrastradas',
          description:
            'Mes del año siguiente en que caducan las vacaciones anuales sin utilizar (1–12).',
        },
        leave_annualCarryExpiryDay: {
          label: 'Día de caducidad de vacaciones arrastradas',
          description:
            'Último día válido del mes de caducidad (1–31); los meses más cortos utilizan su último día.',
        },
        spend_vp: {
          label: 'Umbral de vicepresidencia',
          description:
            'Los importes superiores requieren al vicepresidente responsable.',
        },
        spend_gm: {
          label: 'Umbral de dirección general',
          description:
            'Los importes superiores requieren a la dirección general.',
        },
        expense_head: {
          label: 'Reembolsos que omiten al responsable de departamento',
          description:
            'Los reembolsos de hasta este importe los aprueba el responsable directo.',
        },
        loan_head: {
          label: 'Umbral de anticipos del responsable de departamento',
          description:
            'Los anticipos superiores requieren al responsable de departamento.',
        },
        loan_personalMax: {
          label: 'Límite personal de anticipos',
          description: 'Deuda máxima que una persona puede tener a la vez.',
        },
        purchase_quotes: {
          label: 'Se requieren tres presupuestos por encima de',
          description:
            'Las compras superiores requieren tres presupuestos competidores.',
        },
        contract_gm: {
          label: 'Umbral contractual de dirección general',
          description:
            'Los contratos superiores requieren a la dirección general.',
        },
        asset_scrapGm: {
          label: 'Umbral de baja de activos',
          description:
            'La baja de activos cuyo valor original supere este importe requiere a la dirección general.',
        },
        budget_increaseGm: {
          label: 'Umbral de aumento presupuestario',
          description:
            'Los aumentos presupuestarios superiores requieren a la dirección general.',
        },
        leave_head: {
          label: 'Ausencias que requieren al responsable de departamento',
          description:
            'Las ausencias de al menos estos días requieren al responsable de departamento.',
        },
        leave_hr: {
          label: 'Ausencias que requieren a RR. HH.',
          description:
            'Las ausencias de al menos estos días requieren a RR. HH.',
        },
        overtime_monthlyHead: {
          label:
            'Horas extra mensuales que requieren al responsable de departamento',
          description:
            'Las horas extra mensuales superiores a esta cantidad requieren al responsable de departamento.',
        },
        attendance_fixPerMonth: {
          label: 'Correcciones de asistencia por mes',
          description:
            'Número de correcciones que una persona puede solicitar al mes.',
        },
        grade_managerRank: {
          label: 'Orden del nivel de responsable',
          description:
            'Los niveles con este orden o superior se consideran de responsable.',
        },
        grade_directorRank: {
          label: 'Orden del nivel de director',
          description:
            'Los niveles con este orden o superior se consideran de director.',
        },
        raise_vp: {
          label: 'Subida salarial que requiere a vicepresidencia',
          description:
            'Los aumentos superiores a este porcentaje requieren a vicepresidencia.',
        },
        raise_gm: {
          label: 'Subida salarial que requiere a dirección general',
          description:
            'Los aumentos superiores a este porcentaje requieren a dirección general.',
        },
        sla_remindHours: {
          label: 'Recordatorio después de',
          description: 'Recuerda al aprobador tras este tiempo laborable.',
        },
        sla_escalateHours: {
          label: 'Escalamiento después de',
          description:
            'Escala al responsable del aprobador tras este tiempo laborable.',
        },
        sla_urgeCooldownHours: {
          label: 'Intervalo entre reclamaciones',
          description:
            'Tiempo que el solicitante debe esperar entre reclamaciones.',
        },
        committee_min: {
          label: 'Votos de aprobación de comité',
          description:
            'Número predeterminado de votos favorables que necesita un comité.',
        },
        calendar_workHours: {
          label: 'Horario laboral',
          description: 'Franja diaria de trabajo.',
        },
        calendar_timeZone: {
          label: 'Zona horaria',
          description: 'Zona horaria del calendario.',
        },
      },
    },
    sequences: {
      title: 'Numeración de documentos',
      description:
        'Números emitidos por cada prefijo de documento y mes. Los números se emiten al enviar.',
      loadFailedTitle: 'No se han podido cargar los números de documentos',
      searchPlaceholder: 'Filtrar por prefijo, como LV',
      searchLabel: 'Filtrar por prefijo',
      fields: {
        prefix: 'Prefijo',
        period: 'Mes',
        issued: 'Entregado',
        next: 'Siguiente número',
      },
      empty: {
        title: 'Aún no se han emitido números',
        description: 'Los números aparecen aquí cuando se envían solicitudes.',
      },
    },
    auditLogs: {
      title: 'Registro de auditoría',
      description:
        'Registro de solo lectura de cambios sensibles de organización, personas, reglas y configuración.',
      loadFailedTitle: 'No se ha podido cargar el registro de auditoría',
      system: 'Sistema',
      notFound: 'Esta entrada no existe.',
      detailTitle: 'Entrada de auditoría: {{action}}',
      detailTitleLoading: 'Entrada de auditoría',
      changes: 'Cambios realizados',
      noChanges: 'No se han registrado valores.',
      changed: 'Modificado',
      wholeValue: 'Valor',
      fields: {
        at: 'Hora',
        actor: 'Por',
        action: 'Acción',
        targetType: 'Tipo de objeto',
        targetId: 'Objeto',
        reason: 'Motivo',
        field: 'Campo',
        before: 'Antes',
        after: 'Después',
      },
      filters: {
        allTargetTypes: 'Todos los tipos de objeto',
        allActions: 'Todas las acciones',
        actor: 'Cualquiera',
        dateRange: 'Cualquier fecha',
        presets: 'Intervalo rápido',
      },
      presets: {
        last7: 'Últimos 7 días',
        last30: 'Últimos 30 días',
        thisMonth: 'Este mes',
        lastMonth: 'Mes anterior',
        last90: 'Últimos 90 días',
      },
      empty: {
        title: 'Aún no hay entradas de auditoría',
        description:
          'Los cambios sensibles se registran aquí a medida que se realizan.',
      },
    },
  },
};

export type PlatformLocale = typeof platformEnUS;

export default platformEnUS;
