export default {
  // Existing permission titles use the collection name.
  trainingRequests: {
    authz: {
      resource: 'Đào tạo và học tập',
      submit: 'Gửi yêu cầu đào tạo',
      delegate: 'Gửi thay nhân viên',
      view: 'Xem yêu cầu đào tạo',
    },
  },
  training: {
    actionForm: {
      title: '{{action}} yêu cầu đào tạo "{{name}}"',
      completed: 'Đã hoàn tất {{action}} cho yêu cầu đào tạo "{{name}}"',
      saved: 'Đã lưu yêu cầu đào tạo "{{name}}"',
    },
    businessErrors: {
      TRAINING_INVALID_INPUT:
        'Hoàn thành tên đào tạo, cơ sở và lý do; nhập chi phí không âm hợp lệ.',
      TRAINING_INVALID_DATE:
        'Kết thúc đào tạo phải sau bắt đầu. Kiểm tra ngày giờ.',
      TRAINING_DEPARTMENT_REQUIRED:
        'Người yêu cầu cần phòng ban chính đang hoạt động. Nhờ nhân sự cập nhật hồ sơ nhân viên.',
    },

    cc: 'Thêm người nhận bản sao',
    authz: {
      resource: 'Đào tạo và học tập',
      submit: 'Gửi yêu cầu đào tạo',
      delegate: 'Gửi thay nhân viên',
      view: 'Xem yêu cầu đào tạo',
    },
    new: 'Yêu cầu đào tạo mới',
    edit: 'Chỉnh sửa yêu cầu đào tạo',
    formDescription: 'Đăng ký đào tạo hoặc học bên ngoài.',
    name: 'Tên đào tạo',
    institution: 'Cơ sở',
    startAt: 'Bắt đầu lúc',
    endAt: 'Kết thúc lúc',
    usesWorkingTime: 'Dùng giờ làm việc',
    amount: 'Phí (nhân dân tệ)',
    yuan: 'nhân dân tệ',
    yes: 'Có',
    no: 'Không',
    timeZone: 'Múi giờ công ty: {{zone}}',
    amountHint:
      'Nhập nhân dân tệ tối đa hai chữ số thập phân. Cho phép phí bằng không.',
    amountInvalid: 'Nhập số tiền không âm tối đa hai chữ số thập phân.',
    dateInvalid: 'Chọn khoảng hợp lệ với kết thúc sau bắt đầu.',
    approvalHint:
      'Phê duyệt ghi chấm công đào tạo khi dùng giờ làm việc. Đào tạo có phí tạo hạn mức hoàn chi phí đã duyệt; chưa thanh toán.',
    approvedFacts: 'Đào tạo đã được duyệt. Nhân sự nhận bản sao.',
    attendanceRecorded: 'Đã ghi hoạt động chấm công đào tạo.',
    authorizationIssued:
      'Hạn mức hoàn chi phí đã duyệt: {{amount}} nhân dân tệ. Yêu cầu hoàn theo chính sách hạn mức.',
    zeroNoAuthorization: 'Không tạo hạn mức phí cho đào tạo miễn phí.',
    uncertainCreate:
      'Chưa biết kết quả lưu. Kiểm tra Yêu cầu của tôi trước khi tạo yêu cầu khác.',
    inactive: 'Cần hồ sơ nhân viên đang hoạt động.',
    configuration:
      'Không thể gửi phê duyệt. Liên hệ quản trị viên để kiểm tra thời hạn phê duyệt.',
    invalid: 'Kiểm tra trường yêu cầu và tải lại bản ghi mới nhất nếu cần.',
    stages: {
      manager: 'Quản lý trực tiếp',
      head: 'Trưởng phòng',
      finance: 'Tài chính',
      executive: 'Điều hành',
      gm: 'Tổng giám đốc',
    },
  },
};
