export default {
  headcounts: {
    authz: {
      title: 'Sức chứa định biên',
      view: 'Xem sức chứa',
      manage: 'Quản lý sức chứa năm',
      viewJournal: 'Xem nhật ký nguồn',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        'Không thể đọc danh sách nhân viên đầy đủ. Nhờ quản trị viên kiểm tra quyền đọc nhân viên.',
      HEADCOUNT_ACCESS_DENIED:
        'Bạn không có quyền thực hiện thao tác định biên này.',
      HEADCOUNT_FIELD_ACCESS_DENIED:
        'Trường tổng hợp sức chứa ngoài phạm vi quyền của bạn.',
      HEADCOUNT_NOT_FOUND: 'Tài khoản định biên không khả dụng.',
      HEADCOUNT_ALREADY_EXISTS: 'Phòng ban, vị trí và năm này đã có tài khoản.',
      HEADCOUNT_NOT_INITIALIZED:
        'Đối soát danh sách nhân viên đầy đủ trước khi giữ sức chứa.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        'Chọn danh sách thực tế đầy đủ gồm thử việc, chính thức và đang nghỉ.',
      HEADCOUNT_ROSTER_DRIFT:
        'Danh sách nhân viên thực tế đã thay đổi. Đối soát dữ kiện nguồn trước khi tiếp tục.',
      HEADCOUNT_VERSION_CONFLICT:
        'Tài khoản đã thay đổi. Làm mới trước khi lưu.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT: 'Mã yêu cầu này đã thuộc thao tác khác.',
      HEADCOUNT_INSUFFICIENT:
        'Giới hạn năm không đủ cho định biên thực tế đã chiếm và đã giữ.',
      HEADCOUNT_INVALID_NUMBER: 'Nhập số người nguyên có giới hạn.',
      HEADCOUNT_INVALID_ACCOUNT: 'Chọn phòng ban, vị trí và năm thực.',
      HEADCOUNT_INVALID_IDENTITY:
        'Chọn phòng ban và vị trí tổ chức đang hoạt động.',
      HEADCOUNT_INVALID_COMMAND: 'Cần người thao tác, mã yêu cầu và lý do.',
      HEADCOUNT_INVALID_SOURCE: 'Cần loại nguồn và mã định danh thực.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        'Mỗi chỗ thay thế cần nhân viên nghỉ việc riêng biệt.',
      HEADCOUNT_INVALID_REPLACEMENT:
        'Nguồn thay thế phải khớp chỗ thực của nhân viên đang hoặc đã nghỉ.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'Chỗ thay thế này thiếu hoặc đã được nhận.',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        'Nhân viên nguồn được khôi phục chặn chỗ thay thế này.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND: 'Hồ sơ nhân viên không khả dụng.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        'Nhân viên thực tế không khớp phòng ban và vị trí đã phân bổ.',
      HEADCOUNT_ALREADY_OCCUPIED:
        'Nhân viên đã chiếm chỗ trong tài khoản năm này.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        'Chủ động chuyển liên kết sang năm công ty hiện tại trước khi sử dụng.',
      HEADCOUNT_SOURCE_NOT_FOUND: 'Nguồn sức chứa không khả dụng.',
      HEADCOUNT_SOURCE_EXISTS: 'Nguồn này đã có khoản giữ.',
      HEADCOUNT_SOURCE_STATE: 'Trạng thái nguồn không cho phép thao tác này.',
      HEADCOUNT_SOURCE_CLOSED: 'Nguồn sức chứa đã đóng.',
      HEADCOUNT_SEAT_STATE: 'Chỗ giữ không ở trạng thái đang chờ.',
      HEADCOUNT_STATE_CONFLICT: 'Chỗ giữ đã thay đổi.',
      HEADCOUNT_NO_ALLOCATION: 'Không còn chỗ đã duyệt khả dụng.',
      HEADCOUNT_NOT_LEFT:
        'Cần nghỉ việc thực tế trước khi giải phóng sức chứa đã chiếm.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        'Cần chỗ nhân viên thực tế chưa giải phóng.',
      HEADCOUNT_NOT_RESTORED:
        'Cần khôi phục thực tế trước khi chặn thay thế tương lai.',
      HEADCOUNT_INVALID_REBIND:
        'Chuyển liên kết năm phải giữ phòng ban, vị trí và chuyển về tương lai.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        'Quyền thay thế cần nguồn năm đích rõ ràng.',
      HEADCOUNT_INVALID_TRANSFER: 'Cần khoản giữ đích đã duyệt riêng biệt.',
      HEADCOUNT_INVALID_PAGE: 'Chọn kích thước trang từ 1 đến 100.',
      HEADCOUNT_GUARD_UNAVAILABLE: 'Bảo vệ giao dịch sức chứa không khả dụng.',
    },
  },
};
