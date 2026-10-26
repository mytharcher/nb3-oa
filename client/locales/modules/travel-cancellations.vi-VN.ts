export default {
  // Existing permission titles use the collection name.
  travelCancellations: {
    authz: {
      resource: 'Yêu cầu hủy công tác',
      submit: 'Gửi yêu cầu hủy công tác',
      delegate: 'Gửi thay nhân viên',
      view: 'Xem yêu cầu hủy công tác',
    },
  },
  travelCancellation: {
    fieldInvalid: 'Kiểm tra {{field}}.',

    sourceUnavailable: 'Công tác nguồn không khả dụng',
    exceptionReason: 'Lý do ngoại lệ',
    exception: 'Ngoại lệ hủy đặt chỗ',
    businessErrors: {
      TRAVEL_CANCELLATION_REASON_REQUIRED: 'Nhập lý do hủy công tác.',
      TRAVEL_CANCELLATION_ALREADY_PENDING:
        'Đã có hủy đang chờ cho chuyến này. Mở yêu cầu hiện có.',
      TRAVEL_CANCELLATION_BASELINE_CHANGED:
        'Công tác đã duyệt thay đổi. Làm mới và sửa đơn hủy trước khi gửi lại.',
      TRAVEL_CANCELLATION_INVALID_SOURCE:
        'Công tác gốc không còn đủ điều kiện hủy. Chọn chuyến đã duyệt có hiệu lực.',
    },

    retryUnbooking: 'Thử lại hủy hành chính',
    bookingInformation: 'Lệnh hủy và thu xếp hoàn tiền',
    unbookingHint:
      'Công tác gốc bị thu hồi sau khi trưởng phòng duyệt. Hành chính phải ghi thu xếp hủy và hoàn tiền; điều này không xác nhận đã hoàn tiền.',
    complete: 'Hoàn tất hủy hành chính',
    unable: 'Không thể hủy đặt chỗ',
    forceComplete: 'Buộc đóng hủy',
    source: 'Công tác gốc',
    chooseSource: 'Chọn công tác đã duyệt',
    effectHint:
      'Trưởng phòng gốc phải duyệt trước khi thu hồi chấm công và cấp quyền hoàn chi phí. Tạm ứng liên kết được xử lý theo trạng thái giải ngân.',
    cc: 'Thêm người nhận bản sao',
    authz: {
      resource: 'Yêu cầu hủy công tác',
      submit: 'Gửi yêu cầu hủy công tác',
      delegate: 'Gửi thay nhân viên',
      view: 'Xem yêu cầu hủy công tác',
    },
    new: 'Yêu cầu hủy công tác mới',
    edit: 'Chỉnh sửa yêu cầu hủy công tác',
    formDescription: 'Yêu cầu hủy công tác đã duyệt.',
    name: 'Tên hủy công tác',
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
      'Phê duyệt ghi chấm công hủy công tác khi dùng giờ làm việc. Hủy có phí tạo hạn mức hoàn chi phí đã duyệt; chưa thanh toán.',
    approvedFacts: 'Hủy công tác đã được duyệt. Nhân sự nhận bản sao.',
    attendanceRecorded: 'Đã ghi hoạt động chấm công hủy công tác.',
    authorizationIssued:
      'Hạn mức hoàn chi phí đã duyệt: {{amount}} nhân dân tệ. Yêu cầu hoàn theo chính sách hạn mức.',
    zeroNoAuthorization: 'Không tạo hạn mức phí cho hủy công tác miễn phí.',
    uncertainCreate:
      'Chưa biết kết quả lưu. Kiểm tra Yêu cầu của tôi trước khi tạo yêu cầu khác.',
    inactive: 'Cần hồ sơ nhân viên đang hoạt động.',
    configuration:
      'Không thể gửi phê duyệt. Liên hệ quản trị viên để kiểm tra thời hạn phê duyệt.',
    invalid: 'Kiểm tra trường yêu cầu và tải lại bản ghi mới nhất nếu cần.',
    stages: {
      unbooking: 'Hủy đặt chỗ hành chính',
      manager: 'Quản lý trực tiếp',
      head: 'Trưởng phòng',
      finance: 'Tài chính',
      executive: 'Điều hành',
      gm: 'Tổng giám đốc',
    },
  },
};
