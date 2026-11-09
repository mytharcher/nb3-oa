import type { ApprovalReviewLocale } from './en-US.js';
const locale: ApprovalReviewLocale = {
  approvalAi: {
    history: {
      title: 'Historial de generación',
      total: 'Intentos: {{count}}',
      succeeded: 'Correcto',
      failed: 'Fallido',
      cancelled: 'Cancelado',
      generating: 'Generando',
      unavailable: 'No disponible',
      current: 'Mostrando',
      viewing: 'Versión de sugerencia V{{count}}',
      viewLatest: 'Ver último informe',
      failedReport:
        'La última generación falló. Se sigue mostrando V{{count}}.',
      cancelledReport:
        'La última generación se canceló. Se muestra V{{count}}.',
      unknownFailure:
        'La generación falló; no se registró una causa específica.',
      invalidReport: 'El contenido generado no superó la validación.',
      outputLimit:
        'Se alcanzó el límite de salida antes de completar el informe.',
      interrupted:
        'La generación se interrumpió. Reintenta para iniciar un nuevo intento.',
      incomplete: 'El modelo no completó el informe.',
      invalidJson: 'El modelo no devolvió un informe JSON completo.',
      unverifiedEvidence:
        'No se pudo verificar una cita del informe con los materiales proporcionados.',
      started: 'Inicio: {{time}}',
      deadline: 'Límite: {{time}}',
      tokens:
        'Tokens: entrada {{input}} · salida {{output}} · razonamiento {{reasoning}}',
      duration: 'Llamada al modelo: {{seconds}} s',
      network: 'Falló la conexión con el modelo.',
      rateLimited: 'Se alcanzó el límite de solicitudes del servicio.',
      configuration:
        'La configuración o las credenciales del servicio no son válidas.',
      quota: 'Se agotó la cuota del servicio del modelo.',
      contextLimit: 'Los materiales superan el límite de contexto del modelo.',
      providerRejected:
        'El servicio del modelo rechazó la solicitud de generación.',
      timeout: 'Se agotó el tiempo de generación.',
    },
    retry: 'Reintentar generación',
    readOnly: 'Esta sugerencia es de solo lectura.',
    actionFailed: 'Error. Actualice el estado antes de reintentar.',
    versionCount: '{{current}} / {{count}}',
    version: 'Versión {{count}}',
    latestVersion: '(última)',
    latestRunActions: 'Las acciones afectan a la generación actual.',
    cancelGeneration: 'Cancelar generación',
    cancelling: 'Cancelando…',
    expandReport: 'Expandir detalles',
    collapseReport: 'Contraer detalles',
    findings: 'Comprobaciones',
    generatedAt: 'Generado el',
    nextStep: 'Siguiente paso sugerido:',
    noFindings: 'Sin resultados',
    noMaterials: 'No se registraron documentos. Revise los originales.',
    coverageCounts:
      'Leídos {{read}} · No compatibles {{unsupported}} · Ausentes {{missing}}',
    reviewPrivacy:
      'Contenido de IA orientativo. Verifique las pruebas antes de decidir.',
    historyReadOnly: 'Sugerencia de una tarea finalizada, solo para consulta.',
    materialKinds: {
      field: 'Campo de solicitud',
      text: 'Texto',
      attachment: 'Adjunto',
      knowledge: 'Base de revisión',
      record: 'Registro de negocio',
      aggregate: 'Datos agregados',
    },
    materialStatuses: {
      partial_read: 'Lectura parcial',
      read: 'Leído',
      not_supported: 'No compatible',
      missing: 'Ausente o inaccesible',
    },
    stateHints: {
      cancelled: 'Generación cancelada. Puede generarla de nuevo.',
      none: 'Sin sugerencias. Genere una manualmente; puede continuar aprobando.',
      queued: 'En espera. Puede continuar con la aprobación.',
      running: 'Generando sugerencia. Puede continuar con la aprobación.',
      failed: 'Error de generación. Puede reintentar.',
    },
    verdicts: {
      conforms: 'Conforme',
      nonconforming: 'No conforme',
      needs_verification: 'Por verificar',
      not_covered: 'No cubierto',
    },
    title: 'Asistente de aprobación IA',
    refresh: 'Actualizar',
    submittingGeneration: 'Enviando solicitud…',
    statuses: {
      cancelled: 'Cancelada',
      none: 'No generada',
      queued: 'En cola',
      running: 'Generando',
      succeeded: 'Lista',
      failed: 'Error de generación',
    },
    generate: 'Generar sugerencia',
    regenerate: 'Generar de nuevo',
    model: 'Modelo',
    coverage: 'Cobertura de documentos',
    evidence: 'Pruebas',
  },
};
export default locale;
