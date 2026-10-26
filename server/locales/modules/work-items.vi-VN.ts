export default {
  workItems: {
    authz: {
      confirmationOwned: 'Tác vụ tôi xác nhận',
      handoverConfirmation: 'Chuyển giao trách nhiệm xác nhận',

      title: 'Công việc thông thường',
      owned: 'Do tôi tạo',
      readable: 'Tác vụ tôi tạo, sở hữu hoặc đủ điều kiện xử lý',
      view: 'xem',
      create: 'tạo',
      edit: 'chỉnh sửa',
      dispatch: 'điều phối',
      claim: 'nhận',
      release: 'nhả',
      complete: 'hoàn thành',
      confirm: 'xác nhận',
      return: 'trả lại',
      block: 'chặn',
      resume: 'tiếp tục',
      reassign: 'phân công lại',
      cancel: 'hủy',
      forceComplete: 'buộc hoàn thành',
    },
    notifications: {
      title: 'Cập nhật công việc',
      body: 'Công việc thông thường đã thay đổi. Mở ứng dụng để xem chi tiết.',
    },
    errors: {
      ACCESS_DENIED: 'Không thể truy cập tác vụ hoặc thao tác.',
      NOT_FOUND: 'Không tìm thấy tác vụ.',
      REASON_REQUIRED: 'Cần lý do.',
      RESULT_REQUIRED: 'Cần kết quả hoàn thành.',
      INVALID_INPUT:
        'Đầu vào hoặc trạng thái không hợp lệ; làm mới và thử lại.',
      INVALID_TARGET:
        'Đầu vào hoặc trạng thái không hợp lệ; làm mới và thử lại.',
      INVALID_ATTACHMENT:
        'Đầu vào hoặc trạng thái không hợp lệ; làm mới và thử lại.',
      VERSION_CONFLICT:
        'Đầu vào hoặc trạng thái không hợp lệ; làm mới và thử lại.',
      COMMAND_CONFLICT:
        'Đầu vào hoặc trạng thái không hợp lệ; làm mới và thử lại.',
    },
  },
};
