export default {
  reportsExpense: {
    firstPage: 'Ir a la primera página',

    pageEmpty: 'No hay grupos de gastos en esta página',
    pageEmptyHint:
      'El origen actual contiene menos grupos. Ve a la primera página o utiliza Anterior para volver a una página disponible.',

    exportStarted: 'Se ha iniciado la descarga de Excel',
    reloading:
      'Actualizando… El resultado anterior seguirá visible hasta que terminen de cargarse los filtros actuales.',
    exportLock:
      'Exportando… Los filtros y la navegación están bloqueados hasta que termine la descarga.',

    title: 'Gastos liquidados por mes',
    description:
      'Gastos brutos liquidados por fecha original del gasto y categoría; no representan el efectivo neto pagado.',
    month: 'Mes del gasto (1–12, opcional)',
    effectiveYear: 'Año del calendario de empresa: {{year}}',
    sourceNotice:
      'Se pueden comprobar hasta 10 000 solicitudes liquidadas autorizadas. Cambiar el año o el mes no reduce esta exploración del origen.',
    precondition:
      'No se han podido verificar los justificantes de liquidación o se ha superado un límite del informe. Pide a un administrador que compruebe los justificantes de origen y el tamaño del informe.',
    forbidden:
      'No tienes acceso al origen actual de reembolsos. Contacta con un administrador para comprobar los permisos del origen.',
    empty: 'Aún no hay gastos liquidados en este año',
    emptyHint:
      'Solo se incluyen solicitudes autorizadas con justificantes de liquidación verificados. Comprueba el año y el mes o pide a un administrador que revise el acceso al origen.',
    fields: {
      year: 'Año',
      month: 'Mes del gasto',
      category: 'Código de categoría',
      settledRequestCount: 'Solicitudes liquidadas',
      settledExpenseCents: 'Gasto bruto liquidado (CNY, no efectivo)',
    },
  },
};
