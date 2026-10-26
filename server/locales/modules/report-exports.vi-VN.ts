import type { ReportExportsResource } from './report-exports.en-US.js';

const viVN: ReportExportsResource = {
  reportExports: {
    sheet: 'Báo cáo',
    leaveMonthly: {
      fields: {
        year: 'Năm',
        month: 'Tháng bắt đầu',
        leaveType: 'Loại nghỉ phép',
        approvedRequestCount: 'Số yêu cầu đã duyệt',
        approvedRequestedDays: 'Số ngày yêu cầu đã duyệt (trước hủy)',
      },
    },
    budgetBalances: {
      fields: {
        departmentName: 'Phòng ban',
        year: 'Năm',
        subject: 'Khoản mục',
        allocatedCents: 'Đã phân bổ (xu)',
        heldCents: 'Đã giữ (xu)',
        usedCents: 'Đã dùng (xu)',
        availableCents: 'Khả dụng (xu)',
      },
    },
    headcountBalances: {
      fields: {
        departmentName: 'Phòng ban',
        positionName: 'Vị trí',
        year: 'Năm',
        limit: 'Giới hạn',
        initialized: 'Đã khởi tạo',
        used: 'Đã dùng',
        pending: 'Đang chờ',
        allocated: 'Đã phân bổ',
        replacementPending: 'Thay thế đang chờ',
        replacementAllocated: 'Thay thế đã phân bổ',
        replacementBlocked: 'Thay thế bị chặn',
        available: 'Khả dụng',
        capacityState: 'Trạng thái sức chứa',
      },
    },
    contractLedger: {
      fields: {
        number: 'Số',
        departmentName: 'Phòng ban',
        status: 'Trạng thái',
        amountCents: 'Số tiền (xu)',
        heldCents: 'Đã giữ (xu)',
        paidCents: 'Đã trả (xu)',
        availableCents: 'Khả dụng (xu)',
        startsOn: 'Ngày bắt đầu',
        endsOn: 'Ngày kết thúc',
        asOf: 'Tính đến',
        expiryState: 'Trạng thái hết hạn',
        paymentState: 'Trạng thái thanh toán',
        paidBasisPoints: 'Đã trả (điểm cơ bản)',
      },
    },
    expenseSummary: {
      fields: {
        year: 'Năm',
        month: 'Tháng chi phí',
        category: 'Mã danh mục',
        settledRequestCount: 'Số yêu cầu đã quyết toán',
        settledExpenseCents:
          'Tổng chi phí đã quyết toán (xu, không phải tiền mặt)',
      },
    },
    approvalEfficiency: {
      fields: {
        stage: 'Giai đoạn',
        completedTaskCount: 'Số tác vụ quyết định đã hoàn tất',
        totalElapsedMs: 'Tổng thời gian tự nhiên (ms, gồm chờ)',
        averageElapsedMs: 'Thời gian tự nhiên trung bình (ms, gồm chờ)',
      },
      sheet: 'Tác vụ nghỉ phép hoàn tất',
      stages: {
        manager: 'Quản lý',
        head: 'Trưởng phòng',
        hr: 'Nhân sự',
      },
    },
    approvalReturnRate: {
      fields: {
        year: 'Năm bắt đầu hiện tại',
        month: 'Tháng bắt đầu hiện tại',
        submittedRunCount: 'Số lượt đã gửi (gồm lượt đang mở)',
        returnedRunCount: 'Số lượt có trả lại',
        returnDecisionCount: 'Số quyết định trả lại',
        returnRateBasisPoints: 'Tỷ lệ trả lại (điểm cơ bản)',
      },
      sheet: 'Tỷ lệ trả lại nghỉ phép',
    },
  },
};

export default viVN;
