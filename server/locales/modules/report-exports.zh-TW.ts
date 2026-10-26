import type { ReportExportsResource } from './report-exports.en-US.js';

const zhTW: ReportExportsResource = {
  reportExports: {
    sheet: '報表',
    leaveMonthly: {
      fields: {
        year: '年度',
        month: '開始月份',
        leaveType: '假別',
        approvedRequestCount: '核准申請數',
        approvedRequestedDays: '核准原申請天數（銷假前）',
      },
    },
    budgetBalances: {
      fields: {
        departmentName: '部門',
        year: '年度',
        subject: '預算科目',
        allocatedCents: '額度（分）',
        heldCents: '預占（分）',
        usedCents: '已用（分）',
        availableCents: '可用（分）',
      },
    },
    headcountBalances: {
      fields: {
        departmentName: '部門',
        positionName: '職位',
        year: '年度',
        limit: '編制上限',
        initialized: '已初始化',
        used: '已占用',
        pending: '待簽核',
        allocated: '已分配',
        replacementPending: '替補待簽核',
        replacementAllocated: '替補已分配',
        replacementBlocked: '替補受阻',
        available: '可用',
        capacityState: '編制狀態',
      },
    },
    contractLedger: {
      fields: {
        number: '合約編號',
        departmentName: '部門',
        status: '狀態',
        amountCents: '金額（分）',
        heldCents: '待付預留（分）',
        paidCents: '已付（分）',
        availableCents: '可用（分）',
        startsOn: '開始日期',
        endsOn: '到期日期',
        asOf: '統計日（公司行事曆）',
        expiryState: '到期狀態',
        paymentState: '付款進度',
        paidBasisPoints: '付款比例（基點；10000 = 100%）',
      },
    },
    expenseSummary: {
      fields: {
        year: '年度',
        month: '費用月份',
        category: '費用分類代碼',
        settledRequestCount: '已結算申請數',
        settledExpenseCents: '已結算費用毛額（分，非現金實付）',
      },
    },
    approvalEfficiency: {
      fields: {
        stage: '簽核階段',
        completedTaskCount: '已完成決策任務數',
        totalElapsedMs: '自然總耗時毫秒（含等待）',
        averageElapsedMs: '自然平均耗時毫秒（含等待）',
      },
      sheet: '已完成請假簽核任務',
      stages: {
        manager: '直屬主管',
        head: '部門負責人',
        hr: '人力資源',
      },
    },
    approvalReturnRate: {
      fields: {
        year: '目前批次開始年',
        month: '目前批次開始月',
        submittedRunCount: '已提交批次數（含進行中）',
        returnedRunCount: '曾退回的批次數',
        returnDecisionCount: '實際退回決策數',
        returnRateBasisPoints: '退回率（基點）',
      },
      sheet: '請假簽核退回率',
    },
  },
};

export default zhTW;
