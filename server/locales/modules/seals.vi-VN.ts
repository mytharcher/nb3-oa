export default {
  seals: {
    authz: {
      requests: 'Đề nghị sử dụng con dấu',
      view: 'Xem',
      create: 'Tạo',
      edit: 'Chỉnh sửa',
      operate: 'Thực hiện',
      actualReturn: 'Trả ngoại lệ thực tế',
      ledger: 'Sổ con dấu',
      instances: 'Con dấu cụ thể',
      manage: 'Quản lý siêu dữ liệu con dấu',
      owned: 'Bản ghi của mình',
      readable: 'Bản ghi của mình và có tham gia',
    },
    errors: {
      REVIEWER_REQUIRED:
        'Người xem xét thực tế phải giữ vai trò trách nhiệm đang hoạt động bắt buộc.',
      APPROVAL_REFUSED:
        'Quy tắc phê duyệt hoặc xử lý hiện tại từ chối thao tác này.',
      ACCESS_DENIED: 'Bạn không thể truy cập bản ghi hoặc trường con dấu này.',
      ACTIVE_EMPLOYEE_REQUIRED: 'Cần tài khoản nhân viên đang hoạt động.',
      ADMIN_KEEPER_REQUIRED:
        'Trả ngoại lệ thực tế cần cả vai trò quản trị viên và người giữ con dấu.',
      ADMIN_REQUIRED: 'Cần vai trò hành chính đang hoạt động.',
      BODY_TOO_LARGE: 'Tệp đính kèm vượt giới hạn tải lên.',
      COMMAND_CONFLICT: 'Mã yêu cầu đã dùng cho nội dung khác.',
      CONTRACT_ACCESS_DENIED: 'Bạn không thể xem hợp đồng liên kết.',
      CONTRACT_NOT_EFFECTIVE: 'Hợp đồng liên kết chưa có hiệu lực.',
      CONTRACT_VERSION_CONFLICT: 'Hợp đồng liên kết thay đổi sau phê duyệt.',
      DEPARTMENT_REQUIRED: 'Người yêu cầu phải có phòng ban chính.',
      INVALID_COMMAND: 'Cần mã yêu cầu hợp lệ.',
      INVALID_COPIES:
        'Số bản đóng dấu thực tế phải dương và không vượt số lượng đã duyệt.',
      INVALID_FILE: 'Tệp đính kèm thiếu, không an toàn hoặc ngoài yêu cầu này.',
      INVALID_INPUT: 'Trường yêu cầu con dấu không hợp lệ.',
      INVALID_OUTPUT: 'Kết quả xử lý vật lý không hợp lệ.',
      INVALID_RETURN:
        'Trả thực tế cần lượt mượn ngoài đã đóng theo quản trị và lý do.',
      INVALID_SEAL_TYPE:
        'Loại con dấu không hoạt động hoặc không khớp yêu cầu đã duyệt.',
      INVALID_TIME: 'Thời điểm vật lý hoặc hạn trả không hợp lệ.',
      KEEPER_REQUIRED: 'Cần vai trò người giữ con dấu đang hoạt động.',
      OUTSTANDING_CUSTODY: 'Con dấu còn đang được giữ vật lý.',
      PHYSICAL_ALREADY_REGISTERED: 'Sử dụng hoặc trả vật lý đã được đăng ký.',
      REQUEST_NOT_FOUND: 'Yêu cầu không khả dụng.',
      SEAL_EVIDENCE_REQUIRED: 'Cần chứng minh đóng dấu thực tế bất biến.',
      SEAL_NOT_FOUND: 'Con dấu không khả dụng.',
      SEAL_UNAVAILABLE: 'Con dấu hiện đang được mượn ra ngoài.',
      SLA_UNSUPPORTED: 'Lịch nhắc đã cấu hình không được hỗ trợ.',
      TARGET_MISMATCH: 'Tác vụ được cung cấp không thuộc yêu cầu này.',
      VERSION_CONFLICT: 'Bản ghi đã thay đổi. Làm mới trước khi thử lại.',
    },
    schedule: {
      title: 'Nhắc trả con dấu',
      description: 'Nhắc việc giữ con dấu còn tồn hằng ngày theo giờ công ty.',
    },
    notifications: {
      overdue: 'Con dấu mượn đã quá hạn trả.',
    },
  },
};
