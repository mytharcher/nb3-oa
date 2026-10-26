export default {
  authz: {
    returnHeld: 'Xác nhận trả vật lý tài sản cũ đang giữ',
    resource: 'Sổ tài sản',
    view: 'Đọc sổ tài sản và nguyên giá',
    viewHeld: 'Đọc tài sản tôi đang giữ',
    manage: 'Ghi và sửa mô tả tài sản',
    heldScope: 'Tài sản tôi đang giữ',
  },
  errors: {
    ASSET_RETURN_FORBIDDEN:
      'Quản trị viên tài sản đang hoạt động phải xác nhận trả vật lý.',
    ASSET_REQUEST_REUSED: 'Mã yêu cầu trả này đã xác định biên nhận khác.',
    ASSET_RETURN_INELIGIBLE:
      'Xác nhận tài sản thực tế đang giữ, nhân viên và số sê-ri.',
    ASSET_RETURN_FLOW_REQUIRED:
      'Giải quyết tài sản qua đơn thực tế trước khi xác nhận trả.',

    ASSET_ACCESS_DENIED: 'Bạn không có quyền cho thao tác tài sản này.',
    ASSET_NOT_FOUND: 'Không tìm thấy tài sản.',
    ASSET_INVALID_INPUT:
      'Nhập mã, tên tài sản và giá trị chính xác không âm theo xu.',
    ASSET_CATEGORY_INACTIVE: 'Chọn danh mục tài sản đang hoạt động.',
    ASSET_INVALID_COMMAND: 'Cần người thao tác và lý do sửa.',
    ASSET_INVALID_VERSION: 'Nhập phiên bản tài sản hiện tại.',
    ASSET_VERSION_CONFLICT: 'Tài sản này đã thay đổi. Tải phiên bản mới nhất.',
    ASSET_CODE_EXISTS: 'Mã tài sản này đã tồn tại.',
    ASSET_INVALID_STORED_AMOUNT:
      'Giá trị tài sản lưu trữ ngoài phạm vi chính xác được hỗ trợ.',
    ASSET_WRITE_UNCONFIRMED: 'Không thể xác nhận việc ghi tài sản.',
    ASSET_DEPARTURE_NOT_CLEARED:
      'Tài sản đã cấp, mượn hoặc giữ phải được trả trước khi hoàn tất nghỉ việc.',
  },
};
