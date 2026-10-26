import type { ReportExportsResource } from './report-exports.en-US.js';

const esES: ReportExportsResource = {
  reportExports: {
    sheet: 'Informe',
    leaveMonthly: {
      fields: {
        year: 'Año',
        month: 'Mes de inicio',
        leaveType: 'Tipo de ausencia',
        approvedRequestCount: 'Número de solicitudes aprobadas',
        approvedRequestedDays:
          'Días solicitados aprobados (antes de cancelaciones)',
      },
    },
    budgetBalances: {
      fields: {
        departmentName: 'Departamento',
        year: 'Año',
        subject: 'Partida',
        allocatedCents: 'Asignado en céntimos',
        heldCents: 'Retenido en céntimos',
        usedCents: 'Utilizado en céntimos',
        availableCents: 'Disponible en céntimos',
      },
    },
    headcountBalances: {
      fields: {
        departmentName: 'Departamento',
        positionName: 'Puesto',
        year: 'Año',
        limit: 'Límite',
        initialized: 'Inicializado',
        used: 'Utilizado',
        pending: 'Pendiente',
        allocated: 'Asignado',
        replacementPending: 'Sustitución pendiente',
        replacementAllocated: 'Sustitución asignada',
        replacementBlocked: 'Sustitución bloqueada',
        available: 'Disponible',
        capacityState: 'Estado de capacidad',
      },
    },
    contractLedger: {
      fields: {
        number: 'Número',
        departmentName: 'Departamento',
        status: 'Estado',
        amountCents: 'Importe en céntimos',
        heldCents: 'Retenido en céntimos',
        paidCents: 'Pagado en céntimos',
        availableCents: 'Disponible en céntimos',
        startsOn: 'Comienza el',
        endsOn: 'Finaliza el',
        asOf: 'A fecha de',
        expiryState: 'Estado de vencimiento',
        paymentState: 'Estado de pago',
        paidBasisPoints: 'Pagado en puntos básicos',
      },
    },
    expenseSummary: {
      fields: {
        year: 'Año',
        month: 'Mes del gasto',
        category: 'Código de categoría',
        settledRequestCount: 'Número de solicitudes liquidadas',
        settledExpenseCents: 'Gasto bruto liquidado en céntimos (no efectivo)',
      },
    },
    approvalEfficiency: {
      fields: {
        stage: 'Etapa',
        completedTaskCount: 'Número de tareas de decisión completadas',
        totalElapsedMs: 'Milisegundos naturales totales (incluye esperas)',
        averageElapsedMs: 'Media de milisegundos naturales (incluye esperas)',
      },
      sheet: 'Tareas de ausencia completadas',
      stages: {
        manager: 'Responsable',
        head: 'Responsable del departamento',
        hr: 'RR. HH.',
      },
    },
    approvalReturnRate: {
      fields: {
        year: 'Año de inicio actual',
        month: 'Mes de inicio actual',
        submittedRunCount: 'Ejecuciones enviadas (incluye abiertas)',
        returnedRunCount: 'Ejecuciones con devolución',
        returnDecisionCount: 'Número de decisiones de devolución',
        returnRateBasisPoints: 'Tasa de devolución en puntos básicos',
      },
      sheet: 'Tasa de devolución de ausencias',
    },
  },
};

export default esES;
