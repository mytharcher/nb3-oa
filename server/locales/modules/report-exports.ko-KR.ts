import type { ReportExportsResource } from './report-exports.en-US.js';

const koKR: ReportExportsResource = {
  reportExports: {
    sheet: '보고서',
    leaveMonthly: {
      fields: {
        year: '연도',
        month: '시작 월',
        leaveType: '휴가 유형',
        approvedRequestCount: '승인 신청 수',
        approvedRequestedDays: '승인 신청 일수(취소 전)',
      },
    },
    budgetBalances: {
      fields: {
        departmentName: '부서',
        year: '연도',
        subject: '예산 항목',
        allocatedCents: '배정액(센트)',
        heldCents: '보류액(센트)',
        usedCents: '사용액(센트)',
        availableCents: '가용액(센트)',
      },
    },
    headcountBalances: {
      fields: {
        departmentName: '부서',
        positionName: '직위',
        year: '연도',
        limit: '한도',
        initialized: '초기화됨',
        used: '사용됨',
        pending: '대기 중',
        allocated: '배정됨',
        replacementPending: '대체 대기',
        replacementAllocated: '대체 배정됨',
        replacementBlocked: '대체 차단됨',
        available: '가용',
        capacityState: '정원 상태',
      },
    },
    contractLedger: {
      fields: {
        number: '번호',
        departmentName: '부서',
        status: '상태',
        amountCents: '금액(센트)',
        heldCents: '보류액(센트)',
        paidCents: '지급액(센트)',
        availableCents: '가용액(센트)',
        startsOn: '시작일',
        endsOn: '종료일',
        asOf: '기준일',
        expiryState: '만료 상태',
        paymentState: '지급 상태',
        paidBasisPoints: '지급 비율(베이시스 포인트)',
      },
    },
    expenseSummary: {
      fields: {
        year: '연도',
        month: '경비 월',
        category: '분류 코드',
        settledRequestCount: '정산 신청 수',
        settledExpenseCents: '정산 총경비(센트, 현금 실지급액 아님)',
      },
    },
    approvalEfficiency: {
      fields: {
        stage: '단계',
        completedTaskCount: '완료한 결정 할 일 수',
        totalElapsedMs: '자연 경과 총 밀리초(대기 포함)',
        averageElapsedMs: '자연 경과 평균 밀리초(대기 포함)',
      },
      sheet: '완료한 휴가 할 일',
      stages: {
        manager: '관리자',
        head: '부서장',
        hr: '인사팀',
      },
    },
    approvalReturnRate: {
      fields: {
        year: '현재 시작 연도',
        month: '현재 시작 월',
        submittedRunCount: '제출 실행 수(미종결 포함)',
        returnedRunCount: '반려된 실행 수',
        returnDecisionCount: '반려 결정 수',
        returnRateBasisPoints: '반려율(베이시스 포인트)',
      },
      sheet: '휴가 반려율',
    },
  },
};

export default koKR;
