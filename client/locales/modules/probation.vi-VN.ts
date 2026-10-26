export default {
  probationRequests: {
    businessErrors: {
      PROBATION_SELF_EVALUATION_REQUIRED:
        'Nhập tự đánh giá của nhân viên trước khi gửi.',
      PROBATION_CONCLUSION_REQUIRED:
        'Nhập kết luận của quản lý trước khi phê duyệt.',
      PROBATION_COMPENSATION_REQUIRED:
        'Hoàn thành cấp bậc và lương được bảo vệ trong biểu mẫu phê duyệt nhân sự.',
      PROBATION_INVALID_GRADE: 'Chọn cấp bậc đang bật.',
      PROBATION_ALREADY_ACTIVE:
        'Nhân viên đã có yêu cầu thử việc đang hoạt động. Mở yêu cầu hiện có.',
      PROBATION_STALE_EMPLOYEE:
        'Thông tin thử việc đã thay đổi. Làm mới trước khi thao tác lại.',
      PROBATION_DEPARTMENT_REQUIRED:
        'Nhân viên cần phòng ban chính đang hoạt động. Nhờ nhân sự cập nhật bản ghi.',
    },

    title: 'Yêu cầu thử việc',
    description:
      'Xem đánh giá thử việc và theo dõi quyết định chuyển chính thức.',
    new: 'Yêu cầu thử việc mới',
    edit: 'Chỉnh sửa',
    details: 'Xem chi tiết',
    number: 'Số',
    employee: 'Nhân viên',
    probationEndDate: 'Ngày kết thúc thử việc',
    conclusion: 'Kết luận',
    search: 'Tìm số, tên nhân viên hoặc tự đánh giá',
    view: 'Xem bản ghi',
    allStatuses: 'Tất cả trạng thái',
    refresh: 'Làm mới',
    clearFilters: 'Xóa bộ lọc',
    emptyTitle: 'Chưa có yêu cầu thử việc',
    emptyDescription:
      'Nhân viên nhận bản nháp hệ thống gần hết hạn. Nhân sự có thể tạo đánh giá cho nhân viên thử việc.',
    noResults: 'Không có yêu cầu phù hợp',
    rowActions: 'Thao tác cho {{name}}',
    views: {
      mine: 'Của tôi',
      pending: 'Đang chờ',
      done: 'Hoàn tất',
      copied: 'Đã sao chép',
    },
    conclusions: {
      regular: 'Chuyển chính thức',
      deferred: 'Gia hạn thử việc',
      declined: 'Từ chối chuyển chính thức',
    },
    statuses: {
      draft: 'Bản nháp',
      revision: 'Phiên bản',
      manager: 'Quản lý xem xét',
      head: 'Phòng ban xem xét',
      hr: 'Nhân sự xem xét',
      gm: 'Tổng giám đốc xem xét',
      approved: 'Đã phê duyệt',
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
        'Đánh giá đã thay đổi. Đọc bản ghi mới nhất trước khi thao tác lại.',
      invalid: 'Kiểm tra nội dung đánh giá và trường bắt buộc.',
      failed: 'Yêu cầu chưa hoàn tất. Thử lại.',
      departureUnavailable:
        'Luồng nghỉ việc không khả dụng; thao tác chưa hoàn tất. Xem xét tổng giám đốc vẫn đang chờ.',
    },
    detail: {
      creator: 'Người tạo',
      selfEvaluation: 'Tự đánh giá',
      evaluation: 'Đánh giá quản lý',
      deferredTo: 'Ngày kết thúc thử việc gia hạn',
      grade: 'Cấp bậc',
      manager: 'Người xem xét cấp quản lý',
      head: 'Người xem xét phòng ban',
      hr: 'Người xem xét nhân sự',
      gm: 'Người xem xét tổng giám đốc',
      rules: 'Quy tắc cố định',
      unsubmitted: 'Quy tắc được cố định khi gửi.',
    },
    rules: {
      grade_managerRank: 'Ngưỡng cấp bậc quản lý',
      sla_remindHours: 'Giờ làm việc nhắc nhở',
      sla_escalateHours: 'Giờ làm việc nâng cấp',
      sla_urgeCooldownHours: 'Giờ chờ giữa các lần nhắc',
    },
    compensation: {
      title: 'Đề xuất thu nhập riêng tư',
      denied: 'Bạn không thể xem thu nhập.',
      missing: 'Chưa lưu đề xuất thu nhập.',
      grade: 'Cấp bậc đề xuất',
      salary: 'Lương cơ bản (nhân dân tệ)',
    },
    authz: {
      resource: 'Đánh giá thử việc',
      submit: 'Chỉnh sửa và gửi đánh giá thử việc',
      delegate: 'Nhân sự tạo đánh giá thử việc',
      view: 'Đọc đánh giá thử việc được cấp quyền',
      compensation: 'Truy cập thu nhập thử việc riêng tư',
    },
    schedule: {
      title: 'Nhắc hết hạn thử việc',
      description:
        'Đối soát ngày thử việc theo giờ công ty, tạo bản nháp tự đánh giá trước hết hạn 14 ngày và thông báo nhân viên.',
    },
  },
};
