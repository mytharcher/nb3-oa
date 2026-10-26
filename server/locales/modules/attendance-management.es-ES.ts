export default {
  attendanceManagement: {
    errors: {
      ATTENDANCE_INVALID_INPUT:
        'Los justificantes originales de asistencia no son válidos.',
      ATTENDANCE_INVALID_TIME:
        'El fichaje debe corresponder a la fecha de asistencia de la empresa.',
      ATTENDANCE_INVALID_BATCH:
        'Proporciona entre 1 y 1000 filas dentro del límite de tamaño de los justificantes.',
      ATTENDANCE_SOURCE_CONFLICT:
        'La clave de origen identifica otros justificantes inmutables.',
      ATTENDANCE_IDENTITY_UNAVAILABLE:
        'Cada fila requiere una persona real con ficha de empleado.',

      NOT_FOUND: 'Este turno ya no existe.',
      ACCESS_DENIED: 'No tienes acceso a esta configuración de asistencia.',
      ATTENDANCE_ACCESS_DENIED:
        'Los permisos actuales del registro o del campo no permiten este cambio.',
      ATTENDANCE_VERSION_CONFLICT:
        'La configuración ha cambiado. Vuelve a cargarla antes de guardar.',
      ATTENDANCE_SHIFT_INVALID:
        'Introduce una definición explícita de turno válida.',
      ATTENDANCE_SHIFT_NOT_FOUND: 'El turno no existe o está desactivado.',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE:
        'No se puede modificar el código de un turno.',
      ATTENDANCE_SHIFT_CODE_CONFLICT: 'Este código de turno ya existe.',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED:
        'Utiliza una revisión en la zona horaria actual de la empresa.',
      ATTENDANCE_SCHEDULE_INVALID:
        'Elige una fecha real y un turno o día de descanso explícito.',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE:
        'Este departamento no está disponible.',
      ATTENDANCE_SCHEDULE_NOT_READABLE:
        'No se puede leer la revisión actual del calendario.',
      ATTENDANCE_LIST_INVALID: 'Los parámetros de la página no son válidos.',
      ATTENDANCE_LOCAL_TIME_INVALID:
        'El cambio de horario de verano omite o repite esta hora local. Elige límites sin ambigüedad.',
    },
    authz: {
      importResource: 'Importación de fichajes originales',
      ingest: 'Importar justificantes inmutables',
      attendanceRecords: 'Registros de asistencia originales',

      resource: 'Configuración de asistencia',
      view: 'Ver configuración de asistencia',
      manage: 'Gestionar configuración de asistencia',
      attendanceShifts: 'Turnos de asistencia',
      attendanceShiftRevisions: 'Revisiones de turnos',
      attendanceSchedules: 'Calendarios de departamentos',
      attendanceScheduleRevisions: 'Revisiones de calendarios',
    },
  },
};
