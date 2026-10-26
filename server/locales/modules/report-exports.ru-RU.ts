import type { ReportExportsResource } from './report-exports.en-US.js';

const ruRU: ReportExportsResource = {
  reportExports: {
    sheet: 'Отчёт',
    leaveMonthly: {
      fields: {
        year: 'Год',
        month: 'Месяц начала',
        leaveType: 'Тип отпуска',
        approvedRequestCount: 'Количество согласованных заявок',
        approvedRequestedDays: 'Согласованные запрошенные дни (до отмены)',
      },
    },
    budgetBalances: {
      fields: {
        departmentName: 'Отдел',
        year: 'Год',
        subject: 'Статья',
        allocatedCents: 'Выделено (целые фэни)',
        heldCents: 'Зарезервировано (целые фэни)',
        usedCents: 'Использовано (целые фэни)',
        availableCents: 'Доступно (целые фэни)',
      },
    },
    headcountBalances: {
      fields: {
        departmentName: 'Отдел',
        positionName: 'Должность',
        year: 'Год',
        limit: 'Лимит',
        initialized: 'Инициализировано',
        used: 'Использовано',
        pending: 'Ожидает',
        allocated: 'Выделено',
        replacementPending: 'Замена ожидается',
        replacementAllocated: 'Замена выделена',
        replacementBlocked: 'Замена заблокирована',
        available: 'Доступно',
        capacityState: 'Состояние вместимости',
      },
    },
    contractLedger: {
      fields: {
        number: 'Номер',
        departmentName: 'Отдел',
        status: 'Статус',
        amountCents: 'Сумма (целые фэни)',
        heldCents: 'Зарезервировано (целые фэни)',
        paidCents: 'Оплачено (целые фэни)',
        availableCents: 'Доступно (целые фэни)',
        startsOn: 'Дата начала',
        endsOn: 'Дата окончания',
        asOf: 'По состоянию на',
        expiryState: 'Состояние истечения',
        paymentState: 'Состояние оплаты',
        paidBasisPoints: 'Оплачено (базисные пункты)',
      },
    },
    expenseSummary: {
      fields: {
        year: 'Год',
        month: 'Месяц расходов',
        category: 'Код категории',
        settledRequestCount: 'Количество рассчитанных заявок',
        settledExpenseCents:
          'Рассчитанный полный расход в целых фэнях (не выплаченные деньги)',
      },
    },
    approvalEfficiency: {
      fields: {
        stage: 'Этап',
        completedTaskCount: 'Количество завершённых задач принятия решения',
        totalElapsedMs: 'Общее календарное время, мс (включая ожидание)',
        averageElapsedMs: 'Среднее календарное время, мс (включая ожидание)',
      },
      sheet: 'Завершённые задачи отпусков',
      stages: {
        manager: 'Руководитель',
        head: 'Начальник отдела',
        hr: 'Отдел кадров',
      },
    },
    approvalReturnRate: {
      fields: {
        year: 'Текущий год начала',
        month: 'Текущий месяц начала',
        submittedRunCount: 'Поданные запуски (включая открытые)',
        returnedRunCount: 'Запуски с возвратом',
        returnDecisionCount: 'Количество решений о возврате',
        returnRateBasisPoints: 'Доля возвратов (базисные пункты)',
      },
      sheet: 'Доля возвратов отпусков',
    },
  },
};

export default ruRU;
