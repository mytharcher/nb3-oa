export default {
  flowDiagram: {
    escapeHint: 'Pulsa Esc para salir',
    controls: 'Controles del diagrama',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    fitView: 'Ajustar vista',
    fullscreen: 'Pantalla completa',
    exitFullscreen: 'Salir de pantalla completa',
    minimap: 'Minimapa',

    empty: 'No hay estados que mostrar.',
    loading: 'Organizando el diagrama…',
    failed:
      'No se ha podido organizar el diagrama. Consulta los parámetros del proceso y las ejecuciones recientes.',
    nodeHelp: 'Estado del proceso. Desplaza y amplía para explorar.',
    edgeHelp: 'Transición del proceso',
  },
  processManagement: {
    managementReason: 'Motivo',
    normalDescription:
      'Muestra la ruta empresarial principal; las condiciones determinan las bifurcaciones.',
    revealHint:
      'Pasa el cursor sobre un paso para mostrar sus devoluciones y otras salidas y sobre una salida para ver los detalles.',
    graphLegend: 'Leyenda del diagrama',
    otherExits: 'Otras salidas',
    exitNext: 'Después puede:',
    exitEnds: 'El proceso termina aquí.',
    nodeTypes: {
      start: 'Inicio',
      approval: 'Aprobación',
      work: 'Paso de trabajo',
      success: 'Completado',
      negative: 'Finalizado',
      exception: 'Devolución o incidencia',
    },
    rulesCount_one: '{{count}} regla',
    rulesCount_other: '{{count}} reglas',
    notReached: 'Aún no alcanzado',
    parameters: {
      title: 'Parámetros del proceso',
      description:
        'Umbrales que este proceso consulta en cada paso. Cada valor se establece una vez y se aplica a todos los pasos indicados junto a él.',
      none: 'Este proceso no tiene parámetros ajustables.',
      onNodes:
        'Este proceso se configura en sus pasos. Utiliza el botón de configuración de un paso del diagrama.',
      forbidden: 'No tienes permiso para ver los parámetros de este proceso.',
      readOnly: 'Puedes ver estos parámetros, pero no modificarlos.',
      changed: 'Modificado',
      scheduled: 'Cambia a {{value}} el {{date}}.',
      orderViolated:
        'No mantiene el orden con un parámetro relacionado: un umbral inferior no puede superar uno superior. Ajusta ambos aquí y guárdalos juntos.',
      discard: 'Descartar cambios',
      save_zero: 'Guardar',
      save_one: 'Guardar 1 cambio',
      save_other: 'Guardar {{count}} cambios',
      saved_one: '1 parámetro guardado',
      saved_other: '{{count}} parámetros guardados',
    },
    nodeSettings: {
      edit: 'Editar parámetros',
      editNamed: 'Editar parámetros de {{name}}',
      title: 'Editar parámetros de {{name}}',
      parameter: 'Parámetro',
      effect:
        'Los cambios no reescriben las instantáneas guardadas de solicitudes ni las tareas existentes. Los nuevos envíos utilizan la configuración vigente; los reenvíos siguen las reglas del proceso correspondiente.',
      shared: 'Configuración compartida. También afecta a: {{flows}}.',
      unavailable:
        'Este nodo no tiene parámetros editables disponibles. Cierra este diálogo y elige un nodo configurado.',
      forbidden: 'No tienes permiso para editar la configuración de este nodo.',
      newCommittee: 'Publicar una nueva estructura de comité',
      seat: 'Versión {{version}} · Persona de la plaza {{name}}',
      committeeContext:
        'Nodo seleccionado: versión {{selected}}. Activa: {{active}}. Última guardada: {{latest}}.',
    },
    conditionMissing:
      'Esta bifurcación necesita una descripción explícita de su condición; consulta las reglas empresariales correspondientes',
    snapshotConditions:
      'Los umbrales de importes, días y niveles utilizan las reglas fijadas al enviar. Esta definición explica los criterios de decisión, no la instantánea de una solicitud histórica.',
    branchConditions: {
      travelCancellation_unbooking:
        'El viaje original solicita reservas, por lo que la cancelación requiere anularlas',
      travelCancellation_approved:
        'El viaje original no solicita reservas, por lo que no es necesario anularlas',
      reimbursement_managerApproved_head:
        'Reembolso total > límite fijado del responsable de departamento y no se ha validado la unificación de tareas de responsable directo/departamento',
      reimbursement_managerApproved_finance:
        'El reembolso total no supera el límite del departamento o las tareas de aprobación del responsable directo/departamento se han unificado válidamente',

      training_managerApproved_head:
        'Importe de formación > 0 y las tareas de aprobación del responsable directo/departamento no se han unificado válidamente',
      training_managerApproved_finance:
        'Importe de formación > 0; el responsable directo y el de departamento son la misma persona y esta ronda supera la validación de unificación de tareas',
      training_managerApproved_approved: 'El importe de formación es cero',

      travel_managerApproved_head:
        'No se cumplen las condiciones de unificación de responsables',
      travel_managerApproved_finance:
        'El responsable directo y el de departamento son la misma persona y esta ronda supera la validación de unificación de tareas',
      probation_managerApproved_head:
        'No se cumplen las condiciones de unificación de responsables',
      probation_managerApproved_hr:
        'El responsable directo y el de departamento son la misma persona y esta ronda supera la validación de unificación de tareas',
      departure_managerApproved_head:
        'No se cumplen las condiciones de unificación de responsables',
      departure_managerApproved_hr:
        'El responsable directo y el de departamento son la misma persona y esta ronda supera la validación de unificación de tareas',
      expensePlan_financeApproved_executive:
        'Se requiere aprobación de dirección: importe > límite de dirección fijado al enviar',
      expensePlan_financeApproved_gm:
        'No se requiere aprobación de dirección; importe > límite de dirección general fijado al enviar',
      expensePlan_financeApproved_approved:
        'No se aplican condiciones de aprobación adicional de dirección ni de dirección general',
      expensePlan_executiveApproved_gm:
        'Se requiere aprobación de dirección general y no se ha validado la unificación de tareas de dirección/dirección general',
      expensePlan_executiveApproved_approved:
        'No se requiere aprobación de dirección general o las tareas de dirección/dirección general se han unificado válidamente',
      loan_financeApproved_executive:
        'Se requiere aprobación de dirección: importe > límite de dirección fijado al enviar',
      loan_financeApproved_gm:
        'No se requiere aprobación de dirección; importe > límite de dirección general fijado al enviar',
      loan_financeApproved_cashier:
        'No se aplican condiciones de aprobación adicional de dirección ni de dirección general',
      loan_executiveApproved_gm:
        'Se requiere aprobación de dirección general y no se ha validado la unificación de tareas de dirección/dirección general',
      loan_executiveApproved_cashier:
        'No se requiere aprobación de dirección general o las tareas de dirección/dirección general se han unificado válidamente',
      purchase_financeApproved_executive:
        'Se requiere aprobación de dirección: importe > límite de dirección fijado al enviar',
      purchase_financeApproved_gm:
        'No se requiere aprobación de dirección; importe > límite de dirección general fijado al enviar',
      purchase_financeApproved_approved:
        'No se aplican condiciones de aprobación adicional de dirección ni de dirección general',
      purchase_executiveApproved_gm:
        'Se requiere aprobación de dirección general y no se ha validado la unificación de tareas de dirección/dirección general',
      purchase_executiveApproved_approved:
        'No se requiere aprobación de dirección general o las tareas de dirección/dirección general se han unificado válidamente',
      payment_financeApproved_executive:
        'Se requiere aprobación de dirección: escala completa de aprobación e importe > límite de dirección fijado al enviar',
      payment_financeApproved_gm:
        'No se requiere aprobación de dirección; importe > límite de dirección general fijado al enviar y se requiere aprobación completa',
      payment_financeApproved_cashier:
        'No se aplican condiciones de aprobación adicional de dirección ni de dirección general',
      payment_executiveApproved_gm:
        'Se requiere aprobación de dirección general y no se ha validado la unificación de tareas de dirección/dirección general',
      payment_executiveApproved_cashier:
        'No se requiere aprobación de dirección general o las tareas de dirección/dirección general se han unificado válidamente',
      travel_financeApproved_executive:
        'Se requiere aprobación de dirección: viaje internacional o importe > límite de dirección fijado al enviar',
      travel_financeApproved_gm:
        'No se requiere aprobación de dirección; importe > límite de dirección general fijado al enviar',
      travel_financeApproved_booking:
        'No se requieren más aprobaciones de dirección/dirección general y se solicitan reservas',
      travel_financeApproved_completed:
        'No se requieren más aprobaciones de dirección/dirección general y no se solicitan reservas',
      travel_executiveApproved_gm:
        'Se requiere aprobación de dirección general y no se ha validado la unificación de tareas de dirección/dirección general',
      travel_executiveApproved_booking:
        'No se requiere aprobación de dirección general o se ha unificado válidamente; se solicitan reservas',
      travel_executiveApproved_completed:
        'No se requiere aprobación de dirección general o se ha unificado válidamente; no se solicitan reservas',
      travel_gmApproved_booking: 'Se solicitan reservas',
      travel_gmApproved_completed: 'No se solicitan reservas',
      payment_submit_head:
        'La comprobación del origen de fondos requiere la escala completa de aprobación, incluidos pagos en exceso con aprobación adicional',
      payment_submit_finance:
        'La comprobación del origen de fondos no requiere la escala completa de aprobación',
      budgetAdjustment_cfoApproved_gm:
        'El aumento presupuestario supera el límite de dirección general fijado al enviar',
      budgetAdjustment_cfoApproved_approved:
        'No es un aumento presupuestario o no supera el límite fijado de dirección general',
      leave_managerApproved_head:
        'Días ≥ límite fijado del responsable de departamento y este no existe o es distinto del responsable directo',
      leave_managerApproved_hr:
        'No se requiere revisión del departamento; el tipo de ausencia requiere RR. HH. o días ≥ límite fijado de RR. HH.',
      leave_managerApproved_approved:
        'Sin revisión de departamento, tipo de ausencia sin RR. HH. obligatorio y días por debajo del límite fijado de RR. HH.',
      leave_headApproved_hr:
        'El tipo de ausencia requiere RR. HH. o días ≥ límite fijado de RR. HH.',
      leave_headApproved_approved:
        'El tipo de ausencia no requiere RR. HH. y los días están por debajo del límite fijado',
      overtime_managerApproved_head:
        'Las horas extra mensuales superan el límite fijado de revisión del departamento y el responsable no existe o es distinto del directo',
      overtime_managerApproved_hr:
        'No se requiere revisión del departamento; enviado más de 3 días laborables después de las horas extra',
      overtime_managerApproved_approved:
        'No se requiere revisión del departamento; enviado dentro del plazo de 3 días laborables',
      overtime_headApproved_hr:
        'Enviado más de 3 días laborables después de las horas extra',
      overtime_headApproved_approved:
        'Enviado dentro de los 3 días laborables posteriores a las horas extra',
      supplies_submit_issuing:
        'Reenviado desde una incidencia de ejecución con el contenido aprobado sin cambios',
      supplies_submit_manager:
        'Solicitud nueva, contenido cubierto por aprobación modificado o condiciones de reanudación no cumplidas',
      vehicleRequest_submit_dispatch:
        'Reenviado desde una incidencia de ejecución con el contenido aprobado sin cambios',
      vehicleRequest_submit_head:
        'Solicitud nueva, contenido cubierto por aprobación modificado o condiciones de reanudación no cumplidas',
      purchase_submit_purchasing:
        'Reenviado desde una incidencia de ejecución con el contenido aprobado sin cambios',
      purchase_submit_head:
        'Solicitud nueva, contenido cubierto por aprobación modificado o condiciones de reanudación no cumplidas',
      assetRequest_submit_issuing:
        'Reenviado desde una incidencia de ejecución con contenido aprobado sin cambios; apto para reanudar; no es una solicitud de baja de activos',
      assetRequest_submit_head:
        'Solicitud nueva, contenido cubierto por aprobación modificado o condiciones de reanudación no cumplidas',
      sealRequest_submit_stamping:
        'Reenviado desde una incidencia de ejecución con contenido aprobado sin cambios; apto para reanudar',
      sealRequest_submit_head:
        'Solicitud nueva, contenido cubierto por aprobación modificado o condiciones de reanudación no cumplidas',
      purchase_priced_revision:
        'Precio real > 120 % de la estimación original; se requieren confirmación del solicitante y reenvío',
      purchase_priced_finance: 'Precio real ≤ 120 % de la estimación original',
      purchase_forcedPriced_revision:
        'Precio real > 120 % de la estimación original; se requieren confirmación del solicitante y reenvío',
      purchase_forcedPriced_finance:
        'Precio real ≤ 120 % de la estimación original',
      probation_hrApproved_gm:
        'Se deniega la confirmación de empleo o el nivel confirmado por RR. HH. alcanza el umbral fijado de responsable',
      probation_hrApproved_approved:
        'No se deniega la confirmación de empleo y el nivel confirmado por RR. HH. está por debajo del umbral de responsable',
      departure_hrApproved_gm:
        'Nivel del empleado ≥ umbral de responsable fijado al enviar',
      departure_hrApproved_handover:
        'El nivel del empleado está por debajo del umbral fijado de responsable',
      departure_cancellationRejected_gm:
        'Cancelación rechazada; se reanuda el estado guardado de dirección general anterior a la cancelación',
      departure_cancellationRejected_handover:
        'Cancelación rechazada; se reanuda el estado guardado de traspaso anterior a la cancelación',
      departure_cancellationRejected_completed:
        'Cancelación rechazada; se reanuda el estado guardado de completado anterior a la cancelación',
      recruitment_submit_head:
        'El solicitante no es el responsable del departamento o este no existe',
      recruitment_submit_hrbp:
        'El solicitante es el responsable del departamento; se omite la autoaprobación',
      recruitment_reviewEdit_head:
        'El solicitante no es el responsable del departamento o este no existe',
      recruitment_reviewEdit_hrbp:
        'El solicitante es el responsable del departamento; se omite la autoaprobación',
      recruitment_hrDirectorApproved_executive:
        'La petición utiliza una ampliación de plantilla',
      recruitment_hrDirectorApproved_gm:
        'No es ampliación de plantilla; el nivel de destino alcanza el umbral fijado de director',
      recruitment_hrDirectorApproved_approved:
        'No es ampliación de plantilla; el nivel de destino está por debajo del umbral fijado de director',
      recruitment_executiveApproved_gm:
        'Ampliación de plantilla o nivel de destino que alcanza el umbral de director',
      recruitment_executiveApproved_approved:
        'Sin ampliación de plantilla y nivel de destino por debajo del umbral de director',
      transfer_submit_manager:
        'Quien envía no es el responsable del empleado; la ausencia de responsable también entra en revisión del responsable',
      transfer_submit_sourceHead: 'Quien envía es el responsable del empleado',
      transfer_reviewEdit_manager:
        'Quien envía no es el responsable del empleado; la ausencia de responsable también entra en revisión del responsable',
      transfer_reviewEdit_sourceHead:
        'Quien envía es el responsable del empleado',
      transfer_sourceHeadApproved_targetHead:
        'El cambio incluye un traslado de departamento',
      transfer_sourceHeadApproved_hr:
        'El cambio no incluye un traslado de departamento',
      transfer_hrApproved_executive:
        'La subida salarial supera el umbral fijado de dirección o el nivel de destino alcanza el de responsable',
      transfer_hrApproved_gm:
        'Sin revisión de dirección; la subida supera el umbral fijado de dirección general o el nivel de destino alcanza el de director',
      transfer_hrApproved_pendingEffective:
        'No se aplican condiciones salariales o de nivel para revisión adicional de dirección/dirección general',
      transfer_executiveApproved_gm:
        'La subida supera el umbral fijado de dirección general o el nivel de destino alcanza el de director',
      transfer_executiveApproved_pendingEffective:
        'No se aplican condiciones salariales ni de nivel para revisión adicional de dirección general',
      assetRequest_headApproved_appraisal:
        'La solicitud es una baja de activos',
      assetRequest_headApproved_issuing:
        'La solicitud no es una baja de activos',
      assetRequest_financeApproved_gm:
        'Solicitud de baja; el valor original total de activos supera el límite fijado de dirección general',
      assetRequest_financeApproved_scrapped:
        'No se supera el umbral de valor original para dirección general en bajas',
      assetRequest_issueCompleted_returning:
        'Solicitud de préstamo: entregar y después procesar la devolución',
      assetRequest_issueCompleted_issued: 'La solicitud no es de préstamo',
      sealRequest_stamped_returning:
        'El préstamo externo de sellos requiere procesar la devolución',
      sealRequest_stamped_completed: 'El sello no se utiliza externamente',
      vendorQualification_submit_removalReview:
        'La operación elimina un proveedor del directorio',
      vendorQualification_submit_purchasing:
        'La operación no elimina un proveedor',
      contract_headApproved_legalFinance:
        'Terminación contractual o plantilla no estándar',
      contract_headApproved_standardFinance:
        'No es terminación y se utiliza una plantilla estándar',
      contract_legalFinanceApproved_executive:
        'El importe contractual supera el límite fijado de dirección; no es una terminación',
      contract_legalFinanceApproved_gm:
        'Sin revisión de dirección; el importe supera el límite contractual fijado de dirección general o Asesoría jurídica/Finanzas lo marca no estándar; no es terminación',
      contract_legalFinanceApproved_approved:
        'Terminación o sin condiciones de aprobación adicionales',
      contract_standardFinanceApproved_executive:
        'El importe contractual supera el límite fijado de dirección',
      contract_standardFinanceApproved_gm:
        'Sin revisión de dirección; el importe supera el límite contractual fijado de dirección general',
      contract_standardFinanceApproved_approved:
        'No se superan los umbrales de dirección ni dirección general de contratos',
      contract_executiveApproved_gm:
        'El importe supera el límite contractual fijado de dirección general o el contrato no es estándar',
      contract_executiveApproved_approved:
        'El importe no supera el límite contractual de dirección general y el contrato es estándar',
      committeeVersion:
        'Utiliza el grupo de comité correspondiente a la versión fijada al enviar',
      returnApplicant:
        'La decisión de devolución selecciona revisión del solicitante y reenvío',
      returnEarlier:
        'La decisión de devolución selecciona esta etapa de aprobación anterior ya visitada',
      seal_legal:
        'Tras revisión del departamento: sello contractual o contrato vinculado',
      seal_financeManager:
        'Desde revisión del departamento/jurídica: sello financiero, después de la prioridad de ruta contractual',
      seal_gm:
        'Sin bifurcación jurídica/financiera aplicable; sello del representante o uso externo y el revisor actual no es dirección general',
      seal_stamping:
        'Sin bifurcación jurídica/financiera aplicable y sin revisión adicional de dirección general, o el revisor actual es dirección general',
    },

    conditional: 'Se aplican condiciones empresariales',
    transitionUnknown: 'Acción: {{name}}',
    transitionNames: {
      edit: 'Editar contenido',
      submit: 'Enviar',
      approved: 'Aprobación superada',
      rejected: 'Rechazar',
      returned: 'Devolver para revisión',
      withdraw: 'Retirar',
      terminate: 'Terminar',
      booked: 'Reserva completada',
      bookingFailed: 'Reserva fallida',
      bookingForced: 'Confirmar finalización',
      retryBooking: 'Reintentar reserva',
      reviseTrip: 'Revisar viaje',
      cancelApproved: 'Cancelación aprobada',
      issued: 'Entrega completada',
      unavailable: 'No disponible / ejecución fallida',
      forceClosed: 'Forzar cierre',
    },

    place: 'Puesto vacante',
    placeNumber: 'Puesto vacante {{number}}',
    placeRequired: 'Elige un puesto vacante.',
    title: 'Gestión de procesos',
    description:
      'Consulta definiciones, ejecuciones e historial de aprobación de procesos autorizados',
    definitions: 'Definiciones',
    executions: 'Ejecuciones',
    refresh: 'Actualizar',
    search: 'Buscar por número, proceso o solicitante',
    definitionSearch: 'Buscar por nombre de proceso',
    clear: 'Borrar filtros',
    all: 'Todas',
    name: 'Nombre',
    domain: 'Área empresarial',
    category: 'Categoría',
    capabilities: 'Capacidades de gestión',
    approval: 'Proceso de aprobación',
    connected: 'Conectado',
    readOnly: 'Solo lectura',
    notConnected: 'Acciones de gestión aún no conectadas',
    reference: 'Número / título',
    applicant: 'Solicitante',
    status: 'Estado',
    stage: 'Etapa actual',
    createdAt: 'Iniciado',
    endedAt: 'Finalizado',
    empty: 'Aún no hay ejecuciones',
    emptyDescription:
      'Las ejecuciones de procesos conectados aparecen aquí al iniciarse',
    noDefinitions: 'No hay definiciones legibles',
    noDefinitionsDescription:
      'Pide a un administrador que configure el acceso a definiciones',
    noResults: 'No hay registros coincidentes',
    noResultsDescription: 'Ajusta o borra los filtros para encontrar registros',
    definitionGraph: 'Definición actual',
    graphDescription:
      'Estados y transiciones registrados actualmente; las reglas empresariales determinan las bifurcaciones dinámicas',
    currentNode: 'Estado actual',
    visitedNode: 'Visitado',
    unvisitedNode: 'No visitado',
    executionHistory: 'Historial de ejecución',
    terminationOutcome: 'Resultado de terminación',
    actualPath: 'Ruta real de ejecución',
    actualDescription:
      'El flujo completo de aprobación y ejecución con nodos visitados, transiciones y estado actual resaltados. Las devoluciones reales y las rutas históricas siguen visibles.',
    tasks: 'Tareas e historial de aprobación',
    timeline: 'Historial de aprobación y gestión',
    run: 'Ejecución de aprobación',
    historical: 'Historial de ejecución',
    definitionMissing: 'Definición histórica no disponible',
    commentsRestricted:
      'Los comentarios pueden contener datos privados y requieren acceso empresarial independiente',
    comment: 'Comentario / motivo',
    actor: 'Responsable',
    assignee: 'Persona asignada',
    answer: 'Decisión',
    previousTask: 'Tarea anterior',
    from: 'Desde',
    to: 'Hasta',
    initial: 'Inicial',
    final: 'Final',
    transitions: 'Transiciones de estado',
    definitionDetails: 'Etapas y transiciones',
    viewExecutions: 'Ver todos los registros',
    back: 'Volver',
    manage: 'Acciones de gestión',
    appoint: 'Asignar',
    reassign: 'Reasignar',
    terminate: 'Terminar',
    unavailable:
      'La tarea actual o el estado empresarial no permiten esta acción',
    person: 'Destinatario',
    reason: 'Motivo',
    personRequired: 'Elige un destinatario',
    reasonRequired: 'Introduce un motivo',
    cancel: 'Cancelar',
    retry: 'Reintentar',
    loadFailed: 'La carga ha fallado. Vuelve a intentarlo',
    submitFailed: 'La acción ha fallado. Revisa y vuelve a intentarlo',
    unknown: 'Resultado desconocido. Actualiza para comprobarlo',
    stale: 'La tarea ha cambiado. Actualiza y revísala',
    gone: 'El registro no existe o está fuera de tu ámbito actual',
    forbidden: 'No puedes leer esta sección. Contacta con un administrador',
    loading: 'Cargando',
    noPeople: 'No hay destinatarios aptos para la tarea actual',
    peopleSearch: 'Buscar destinatarios autorizados',
    loadMore: 'Cargar más',
    reassignTitle: 'Reasignar una tarea de «{{recordLabel}}»',
    appointTitle: 'Asignar una tarea de «{{recordLabel}}»',
    terminateTitle: 'Terminar la solicitud «{{recordLabel}}»',
    reassigned: 'Se ha reasignado una tarea de «{{recordLabel}}»',
    appointed: 'Se ha asignado una tarea de «{{recordLabel}}»',
    terminated: 'Se ha terminado la solicitud «{{recordLabel}}»',
    recentDescription:
      'Las cinco ejecuciones autorizadas más recientes. Abre la lista de ejecuciones para ver todo el historial.',
    vehicleTerminationGuard:
      'Las solicitudes con vehículo asignado no se pueden terminar directamente. El solicitante real debe registrar el uso y seguir el proceso de vehículos.',
    terminationConsequences: {
      vehicle:
        'Finaliza una solicitud sin vehículo asignado. Esta operación no puede cerrar una solicitud ya asignada.',
      leave:
        'Cierra la aprobación actual; el servicio de ausencias gestiona las reservas de cuota pendientes.',
      funding:
        'Cierra la aprobación actual; el servicio empresarial gestiona las reservas pendientes de presupuesto, financiación o solicitud. Los pagos liquidados permanecen registrados.',
      stock:
        'Cierra la aprobación actual; el servicio de material gestiona las reservas de existencias pendientes. Las devoluciones físicas requieren su proceso empresarial.',
      ordinary:
        'Cierra la aprobación actual y ejecuta los controles de terminación empresarial y su procesamiento de salida.',
    },
    terminationDescription:
      'La terminación cierra las tareas actuales y libera reservas según las reglas empresariales, conservando todo el historial. Los hechos empresariales ejecutados requieren su propia cancelación o liquidación de custodia.',
    graphView: 'Diagrama',
    dateRange: 'Fecha de inicio',
    last7: 'Últimos 7 días',
    last30: 'Últimos 30 días',
    last90: 'Últimos 90 días',
    thisMonth: 'Este mes',
    lastMonth: 'Mes anterior',
    safeHistory:
      'Esta vista solo contiene información de procesos segura y autorizada',
    business: 'Contenido empresarial',
    businessRestricted:
      'El contenido empresarial, los adjuntos y los campos privados necesitan acceso independiente',
    guardedBranch:
      'Bifurcación seleccionada según las condiciones empresariales de origen',
    frozen: 'Campos fijados',
    covered: 'Campos cubiertos',
    management: 'Intervención del administrador',
    kinds: {
      leave: 'Ausencia',
      overtime: 'Horas extra',
      leaveCancellation: 'Cancelación de ausencia',
      general: 'Solicitud general',
      attendanceChange: 'Corrección de asistencia',
      outing: 'Salida',
      supplies: 'Solicitud de material',
      budgetAdjustment: 'Ajuste presupuestario',
      expensePlan: 'Autorización de gastos',
      training: 'Formación',
      travel: 'Viajes',
      travelCancellation: 'Cancelación de viaje',
      reimbursement: 'Reembolso',
      purchase: 'Compra',
      loan: 'Solicitud de anticipo',
      payment: 'Solicitud de pago',
      probation: 'Evaluación del período de prueba',
      vehicleRequest: 'Solicitud de vehículo',
      contract: 'Contrato',
      assetRequest: 'Solicitud de activos',
      vendorQualification: 'Acreditación de proveedores',
      recruitment: 'Contratación',
      sealRequest: 'Solicitud de sello',
      transfer: 'Cambio de personal',
      departure: 'Baja laboral',
      certificateRequest: 'Solicitud de certificado',
    },
    domains: {
      office: 'Trabajo diario',
      organization: 'Organización y RR. HH.',
      finance: 'Finanzas y gastos',
      procurement: 'Compras y contratos',
      administration: 'Administración y activos',
    },
    states: {
      issued: 'Entregado',
      forcedClosed: 'Cierre forzado',
      draft: 'Borrador',
      revision: 'Revisión',
      manager: 'Responsable',
      head: 'Responsable del departamento',
      hr: 'RR. HH.',
      extra: 'Revisión adicional',
      finance: 'Finanzas',
      cashier: 'Cajero',
      executive: 'Dirección',
      gm: 'Director general',
      cfo: 'CFO',
      legal: 'Asesoría jurídica',
      financeManager: 'Responsable de finanzas',
      hrbp: 'HRBP',
      hrDirector: 'Director de RR. HH.',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      withdrawn: 'Retirado',
      terminated: 'Terminado',
      completed: 'Completado',
      exception: 'Incidencia de gestión',
      dispatch: 'Asignar',
      usage: 'Uso de vehículos',
      issuing: 'Entrega',
      returning: 'Devolución',
      returnException: 'Incidencia de devolución',
      stamping: 'Sellado',
      booking: 'Reserva',
      unbooking: 'Cancelar reserva',
      paid: 'Pagado',
      paymentException: 'Incidencia de pago',
      pendingEffective: 'Pendiente de fecha de efecto',
      cancellationReview: 'Revisión de cancelación',
      sourceHead: 'Responsable del departamento de origen',
      targetHead: 'Responsable del departamento de destino',
      committee: 'Comité',
      purchasing: 'Compras',
      inquiry: 'Consulta',
      quoting: 'Presupuesto',
      pending: 'Pendiente',
      claimed: 'Asumido',
      waiting: 'En espera',
      blocked: 'Bloqueado',
      candidate: 'Candidato',
      suspended: 'Suspendido',
      transferred: 'Transferido',
      voided: 'Cerrado',
      open: 'Abrir',
      cancelled: 'Cancelado',
      returned: 'Devuelto',
      concluded: 'Concluido',
      decide: 'Decisión',
      copy: 'Copiar',
      approve: 'Aprobar',
      reject: 'Rechazar',
      return: 'Devolver',
      unknown: 'Otro estado',
    },
    authz: {
      definitionRead: 'Definiciones',
      historyRead: 'Historial de ejecución',
      appoint: 'Asignar',
      reassign: 'Reasignar',
      terminate: 'Terminar',
    },
    otherStage: 'Otra etapa ({{name}})',
    otherEvent: 'Evento del proceso ({{name}})',
    events: {
      approve: 'Aprobado',
      reject: 'Rechazado',
      return: 'Devuelto',
      reassign: 'Reasignación administrativa',
      appoint: 'Asignación administrativa',
      comment: 'Comentar',
      transfer: 'Transferido',
      addSign: 'Firmante añadido',
      claim: 'Asumido',
      release: 'Tarea liberada',
      'stage.unassigned': 'Etapa sin asignar',
      'run.started': 'Aprobación iniciada',
      'run.ended': 'Aprobación finalizada',
      'stage.entered': 'Entrada en etapa',
      remind: 'Recordatorio',
      escalate: 'Escalado',
      read: 'Leer',
    },
  },
};
