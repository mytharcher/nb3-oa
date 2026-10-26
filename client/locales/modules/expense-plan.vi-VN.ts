export default {
  expensePlans: {
    relatedUnavailable: 'Bản ghi liên quan không khả dụng',
    businessErrors: {
      EXPENSE_PLAN_DEPARTMENT_REQUIRED:
        'Người yêu cầu cần phòng ban chính đang hoạt động. Nhờ nhân sự cập nhật hồ sơ nhân viên.',
      EXPENSE_PLAN_INVALID_DATE: 'Chọn ngày chi phí dự kiến hợp lệ.',
      EXPENSE_PLAN_INVALID_DICTIONARY:
        'Chọn loại công việc và khoản mục ngân sách đang bật.',
      EXPENSE_PLAN_INVALID_INPUT:
        'Nhập số tiền dương, người tham gia và lý do chi phí.',
    },

    new: 'Duyệt trước chi phí mới',
    edit: 'Chỉnh sửa duyệt trước chi phí',
    formDescription:
      'Lập kế hoạch tiếp khách, xây dựng đội nhóm hoặc sự kiện trước khi chi tiêu.',
    matterType: 'Loại công việc',
    subject: 'Khoản mục ngân sách',
    amount: 'Chi phí dự kiến (nhân dân tệ)',
    yuan: 'nhân dân tệ',
    participants: 'Người tham gia',
    eventDate: 'Ngày sự kiện',
    budgetYear: 'Năm ngân sách lúc gửi',
    department: 'Phòng ban chính lúc gửi',
    primaryDepartment:
      'Phòng ban chính hiện tại: {{department}}. Kiểm tra lại khi gửi.',
    departmentMissing: 'Chưa cấu hình',
    departmentPending: 'Xác định khi gửi',
    departmentUnavailable: 'Phòng ban hiện không khả dụng',
    year: 'Năm ngân sách: {{year}} · lịch công ty: {{timeZone}}',
    amountHint:
      'Nhập nhân dân tệ dạng thập phân; số tiền được lưu bằng xu nguyên chính xác.',
    amountInvalid:
      'Nhập số tiền dương tối đa hai chữ số thập phân trong giới hạn an toàn.',
    participantsInvalid: 'Nhập số nguyên từ 1 đến 100000.',
    dateInvalid: 'Chọn ngày hợp lệ.',
    disabled: 'Đã vô hiệu hóa',
    subjectInactive:
      'Chọn loại công việc và khoản mục ngân sách đang hoạt động.',
    optionsEmpty:
      'Phải cấu hình loại công việc và khoản mục ngân sách đang hoạt động trước khi lưu.',
    reserveHint:
      'Gửi sẽ giữ ngân sách. Phê duyệt cuối cấp hạn mức hoàn chi phí.',
    revisionHold:
      'Khoản giữ ngân sách gốc được giữ khi chỉnh sửa. Chỉ thay đổi khi gửi lại.',
    retainedHold:
      'Khoản giữ gốc: {{subject}} · {{amount}} nhân dân tệ. Khoản này tách biệt với đề xuất sửa đổi.',
    actualHold: 'Khoản giữ khi phê duyệt',
    holdFactHint:
      'Đây là dữ kiện khoản giữ nguồn, không phải số dư sau hoàn chi phí về sau.',
    frozenThreshold:
      'Ngưỡng lúc gửi: điều hành > {{vp}} nhân dân tệ; tổng giám đốc > {{gm}} nhân dân tệ.',
    applied:
      'Đã cấp hạn mức được duyệt. Điều này không biểu thị đã hoàn chi phí hoặc thanh toán.',
    reserved: 'Ngân sách được giữ trong khi đơn chờ phê duyệt.',
    awaitingEffect: 'Chưa cấp hạn mức được duyệt cho đơn này.',
    uncertainCreate:
      'Kết quả lưu chưa chắc chắn. Đóng và kiểm tra Yêu cầu của tôi trước khi tạo bản nháp khác.',
    unknownEdit:
      'Kết quả lưu chưa chắc chắn. Nội dung nhập bị khóa đến khi tải bản ghi mới nhất.',
    authorization: 'Hạn mức đã duyệt',
    quotaId: 'Tham chiếu hạn mức',
    grantedAmount: 'Số tiền đã cấp',
    quotaState: 'Trạng thái hạn mức',
    deadline: 'Ngày hết hạn',
    quotaHint:
      'Hoàn chi phí quyết toán hạn mức này. Đóng hoặc hết hạn không hoàn tác phê duyệt.',
    mergedTitle: 'Gộp cùng người',
    quotaStates: { open: 'Mở', closed: 'Đã đóng', expired: 'Đã hết hạn' },
    createdBy: 'Người tạo',
    authz: {
      resource: 'Duyệt trước chi phí',
      submit: 'Gửi duyệt trước chi phí',
      delegate: 'Gửi duyệt trước chi phí thay nhân viên',
      view: 'Đọc duyệt trước chi phí',
    },
    stages: {
      head: 'Trưởng phòng',
      finance: 'Tài chính',
      executive: 'Điều hành phụ trách',
      gm: 'Tổng giám đốc',
    },
    states: { approved: 'Đã cấp hạn mức được duyệt' },
    merged:
      'Đã gộp điều hành và tổng giám đốc: cùng một người phê duyệt theo vai trò của họ.',
    errors: {
      invalid:
        'Kiểm tra ngày, người tham gia, số tiền, loại công việc và khoản mục.',
      department: 'Người yêu cầu cần phòng ban chính đang hoạt động.',
      insufficient: 'Tài khoản ngân sách không đủ tiền khả dụng.',
      inactive: 'Người yêu cầu phải có hồ sơ nhân viên đang hoạt động.',
      configuration:
        'Không thể gửi phê duyệt. Liên hệ quản trị viên để kiểm tra thời hạn phê duyệt.',
    },
  },
};
