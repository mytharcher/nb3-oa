export default {
  probationRequests: {
    businessErrors: {
      PROBATION_SELF_EVALUATION_REQUIRED:
        'Introduce la autoevaluación del empleado antes de enviar.',
      PROBATION_CONCLUSION_REQUIRED:
        'Introduce la conclusión del responsable antes de aprobar.',
      PROBATION_COMPENSATION_REQUIRED:
        'Completa la información protegida de nivel y salario en el formulario de aprobación de RR. HH.',
      PROBATION_INVALID_GRADE: 'Selecciona un nivel activado.',
      PROBATION_ALREADY_ACTIVE:
        'Este empleado ya tiene una solicitud activa de período de prueba. Abre la solicitud existente.',
      PROBATION_STALE_EMPLOYEE:
        'La información del período de prueba del empleado ha cambiado. Actualiza antes de actuar de nuevo.',
      PROBATION_DEPARTMENT_REQUIRED:
        'El empleado necesita un departamento principal activo. Pide a RR. HH. que actualice la ficha.',
    },

    title: 'Solicitudes de período de prueba',
    description:
      'Revisa las evaluaciones del período de prueba y sigue la decisión de confirmación de empleo.',
    new: 'Nueva solicitud de período de prueba',
    edit: 'Editar',
    details: 'Ver detalles',
    number: 'Número',
    employee: 'Empleado',
    probationEndDate: 'Fecha de fin del período de prueba',
    conclusion: 'Conclusión',
    search: 'Buscar número, nombre del empleado o autoevaluación',
    view: 'Vista de registros',
    allStatuses: 'Todos los estados',
    refresh: 'Actualizar',
    clearFilters: 'Borrar filtros',
    emptyTitle: 'Aún no hay solicitudes de período de prueba',
    emptyDescription:
      'Los empleados reciben borradores automáticos cerca del vencimiento. RR. HH. puede crear una evaluación para un empleado en prueba.',
    noResults: 'No hay solicitudes coincidentes',
    rowActions: 'Acciones para {{name}}',
    views: {
      mine: 'Mías',
      pending: 'Pendiente',
      done: 'Finalizadas',
      copied: 'Copiado',
    },
    conclusions: {
      regular: 'Confirmar empleo',
      deferred: 'Ampliar período de prueba',
      declined: 'Denegar confirmación de empleo',
    },
    statuses: {
      draft: 'Borrador',
      revision: 'Revisión',
      manager: 'Revisión del responsable',
      head: 'Revisión del departamento',
      hr: 'Revisión de RR. HH.',
      gm: 'Revisión de la dirección general',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      withdrawn: 'Retirado',
      terminated: 'Terminado',
    },
    errors: {
      forbidden:
        'No tienes acceso. Pide a un administrador que compruebe tus permisos.',
      notFound:
        'Este registro ya no existe o no está disponible. Vuelve a la página de origen.',
      conflict:
        'Esta evaluación ha cambiado. Lee la última versión antes de actuar de nuevo.',
      invalid:
        'Comprueba el contenido de la evaluación y los campos obligatorios.',
      failed: 'La solicitud no se ha completado. Vuelve a intentarlo.',
      departureUnavailable:
        'El proceso de baja laboral no está disponible; esta acción no se ha completado. La revisión de dirección general sigue pendiente.',
    },
    detail: {
      creator: 'Creado por',
      selfEvaluation: 'Autoevaluación',
      evaluation: 'Evaluación del responsable',
      deferredTo: 'Nueva fecha de fin del período de prueba',
      grade: 'Nivel',
      manager: 'Revisor responsable',
      head: 'Revisor del departamento',
      hr: 'Revisor de RR. HH.',
      gm: 'Revisor de dirección general',
      rules: 'Reglas fijadas',
      unsubmitted: 'Las reglas se fijan al enviar.',
    },
    rules: {
      grade_managerRank: 'Umbral de nivel del responsable',
      sla_remindHours: 'Horas laborables hasta el recordatorio',
      sla_escalateHours: 'Horas laborables hasta el escalamiento',
      sla_urgeCooldownHours: 'Horas mínimas entre recordatorios',
    },
    compensation: {
      title: 'Propuesta de remuneración privada',
      denied: 'No puedes ver la remuneración.',
      missing: 'No se ha guardado ninguna propuesta de remuneración.',
      grade: 'Nivel propuesto',
      salary: 'Salario base (yuanes)',
    },
    authz: {
      resource: 'Evaluaciones del período de prueba',
      submit: 'Editar y enviar evaluación del período de prueba',
      delegate: 'RR. HH. crea evaluaciones del período de prueba',
      view: 'Leer evaluaciones autorizadas del período de prueba',
      compensation: 'Acceder a remuneración privada del período de prueba',
    },
    schedule: {
      title: 'Recordatorios de fin del período de prueba',
      description:
        'Concilia las fechas del período de prueba en la zona horaria de la empresa, crea borradores de autoevaluación 14 días antes de su fin y notifica a los empleados.',
    },
  },
};
