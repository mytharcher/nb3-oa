import type { ReportExportsResource } from './report-exports.en-US.js';

const zhCN: ReportExportsResource = {
  reportExports: {
    sheet: '报表',
    leaveMonthly: {
      fields: {
        year: '年度',
        month: '开始月份',
        leaveType: '假别',
        approvedRequestCount: '批准申请数',
        approvedRequestedDays: '批准原申请天数（销假前）',
      },
    },
    budgetBalances: {
      fields: {
        departmentName: '部门',
        year: '年度',
        subject: '预算科目',
        allocatedCents: '额度（分）',
        heldCents: '预占（分）',
        usedCents: '已用（分）',
        availableCents: '可用（分）',
      },
    },
    headcountBalances: {
      fields: {
        departmentName: '部门',
        positionName: '岗位',
        year: '年度',
        limit: '编制上限',
        initialized: '已初始化',
        used: '已占用',
        pending: '待审批',
        allocated: '已分配',
        replacementPending: '替补待审批',
        replacementAllocated: '替补已分配',
        replacementBlocked: '替补阻断',
        available: '可用',
        capacityState: '编制状态',
      },
    },
    contractLedger: {
      fields: {
        number: '合同编号',
        departmentName: '部门',
        status: '状态',
        amountCents: '金额（分）',
        heldCents: '待付预留（分）',
        paidCents: '已付（分）',
        availableCents: '可用（分）',
        startsOn: '开始日期',
        endsOn: '到期日期',
        asOf: '统计日（公司日历）',
        expiryState: '到期状态',
        paymentState: '付款进度',
        paidBasisPoints: '付款比例（基点；10000 = 100%）',
      },
    },
    expenseSummary: {
      fields: {
        year: '年度',
        month: '费用月份',
        category: '费用分类代码',
        settledRequestCount: '已结算申请数',
        settledExpenseCents: '已结算费用毛额（分，非现金实付）',
      },
    },
    approvalEfficiency: {
      fields: {
        stage: '环节',
        completedTaskCount: '已完成决策任务数',
        totalElapsedMs: '自然总耗时毫秒（含等待）',
        averageElapsedMs: '自然平均耗时毫秒（含等待）',
      },
      sheet: '已完成请假审批任务',
      stages: {
        manager: '直属上级',
        head: '部门负责人',
        hr: '人力资源',
      },
    },
    approvalReturnRate: {
      fields: {
        year: '当前开始年',
        month: '当前开始月',
        submittedRunCount: '提交批次数（含在途）',
        returnedRunCount: '发生退回的批次数',
        returnDecisionCount: '实际退回决策数',
        returnRateBasisPoints: '退回率基点',
      },
      sheet: '请假审批退回率',
    },
  },
};

export default zhCN;
