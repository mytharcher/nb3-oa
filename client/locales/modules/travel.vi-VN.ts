export default {
  travel: {
    fieldInvalid: 'Kiểm tra {{field}}.',

    confirmRetryBooking: 'Thử đặt chỗ lại cho công tác đã duyệt này?',
    confirmReviseTrip: 'Sửa công tác và khởi động lại phê duyệt?',
    states: {
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy',
      exception: 'Ngoại lệ đặt chỗ',
    },
    businessErrors: {
      TRAVEL_ITINERARY_REQUIRED:
        'Công tác quốc tế cần tệp lịch trình. Tải lên hoặc chọn trước khi gửi.',
      TRAVEL_OVERLAP: 'Thời gian trùng công tác đã duyệt. Điều chỉnh ngày đi.',
      TRAVEL_COMPANIONS_INVALID:
        'Chọn người đi cùng khác nhau và khác người yêu cầu.',
      TRAVEL_COMPANION_INACTIVE:
        'Người đi đã chọn không còn hoạt động. Chọn lại nhân viên hiện tại.',
      TRAVEL_DEPARTMENT_REQUIRED:
        'Người yêu cầu cần phòng ban chính đang hoạt động. Nhờ nhân sự cập nhật hồ sơ nhân viên.',
      TRAVEL_INVALID_DATE:
        'Kết thúc công tác phải sau bắt đầu. Kiểm tra cả ngày và giờ.',
      TRAVEL_INVALID_INPUT:
        'Hoàn thành điểm đến và lý do; nhập chi phí công tác không âm hợp lệ.',
    },

    requestLoan: 'Yêu cầu tạm ứng liên kết',
    reviseTrip: 'Sửa công tác và khởi động lại phê duyệt',
    revisionWarning:
      'Sửa đóng hạn mức hoàn chi phí cũ và kết thúc hoạt động chấm công cũ trước phê duyệt mới. Tiền gốc tạm ứng và hạn gốc giữ nguyên; xử lý tạm ứng riêng.',
    cancelTrip: 'Yêu cầu hủy công tác',
    complete: 'Hoàn tất đặt chỗ',
    unable: 'Không thể đặt chỗ',
    forceComplete: 'Buộc đóng đặt chỗ',
    retryBooking: 'Thử đặt chỗ lại',
    standard: 'Tiêu chuẩn công tác cố định',
    lodgingPerNight: 'Tiêu chuẩn lưu trú mỗi đêm (nhân dân tệ)',
    allowancePerDay: 'Tiêu chuẩn phụ cấp mỗi ngày (nhân dân tệ)',
    companions: 'Người đi cùng',
    addCompanion: 'Thêm người đi cùng',
    removeCompanion: 'Gỡ bỏ',
    companionsInvalid: 'Người đi cùng phải khác nhau',
    peopleUnavailable:
      'Quyền của bạn không cho tìm nhân viên. Liên hệ quản trị viên.',
    destination: 'Điểm đến',
    international: 'Công tác quốc tế',
    needsBooking: 'Đặt chỗ hành chính',
    needsLoan: 'Đã yêu cầu tạm ứng',
    transportCents: 'Di chuyển',
    lodgingCents: 'Lưu trú',
    allowanceCents: 'Phụ cấp',
    bookingInformation: 'Chi tiết lịch đặt',
    exceptionReason: 'Lý do ngoại lệ',
    cc: 'Thêm người nhận bản sao',
    authz: {
      resource: 'Yêu cầu công tác',
      submit: 'Gửi yêu cầu công tác',
      delegate: 'Gửi thay nhân viên',
      view: 'Xem yêu cầu công tác',
    },
    new: 'Yêu cầu công tác mới',
    edit: 'Chỉnh sửa yêu cầu công tác',
    formDescription: 'Đăng ký chuyến công tác.',
    name: 'Tên công tác',
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
      'Phê duyệt ghi chấm công công tác và tạo hạn mức hoàn chi phí cho dự toán dương. Đặt chỗ và giải ngân tạm ứng tách riêng.',
    approvedFacts:
      'Đã hoàn tất phê duyệt công tác; tiến độ đặt chỗ hiển thị riêng.',
    attendanceRecorded: 'Đã ghi hoạt động chấm công công tác.',
    authorizationIssued:
      'Hạn mức hoàn chi phí đã duyệt: {{amount}} nhân dân tệ. Yêu cầu hoàn theo chính sách hạn mức.',
    zeroNoAuthorization:
      'Dự toán bằng không không tạo hạn mức; vẫn cần tài chính xem xét.',
    uncertainCreate:
      'Chưa biết kết quả lưu. Kiểm tra Yêu cầu của tôi trước khi tạo yêu cầu khác.',
    inactive: 'Cần hồ sơ nhân viên đang hoạt động.',
    configuration:
      'Không thể gửi phê duyệt. Liên hệ quản trị viên để kiểm tra thời hạn phê duyệt.',
    invalid: 'Kiểm tra trường yêu cầu và tải lại bản ghi mới nhất nếu cần.',
    stages: {
      completed: 'Đã hoàn thành',
      manager: 'Quản lý trực tiếp',
      head: 'Trưởng phòng',
      finance: 'Tài chính',
      executive: 'Điều hành',
      gm: 'Tổng giám đốc',
      booking: 'Đặt chỗ hành chính',
    },
  },
};
