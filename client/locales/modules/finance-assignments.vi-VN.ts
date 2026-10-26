export default {
  financeAssignments: {
    create: 'Tạo',

    saved: 'Đã lưu phân công kế toán cho "{{name}}"',
    saveFailed: 'Không thể lưu phân công. Kiểm tra nội dung rồi thử lại.',
    disableTitle: 'Tắt phân công cho "{{name}}"?',

    loadLatest: 'Tải phân công mới nhất',
    latestSummary:
      'Mới nhất: {{name}} / {{status}}. Giá trị biểu mẫu của bạn giữ nguyên.',
    adoptVersion: 'Dùng phiên bản này với thay đổi của tôi',
    uncertain:
      'Chưa chắc chắn kết quả tạo. Kiểm tra phòng ban này trước khi thử lại.',
    checkExisting: 'Kiểm tra phân công phòng ban',
    viewExisting: 'Mở phân công hiện có',
    required: 'Trường này là bắt buộc.',
    title: 'Kế toán phòng ban',
    description:
      'Phân công người xem xét tài chính cho mỗi phòng ban. Phân công thiếu hoặc không hoạt động dùng cấp trên gần nhất đang hoạt động, rồi đến trưởng bộ phận tài chính.',
    new: 'Phân công kế toán',
    edit: 'Chỉnh sửa phân công',
    view: 'Chi tiết phân công',
    department: 'Phòng ban',
    accountant: 'Kế toán',
    status: 'Trạng thái',
    active: 'Đang hoạt động',
    inactive: 'Đã vô hiệu hóa',
    updatedAt: 'Đã cập nhật',
    refresh: 'Làm mới',
    clear: 'Xóa bộ lọc',
    rowActions: 'Thao tác cho {{name}}',
    save: 'Lưu',
    cancel: 'Hủy',
    loading: 'Đang tải phân công',
    retry: 'Thử lại',
    accountantPlaceholder: 'Tìm kế toán đủ điều kiện',
    noAccountants: 'Không có thành viên vai trò tài chính đang hoạt động',
    reason: 'Lý do',
    formDescription:
      'Chỉ có thể phân công thành viên vai trò tài chính đang hoạt động. Thay đổi được kiểm toán.',
    departmentPermission:
      'Cần quyền đọc phòng ban để chọn. Nhờ quản trị viên cấp quyền.',
    conflictAdvice:
      'Giữ thay đổi để tham khảo. Đóng và mở lại biểu mẫu để kiểm tra phân công mới nhất trước khi thử lại.',
    disable: 'Tắt phân công',
    disableDescription:
      'Phê duyệt sau này dùng phân công cấp trên gần nhất đang hoạt động, rồi đến trưởng bộ phận tài chính. Tác vụ hiện có giữ người xem xét đã ghi.',
    authz: {
      title: 'Kế toán phòng ban',
      read: 'Đọc phân công',
      update: 'Quản lý lượt gán',
      permissionSet: 'Cấu hình kế toán của trưởng bộ phận tài chính',
    },
    empty: {
      accountsTitle: 'Chưa phân công kế toán',
      accountsDescription:
        'Phân công kế toán cho phòng ban để định tuyến xem xét tài chính.',
      readonlyTitle: 'Không có phân công',
      readonlyDescription:
        'Trưởng bộ phận tài chính có thể cấu hình kế toán phòng ban.',
      filteredTitle: 'Không có phân công phù hợp',
      filteredDescription: 'Xóa bộ lọc phòng ban để xem tất cả phân công.',
    },
    error: {
      forbidden: 'Bạn không có quyền truy cập các phân công này.',
      missing: 'Phân công không còn tồn tại.',
      invalid: 'Kiểm tra giá trị biểu mẫu.',
      failed: 'Không thể tải phân công. Thử lại.',
      FINANCE_ASSIGNMENT_NOT_FOUND: 'Phân công không còn tồn tại.',
      FINANCE_ASSIGNMENT_VERSION_CONFLICT:
        'Phân công đã thay đổi. Mở lại biểu mẫu để xem phiên bản mới nhất.',
      FINANCE_ASSIGNMENT_ALREADY_EXISTS:
        'Phòng ban đã có phân công. Chỉnh sửa phân công đó.',
      FINANCE_ASSIGNMENT_INVALID_DEPARTMENT: 'Chọn phòng ban đang hoạt động.',
      FINANCE_ASSIGNMENT_INVALID_ACCOUNTANT:
        'Chọn thành viên vai trò tài chính đang hoạt động.',
      FINANCE_ASSIGNMENT_INVALID_COMMAND: 'Cần người thao tác và lý do.',
    },
  },
};
