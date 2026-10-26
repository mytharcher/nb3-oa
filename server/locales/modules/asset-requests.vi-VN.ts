export default {
  authz: {
    ownedScope: 'Đơn tài sản của mình',
    resource: 'Đơn tài sản',
    view: 'Đọc đơn tài sản',
    viewValue: 'Đọc nguyên giá tài sản',
    create: 'Tạo đơn tài sản của mình',
    edit: 'Chỉnh sửa đơn tài sản của mình',
    operate: 'Thực hiện thao tác phê duyệt và xử lý tài sản được cấp quyền',
    returnIssued: 'Xác nhận trả vật lý tài sản đã cấp sử dụng',
  },
  errors: {
    ASSET_RETURN_REASON_REQUIRED: 'Nhập lý do tiếp nhận vật lý.',
    ASSET_ACCESS_DENIED: 'Bạn không thể truy cập yêu cầu tài sản này.',
    ASSET_ACTION_INVALID: 'Thao tác này không khả dụng cho yêu cầu.',
    ASSET_REQUEST_NOT_FOUND: 'Không tìm thấy yêu cầu tài sản.',
    ASSET_INVALID_COMMAND: 'Nhập mã yêu cầu cố định và lý do bắt buộc.',
    ASSET_REQUEST_REUSED: 'Mã yêu cầu này gắn với thao tác khác.',
    ASSET_REQUIRED_FIELDS: 'Hoàn thành mục đích, số lượng và lựa chọn tài sản.',
    ASSET_CATEGORY_INACTIVE: 'Chọn danh mục tài sản đang hoạt động.',
    ASSET_EMPLOYEE_INACTIVE:
      'Người yêu cầu phải có hồ sơ nhân viên đang hoạt động.',
    ASSET_DEPARTMENT_MISSING:
      'Người yêu cầu cần phòng ban chính đang hoạt động.',
    ASSET_HEAD_MISSING: 'Phòng ban cần trưởng phòng phê duyệt đang hoạt động.',
    ASSET_BORROW_DATE_INVALID:
      'Chọn ngày trả tương lai hợp lệ theo lịch công ty.',
    ASSET_SCRAP_REQUIRED:
      'Chọn một tài sản, nhập lý do loại bỏ và đính kèm ảnh.',
    ASSET_SCRAP_INELIGIBLE:
      'Chỉ được loại bỏ tài sản đang giữ đủ điều kiện hoặc hàng tồn do quản trị viên kiểm soát.',
    ASSET_PHOTO_DENIED: 'Không thể truy cập yêu cầu hoặc trường ảnh.',
    ASSET_PHOTO_INVALID:
      'Chọn tối đa mười ảnh hợp lệ liên kết với yêu cầu này.',
    ASSET_PHOTO_SIZE: 'Mỗi ảnh không được lớn hơn 5 MiB.',
    ASSET_PHOTO_TYPE: 'Tải lên ảnh JPEG, PNG hoặc WebP hợp lệ.',
    ASSET_STOCK_SHORTAGE: 'Không đủ đơn vị khả dụng cho toàn bộ yêu cầu này.',
    ASSET_INVALID_QUANTITY: 'Xác nhận số lượng nguyên từ 1 đến 100.',
    ASSET_INVALID_AMOUNT:
      'Giá trị tài sản lưu trữ ngoài phạm vi chính xác được hỗ trợ.',
    ASSET_NOT_FOUND: 'Không tìm thấy một tài sản trong yêu cầu.',
    ASSET_INVALID_VERSION: 'Tải phiên bản tài sản hiện tại.',
    ASSET_VERSION_CONFLICT: 'Tài sản đã thay đổi. Tải lại trước khi xác nhận.',
    ASSET_ALREADY_RESERVED: 'Tài sản đang được giữ cho đơn khác.',
    ASSET_EXISTING_HOLD:
      'Giải quyết lượt giữ hiện tại trước khi thay đổi tồn kho.',
    ASSET_HOLD_MISMATCH: 'Lượt giữ thực tế không khớp yêu cầu này.',
    ASSET_BASELINE_CONFLICT:
      'Dữ kiện tài sản thay đổi sau phê duyệt. Trả lại xem xét trước khi thực hiện.',
    ASSET_UNITS_INCOMPLETE:
      'Xác nhận mọi đơn vị được phân bổ và số sê-ri thực tế.',
    ASSET_SERIAL_MISMATCH: 'Số sê-ri khác tài sản thực tế.',
    ASSET_RETURN_MISMATCH: 'Mục trả không khớp tài sản đã bàn giao thực tế.',
    ASSET_ALREADY_RETURNED: 'Tài sản này đã được trả.',
    ASSET_RETURN_FORBIDDEN:
      'Quản trị viên tài sản đang hoạt động phải xác nhận trả vật lý.',
    ASSET_RETURN_INELIGIBLE:
      'Yêu cầu này không phải yêu cầu sử dụng đã cấp đủ điều kiện.',
    ASSET_ALLOCATION_MISSING: 'Thiếu thông tin phân bổ thực tế đầy đủ.',
    ASSET_SOURCE_UNAVAILABLE: 'Nguồn đơn tài sản không khả dụng.',
    ASSET_SOURCE_MISSING: 'Đơn tài sản chủ quản không còn tồn tại.',
    ASSET_SOURCE_FORBIDDEN: 'Nguồn chưa cho phép thao tác tồn kho này.',
    ASSET_SOURCE_MISMATCH: 'Nguồn tồn kho không khớp đơn thực tế.',
    ASSET_TARGET_MISMATCH: 'Đích phê duyệt thuộc yêu cầu khác.',
    ASSET_DIRECTORY_UNAVAILABLE: 'Cần danh bạ phê duyệt mới.',
    ASSET_SLA_UNSUPPORTED:
      'Bản phát hành chỉ hỗ trợ đồng hồ phê duyệt mặc định 24/48 giờ làm việc.',
  },
  schedule: {
    title: 'Nhắc trả tài sản mượn',
    description:
      'Nhắc ngày đến hạn hằng ngày theo giờ công ty và quá hạn hằng tuần. Gửi đang chờ được báo là lần chạy thất bại.',
  },
  reminders: {
    before:
      'Đơn tài sản {{number}}: {{quantity}} tài sản mượn đến hạn ngày {{date}}. Vui lòng sắp xếp trả vật lý.',
    overdue:
      'Đơn tài sản {{number}}: {{quantity}} tài sản mượn đến hạn ngày {{date}} và vẫn chưa được trả.',
  },
};
