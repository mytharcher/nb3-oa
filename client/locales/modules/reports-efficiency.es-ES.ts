export default {
  exported: 'Se ha iniciado la descarga de Excel.',
  title: 'Tiempo transcurrido de las tareas de decisión de ausencias',
  description:
    'Tareas de decisión de ausencias completadas: desde su creación hasta el cierre en milisegundos naturales, incluidas las esperas y los reenvíos históricos; agrupadas por el mes de inicio original de la solicitud. No mide tiempo laborable, SLA, tasa de devolución ni duración del proceso completo.',
  year: 'Año de inicio',
  month: 'Mes de inicio (opcional)',
  clear: 'Borrar filtros',
  export: 'Exportar Excel',
  exporting: 'Exportando…',
  refresh: 'Actualizar',
  selectYear:
    'Elige el año de inicio original de la solicitud para cargar este informe.',
  invalid:
    'Introduce un año entre 1900 y 9998 y, opcionalmente, un mes entre 1 y 12.',
  forbidden:
    'Los permisos actuales de registros o campos de ausencias no permiten este informe. Contacta con un administrador.',
  precondition:
    'Ha fallado la comprobación del límite del origen o de las marcas temporales de las tareas. Restringe el año/mes o pide a un administrador que compruebe las fechas del origen.',
  failed: 'No se ha podido cargar el informe. Vuelve a intentarlo.',
  retry: 'Reintentar',
  exportFailed: 'La exportación de Excel ha fallado. Vuelve a intentarlo.',
  empty: 'No hay tareas de decisión completadas',
  noResults: 'No hay tareas coincidentes en este mes',
  emptyHint:
    'Solo se cuentan tareas de decisión completadas de solicitudes de ausencia actualmente legibles. Elige otro año o mes de inicio.',
  total: '{{count}} grupos de etapas',
  generatedAt: 'Generado {{value}}',
  previous: 'Anterior',
  next: 'Siguiente',
  fields: {
    stage: 'Etapa',
    completedTaskCount: 'Tareas de decisión completadas',
    totalElapsedMs: 'Milisegundos naturales totales',
    averageElapsedMs: 'Media de milisegundos naturales',
  },
  stages: {
    manager: 'Responsable',
    head: 'Responsable del departamento',
    hr: 'RR. HH.',
  },
};
