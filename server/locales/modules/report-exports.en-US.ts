import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  reportExports: {
    sheet: 'Report',
    leaveMonthly: {
      fields: {
        year: 'Year',
        month: 'Start month',
        leaveType: 'Leave type',
        approvedRequestCount: 'Approved request count',
        approvedRequestedDays: 'Approved requested days (before cancellation)',
      },
    },
    budgetBalances: {
      fields: {
        departmentName: 'Department',
        year: 'Year',
        subject: 'Subject',
        allocatedCents: 'Allocated cents',
        heldCents: 'Held cents',
        usedCents: 'Used cents',
        availableCents: 'Available cents',
      },
    },
    headcountBalances: {
      fields: {
        departmentName: 'Department',
        positionName: 'Position',
        year: 'Year',
        limit: 'Limit',
        initialized: 'Initialized',
        used: 'Used',
        pending: 'Pending',
        allocated: 'Allocated',
        replacementPending: 'Replacement pending',
        replacementAllocated: 'Replacement allocated',
        replacementBlocked: 'Replacement blocked',
        available: 'Available',
        capacityState: 'Capacity state',
      },
    },
    contractLedger: {
      fields: {
        number: 'Number',
        departmentName: 'Department',
        status: 'Status',
        amountCents: 'Amount cents',
        heldCents: 'Held cents',
        paidCents: 'Paid cents',
        availableCents: 'Available cents',
        startsOn: 'Starts on',
        endsOn: 'Ends on',
        asOf: 'As of',
        expiryState: 'Expiry state',
        paymentState: 'Payment state',
        paidBasisPoints: 'Paid basis points',
      },
    },
    expenseSummary: {
      fields: {
        year: 'Year',
        month: 'Expense month',
        category: 'Category code',
        settledRequestCount: 'Settled request count',
        settledExpenseCents: 'Settled gross expense cents (not cash)',
      },
    },
    approvalEfficiency: {
      fields: {
        stage: 'Stage',
        completedTaskCount: 'Completed decision task count',
        totalElapsedMs: 'Total natural elapsed ms (includes waiting)',
        averageElapsedMs: 'Mean natural elapsed ms (includes waiting)',
      },
      sheet: 'Completed leave tasks',
      stages: {
        manager: 'Manager',
        head: 'Department head',
        hr: 'HR',
      },
    },
    approvalReturnRate: {
      fields: {
        year: 'Current start year',
        month: 'Current start month',
        submittedRunCount: 'Submitted runs (includes open)',
        returnedRunCount: 'Runs with a return',
        returnDecisionCount: 'Return decision count',
        returnRateBasisPoints: 'Return rate basis points',
      },
      sheet: 'Leave return rate',
    },
  },
};

export type ReportExportsResource = LocaleResource<typeof enUS>;

export default enUS;
