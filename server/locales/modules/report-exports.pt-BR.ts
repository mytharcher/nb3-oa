import type { ReportExportsResource } from './report-exports.en-US.js';

const ptBR: ReportExportsResource = {
  reportExports: {
    sheet: 'Relatório',
    leaveMonthly: {
      fields: {
        year: 'Ano',
        month: 'Mês inicial',
        leaveType: 'Tipo de licença',
        approvedRequestCount: 'Quantidade de solicitações aprovadas',
        approvedRequestedDays:
          'Dias solicitados aprovados (antes do cancelamento)',
      },
    },
    budgetBalances: {
      fields: {
        departmentName: 'Departamento',
        year: 'Ano',
        subject: 'Rubrica',
        allocatedCents: 'Centavos alocados',
        heldCents: 'Centavos retidos',
        usedCents: 'Centavos utilizados',
        availableCents: 'Centavos disponíveis',
      },
    },
    headcountBalances: {
      fields: {
        departmentName: 'Departamento',
        positionName: 'Cargo',
        year: 'Ano',
        limit: 'Limite',
        initialized: 'Inicializado',
        used: 'Utilizado',
        pending: 'Pendente',
        allocated: 'Alocado',
        replacementPending: 'Reposição pendente',
        replacementAllocated: 'Reposição alocada',
        replacementBlocked: 'Reposição bloqueada',
        available: 'Disponível',
        capacityState: 'Estado da capacidade',
      },
    },
    contractLedger: {
      fields: {
        number: 'Número',
        departmentName: 'Departamento',
        status: 'Status',
        amountCents: 'Valor em centavos',
        heldCents: 'Centavos retidos',
        paidCents: 'Centavos pagos',
        availableCents: 'Centavos disponíveis',
        startsOn: 'Inicia em',
        endsOn: 'Termina em',
        asOf: 'Na data de',
        expiryState: 'Estado de vencimento',
        paymentState: 'Estado do pagamento',
        paidBasisPoints: 'Pago em pontos base',
      },
    },
    expenseSummary: {
      fields: {
        year: 'Ano',
        month: 'Mês da despesa',
        category: 'Código da categoria',
        settledRequestCount: 'Quantidade de solicitações liquidadas',
        settledExpenseCents:
          'Despesa bruta liquidada em centavos (não dinheiro)',
      },
    },
    approvalEfficiency: {
      fields: {
        stage: 'Etapa',
        completedTaskCount: 'Quantidade de tarefas de decisão concluídas',
        totalElapsedMs: 'Total de ms corridos (inclui espera)',
        averageElapsedMs: 'Média de ms corridos (inclui espera)',
      },
      sheet: 'Tarefas de licença concluídas',
      stages: {
        manager: 'Gestor',
        head: 'Chefe de departamento',
        hr: 'RH',
      },
    },
    approvalReturnRate: {
      fields: {
        year: 'Ano inicial atual',
        month: 'Mês inicial atual',
        submittedRunCount: 'Execuções enviadas (inclui abertas)',
        returnedRunCount: 'Execuções com devolução',
        returnDecisionCount: 'Quantidade de decisões de devolução',
        returnRateBasisPoints: 'Taxa de devolução em pontos base',
      },
      sheet: 'Taxa de devolução de licenças',
    },
  },
};

export default ptBR;
