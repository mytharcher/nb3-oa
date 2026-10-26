import type { ReportExportsResource } from './report-exports.en-US.js';

const jaJP: ReportExportsResource = {
  reportExports: {
    sheet: 'レポート',
    leaveMonthly: {
      fields: {
        year: '年度',
        month: '開始月',
        leaveType: '休暇種類',
        approvedRequestCount: '承認済み申請件数',
        approvedRequestedDays: '承認済み申請日数（取消前）',
      },
    },
    budgetBalances: {
      fields: {
        departmentName: '部署',
        year: '年度',
        subject: '科目',
        allocatedCents: '配賦額（分）',
        heldCents: '保留額（分）',
        usedCents: '使用額（分）',
        availableCents: '利用可能額（分）',
      },
    },
    headcountBalances: {
      fields: {
        departmentName: '部署',
        positionName: '役職',
        year: '年度',
        limit: '定員上限',
        initialized: '初期化済み',
        used: '使用数',
        pending: '保留数',
        allocated: '割り当て済み数',
        replacementPending: '補充保留数',
        replacementAllocated: '補充割り当て済み数',
        replacementBlocked: '補充停止数',
        available: '利用可能数',
        capacityState: '定員状態',
      },
    },
    contractLedger: {
      fields: {
        number: '番号',
        departmentName: '部署',
        status: '状態',
        amountCents: '金額（分）',
        heldCents: '保留額（分）',
        paidCents: '支払済み金額（分）',
        availableCents: '利用可能額（分）',
        startsOn: '開始日',
        endsOn: '終了日',
        asOf: '基準日',
        expiryState: '期限状態',
        paymentState: '支払状態',
        paidBasisPoints: '支払率（ベーシスポイント）',
      },
    },
    expenseSummary: {
      fields: {
        year: '年度',
        month: '経費月',
        category: '区分コード',
        settledRequestCount: '精算済み申請件数',
        settledExpenseCents: '精算総額（分、現金支払額ではない）',
      },
    },
    approvalEfficiency: {
      fields: {
        stage: '段階',
        completedTaskCount: '完了判断タスク件数',
        totalElapsedMs: '実経過時間合計（ms、待機を含む）',
        averageElapsedMs: '平均実経過時間（ms、待機を含む）',
      },
      sheet: '完了した休暇タスク',
      stages: {
        manager: '直属上司',
        head: '部署長',
        hr: '人事',
      },
    },
    approvalReturnRate: {
      fields: {
        year: '現在の開始年',
        month: '現在の開始月',
        submittedRunCount: '提出済み実行件数（未終了を含む）',
        returnedRunCount: '差し戻しがあった実行件数',
        returnDecisionCount: '差し戻し判断件数',
        returnRateBasisPoints: '差し戻し率（ベーシスポイント）',
      },
      sheet: '休暇差し戻し率',
    },
  },
};

export default jaJP;
