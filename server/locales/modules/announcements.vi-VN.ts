export default {
  announcements: {
    authz: {
      title: 'Thông báo nội bộ',
      owned: 'Do tôi đăng',
      readable: 'Bài đăng của tôi và thông báo đã nhận',
      view: 'Đọc thông báo nội bộ',
      create: 'Tạo bản nháp thông báo',
      edit: 'Chỉnh sửa bản nháp của mình',
      publish: 'Đăng thông báo của mình',
      revoke: 'Thu hồi thông báo của mình',
      remind: 'Nhắc người nhận chưa xác nhận',
      receipts: 'Đọc danh sách người nhận của mình',
      confirm: 'Xác nhận đã nhận của mình',
    },
    notifications: {
      title: 'Thông báo công ty',
      body: 'Có thông báo mới. Mở ứng dụng để đọc.',
    },
    errors: {
      ACCESS_DENIED: 'Không thể truy cập thông báo hoặc thao tác này.',
      NOT_FOUND: 'Không tìm thấy thông báo.',
      INVALID_INPUT: 'Đầu vào thông báo hoặc khoảng hiệu lực không hợp lệ.',
      INVALID_AUDIENCE:
        'Đối tượng có phòng ban hoặc vai trò trách nhiệm không khả dụng.',
      EMPTY_AUDIENCE: 'Thông báo không có người nhận đang hoạt động.',
      INVALID_ATTACHMENT: 'Tệp đính kèm không hợp lệ hoặc không khả dụng.',
      INVALID_STATE: 'Thao tác không khả dụng trong trạng thái hiện tại.',
      VERSION_CONFLICT: 'Thông báo thay đổi. Tải lại và thử lại.',
      COMMAND_CONFLICT: 'Mã yêu cầu đã dùng với đầu vào khác.',
      KNOWLEDGE_UNAVAILABLE:
        'Tài liệu liên kết không khả dụng hoặc không đọc được.',
    },
  },
};
