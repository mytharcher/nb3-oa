export default {
  attendanceResults: {
    title: 'Resultados de asistencia',
    description:
      'Revisa la asistencia diaria, resuelve fichajes ausentes y consulta tu resumen mensual.',
    month: 'Mes',
    employee: 'Empleado',
    department: 'Departamento',
    date: 'Fecha',
    status: 'Estado',
    dailyResult: 'Asistencia diaria',
    normalDays: 'Días normales',
    exceptionDays: 'Días con incidencias',
    blockedDays: 'Días que requieren revisión',
    restDays: 'Días de descanso',
    lateMinutes: 'Retraso (min)',
    earlyMinutes: 'Salida anticipada (min)',
    missingPunches: 'Fichajes ausentes',
    absentMinutes: 'Ausencia sin justificar (min)',
    approvedOvertimeMinutes: 'Horas extra aprobadas (min)',
    statuses: {
      normal: 'Normal',
      exception: 'Incidencia',
      blocked: 'Requiere revisión',
      rest: 'Día de descanso',
    },
    timeZone:
      'Las fechas de asistencia siguen la zona horaria de la empresa: {{zone}}.',
    refresh: 'Actualizar',
    clear: 'Borrar filtros',
    empty: 'Aún no hay resultados de asistencia',
    noResults: 'No hay resultados coincidentes',
    emptyDescription:
      'Los resultados aparecen tras el cálculo diario. Puedes calcular un día finalizado o pedir a RR. HH. que revise el calendario.',
    unnamed: 'Nombre del empleado no disponible',
    denied: 'No tienes acceso a esta operación de asistencia.',
    calculate: 'Calcular mi asistencia',
    recalculate: 'Recalcular',
    calculateDescription:
      'Selecciona un día finalizado y explica el motivo. Los resultados existentes se conservan en el historial de cálculo.',
    reason: 'Motivo',
    cancel: 'Cancelar',
    confirmCalculate: 'Calcular',
    calculating: 'Calculando…',
    calculated: 'Cálculo de asistencia completado.',
    calculateFailed:
      'No se ha podido calcular la asistencia. Comprueba que el turno haya terminado y que exista un calendario válido y vuelve a intentarlo.',
    correctIn: 'Solicitar corrección de entrada',
    correctOut: 'Solicitar corrección de salida',
    export: 'Exportar mes',
    exporting: 'Exportando…',
    exported: 'Se ha descargado la exportación de asistencia.',
    needsReview:
      'Pide a RR. HH. que revise el calendario y los registros de asistencia.',
    prefillUnavailable:
      'Este fichaje ausente ya no se puede corregir. Selecciona otro registro apto o pide ayuda a RR. HH.',
    reasons: {
      missingPrimaryDepartment:
        'Es necesario establecer tu departamento principal.',
      missingSchedule: 'No hay calendario disponible para este día.',
      missingShiftRevision: 'Es necesario revisar el turno.',
      calendarTimeZoneChanged:
        'La configuración horaria de asistencia ha cambiado. Pide a RR. HH. que la confirme.',
      unresolvableLocalTime: 'Es necesario revisar la hora del reloj.',
      missingCorrectionFact: 'Es necesario conciliar una corrección aprobada.',
      invalidActivityTime:
        'Una ausencia aprobada tiene un intervalo temporal no válido.',
      unverifiedActivitySource:
        'Es necesario verificar una ausencia antes de poder utilizarla.',
    },
  },
};
