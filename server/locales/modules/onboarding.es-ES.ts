export default {
  onboarding: {
    notifications: {
      overdueTitle: 'Tarea de incorporación vencida',
      overdueBody:
        'Una tarea de incorporación ha vencido. Revisa el trabajo que tienes asignado.',
    },
    authz: {
      resource: 'Incorporación',
      readable: 'Participantes en la incorporación',
      view: 'Ver incorporaciones',
      create: 'Crear incorporación',
      cancel: 'Cancelar incorporación',
      claim: 'Asumir tarea',
      reassignMentor: 'Reasignar responsable de departamento',
      transfer: 'Transferir',
      release: 'Liberar tarea',
      complete: 'Completar tarea',
      forceComplete: 'Forzar finalización',
      viewSalary: 'Ver salario de incorporación',
      viewBank: 'Ver datos bancarios de incorporación',
    },
    errors: {
      employeeSourceConflict:
        'El origen de incorporación ya está vinculado a otros datos de empleado.',
      employeeAccountEnabled:
        'La cuenta de incorporación debe permanecer desactivada mientras se crea la ficha de empleado.',
      forbidden:
        'No tienes permiso para realizar esta operación de incorporación.',
      sourceInvalid:
        'La asignación de contratación o los datos empresariales de incorporación ya no son válidos.',
      idempotencyConflict:
        'Este identificador de comando ya se ha utilizado con otros datos.',
    },
  },
};
