export default {
  vendors: {
    saved: 'Đã lưu nhà cung cấp "{{name}}"',

    title: 'Nhà cung cấp',
    description:
      'Mua hàng quản lý nhà cung cấp thủ công. Đơn đã duyệt giữ dữ kiện nhà cung cấp đã ghi.',
    new: 'Nhà cung cấp mới',
    edit: 'Chỉnh sửa nhà cung cấp',
    view: 'Chi tiết nhà cung cấp',
    refresh: 'Làm mới',
    search: 'Tìm tên, mã hoặc danh mục',
    clear: 'Xóa bộ lọc',
    rowActions: 'Thao tác cho {{name}}',
    save: 'Lưu',
    cancel: 'Hủy',
    loading: 'Đang tải nhà cung cấp',
    retry: 'Thử lại',
    active: 'Đang hoạt động',
    status: 'Trạng thái',
    statuses: {
      manual: 'Nhà cung cấp thủ công',
      qualified: 'Đủ điều kiện',
      disabled: 'Đã vô hiệu hóa',
    },
    updatedAt: 'Đã cập nhật',
    reason: 'Lý do thay đổi',
    formDescription:
      'Thay đổi nhà cung cấp và ngân hàng được kiểm toán. Tắt ngăn mua sắm và thanh toán mới.',
    disableHint: 'Mua sắm mới và chi tiết tài khoản thanh toán sẽ bị chặn.',
    required: 'Trường này là bắt buộc.',
    invalidCode: 'Dùng chữ cái, chữ số, dấu chấm, gạch nối hoặc gạch dưới.',
    invalidEmail: 'Nhập địa chỉ email hợp lệ.',
    noChanges: 'Thay đổi ít nhất một trường trước khi lưu.',
    unknownCreate:
      'Chưa biết kết quả tạo. Kiểm tra danh sách và mã nhà cung cấp trước khi tạo nhà cung cấp khác.',
    unknownEdit:
      'Chưa biết kết quả. Tải nhà cung cấp mới nhất trước khi thử lại; thay đổi chưa ghi sẽ được giữ.',
    loadLatest: 'Tải nhà cung cấp mới nhất',
    fields: {
      code: 'Mã',
      name: 'Tên',
      category: 'Danh mục',
      contactName: 'Liên hệ',
      contactPhone: 'Điện thoại',
      contactEmail: 'Email',
      bankName: 'Ngân hàng',
      bankAccount: 'Tài khoản ngân hàng',
      bankAccountName: 'Tên tài khoản',
    },
    authz: {
      resource: 'Nhà cung cấp',
      view: 'Đọc chi tiết nhà cung cấp',
      manage: 'Quản lý nhà cung cấp',
      bankRead: 'Đọc thông tin ngân hàng',
      createdScope: 'Nhà cung cấp do người dùng hiện tại tạo',
    },
    empty: {
      accountsTitle: 'Không có nhà cung cấp',
      accountsDescription: 'Thêm nhà cung cấp thủ công cho mua sắm.',
      readonlyTitle: 'Không có nhà cung cấp đọc được',
      readonlyDescription:
        'Không có nhà cung cấp trong phạm vi quyền. Nhờ mua hàng thêm hoặc nhờ quản trị viên cấp quyền Quản lý nhà cung cấp.',
      filteredTitle: 'Không có nhà cung cấp phù hợp',
      filteredDescription: 'Thay đổi hoặc xóa tìm kiếm.',
    },
    error: {
      forbidden: 'Bạn không có quyền truy cập các nhà cung cấp này.',
      missing: 'Nhà cung cấp không khả dụng. Làm mới danh sách cha.',
      invalid: 'Kiểm tra trường nhà cung cấp.',
      failed: 'Không thể tải hoặc lưu nhà cung cấp. Thử lại.',
      VENDOR_INVALID_INPUT:
        'Kiểm tra trường liên hệ và ngân hàng nhà cung cấp.',
      VENDOR_INVALID_COMMAND: 'Cần người thao tác và lý do thay đổi.',
      VENDOR_CODE_EXISTS: 'Mã này đã thuộc nhà cung cấp.',
      VENDOR_VERSION_CONFLICT:
        'Nhà cung cấp đã thay đổi. Tải phiên bản mới nhất trước khi thử lại.',
      VENDOR_NOT_FOUND: 'Nhà cung cấp không khả dụng.',
      VENDOR_INACTIVE: 'Chọn nhà cung cấp đang hoạt động.',
      VENDOR_FIELDS_RESTRICTED: 'Trường nhà cung cấp ngoài quyền cấp của bạn.',
      VENDOR_ACCESS_DENIED: 'Bạn không có quyền cho thao tác nhà cung cấp này.',
      VENDOR_PAYMENT_ACCOUNT_REQUIRED:
        'Hoàn thành thông tin ngân hàng nhà cung cấp trước thanh toán.',
    },
  },
};
