export default {
  contracts: {
    errors: {
      CONTRACT_SEAL_EVIDENCE_REQUIRED:
        'Cần chứng minh đóng dấu thực tế đã hoàn tất.',
      CONTRACT_SEAL_EVIDENCE_CONFLICT:
        'Chứng minh con dấu thuộc dữ kiện hợp đồng khác.',
      CONTRACT_ACCESS_DENIED: 'Hợp đồng này ngoài phạm vi quyền của bạn.',
      CONTRACT_ACTION_NOT_ALLOWED: 'Thao tác này không khả dụng cho hợp đồng.',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        'Giá trị hợp đồng không được nhỏ hơn tổng đã trả và khoản thanh toán đã giữ.',
      CONTRACT_ATTACHMENT_DENIED:
        'Trường tệp đính kèm hoặc bản ghi hợp đồng ngoài phạm vi quyền của bạn.',
      CONTRACT_ATTACHMENT_INVALID:
        'Chọn tệp đính kèm hợp lệ thuộc yêu cầu hợp đồng này.',
      CONTRACT_CANDIDATE_REMOVED:
        'Ứng viên hợp đồng chưa công bố này đã bị gỡ. Tạo đơn mới.',
      CONTRACT_CATEGORY_INACTIVE: 'Chọn loại hợp đồng đang hoạt động.',
      CONTRACT_CORRUPT_BALANCE:
        'Tổng thanh toán hợp đồng không nhất quán. Liên hệ quản trị viên.',
      CONTRACT_EMPLOYEE_REQUIRED:
        'Cần nhân viên đang hoạt động có phòng ban chính.',
      CONTRACT_FIELDS_RESTRICTED:
        'Trường hợp đồng bắt buộc ngoài phạm vi quyền của bạn.',
      CONTRACT_FILE_SIZE: 'Chọn tệp hợp đồng không rỗng tối đa 5 MiB.',
      CONTRACT_FILE_TYPE:
        'Văn bản hợp đồng phải là PDF; chứng minh có thể là PDF, JPEG, PNG hoặc WebP với nội dung khớp định dạng.',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        'Mã yêu cầu này đã dùng với chi tiết khác. Làm mới trước khi gửi lại.',
      CONTRACT_INACTIVE_SOURCE: 'Chọn nguồn hợp đồng đã duyệt có hiệu lực.',
      CONTRACT_INCOMPLETE_PROPOSAL:
        'Hoàn thành lý do hợp đồng, điều khoản thanh toán và phiên bản văn bản bất biến.',
      CONTRACT_INPUT_INVALID:
        'Kiểm tra các trường đầu vào hợp đồng được khai báo.',
      CONTRACT_INVALID_AMOUNT:
        'Nhập số tiền không âm bằng xu nguyên chính xác trong phạm vi hỗ trợ.',
      CONTRACT_INVALID_ID: 'Cần định danh hợp lệ có giới hạn.',
      CONTRACT_INVALID_TIME: 'Dấu thời gian hợp đồng không hợp lệ.',
      CONTRACT_LIMIT_EXCEEDED:
        'Số tiền đang chờ và đã trả vượt giới hạn hợp đồng.',
      CONTRACT_NOT_CANDIDATE:
        'Chỉ được gỡ ứng viên hợp đồng chưa công bố của đơn này.',
      CONTRACT_NOT_FOUND: 'Không tìm thấy nguồn hợp đồng.',
      CONTRACT_OUTSTANDING_PAYMENTS:
        'Giải phóng khoản thanh toán đang chờ trước khi chấm dứt hợp đồng.',
      CONTRACT_REASON_REQUIRED: 'Nhập lý do trong độ dài hỗ trợ.',
      CONTRACT_REBASE_NOT_ALLOWED:
        'Chỉ người yêu cầu được chủ động làm mới phiên bản gốc của thay đổi bị trả lại.',
      CONTRACT_REQUEST_KEY_REQUIRED: 'Cần mã yêu cầu cố định.',
      CONTRACT_RESERVATION_CLOSED: 'Khoản giữ thanh toán đã đóng.',
      CONTRACT_RULE_INVALID:
        'Chính sách phê duyệt hợp đồng thiếu hoặc không hợp lệ. Liên hệ quản trị viên.',
      CONTRACT_SLA_UNSUPPORTED:
        'Bộ chuyển đổi phê duyệt đã cài chỉ hỗ trợ đồng hồ 24/48 giờ đã cấu hình.',
      CONTRACT_SOURCE_CONFLICT: 'Tham chiếu này thuộc nguồn hợp đồng khác.',
      CONTRACT_STORED_ID_INVALID:
        'Định danh hợp đồng lưu trữ không hợp lệ. Liên hệ quản trị viên.',
      CONTRACT_SUPPLIER_INVALID:
        'Nhà cung cấp phải đang hoạt động và có năng lực đã duyệt. Làm mới hồ sơ trước phê duyệt.',
      CONTRACT_TARGET_MISMATCH: 'Đích phê duyệt thuộc yêu cầu hợp đồng khác.',
      CONTRACT_TEXT_INVALID:
        'Chọn phiên bản văn bản PDF bất biến thuộc đơn này.',
      CONTRACT_TEXT_NOT_EDITABLE:
        'Chỉ có thể thêm phiên bản văn bản vào bản nháp của mình hoặc bản sửa bị trả lại.',
      CONTRACT_TEXT_REQUIRED:
        'Chọn phiên bản văn bản hợp đồng bất biến hợp lệ.',
      CONTRACT_TRANSITION_NOT_ALLOWED:
        'Dùng thao tác hợp đồng chuyên biệt có kiểm soát.',
      CONTRACT_VERSION_CONFLICT:
        'Hợp đồng đã duyệt đã thay đổi. Trả lại yêu cầu, chủ động làm mới phiên bản gốc và gửi xem xét lại.',
    },
    authz: {
      resource: 'Hợp đồng và thay đổi',
      view: 'Xem yêu cầu hợp đồng',
      submit: 'Tạo và chỉnh sửa yêu cầu hợp đồng của mình',
      ledger: 'Đọc sổ hợp đồng đã duyệt và phiên bản bất biến',
      historicalEntry:
        'Đăng ký hợp đồng lịch sử kèm hồ sơ pháp lý có kiểm toán',
    },
  },
};
