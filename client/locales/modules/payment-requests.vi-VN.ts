export default {
  paymentRequests: {
    relatedUnavailable: 'Bản ghi liên quan không khả dụng',
    businessErrors: {
      PAYMENT_REQUEST_INVALID_INPUT:
        'Hoàn thành lý do, người nhận tiền, số tiền dương, số hóa đơn và chứng minh hóa đơn.',
      PAYMENT_REQUEST_ACCOUNT_REQUIRED:
        'Hoàn thành tài khoản ngân hàng được bảo vệ của người nhận trước khi gửi.',
      PAYMENT_REQUEST_ACCOUNT_STALE:
        'Tài khoản người nhận đã thay đổi. Tải tài khoản mới nhất trước khi sửa.',
      PAYMENT_REQUEST_DEPARTMENT_REQUIRED:
        'Người yêu cầu cần phòng ban chính đang hoạt động. Nhờ nhân sự cập nhật hồ sơ nhân viên.',
      PAYMENT_REQUEST_METHOD_INVALID: 'Chọn phương thức thanh toán đang bật.',
      PAYMENT_REQUEST_SOURCE_REQUIRED:
        'Giải thích vì sao không có phê duyệt trước và xóa đơn đặt hàng liên kết.',
      PAYMENT_REQUEST_SOURCE_INVALID:
        'Chọn đơn đặt hàng hoặc hợp đồng có hiệu lực cùng người nhận tiền gốc.',
      PAYMENT_REQUEST_SOURCE_STALE:
        'Chứng từ nguồn đã thay đổi. Làm mới thanh toán và nguồn trước khi thao tác lại.',
      PAYMENT_REQUEST_CONTRACT_STALE:
        'Hợp đồng đã thay đổi. Làm mới phiên bản và sửa thanh toán trước khi gửi lại.',
      PAYMENT_REQUEST_VOUCHER_REQUIRED:
        'Nhập số chứng từ thanh toán và tải lên hoặc chọn chứng minh thanh toán.',
      PAYMENT_REQUEST_FORCE_CONFIRMATION_REQUIRED:
        'Xác nhận số tiền đã duyệt chính xác trước khi buộc hoàn tất thanh toán.',
      PAYMENT_REQUEST_HANDLING_REASON_REQUIRED:
        'Nhập lý do không thể hoàn tất thanh toán.',
      PAYMENT_REQUEST_ALREADY_PAID:
        'Thanh toán đã quyết toán. Làm mới để xem kết quả đã ghi.',
      PAYMENT_REQUEST_CONTRACT_ACTUAL_PAYMENT_REQUIRED:
        'Ghi thanh toán hợp đồng thực tế trước khi hoàn tất thao tác này.',
      PAYMENT_FILE_SIZE: 'Chọn tệp đính kèm không rỗng tối đa 5 MB.',
      PAYMENT_FILE_TYPE:
        'Tải tệp PDF, JPEG, PNG hoặc WebP có loại tệp phù hợp.',
      PAYMENT_ATTACHMENT_INVALID:
        'Chọn chứng minh đã tải cho yêu cầu thanh toán này.',
    },

    title: 'Đề nghị thanh toán',
    description: 'Xem đơn thanh toán, dữ kiện nguồn cố định và xử lý thủ quỹ.',
    new: 'Yêu cầu thanh toán mới',
    edit: 'Chỉnh sửa',
    details: 'Xem chi tiết',
    number: 'Số',
    reason: 'Lý do',
    vendor: 'Người nhận tiền',
    amount: 'Số tiền thanh toán (nhân dân tệ)',
    search: 'Tìm số, lý do, người yêu cầu hoặc người nhận tiền',
    view: 'Xem bản ghi',
    allStatuses: 'Tất cả trạng thái',
    refresh: 'Làm mới',
    clearFilters: 'Xóa bộ lọc',
    emptyTitle: 'Chưa có yêu cầu thanh toán',
    emptyDescription:
      'Tạo bản nháp yêu cầu thanh toán và đính kèm chứng minh hóa đơn.',
    noResults: 'Không có bản ghi phù hợp. Xóa hoặc điều chỉnh bộ lọc.',
    rowActions: 'Thao tác cho {{name}}',
    yes: 'Có',
    no: 'Không',
    frozenHint: 'Nguồn, người nhận, số tiền và hóa đơn được cố định khi gửi.',
    sourceModes: {
      contract: 'Hợp đồng',
      purchase: 'Đơn đặt hàng',
      none: 'Không có phê duyệt trước',
    },
    views: {
      mine: 'Của tôi',
      pending: 'Đang chờ',
      done: 'Hoàn tất',
      copied: 'Đã sao chép',
    },
    statuses: {
      draft: 'Bản nháp',
      revision: 'Phiên bản',
      head: 'Phòng ban xem xét',
      finance: 'Tài chính xem xét',
      executive: 'Ban điều hành xem xét',
      gm: 'Tổng giám đốc xem xét',
      cashier: 'Thủ quỹ xử lý',
      exception: 'Ngoại lệ xử lý',
      paid: 'Đã chi trả',
      forcedPaid: 'Đã ghi thanh toán bắt buộc',
      rejected: 'Đã từ chối',
      withdrawn: 'Đã rút lại',
      terminated: 'Đã chấm dứt',
    },
    errors: {
      forbidden:
        'Bạn không có quyền truy cập. Nhờ quản trị viên kiểm tra quyền.',
      notFound:
        'Bản ghi không còn tồn tại hoặc không khả dụng. Quay lại trang nguồn.',
      conflict:
        'Thanh toán đã thay đổi. Đọc bản ghi mới nhất trước khi thao tác lại.',
      invalid: 'Kiểm tra nội dung thanh toán và chứng minh bắt buộc.',
      failed: 'Yêu cầu chưa hoàn tất. Thử lại.',
    },
    detail: {
      creator: 'Người tạo',
      sourceMode: 'Nguồn',
      order: 'Đơn đặt hàng',
      noPriorReason: 'Lý do không có phê duyệt trước',
      invoice: 'Số hóa đơn',
      method: 'Phương thức thanh toán',
      failure: 'Lỗi xử lý',
      voucher: 'Chứng từ chi trả',
      forcedReason: 'Lý do thanh toán bắt buộc',
      paidAt: 'Thời điểm thanh toán',
      sourceFacts: 'Dữ kiện nguồn cố định',
      cumulativeHint:
        'Thanh toán lũy kế lúc gửi gồm khoản đang chờ. Khoản giữ của yêu cầu hiện tại hiển thị riêng và không được cộng lại. Thanh toán không xác nhận giao hàng hoặc tiếp nhận.',
      sourceApproved: 'Giá trị đơn đã duyệt (nhân dân tệ)',
      sourceCumulative: 'Số tiền lũy kế lúc gửi (nhân dân tệ)',
      sourceHeld: 'Khoản giữ nguồn hiện tại (nhân dân tệ)',
      fullApproval: 'Cần phê duyệt đầy đủ',
      attachments: 'Chứng minh hóa đơn',
      voucherAttachments: 'Chứng minh thanh toán',
      notSubmitted: 'Quy tắc được cố định khi gửi.',
    },
    rules: {
      spend_vp: 'Ngưỡng điều hành (nhân dân tệ)',
      spend_gm: 'Ngưỡng tổng giám đốc (nhân dân tệ)',
      sla_remindHours: 'Giờ làm việc nhắc nhở',
      sla_escalateHours: 'Giờ làm việc nâng cấp',
      sla_urgeCooldownHours: 'Giờ chờ giữa các lần nhắc',
    },
    authz: {
      voucherEvidence: 'Tải chứng minh chứng từ thanh toán',
      ownScope: 'Thanh toán tôi sở hữu hoặc tạo',
      resource: 'Đề nghị thanh toán',
      view: 'Xem yêu cầu thanh toán',
      submit: 'Tạo và gửi thanh toán của tôi',
      delegate: 'Tạo thanh toán thay nhân viên',
      paymentAccount: 'Đọc và sửa tài khoản thanh toán được cấp quyền',
    },
  },
};
