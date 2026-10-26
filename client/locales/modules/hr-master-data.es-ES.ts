export default {
  hrMasterData: {
    mappingSearch:
      'Busca un registro vinculado por su identificador externo exacto (sin filtro se muestran los 100 más recientes)',
    title: 'Sincronización de RR. HH.',
    description:
      'Recibe datos maestros de organización y empleados desde una pasarela de integración aprobada. Se requieren vinculaciones de cuentas existentes; la sincronización no habilita el inicio de sesión.',
    read: 'Ver sincronización',
    sync: 'Sincronizar y reprocesar',
    manage: 'Gestionar orígenes y control de datos',
    addSource: 'Añadir origen',
    editSource: 'Editar origen',
    sourceCode: 'Código de origen (letras minúsculas, números y guiones)',
    sourceName: 'Nombre del origen',
    principal: 'Cuenta de integración autorizada',
    enabled: 'Activado',
    disabled: 'Desactivado',
    noSources: 'No hay ningún origen de RR. HH. configurado para tu cuenta.',
    recent: 'Sincronización reciente',
    latest: 'Se muestran los últimos 50 lotes de este origen.',
    items_one: '{{count}} registro',
    items_other: '{{count}} registros',
    actions: 'Acciones',
    replay: 'Reintentar lote original',
    refresh: 'Actualizar',
    noRuns: 'Aún no se han recibido lotes.',
    mappings: 'Registros vinculados',
    revision: 'Revisión {{revision}}',
    reclaim: 'Restaurar control externo',
    reclaimHelp:
      'Los cambios locales están protegidos. Restaurar el control permite al origen externo reemplazar estos campos en la próxima actualización válida. Revisa primero el registro local y explica tu decisión.',
    confirmReclaim: 'Confirmar control externo',
    reason: 'Motivo',
    cancel: 'Cancelar',
    save: 'Guardar',
    failed:
      'La operación ha fallado. Comprueba tus permisos y la configuración del origen y vuelve a intentarlo.',
    localConflict:
      'Este registro se ha modificado localmente. RR. HH. debe revisarlo y restaurar explícitamente el control externo antes de reintentar.',
    businessConflict:
      'No se ha podido aplicar un registro. Corrige los datos de origen o resuelve la restricción empresarial y reintenta el lote original.',
    states: {
      pending: 'Pendiente',
      completed: 'Completado',
      failed: 'Fallido',
    },
    entities: {
      department: 'Departamento',
      grade: 'Nivel',
      employee: 'Empleado',
    },
  },
};
